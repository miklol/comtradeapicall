import { useState, useMemo, useEffect } from 'react'

export default function ResultsTable({ data = [], title }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Reset pagination when data or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [data, search])

  const columns = useMemo(() => {
    if (!data.length) return []
    return Object.keys(data[0])
  }, [data])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => String(row[col] ?? '').toLowerCase().includes(q))
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [filtered, sortCol, sortDir])

  // Pagination logic
  const totalPages = Math.ceil(sorted.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  const startRec = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRec = Math.min(currentPage * pageSize, sorted.length)

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const exportCSV = () => {
    if (!sorted.length) return
    const header = columns.join(',')
    const rows = sorted.map(row =>
      columns.map(c => {
        const v = String(row[c] ?? '')
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"`
          : v
      }).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'comtrade-data'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    if (!sorted.length) return
    const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'comtrade-data'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!data.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No Data</h3>
        <p>Submit a query to see results here.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="record-count">
            <strong>{sorted.length.toLocaleString()}</strong> records
            {sorted.length !== data.length && ` (filtered from ${data.length.toLocaleString()})`}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="search-bar">
            <span className="search-icon">🔎</span>
            <input
              className="form-input"
              type="text"
              placeholder="Filter results…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📥 CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={exportJSON}>📥 JSON</button>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer' }}>
                  {col}
                  <span className={`sort-arrow ${sortCol === col ? 'active' : ''}`}>
                    {sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, ri) => (
              <tr key={ri}>
                {columns.map(col => (
                  <td key={col} title={String(row[col] ?? '')}>
                    {(() => {
                      const val = row[col]
                      if (val == null) return '—'
                      const str = String(val)
                      if (str.startsWith('http://') || str.startsWith('https://')) {
                        return (
                          <a 
                            href={str} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                          >
                            Download ⬇️
                          </a>
                        )
                      }
                      return str
                    })()}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <div className="pagination-info">
          Showing <strong>{startRec}</strong> to <strong>{endRec}</strong> of <strong>{sorted.length.toLocaleString()}</strong> rows
        </div>
        
        <div className="pagination-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
            <label htmlFor="pageSize" className="text-secondary" style={{ fontSize: '0.875rem' }}>Rows:</label>
            <select 
              id="pageSize"
              className="form-select" 
              style={{ padding: '4px 8px', width: 'auto' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
          </div>

          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1}
            title="First Page"
          >
            «
          </button>
          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            title="Previous Page"
          >
            ‹
          </button>
          
          <span style={{ fontSize: '0.875rem', padding: '0 8px' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            ›
          </button>
          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages}
            title="Last Page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  )
}
