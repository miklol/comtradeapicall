import { useState, useRef } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import QueryForm from '../components/QueryForm'
import ResultsTable from '../components/ResultsTable'
import { previewFinalData, previewTarifflineData, getPartners } from '../services/comtradeApi'

const DATA_TYPES = [
  { id: 'final', label: 'Final Data' },
  { id: 'tariffline', label: 'Tariffline Data' },
]

export default function TradeDataQuery() {
  const [activeTab, setActiveTab] = useState('final')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [meta, setMeta] = useState(null)
  const [progress, setProgress] = useState(null) // { current, total, message }
  // Export options state
  const [exportOptions, setExportOptions] = useState({
    useFolders: true,
    hs2: true,
    hs4: true,
    hs6: true,
    total: true
  })
  const [lastQuery, setLastQuery] = useState(null)
  
  // Abort controller ref to allow cancellation if needed (basic implementation)
  const abortRef = useRef(false)

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  // Helper to generate periods
  const generatePeriods = (start, end, freq) => {
    const list = []
    let s = parseInt(start, 10)
    let e = parseInt(end, 10)
    
    if (isNaN(s) || isNaN(e)) return [start] // fallback
    if (s > e) [s, e] = [e, s]

    if (freq === 'A') {
      for (let y = s; y <= e; y++) {
        list.push(String(y))
      }
    } else if (freq === 'M') {
      // Annual component and Month component
      // formats: YYYY or YYYYMM? Usually YYYYMM for Comtrade M
      // If user inputs 2020 to 2021, and freq M, maybe they mean all months?
      // Assuming user inputs YYYYMM: 202001 to 202005
      let y = Math.floor(s / 100)
      let m = s % 100
      let endY = Math.floor(e / 100)
      let endM = e % 100
      
      while (y < endY || (y === endY && m <= endM)) {
        list.push(`${y}${String(m).padStart(2, '0')}`)
        m++
        if (m > 12) {
          m = 1
          y++
        }
      }
    }
    return list
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    setError(null)
    setResults([])
    setMeta(null)
    setProgress(null)
    setLastQuery(values)
    abortRef.current = false

    try {
      // 1. Determine Periods
      let periods = []
      if (values.batchMode && values.periodStart && values.periodEnd) {
        periods = generatePeriods(values.periodStart, values.periodEnd, values.freqCode)
      } else {
        periods = [values.period || ''] 
      }

      // 2. Determine Partners
      let partnerList = []
      let partnerMap = {} // id -> name for progress display
      
      if (values.breakdownPartner && values.batchMode && !values.partnerCode) {
        setProgress({ message: 'Fetching partner list...', current: 0, total: 0 })
        try {
          const pList = await getPartners()
          // Filter out World (0) usually? Or keep it?
          // Usually individual breakdown means skipping World aggregator.
          // But Comtrade logic: 0 is World. 
          // Let's filter slightly to avoid "All" duplicate if API returns it.
          // The API returns list of {id, text}.
          partnerList = pList.filter(p => p.id !== 'all' && p.id !== '') 
          partnerList.forEach(p => { partnerMap[p.id] = p.text })
        } catch (e) {
          throw new Error('Failed to fetch partner list for breakdown: ' + e.message)
        }
      } else {
        // Single partner or "All" (empty string)
        partnerList = [{ id: values.partnerCode || '', text: 'All/Selected' }]
      }

      // 3. Build Queue
      const queue = []
      for (const p of periods) {
        for (const r of partnerList) {
          queue.push({ period: p, partner: r })
        }
      }

      const allData = []
      let totalElapsed = 0

      for (let i = 0; i < queue.length; i++) {
        if (abortRef.current) break;

        const task = queue[i]
        const p = task.period
        const partner = task.partner.id // string ID
        const partnerName = task.partner.text || partner

        // Rate limit sleep (5s) before next request (except the very first one)
        if (i > 0) {
           await sleep(5000)
        }

        const msg = `Fetching ${p} / ${partnerName.slice(0, 20)}...`
        setProgress({ 
          current: i + 1, 
          total: queue.length, 
          message: msg
        })

        const baseParams = {
          typeCode: values.typeCode,
          freqCode: values.freqCode,
          clCode: values.clCode,
          period: p,
          reporterCode: values.reporterCode || undefined,
          cmdCode: values.cmdCode || undefined,
          flowCode: values.flowCode || undefined,
          partnerCode: partner || undefined, // Use the specific partner from queue
          partner2Code: values.partner2Code || undefined,
          customsCode: values.customsCode || undefined,
          motCode: values.motCode || undefined,
          includeDesc: values.includeDesc ?? true,
        }

        // Step 1: Check availability (Count)
        let totalRecords = 0
        try {
          if (queue.length > 5) { // Only do count check if batch is large, actually always do it for safety
             // But if iterating 200 partners, checking count for EACH doubles the requests.
             // 400 requests instead of 200.
             // However, "Count" endpoint is lighter.
             // User asked "check data availability... try to get that amount".
             // So we MUST check.
             setProgress({ current: i + 1, total: queue.length, message: `Checking count for ${p} / ${partnerName.slice(0, 15)}...` })
             
             let countRes
             if (activeTab === 'tariffline') {
               countRes = await previewTarifflineData({ ...baseParams, countOnly: true })
             } else {
               countRes = await previewFinalData({ ...baseParams, countOnly: true })
             }
             totalRecords = countRes.count || 0
             await sleep(1000)
          } else {
             // For small batches, maybe skip?
             // No, consistent behavior is better.
             let countRes
             if (activeTab === 'tariffline') {
               countRes = await previewTarifflineData({ ...baseParams, countOnly: true })
             } else {
               countRes = await previewFinalData({ ...baseParams, countOnly: true })
             }
             totalRecords = countRes.count || 0
             await sleep(1000)
          }
        } catch (err) {
          console.warn('Failed to check count, proceeding with default maxRecords', err)
        }

        if (totalRecords === 0) {
          // Skip fetch if 0 records
          continue
        }

        // Step 2: Fetch actual data
        setProgress({ 
          current: i + 1, 
          total: queue.length, 
          message: `Fetching ${totalRecords.toLocaleString()} recs: ${p} / ${partnerName.slice(0, 15)}...` 
        })

        const params = {
          ...baseParams,
          maxRecords: totalRecords > 0 ? totalRecords : (values.maxRecords ? parseInt(values.maxRecords, 10) : 500),
        }

        let res
        let retries = 0
        const MAX_RETRIES = 3
        
        while (true) {
          try {
            if (activeTab === 'tariffline') {
              res = await previewTarifflineData(params)
            } else {
              res = await previewFinalData(params)
            }
            break // Success
          } catch (err) {
            if (err.message.includes('429') && retries < MAX_RETRIES) {
              retries++
              setProgress({ 
                current: i + 1, 
                total: queue.length, 
                message: `Rate limit hit. Waiting 10s (Retry ${retries}/${MAX_RETRIES})...` 
              })
              await sleep(10000) 
              continue
            }
            // If it's a 500 or other error, maybe just skip this partner?
            // Throwing stops the whole batch. 
            // Better to log error and continue?
            console.error(`Failed to fetch ${p}/${partnerName}`, err)
            res = { data: [], elapsedTime: 0 } // proceed with empty
            break
          }
        }

        const chunk = res.data || []
        // Optional: add metadata to chunk?
        // chunk.forEach(r => r._queryPartner = partnerName) 
        allData.push(...chunk)
        if (res.elapsedTime) {
          totalElapsed += parseFloat(res.elapsedTime) || 0
        }
      }

      setResults(allData)
      setMeta({ 
        count: allData.length, 
        elapsedTime: totalElapsed > 0 ? `${totalElapsed.toFixed(2)}s` : null 
      })

      // Save to history (summary)
      try {
        const history = JSON.parse(localStorage.getItem('comtrade_query_history') || '[]')
        const desc = `${values.typeCode}/${values.freqCode} — Batch: ${values.periodStart}-${values.periodEnd} (Partners: ${partnerList.length > 1 ? 'Iterated' : 'All'})`
        history.unshift({ description: desc, time: new Date().toLocaleString() })
        localStorage.setItem('comtrade_query_history', JSON.stringify(history.slice(0, 20)))
      } catch { /* ignore */ }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const handleDownloadZip = async () => {
    if (!results.length) return
    
    const zip = new JSZip()
    
    // Group by refYear/period first
    // Then by HS length
    const grouped = {}
    
    results.forEach(row => {
      const year = String(row.refYear || row.period || 'unknown')
      const code = String(row.cmdCode || '')
      const len = code.length
      
      let type = 'Total'
      if (len === 2) type = 'HS2'
      if (len === 4) type = 'HS4'
      if (len === 6) type = 'HS6'
      
      // Filter based on options
      if (type === 'HS2' && !exportOptions.hs2) return
      if (type === 'HS4' && !exportOptions.hs4) return
      if (type === 'HS6' && !exportOptions.hs6) return
      if (type === 'Total' && !exportOptions.total) return

      // Key structure: "Year|Type" 
      const key = `${year}|${type}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(row)
    })

    for (const [key, rows] of Object.entries(grouped)) {
       if (!rows.length) continue
       
       const [year, type] = key.split('|')
       
       const columns = Object.keys(rows[0])
       const header = columns.join(',')
       const csvRows = rows.map(row =>
         columns.map(c => {
           const v = String(row[c] ?? '')
           return v.includes(',') || v.includes('"') || v.includes('\n')
             ? `"${v.replace(/"/g, '""')}"`
             : v
         }).join(',')
       )
       const csv = [header, ...csvRows].join('\n')
       
       // Path generation
       let filename = `comtrade_${year}_${type}.csv`
       if (exportOptions.useFolders) {
         filename = `${year}/${filename}`
       }
       
       zip.file(filename, csv)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    
    // Construct dynamic filename
    const getSafeName = (str) => (str || '').replace(/[^a-zA-Z0-9 \-_]/g, '').trim()
    const rName = lastQuery?.reporterCode ? (results[0]?.reporterDesc || lastQuery.reporterCode) : 'All_Reporters'
    const pName = lastQuery?.breakdownPartner ? 'Partner_Iterated' : (lastQuery?.partnerCode ? (results[0]?.partnerDesc || lastQuery.partnerCode) : 'All_Partners')
    const fName = lastQuery?.flowCode ? (results[0]?.flowDesc || lastQuery.flowCode) : 'All_Flows'
    const periodStr = lastQuery?.batchMode ? `${lastQuery.periodStart}-${lastQuery.periodEnd}` : (lastQuery?.period || 'All_Periods')
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]
    
    // Indicate if specialized export
    const isSpecialized = exportOptions.hs2 || exportOptions.hs4 || exportOptions.hs6
    const filename = `Comtrade_${getSafeName(rName)}_${getSafeName(pName)}_${getSafeName(fName)}_(${periodStr})_${timestamp}${isSpecialized ? '_HS_Export' : ''}.zip`
    
    saveAs(content, filename)
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Trade Data Query</h1>
        <p>Search and download international trade data. {localStorage.getItem('comtrade_api_key') ? 'Using subscription key.' : 'Preview limits apply.'}</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {DATA_TYPES.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.id); setResults([]); setError(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Query Form */}
      <QueryForm onSubmit={handleSubmit} loading={loading}>
        {progress && (
          <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--accent-primary)' }}>
             <strong>Progress:</strong> {progress.message} ({progress.current}/{progress.total})
             <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '8px', borderRadius: '2px' }}>
               <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', transition: 'width 0.3s' }}></div>
             </div>
          </div>
        )}
      </QueryForm>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Meta info */}
      {meta && (
        <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div className="badge badge-info">Total Records: {meta.count.toLocaleString()}</div>
            {meta.elapsedTime && (
              <div className="badge badge-success">⏱ Total Time: {meta.elapsedTime}</div>
            )}
          </div>
          
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                 <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
                   <input type="checkbox" checked={exportOptions.useFolders} onChange={e => setExportOptions(o => ({...o, useFolders: e.target.checked}))} />
                   Year Folders
                 </label>
                 <span>|</span>
                 <span>Include:</span>
                 <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
                   <input type="checkbox" checked={exportOptions.hs2} onChange={e => setExportOptions(o => ({...o, hs2: e.target.checked}))} />
                   HS-2
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
                   <input type="checkbox" checked={exportOptions.hs4} onChange={e => setExportOptions(o => ({...o, hs4: e.target.checked}))} />
                   HS-4
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
                   <input type="checkbox" checked={exportOptions.hs6} onChange={e => setExportOptions(o => ({...o, hs6: e.target.checked}))} />
                   HS-6
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
                   <input type="checkbox" checked={exportOptions.total} onChange={e => setExportOptions(o => ({...o, total: e.target.checked}))} />
                   Total
                 </label>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadZip} title="Download separate CSV files">
                📦 Download ZIP
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <ResultsTable data={results} title={`comtrade-${activeTab}-data`} />
    </div>
  )
}
