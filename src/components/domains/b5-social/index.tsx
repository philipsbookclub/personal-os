import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { useDictation } from '../../../hooks/useDictation'

const STATUSES = ['applied', 'response', 'interview', 'offer', 'rejected', 'withdrawn']

function DailyLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), applicationsSubmitted: 0, responsesReceived: 0, interviewsScheduled: 0, connectionsForSearch: 0, meaningfulConversations: 0, followUpsSent: 0, eventsAttended: 0, momentumScore: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setLogs(await api.b5.logs.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const { listening: dictating, toggle: toggleDictation } = useDictation(
    t => setForm(f => ({ ...f, notes: f.notes + (f.notes ? ' ' : '') + t }))
  )
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b5.logs.add({ ...form, momentumScore: form.momentumScore ? parseInt(form.momentumScore) : null, videosPosted: 0, views: 0, followersGained: 0 })
      setForm(f => ({ ...f, notes: '', momentumScore: '' }))
      load()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + (err instanceof Error ? err.message : String(err))) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="card">
      <h2 className="mb-md">Daily Log</h2>
      <form onSubmit={submit}>
        <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <p className="muted mb-md" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>Job Search</p>
        <div className="grid-3">
          {([['applicationsSubmitted', 'Apps Sent'], ['responsesReceived', 'Responses'], ['interviewsScheduled', 'Interviews']] as [string, string][]).map(([k, l]) => (
            <div key={k} className="form-group"><label>{l}</label><input type="number" value={(form as any)[k]} onChange={e => set(k, +e.target.value)} min={0} /></div>
          ))}
        </div>
        <p className="muted mb-md" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>Networking</p>
        <div className="grid-3">
          {([['connectionsForSearch', 'Connections'], ['meaningfulConversations', 'Conversations'], ['followUpsSent', 'Follow-ups']] as [string, string][]).map(([k, l]) => (
            <div key={k} className="form-group"><label>{l}</label><input type="number" value={(form as any)[k]} onChange={e => set(k, +e.target.value)} min={0} /></div>
          ))}
        </div>
        <div className="form-row mt-md">
          <div className="form-group"><label>Events Attended</label><input type="number" value={form.eventsAttended} onChange={e => set('eventsAttended', +e.target.value)} min={0} /></div>
          <div className="form-group"><label>Momentum (1–5)</label><input type="number" value={form.momentumScore} onChange={e => set('momentumScore', e.target.value)} min={1} max={5} /></div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Notes
            <button type="button" onClick={toggleDictation} title={dictating ? 'Stop dictation' : 'Dictate'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, color: dictating ? 'var(--red, #ef4444)' : 'inherit', opacity: dictating ? 1 : 0.5 }}>{dictating ? '⏹ stop' : '🎤'}</button>
          </label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="What happened today?" />
        </div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Log'}</button>
      </form>
      <div className="mt-lg">
        {logs.slice(0, 7).map(l => (
          <div key={l.id} className="list-item">
            <span className="muted" style={{ fontSize: '0.8rem', minWidth: 80 }}>{l.date}</span>
            <div className="tag-row">
              <span className="badge badge-purple">{l.applicationsSubmitted} apps</span>
              <span className="badge badge-yellow">{l.meaningfulConversations} convos</span>
              {l.momentumScore && <span className="badge badge-green">momentum {l.momentumScore}/5</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function JobTracker() {
  const [jobs, setJobs] = useState<any[]>([])
  const [form, setForm] = useState({ company: '', role: '', appliedAt: new Date().toISOString().slice(0, 10), notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setJobs(await api.b5.jobs.get() as any[])
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b5.jobs.add(form)
      setForm(f => ({ ...f, company: '', role: '', notes: '' }))
      load()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + (err instanceof Error ? err.message : String(err))) }
    finally { setSubmitting(false) }
  }
  const updateStatus = async (id: string, status: string) => { await api.b5.jobs.status(id, status); load() }

  const active = jobs.filter(j => !['rejected', 'withdrawn'].includes(j.status))
  const closed = jobs.filter(j => ['rejected', 'withdrawn'].includes(j.status))

  return (
    <div className="card">
      <h2 className="mb-md">Job Tracker</h2>
      <div className="stat-row">
        {(['applied', 'response', 'interview', 'offer'] as string[]).map(s => (
          <div key={s} className="stat">
            <div className="stat-label">{s}</div>
            <div className="stat-value">{jobs.filter(j => j.status === s).length}</div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mb-md">
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}><label>Company</label><input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required /></div>
          <div className="form-group" style={{ flex: 2 }}><label>Role</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required /></div>
          <div className="form-group"><label>Date</label><input type="date" value={form.appliedAt} onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))} /></div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={submitting}>Add Application</button>
      </form>
      {active.map(j => (
        <div key={j.id} className="list-item">
          <div style={{ flex: 1 }}>
            <strong>{j.company}</strong> — {j.role}
            <div className="tag-row"><span className="muted" style={{ fontSize: '0.8rem' }}>{j.appliedAt}</span></div>
          </div>
          <select value={j.status} onChange={e => updateStatus(j.id, e.target.value)} style={{ width: 'auto' }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      ))}
      {closed.length > 0 && (
        <details className="mt-md">
          <summary className="muted" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Closed ({closed.length})</summary>
          {closed.map(j => (
            <div key={j.id} className="list-item" style={{ opacity: 0.5 }}>
              <span style={{ textDecoration: 'line-through' }}>{j.company} — {j.role}</span>
              <span className={`badge ${j.status === 'offer' ? 'badge-green' : 'badge-red'}`}>{j.status}</span>
            </div>
          ))}
        </details>
      )}
    </div>
  )
}

function WeeklyReport() {
  const [, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => { const r = await api.b5.reports.get() as any[]; setReports(r); if (r.length > 0 && !selected) setSelected(r[0]) }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b5.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Social</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}</button>
      </div>
      {selected ? <div className="report-content">{selected.content}</div> : <div className="empty-state">No reports yet</div>}
    </div>
  )
}

export default function B5Social() {
  const [tab, setTab] = useState('log')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B5 — Social / Career</h1></div>
      <div className="tabs">
        {[['log', 'Daily Log'], ['jobs', 'Job Tracker'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'log'    && <DailyLog />}
      {tab === 'jobs'   && <JobTracker />}
      {tab === 'report' && <WeeklyReport />}
    </div>
  )
}
