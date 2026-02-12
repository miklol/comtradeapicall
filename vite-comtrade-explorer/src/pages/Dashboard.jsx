import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const quickActions = [
  {
    icon: '🔍',
    title: 'Trade Data Query',
    desc: 'Search and preview international trade data by country, commodity, and time period.',
    to: '/query',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  },
  {
    icon: '📊',
    title: 'Data Availability',
    desc: 'Check which datasets are available and see recent data releases.',
    to: '/availability',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  },
  {
    icon: '📚',
    title: 'References & Codes',
    desc: 'Browse reporter/partner codes, commodity classifications, and convert ISO3 codes.',
    to: '/references',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  },
  {
    icon: '⚙️',
    title: 'Settings',
    desc: 'Manage your API subscription key and proxy configuration.',
    to: '/settings',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },
]

const stats = [
  { label: 'Countries', value: '200+', icon: '🌍' },
  { label: 'Commodities', value: '5,000+', icon: '📦' },
  { label: 'Years', value: '1962–2024', icon: '📅' },
  { label: 'Records', value: 'Billions', icon: '💾' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const hasKey = !!localStorage.getItem('comtrade_api_key')

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('comtrade_query_history') || '[]')
      setHistory(h.slice(0, 5))
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="page-header">
        <h1>UN Comtrade Explorer</h1>
        <p>Query, visualize, and export international trade data from the United Nations Comtrade database.</p>
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        {stats.map(s => (
          <div key={s.label} className="card stat-card">
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
      <div className="card-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        {quickActions.map(a => (
          <div key={a.to} className="card action-card" onClick={() => navigate(a.to)}>
            <div className="card-icon" style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: a.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 'var(--space-md)'
            }}>
              {a.icon}
            </div>
            <h3>{a.title}</h3>
            <p>{a.desc}</p>
          </div>
        ))}
      </div>

      {/* API Key Status */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>API Key Status</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              {hasKey
                ? 'Your subscription key is saved. You have access to full data (250K records).'
                : 'No subscription key set. Using preview mode (limited to 500 records).'}
            </p>
          </div>
          <span className={`badge ${hasKey ? 'badge-success' : 'badge-warning'}`}>
            {hasKey ? '✓ Active' : '⚠ Preview Mode'}
          </span>
        </div>
      </div>

      {/* Recent Queries */}
      {history.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Recent Queries</h3>
          {history.map((h, i) => (
            <div key={i} style={{
              padding: 'var(--space-sm) 0',
              borderBottom: i < history.length - 1 ? '1px solid var(--border-color)' : 'none',
              fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)',
              display: 'flex', justifyContent: 'space-between'
            }}>
              <span>{h.description}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>{h.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
