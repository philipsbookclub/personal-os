import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const BUCKETS = [
  { id: 'b1', label: 'Work',        icon: '💼', path: '/b1' },
  { id: 'b2', label: 'Build',       icon: '🔧', path: '/b2' },
  { id: 'b3', label: 'Fitness',     icon: '🎾', path: '/b3' },
  { id: 'b4', label: 'Reading',     icon: '📖', path: '/b4' },
  { id: 'b5', label: 'Social',      icon: '📡', path: '/b5' },
  { id: 'b6', label: 'Connections', icon: '🔗', path: '/b6' },
  { id: 'b7', label: 'Idea Lab',    icon: '💡', path: '/b7' },
]

export default function Dashboard() {
  const [week, setWeek]   = useState<any>(null)
  const [month, setMonth] = useState<any>(null)

  useEffect(() => {
    api.week.get().then(setWeek)
    api.month.get().then(setMonth)
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {(week?.theme || month?.theme) && (
        <div className="grid-2 mb-md">
          {month?.theme && (
            <div className="card">
              <div className="muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Month Theme</div>
              <h2 style={{ marginTop: '0.35rem' }}>{month.theme}</h2>
              {month.priorities?.filter((p: any) => p.title).slice(0, 3).map((p: any, i: number) => (
                <div key={i} className="list-item" style={{ fontSize: '0.875rem' }}>
                  <span style={{ flex: 1 }}>{p.title}</span>
                  <span className="badge badge-purple">{p.timePercent}%</span>
                </div>
              ))}
            </div>
          )}
          {week?.theme && (
            <div className="card">
              <div className="muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Week Theme</div>
              <h2 style={{ marginTop: '0.35rem' }}>{week.theme}</h2>
              {week.outcomes?.filter(Boolean).slice(0, 3).map((o: string, i: number) => (
                <div key={i} className="list-item" style={{ fontSize: '0.875rem' }}>→ {o}</div>
              ))}
              {week.minimumViableWeek && <p className="muted mt-md" style={{ fontSize: '0.8rem' }}>MVW: {week.minimumViableWeek}</p>}
            </div>
          )}
        </div>
      )}

      <div className="bucket-grid">
        {BUCKETS.map(b => (
          <a key={b.id} href={b.path} className="card bucket-card">
            <div className="bucket-card-icon">{b.icon}</div>
            <div className="bucket-card-label">{b.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
