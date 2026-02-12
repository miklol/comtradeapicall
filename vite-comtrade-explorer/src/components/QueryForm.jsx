import { useState, useMemo } from 'react'
import reportersData from '../assets/reporters.json'

/**
 * Reusable query form for trade data selection criteria.
 * Props:
 *  - onSubmit(values) - called with the form values
 *  - loading - disables the submit button
 *  - showFlowCode - show flow code selector (default true)
 *  - showCmdCode - show commodity code (default true)
 *  - showPartner - show partner code (default true)
 *  - children - extra controls to render at the bottom
 */
export default function QueryForm({
  onSubmit,
  loading = false,
  showFlowCode = true,
  showCmdCode = true,
  showPartner = true,
  children,
}) {
  const [values, setValues] = useState({
    typeCode: 'C',
    freqCode: 'A',
    clCode: 'HS',
    period: '',
    reporterCode: '',
    cmdCode: '',
    flowCode: '',
    partnerCode: '',
    partner2Code: '',
    customsCode: '',
    customsCode: '',
    motCode: '',
    maxRecords: '', // default is 500 in API, but let user override
    includeDesc: true,
  })

  // Sort reporters alphabetically
  const sortedReporters = useMemo(() => {
    return [...reportersData].sort((a, b) => a.text.localeCompare(b.text))
  }, [])

  const set = (field) => (e) =>
    setValues(v => ({ ...v, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Selection Criteria</h3>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? '⏳ Loading…' : '🔍 Query'}
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Product Type</label>
          <select className="form-select" value={values.typeCode} onChange={set('typeCode')}>
            <option value="C">Goods (C)</option>
            <option value="S">Services (S)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Frequency</label>
          <select className="form-select" value={values.freqCode} onChange={set('freqCode')}>
            <option value="A">Annual (A)</option>
            <option value="M">Monthly (M)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Classification</label>
          <select className="form-select" value={values.clCode} onChange={set('clCode')}>
            <option value="HS">HS</option>
            <option value="S1">SITC Rev.1</option>
            <option value="S2">SITC Rev.2</option>
            <option value="S3">SITC Rev.3</option>
            <option value="S4">SITC Rev.4</option>
            <option value="SS">Services (EBOPS 2002)</option>
            <option value="B4">BEC Rev.4</option>
            <option value="B5">BEC Rev.5</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Period</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
            <label style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="periodMode"
                value="single"
                checked={!values.batchMode}
                onChange={() => setValues(v => ({ ...v, batchMode: false, period: '' }))}
                style={{ marginRight: '4px' }}
              />
              Single/List
            </label>
            <label style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="periodMode"
                value="batch"
                checked={values.batchMode}
                onChange={() => setValues(v => ({ ...v, batchMode: true, periodStart: '', periodEnd: '' }))}
                style={{ marginRight: '4px' }}
              />
              Range (Batch)
            </label>
          </div>
          
          {!values.batchMode ? (
            <>
              <input
                className="form-input"
                type="text"
                placeholder={values.freqCode === 'M' ? 'e.g. 202205' : 'e.g. 2022,2023'}
                value={values.period}
                onChange={set('period')}
              />
              <span className="form-hint">{values.freqCode === 'M' ? 'YYYYMM format (comma sep)' : 'YYYY format (comma sep)'}</span>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Start"
                  value={values.periodStart || ''}
                  onChange={set('periodStart')}
                  maxLength={6}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>-</div>
              <div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="End"
                  value={values.periodEnd || ''}
                  onChange={set('periodEnd')}
                  maxLength={6}
                />
              </div>
            </div>
          )}
          {values.batchMode && <span className="form-hint">Fetches data year-by-year to bypass limits.</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Reporter</label>
          <select className="form-select" value={values.reporterCode} onChange={set('reporterCode')}>
            <option value="">All Reporters</option>
            {sortedReporters.map(r => (
              <option key={r.id} value={r.id}>{r.text}</option>
            ))}
          </select>
          <span className="form-hint">Select a country or region</span>
        </div>
        {showCmdCode && (
          <div className="form-group">
            <label className="form-label">Commodity Code</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. 91 or TOTAL"
              value={values.cmdCode}
              onChange={set('cmdCode')}
            />
            <span className="form-hint">Use TOTAL for aggregate</span>
          </div>
        )}
        {showFlowCode && (
          <div className="form-group">
            <label className="form-label">Flow</label>
            <select className="form-select" value={values.flowCode} onChange={set('flowCode')}>
              <option value="">All Flows</option>
              <option value="M">Imports (M)</option>
              <option value="X">Exports (X)</option>
              <option value="RM">Re-imports (RM)</option>
              <option value="RX">Re-exports (RX)</option>
            </select>
          </div>
        )}
        {showPartner && (
          <div className="form-group">
            <label className="form-label">Partner</label>
             <select className="form-select" value={values.partnerCode} onChange={set('partnerCode')}>
              <option value="">All Partners</option>
              <option value="0">World</option>
              {sortedReporters.map(r => (
                <option key={r.id} value={r.id}>{r.text}</option>
              ))}
            </select>
            <span className="form-hint">Select a partner country</span>
            {values.batchMode && values.partnerCode === '' && (
              <div style={{ marginTop: 'var(--space-xs)' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--accent-primary)' }}>
                  <input
                    type="checkbox"
                    checked={values.breakdownPartner}
                    onChange={(e) => setValues(v => ({ ...v, breakdownPartner: e.target.checked }))}
                    style={{ marginRight: '6px' }}
                  />
                  Iterate all partners (Slow/Exhaustive)
                </label>
              </div>
            )}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Max Records</label>
          <input
            className="form-input"
            type="number"
            placeholder="500"
            value={values.maxRecords}
            onChange={set('maxRecords')}
            min="1"
            max="250000"
          />
          <span className="form-hint">Limit results (max 250k with key)</span>
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 'var(--space-md)' }}>
           <label className="form-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={values.includeDesc}
              onChange={(e) => setValues(v => ({ ...v, includeDesc: e.target.checked }))}
              style={{ marginRight: 'var(--space-xs)', width: 'auto' }}
            />
            Include Descriptions
          </label>
        </div>
      </div>

      {children}
    </form>
  )
}
