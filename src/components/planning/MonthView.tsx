import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

export default function MonthView() {
  const thisMonth = new Date().toISOString().slice(0, 7)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    month: thisMonth, theme: '', identityStatement: '',
    priorities: [{ title: '', timePercent: 0, keyFocus: '', metrics: ['', '', '', '', ''] }],
    obstacles: ['', '', ''],
  })

  useEffect(() => {
    api.month.get().then((d: any) => {
      if (d && d.theme !== undefined) {
        setForm({
          month: d.month || thisMonth, theme: d.theme || '', identityStatement: d.identityStatement || '',
          priorities: d.priorities?.length ? d.priorities.map((p: any) => ({ ...p, metrics: p.metrics?.length ? p.metrics : ['', '', '', '', ''] })) : [{ title: '', timePercent: 0, keyFocus: '', metrics: ['', '', '', '', ''] }],
          obstacles: d.obstacles?.length ? d.obstacles : ['', '', ''],
        })
      }
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.month.save({ ...form, priorities: form.priorities.filter(p => p.title), obstacles: form.obstacles.filter(Boolean) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const updatePriority = (i: number, k: string, v: any) =>
    setForm(f => { const p = [...f.priorities]; p[i] = { ...p[i], [k]: v }; return { ...f, priorities: p } })

  const updateMetric = (pi: number, mi: number, v: string) => {
    setForm(f => {
      const p = [...f.priorities]
      const ms = [...p[pi].metrics]; ms[mi] = v; p[pi] = { ...p[pi], metrics: ms }
      return { ...f, priorities: p }
    })
  }

  const totalPercent = form.priorities.reduce((s, p) => s + (p.timePercent || 0), 0)

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Month Plan — {form.month}</h1></div>
      <form onSubmit={submit}>
        <div className="card mb-md">
          <h2 className="mb-md">Month Frame</h2>
          <div className="form-row">
            <div className="form-group"><label>Month</label><input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></div>
            <div className="form-group" style={{ flex: 3 }}><label>Theme</label><input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="One phrase that frames this month…" /></div>
          </div>
          <div className="form-group"><label>Monthly Identity Statement</label><textarea value={form.identityStatement} onChange={e => setForm(f => ({ ...f, identityStatement: e.target.value }))} placeholder="This month I am…" /></div>
        </div>

        <div className="card mb-md">
          <div className="flex-between mb-md">
            <h2>Top Priorities</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className={`badge ${totalPercent === 100 ? 'badge-green' : totalPercent > 100 ? 'badge-red' : 'badge-yellow'}`}>{totalPercent}% allocated</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, priorities: [...f.priorities, { title: '', timePercent: 0, keyFocus: '', metrics: ['', '', '', '', ''] }] }))}>+ Add</button>
            </div>
          </div>
          {form.priorities.map((p, i) => (
            <div key={i} className="card mb-md" style={{ background: 'var(--surface2)' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 3 }}><label>Priority {i + 1}</label><input value={p.title} onChange={e => updatePriority(i, 'title', e.target.value)} placeholder="Name…" /></div>
                <div className="form-group"><label>Time %</label><input type="number" value={p.timePercent} onChange={e => updatePriority(i, 'timePercent', +e.target.value)} min={0} max={100} /></div>
              </div>
              <div className="form-group"><label>Key Focus</label><input value={p.keyFocus} onChange={e => updatePriority(i, 'keyFocus', e.target.value)} placeholder="What does winning look like?" /></div>
              <div className="form-group">
                <label>5 Measurable Metrics</label>
                {p.metrics.map((m: string, mi: number) => (
                  <input key={mi} value={m} onChange={e => updateMetric(i, mi, e.target.value)} placeholder={`Metric ${mi + 1}…`} style={{ marginBottom: '0.4rem' }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card mb-md">
          <h2 className="mb-md">Preemptive Obstacles</h2>
          <p className="muted mb-md" style={{ fontSize: '0.8rem' }}>What 3 things are most likely to derail this month?</p>
          {form.obstacles.map((o, i) => (
            <div key={i} className="form-group"><label>Obstacle {i + 1}</label><input value={o} onChange={e => setForm(f => { const ob = [...f.obstacles]; ob[i] = e.target.value; return { ...f, obstacles: ob } })} placeholder="What could derail this month?" /></div>
          ))}
        </div>

        <button className="btn btn-primary" type="submit">{saved ? '✓ Saved' : 'Save Month Plan'}</button>
      </form>
    </div>
  )
}
