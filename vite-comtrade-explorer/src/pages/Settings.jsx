import { useState, useEffect } from 'react'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const k = localStorage.getItem('comtrade_api_key') || ''
    setApiKey(k)
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('comtrade_api_key', apiKey.trim())
    } else {
      localStorage.removeItem('comtrade_api_key')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClear = () => {
    setApiKey('')
    localStorage.removeItem('comtrade_api_key')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClearHistory = () => {
    localStorage.removeItem('comtrade_query_history')
    alert('Query history cleared.')
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your API subscription key and application preferences.</p>
      </div>

      {/* API Key */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          🔑 API Subscription Key
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Enter your UN Comtrade API subscription key. This key is stored locally in your browser and never sent to any third-party server.
          Get a key at{' '}
          <a href="https://comtradedeveloper.un.org" target="_blank" rel="noopener noreferrer">
            comtradedeveloper.un.org
          </a>.
        </p>

        <div className="form-group">
          <label className="form-label">Subscription Key</label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              className="form-input"
              type={showKey ? 'text' : 'password'}
              placeholder="Enter your subscription key…"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn-icon" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <span className="form-hint">Without a key, you can still use preview endpoints (max 500 records).</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Save Key
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            🗑️ Clear Key
          </button>
          {saved && <span className="badge badge-success" style={{ animation: 'pageIn 0.3s ease-out' }}>✓ Saved</span>}
        </div>
      </div>

      {/* Info about the modes */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          📖 API Access Modes
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div style={{ padding: 'var(--space-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div className="badge badge-warning" style={{ marginBottom: 'var(--space-sm)' }}>Preview Mode</div>
            <h4 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-xs)' }}>No Key Required</h4>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', paddingLeft: 'var(--space-lg)' }}>
              <li>Max 500 records per query</li>
              <li>Final and tariffline data preview</li>
              <li>Public data availability</li>
              <li>Reference tables</li>
            </ul>
          </div>
          <div style={{ padding: 'var(--space-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div className="badge badge-success" style={{ marginBottom: 'var(--space-sm)' }}>Full Access</div>
            <h4 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-xs)' }}>With Subscription Key</h4>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', paddingLeft: 'var(--space-lg)' }}>
              <li>Up to 250,000 records per query</li>
              <li>Full data endpoints</li>
              <li>Data availability with date filtering</li>
              <li>Live update feed</li>
              <li>Bulk download availability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          🗂️ Data Management
        </h3>
        <div className="form-group">
          <button className="btn btn-secondary" onClick={handleClearHistory}>
            🗑️ Clear Query History
          </button>
          <span className="form-hint" style={{ display: 'block' }}>Remove all saved query history from your browser.</span>
        </div>
      </div>
    </div>
  )
}
