import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { useDictation } from '../../../hooks/useDictation'

const MODES = ['depth', 'breadth', 'exploration', 'management']
const PRIORITIES = ['urgent', 'important', 'normal', 'explore']

function TodoList() {
  const [todos, setTodos] = useState<any[]>([])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('normal')

  const load = async () => setTodos(await api.b1.todos.get() as any[])
  useEffect(() => { load() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await api.b1.todos.add({ text, priority })
    setText(''); load()
  }
  const complete = async (id: string) => { await api.b1.todo.complete(id); load() }
  const remove = async (id: string) => { await api.b1.todo.del(id); load() }

  const open = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)

  return (
    <div className="card">
      <h2 className="mb-md">To-Dos</h2>
      <form onSubmit={add} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add task…" style={{ flex: 3 }} />
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ flex: 1 }}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Add</button>
      </form>

      {open.length === 0 && <div className="empty-state">No open tasks</div>}
      {open.map(t => (
        <div key={t.id} className="list-item">
          <button className="btn btn-ghost btn-sm" onClick={() => complete(t.id)}>✓</button>
          <div style={{ flex: 1 }}>
            <span>{t.text}</span>
            <div className="tag-row">
              <span className={`badge ${t.priority === 'urgent' ? 'badge-red' : t.priority === 'important' ? 'badge-yellow' : 'badge-gray'}`}>{t.priority}</span>
            </div>
          </div>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
      ))}

      {done.length > 0 && (
        <details className="mt-md">
          <summary className="muted" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Completed ({done.length})</summary>
          {done.slice(0, 10).map(t => (
            <div key={t.id} className="list-item" style={{ opacity: 0.5 }}>
              <span style={{ textDecoration: 'line-through' }}>{t.text}</span>
            </div>
          ))}
        </details>
      )}
    </div>
  )
}

function DailyLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), text: '', mode: '', energy: 7, hoursLogged: '', valueCreated: '', producerInteractions: 0, applicationsSubmitted: 0 })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setLogs(await api.b1.logs.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const { listening: dictating, toggle: toggleDictation } = useDictation(
    t => setForm(f => ({ ...f, text: f.text + (f.text ? ' ' : '') + t }))
  )
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b1.logs.add({ ...form, hoursLogged: form.hoursLogged ? parseFloat(form.hoursLogged as string) : null, mode: form.mode || null })
      setForm(f => ({ ...f, text: '', valueCreated: '', hoursLogged: '' }))
      load()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + (err instanceof Error ? err.message : String(err))) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="card">
      <h2 className="mb-md">Daily Log</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group">
            <label>Work Mode</label>
            <select value={form.mode} onChange={e => set('mode', e.target.value)}>
              <option value="">— select —</option>
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Hours</label><input type="number" value={form.hoursLogged} onChange={e => set('hoursLogged', e.target.value)} placeholder="0" min={0} max={24} step={0.5} /></div>
          <div className="form-group"><label>Energy (1–10)</label><input type="number" value={form.energy} onChange={e => set('energy', +e.target.value)} min={1} max={10} /></div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Log
            <button type="button" onClick={toggleDictation} title={dictating ? 'Stop dictation' : 'Dictate'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, color: dictating ? 'var(--red, #ef4444)' : 'inherit', opacity: dictating ? 1 : 0.5 }}>{dictating ? '⏹ stop' : '🎤'}</button>
          </label>
          <textarea value={form.text} onChange={e => set('text', e.target.value)} placeholder="Describe your work day…" required />
        </div>
        <div className="form-row">
          <div className="form-group"><label>Value Created</label><input value={form.valueCreated} onChange={e => set('valueCreated', e.target.value)} placeholder="e.g. $12k app submitted" /></div>
          <div className="form-group"><label>Producer Interactions</label><input type="number" value={form.producerInteractions} onChange={e => set('producerInteractions', +e.target.value)} min={0} /></div>
          <div className="form-group"><label>Applications Submitted</label><input type="number" value={form.applicationsSubmitted} onChange={e => set('applicationsSubmitted', +e.target.value)} min={0} /></div>
        </div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Log'}</button>
      </form>

      <div className="mt-lg">
        <h3 className="mb-md">Recent Logs</h3>
        {logs.length === 0 && <div className="empty-state">No logs yet</div>}
        {logs.slice(0, 7).map(l => (
          <div key={l.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="flex-between" style={{ width: '100%' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>{l.date}</span>
              <div className="tag-row">
                {l.mode && <span className="badge badge-purple">{l.mode}</span>}
                {l.energy && <span className="badge badge-yellow">⚡{l.energy}</span>}
                {l.hoursLogged && <span className="badge badge-gray">{l.hoursLogged}h</span>}
              </div>
            </div>
            <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>{l.text}</p>
            {l.valueCreated && <span className="badge badge-green mt-sm">{l.valueCreated}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyReport() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => {
    const r = await api.b1.reports.get() as any[]
    setReports(r)
    if (r.length > 0 && !selected) setSelected(r[0])
  }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b1.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Work</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate Report'}
        </button>
      </div>
      {reports.length > 1 && (
        <div className="tag-row mb-md">
          {reports.slice(0, 5).map(r => (
            <button key={r.id} className={`btn btn-sm ${selected?.id === r.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelected(r)}>{r.weekOf}</button>
          ))}
        </div>
      )}
      {selected
        ? <div className="report-content">{selected.content}</div>
        : <div className="empty-state">No reports yet — generate your first one above.</div>}
    </div>
  )
}

export default function B1Work() {
  const [tab, setTab] = useState('log')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B1 — Work (UGOA)</h1></div>
      <div className="tabs">
        {[['log', 'Daily Log'], ['todos', 'To-Dos'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'log'    && <DailyLog />}
      {tab === 'todos'  && <TodoList />}
      {tab === 'report' && <WeeklyReport />}
    </div>
  )
}
