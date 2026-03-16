import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard        from './components/dashboard/Dashboard'
import CrossBucketPanel from './components/dashboard/CrossBucketPanel'
import PrepView         from './components/planning/PrepView'
import MonthView        from './components/planning/MonthView'
import WeekView         from './components/planning/WeekView'
import B1Work           from './components/domains/b1-work'
import B2Build          from './components/domains/b2-build'
import B3Fitness        from './components/domains/b3-fitness'
import B4Reading        from './components/domains/b4-reading'
import B5Social         from './components/domains/b5-social'
import B6Connections    from './components/domains/b6-connections'
import B7IdeaLab        from './components/domains/b7-idealab'

const BUCKETS = [
  { label: 'Work',        short: 'Work',  path: '/b1', icon: '💼' },
  { label: 'Build',       short: 'Build', path: '/b2', icon: '🔧' },
  { label: 'Fitness',     short: 'Fit',   path: '/b3', icon: '🎾' },
  { label: 'Reading',     short: 'Read',  path: '/b4', icon: '📖' },
  { label: 'Social',      short: 'Soc',   path: '/b5', icon: '📡' },
  { label: 'Connections', short: 'Links', path: '/b6', icon: '🔗' },
  { label: 'Idea Lab',    short: 'Ideas', path: '/b7', icon: '💡' },
]

const PLANNING = [
  { label: 'Prep',  path: '/prep',  icon: '◎' },
  { label: 'Month', path: '/month', icon: '▦' },
  { label: 'Week',  path: '/week',  icon: '▤' },
]

function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/" end style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo">Personal OS</div>
      </NavLink>

      <div className="sidebar-section" style={{ flex: 1 }}>
        {BUCKETS.map(n => (
          <NavLink key={n.path} to={n.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            {n.icon}&nbsp;&nbsp;{n.label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-section sidebar-footer">
        <div className="sidebar-label">Planning</div>
        {PLANNING.map(n => (
          <NavLink key={n.path} to={n.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            {n.icon}&nbsp;&nbsp;{n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function RightPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <>
      <button className={`panel-toggle${open ? ' is-open' : ''}`} onClick={onToggle} title="Cross-bucket synthesis">
        {open ? '›' : '‹'}
      </button>
      <aside className={`right-panel${open ? '' : ' closed'}`}>
        <CrossBucketPanel />
      </aside>
    </>
  )
}

function MobileHeader({ onSynthesis }: { onSynthesis: () => void }) {
  return (
    <header className="mobile-header">
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <span className="sidebar-logo" style={{ padding: 0 }}>Personal OS</span>
      </NavLink>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <NavLink to="/week"  className="btn btn-ghost btn-sm">▤ Week</NavLink>
        <NavLink to="/month" className="btn btn-ghost btn-sm">▦ Month</NavLink>
        <button className="btn btn-primary btn-sm" onClick={onSynthesis}>⚡</button>
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      {BUCKETS.map(b => (
        <NavLink key={b.path} to={b.path}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="bottom-nav-icon">{b.icon}</span>
          <span className="bottom-nav-label">{b.short}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function App() {
  const [panelOpen, setPanelOpen]           = useState(true)
  const [mobileSynthOpen, setMobileSynthOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className={`app-layout${panelOpen ? ' panel-open' : ' panel-closed'}`}>
        <Sidebar />
        <MobileHeader onSynthesis={() => setMobileSynthOpen(v => !v)} />

        <main className="main-content">
          <Routes>
            <Route path="/"      element={<Dashboard />} />
            <Route path="/prep"  element={<PrepView />} />
            <Route path="/month" element={<MonthView />} />
            <Route path="/week"  element={<WeekView />} />
            <Route path="/b1"    element={<B1Work />} />
            <Route path="/b2"    element={<B2Build />} />
            <Route path="/b3"    element={<B3Fitness />} />
            <Route path="/b4"    element={<B4Reading />} />
            <Route path="/b5"    element={<B5Social />} />
            <Route path="/b6"    element={<B6Connections />} />
            <Route path="/b7"    element={<B7IdeaLab />} />
          </Routes>
        </main>

        <RightPanel open={panelOpen} onToggle={() => setPanelOpen(v => !v)} />

        {mobileSynthOpen && (
          <div className="mobile-synth-overlay" onClick={() => setMobileSynthOpen(false)}>
            <div className="mobile-synth-drawer" onClick={e => e.stopPropagation()}>
              <div className="flex-between mb-md">
                <h2>Cross-Bucket Synthesis</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setMobileSynthOpen(false)}>✕</button>
              </div>
              <CrossBucketPanel />
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
