import { useState } from 'react'
import ResultsTable from '../components/ResultsTable'
import { getDataAvailability, getLiveUpdate } from '../services/comtradeApi'

const AVAIL_TABS = [
  { id: 'final', label: 'Final Data' },
  { id: 'tariffline', label: 'Tariffline' },
  { id: 'bulk-final', label: 'Bulk Final' },
  { id: 'bulk-tariff', label: 'Bulk Tariffline' },
  { id: 'live', label: 'Live Updates' },
]

export default function DataAvailability() {
  const [activeTab, setActiveTab] = useState('final')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])

  // Form state
  const [typeCode, setTypeCode] = useState('C')
  const [freqCode, setFreqCode] = useState('A')
  const [clCode, setClCode] = useState('HS')
  const [period, setPeriod] = useState('')
  const [reporterCode, setReporterCode] = useState('')
  const [publishedDateFrom, setPublishedDateFrom] = useState('')
  const [publishedDateTo, setPublishedDateTo] = useState('')

  const handleQuery = async () => {
    setLoading(true)
    setError(null)
    setResults([])
    try {
      if (activeTab === 'live') {
        const res = await getLiveUpdate()
        setResults(res.data || [])
      } else {
        const tradeDataType = activeTab.includes('tariff') ? 'TARIFFLINE' : 'FINAL'
        const availType = activeTab.startsWith('bulk') ? 'BULK' : null
        const res = await getDataAvailability({
          tradeDataType,
          availType,
          typeCode,
          freqCode,
          clCode,
          period: period || undefined,
          reporterCode: reporterCode || undefined,
          publishedDateFrom: publishedDateFrom || undefined,
          publishedDateTo: publishedDateTo || undefined,
        })
        setResults(res.data || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Data Availability</h1>
        <p>Check which datasets are available and track recent releases.</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {AVAIL_TABS.map(t => (
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
      {activeTab !== 'live' && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Search Criteria</h3>
            <button className="btn btn-primary" onClick={handleQuery} disabled={loading}>
              {loading ? '⏳ Loading…' : '🔍 Check Availability'}
            </button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <select className="form-select" value={typeCode} onChange={e => setTypeCode(e.target.value)}>
                <option value="C">Goods (C)</option>
                <option value="S">Services (S)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={freqCode} onChange={e => setFreqCode(e.target.value)}>
                <option value="A">Annual (A)</option>
                <option value="M">Monthly (M)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Classification</label>
              <select className="form-select" value={clCode} onChange={e => setClCode(e.target.value)}>
                <option value="HS">HS</option>
                <option value="S1">SITC Rev.1</option>
                <option value="S2">SITC Rev.2</option>
                <option value="S3">SITC Rev.3</option>
                <option value="S4">SITC Rev.4</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Period</label>
              <input className="form-input" type="text" placeholder="e.g. 2022" value={period} onChange={e => setPeriod(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reporter Code</label>
              <input className="form-input" type="text" placeholder="Leave blank for all" value={reporterCode} onChange={e => setReporterCode(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Published From</label>
              <input className="form-input" type="date" value={publishedDateFrom} onChange={e => setPublishedDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Published To</label>
              <input className="form-input" type="date" value={publishedDateTo} onChange={e => setPublishedDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Live Updates has a simpler trigger */}
      {activeTab === 'live' && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Recent Data Releases</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                Requires a subscription key. Configure it in Settings.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleQuery} disabled={loading}>
              {loading ? '⏳ Loading…' : '🔄 Fetch Live Updates'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Results */}
      <ResultsTable data={results} title={`availability-${activeTab}`} />
    </div>
  )
}
