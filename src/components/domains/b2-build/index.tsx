import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'

const BUILD_MODES = ['product', 'strategy', 'outreach', 'fundraising']

function DailyLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), text: '', mode: '', hoursLogged: '', milestoneUpdate: '', blockers: '', coFounderAlignment: '', mentorsContacted: 0, keyDecision: '', aiLearningHours: '', aiTopic: '', aiInsight: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setLogs(await api.b2.logs.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    await api.b2.logs.add({ ...form, hoursLogged: form.hoursLogged ? parseFloat(form.hoursLogged) : null, aiLearningHours: form.aiLearningHours ? parseFloat(form.aiLearningHours) : null, coFounderAlignment: form.coFounderAlignment ? parseInt(form.coFounderAlignment) : null, mode: form.mode || null })
    setForm(f => ({ ...f, text: '', milestoneUpdate: '', blockers: '', keyDecision: '', aiInsight: '', aiTopic: '' }))
    load(); setSubmitting(false)
  }

  return (
    <div className="card">
      <h2 className="mb-md">Daily Log</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group"><label>Mode</label>
            <select value={form.mode} onChange={e => set('mode', e.target.value)}>
              <option value="">— select —</option>
              {BUILD_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Hours</label><input type="number" value={form.hoursLogged} onChange={e => set('hoursLogged', e.target.value)} placeholder="0" step={0.5} /></div>
          <div className="form-group"><label>Mentors Contacted</label><input type="number" value={form.mentorsContacted} onChange={e => set('mentorsContacted', +e.target.value)} min={0} /></div>
        </div>
        <div className="form-group"><label>Log</label><textarea value={form.text} onChange={e => set('text', e.target.value)} placeholder="What happened on Magister today…" required /></div>
        <div className="form-row">
          <div className="form-group"><label>Milestone Update</label><input value={form.milestoneUpdate} onChange={e => set('milestoneUpdate', e.target.value)} placeholder="Progress…" /></div>
          <div className="form-group"><label>Co-founder Alignment (1–5)</label><input type="number" value={form.coFounderAlignment} onChange={e => set('coFounderAlignment', e.target.value)} min={1} max={5} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Key Decision</label><input value={form.keyDecision} onChange={e => set('keyDecision', e.target.value)} placeholder="Decision made…" /></div>
          <div className="form-group"><label>Blockers</label><input value={form.blockers} onChange={e => set('blockers', e.target.value)} placeholder="What's blocking…" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>AI Learning Hours</label><input type="number" value={form.aiLearningHours} onChange={e => set('aiLearningHours', e.target.value)} placeholder="0" step={0.5} /></div>
          <div className="form-group"><label>AI Topic</label><input value={form.aiTopic} onChange={e => set('aiTopic', e.target.value)} placeholder="What you studied…" /></div>
          <div className="form-group"><label>AI Insight</label><input value={form.aiInsight} onChange={e => set('aiInsight', e.target.value)} placeholder="Key insight…" /></div>
        </div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Log'}</button>
      </form>

      <div className="mt-lg">
        {logs.length === 0 && <div className="empty-state">No logs yet</div>}
        {logs.slice(0, 7).map(l => (
          <div key={l.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="flex-between" style={{ width: '100%' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>{l.date}</span>
              <div className="tag-row">
                {l.mode && <span className="badge badge-purple">{l.mode}</span>}
                {l.hoursLogged && <span className="badge badge-gray">{l.hoursLogged}h</span>}
                {l.coFounderAlignment && <span className="badge badge-yellow">align {l.coFounderAlignment}/5</span>}
              </div>
            </div>
            <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>{l.text}</p>
            {l.blockers && <p className="muted mt-sm" style={{ fontSize: '0.8rem' }}>⚠ {l.blockers}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Milestones() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', targetDate: new Date().toISOString().slice(0, 10), notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setMilestones(await api.b2.milestones.get() as any[])
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    await api.b2.milestones.add(form)
    setForm(f => ({ ...f, title: '', notes: '' }))
    load(); setSubmitting(false)
  }

  return (
    <div className="card">
      <h2 className="mb-md">Milestones</h2>
      <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Milestone title…" required style={{ flex: 2 }} />
        <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} style={{ flex: 1 }} />
        <button className="btn btn-primary" type="submit" disabled={submitting}>Add</button>
      </form>
      {milestones.length === 0 && <div className="empty-state">No milestones set</div>}
      {milestones.map(m => (
        <div key={m.id} className="list-item">
          <div style={{ flex: 1 }}>
            <span style={{ textDecoration: m.completedAt ? 'line-through' : 'none' }}>{m.title}</span>
            <div className="tag-row">
              <span className={`badge ${m.completedAt ? 'badge-green' : 'badge-yellow'}`}>{m.completedAt ? '✓ done' : `target: ${m.targetDate}`}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeeklyReport() {
  const [, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => { const r = await api.b2.reports.get() as any[]; setReports(r); if (r.length > 0 && !selected) setSelected(r[0]) }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b2.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Build</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}</button>
      </div>
      {selected ? <div className="report-content">{selected.content}</div> : <div className="empty-state">No reports yet</div>}
    </div>
  )
}

export default function B2Build() {
  const [tab, setTab] = useState('log')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B2 — Build (Magister)</h1></div>
      <div className="tabs">
        {[['log', 'Daily Log'], ['milestones', 'Milestones'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'log'        && <DailyLog />}
      {tab === 'milestones' && <Milestones />}
      {tab === 'report'     && <WeeklyReport />}
    </div>
  )
}
