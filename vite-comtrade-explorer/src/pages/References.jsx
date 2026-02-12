import { useState, useEffect } from 'react'
import ResultsTable from '../components/ResultsTable'
import { listReference, getReference, convertCountryIso3ToCode } from '../services/comtradeApi'

export default function References() {
  const [refList, setRefList] = useState([])
  const [selectedRef, setSelectedRef] = useState(null)
  const [refData, setRefData] = useState([])
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState(null)

  // ISO3 converter
  const [iso3Input, setIso3Input] = useState('')
  const [convertResult, setConvertResult] = useState(null)
  const [converting, setConverting] = useState(false)

  // Load reference list on mount
  useEffect(() => {
    (async () => {
      try {
        const refs = await listReference()
        setRefList(refs)
      } catch (err) {
        setError('Failed to load reference list: ' + err.message)
      } finally {
        setListLoading(false)
      }
    })()
  }, [])

  const handleRefClick = async (category) => {
    setSelectedRef(category)
    setRefData([])
    setLoading(true)
    setError(null)
    try {
      const data = await getReference(category)
      setRefData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!iso3Input.trim()) return
    setConverting(true)
    setConvertResult(null)
    try {
      const codes = await convertCountryIso3ToCode(iso3Input.trim())
      setConvertResult(codes || 'No matching codes found')
    } catch (err) {
      setConvertResult('Error: ' + err.message)
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>References & Codes</h1>
        <p>Browse reference tables for reporters, partners, commodities, and more. Convert ISO3 country codes.</p>
      </div>

      {/* ISO3 Converter */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          🔄 ISO3 → Comtrade Code Converter
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label className="form-label">ISO3 Country Codes</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. USA,FRA,CHE,ITA"
              value={iso3Input}
              onChange={e => setIso3Input(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConvert()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleConvert} disabled={converting} style={{ marginBottom: 0 }}>
            {converting ? '⏳' : '🔄'} Convert
          </button>
        </div>
        {convertResult != null && (
          <div style={{
            marginTop: 'var(--space-md)', padding: 'var(--space-md)',
            background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace', fontSize: 'var(--font-size-md)', color: 'var(--text-accent)'
          }}>
            Comtrade Codes: <strong>{convertResult}</strong>
          </div>
        )}
      </div>

      {/* Reference Tables */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          📚 Reference Tables
        </h3>
        {listLoading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span className="loading-text">Loading references…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {refList.map((ref, i) => (
              <button
                key={i}
                className={`btn ${selectedRef === ref.category ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleRefClick(ref.category)}
              >
                {ref.category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Reference Data */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
          <span className="loading-text">Loading {selectedRef}…</span>
        </div>
      )}

      {!loading && refData.length > 0 && (
        <>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            Reference: <span style={{ color: 'var(--text-accent)' }}>{selectedRef}</span>
          </h3>
          <ResultsTable data={refData} title={`reference-${selectedRef}`} />
        </>
      )}
    </div>
  )
}
