import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { section: 'Explore' },
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { to: '/query', icon: '🔍', label: 'Trade Data Query' },
  { to: '/availability', icon: '📊', label: 'Data Availability' },
  { section: 'Reference' },
  { to: '/references', icon: '📚', label: 'References & Codes' },
  { section: 'System' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? '✕' : '☰'}
      </button>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo-icon">🌐</div>
          <div>
            <h2>Comtrade Explorer</h2>
            <span className="brand-sub">UN Trade Data</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
                end={item.to === '/'}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderTop: '1px solid var(--border-color)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          UN Comtrade API v1
        </div>
      </aside>
    </>
  )
}
