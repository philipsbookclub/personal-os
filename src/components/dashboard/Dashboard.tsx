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
  const [week, setWeek]         = useState<any>(null)
  const [month, setMonth]       = useState<any>(null)
  const [crossReport, setCrossReport]   = useState<any>(null)
  const [crossReports, setCrossReports] = useState<any[]>([])
  const [generating, setGenerating]     = useState(false)

  useEffect(() => {
    api.week.get().then(setWeek)
    api.month.get().then(setMonth)
    api.cross.get().then((r: any) => {
      if (Array.isArray(r) && r.length > 0) { setCrossReports(r); setCrossReport(r[0]) }
    })
  }, [])

  const generateCross = async () => {
    setGenerating(true)
    try {
      const r = await api.cross.generate() as any
      setCrossReport(r)
      const updated = await api.cross.get() as any[]
      setCrossReports(updated)
    } finally { setGenerating(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={generateCross} disabled={generating}>
          {generating ? <><span className="spinner" />&nbsp;Synthesizing…</> : '⚡ Cross-Bucket Report'}
        </button>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {BUCKETS.map(b => (
          <a key={b.id} href={b.path} className="card" style={{ textAlign: 'center', textDecoration: 'none', padding: '0.75rem 0.5rem' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{b.icon}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{b.label}</div>
          </a>
        ))}
      </div>

      <div className="card">
        <div className="flex-between mb-md">
          <h2>Cross-Bucket Synthesis</h2>
          {crossReports.length > 1 && (
            <div className="tag-row">
              {crossReports.slice(0, 4).map((r: any) => (
                <button key={r.id} className={`btn btn-sm ${crossReport?.id === r.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCrossReport(r)}>{r.weekOf}</button>
              ))}
            </div>
          )}
        </div>
        {crossReport
          ? <div className="report-content">{crossReport.content}</div>
          : (
            <div className="empty-state">
              Generate your first cross-bucket synthesis report above.<br /><br />
              This report uses all 7 bucket weekly reports as input and surfaces patterns you can&apos;t see from inside any single bucket.
            </div>
          )}
      </div>
    </div>
  )
}
