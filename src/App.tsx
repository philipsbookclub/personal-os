import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard     from './components/dashboard/Dashboard'
import PrepView      from './components/planning/PrepView'
import MonthView     from './components/planning/MonthView'
import WeekView      from './components/planning/WeekView'
import B1Work        from './components/domains/b1-work'
import B2Build       from './components/domains/b2-build'
import B3Fitness     from './components/domains/b3-fitness'
import B4Reading     from './components/domains/b4-reading'
import B5Social      from './components/domains/b5-social'
import B6Connections from './components/domains/b6-connections'
import B7IdeaLab     from './components/domains/b7-idealab'

const NAV      = [{ label: 'Dashboard',     path: '/',     icon: '⊞' }]
const PLANNING = [
  { label: 'Prep',  path: '/prep',  icon: '◎' },
  { label: 'Month', path: '/month', icon: '▦' },
  { label: 'Week',  path: '/week',  icon: '▤' },
]
const BUCKETS = [
  { label: 'B1  Work',        path: '/b1', icon: '💼' },
  { label: 'B2  Build',       path: '/b2', icon: '🔧' },
  { label: 'B3  Fitness',     path: '/b3', icon: '🎾' },
  { label: 'B4  Reading',     path: '/b4', icon: '📖' },
  { label: 'B5  Social',      path: '/b5', icon: '📡' },
  { label: 'B6  Connections', path: '/b6', icon: '🔗' },
  { label: 'B7  Idea Lab',    path: '/b7', icon: '💡' },
]

function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">Personal OS</div>
      <div className="sidebar-section">
        {NAV.map(n => (
          <NavLink key={n.path} to={n.path} end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            {n.icon}&nbsp;&nbsp;{n.label}
          </NavLink>
        ))}
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Planning</div>
        {PLANNING.map(n => (
          <NavLink key={n.path} to={n.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            {n.icon}&nbsp;&nbsp;{n.label}
          </NavLink>
        ))}
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Buckets</div>
        {BUCKETS.map(n => (
          <NavLink key={n.path} to={n.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            {n.icon}&nbsp;&nbsp;{n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"    element={<Dashboard />} />
            <Route path="/prep"  element={<PrepView />} />
            <Route path="/month" element={<MonthView />} />
            <Route path="/week"  element={<WeekView />} />
            <Route path="/b1"  element={<B1Work />} />
            <Route path="/b2"  element={<B2Build />} />
            <Route path="/b3"  element={<B3Fitness />} />
            <Route path="/b4"  element={<B4Reading />} />
            <Route path="/b5"  element={<B5Social />} />
            <Route path="/b6"  element={<B6Connections />} />
            <Route path="/b7"  element={<B7IdeaLab />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
