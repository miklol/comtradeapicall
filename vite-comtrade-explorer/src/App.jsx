import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import TradeDataQuery from './pages/TradeDataQuery'
import DataAvailability from './pages/DataAvailability'
import References from './pages/References'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/query" element={<TradeDataQuery />} />
          <Route path="/availability" element={<DataAvailability />} />
          <Route path="/references" element={<References />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
