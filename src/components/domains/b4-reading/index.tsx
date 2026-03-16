import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'

const GENRES = ['classic', 'nonfiction', 'business', 'other']

function Books() {
  const [books, setBooks] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', author: '', genre: 'nonfiction', startedAt: new Date().toISOString().slice(0, 10), totalPages: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setBooks(await api.b4.books.get() as any[])
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b4.books.add({ ...form, totalPages: form.totalPages ? parseInt(form.totalPages) : null })
      setForm(f => ({ ...f, title: '', author: '' }))
      load()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + (err instanceof Error ? err.message : String(err))) }
    finally { setSubmitting(false) }
  }

  const complete = async (id: string) => { await api.b4.books.complete(id); load() }
  const current = books.filter(b => !b.completedAt)
  const done = books.filter(b => b.completedAt)

  return (
    <div className="card">
      <h2 className="mb-md">Books</h2>
      <div className="stat-row">
        <div className="stat"><div className="stat-label">Reading</div><div className="stat-value">{current.length}</div></div>
        <div className="stat"><div className="stat-label">Completed</div><div className="stat-value success">{done.length}</div></div>
      </div>
      <form onSubmit={submit} className="mb-md">
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div className="form-group" style={{ flex: 2 }}><label>Author</label><input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required /></div>
          <div className="form-group"><label>Genre</label>
            <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Pages</label><input type="number" value={form.totalPages} onChange={e => setForm(f => ({ ...f, totalPages: e.target.value }))} placeholder="350" /></div>
        </div>
        <button className="btn btn-primary" disabled={submitting}>Start Book</button>
      </form>

      {current.map(b => (
        <div key={b.id} className="list-item">
          <div style={{ flex: 1 }}>
            <strong>{b.title}</strong> <span className="muted">by {b.author}</span>
            <div className="tag-row">
              <span className="badge badge-purple">{b.genre}</span>
              {b.totalPages && <span className="badge badge-gray">{b.totalPages}p</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => complete(b.id)}>Mark Done</button>
        </div>
      ))}
      {done.length > 0 && (
        <details className="mt-md">
          <summary className="muted" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Completed ({done.length})</summary>
          {done.map(b => (
            <div key={b.id} className="list-item" style={{ opacity: 0.5 }}>
              <span style={{ textDecoration: 'line-through' }}>{b.title}</span>
              <span className="badge badge-green">✓</span>
            </div>
          ))}
        </details>
      )}
    </div>
  )
}

function DailyLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), bookId: '', pagesRead: '', keyTakeaway: '', quote: '', appliedTo: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const [l, b] = await Promise.all([api.b4.logs.get(), api.b4.books.get()])
    setLogs(l as any[]); setBooks((b as any[]).filter((bk: any) => !bk.completedAt))
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b4.logs.add({ ...form, pagesRead: form.pagesRead ? parseInt(form.pagesRead) : null, bookId: form.bookId || null })
      setForm(f => ({ ...f, keyTakeaway: '', quote: '', appliedTo: '', pagesRead: '' }))
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
          <div className="form-group" style={{ flex: 2 }}><label>Book</label>
            <select value={form.bookId} onChange={e => set('bookId', e.target.value)}>
              <option value="">— select —</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Pages Read</label><input type="number" value={form.pagesRead} onChange={e => set('pagesRead', e.target.value)} placeholder="0" /></div>
        </div>
        <div className="form-group"><label>Key Takeaway</label><textarea value={form.keyTakeaway} onChange={e => set('keyTakeaway', e.target.value)} placeholder="What was the one idea that stuck?" /></div>
        <div className="form-group"><label>Applied To</label><input value={form.appliedTo} onChange={e => set('appliedTo', e.target.value)} placeholder="Did this connect to Magister, UGOA, or a current problem?" /></div>
        <div className="form-group"><label>Quote</label><input value={form.quote} onChange={e => set('quote', e.target.value)} placeholder="Notable quote…" /></div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
      </form>
      <div className="mt-lg">
        {logs.slice(0, 7).map(l => (
          <div key={l.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="flex-between" style={{ width: '100%' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>{l.date}</span>
              {l.pagesRead && <span className="badge badge-gray">{l.pagesRead}p</span>}
            </div>
            {l.keyTakeaway && <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>{l.keyTakeaway}</p>}
            {l.appliedTo && <span className="badge badge-green mt-sm">→ {l.appliedTo}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyReport() {
  const [, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => { const r = await api.b4.reports.get() as any[]; setReports(r); if (r.length > 0 && !selected) setSelected(r[0]) }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b4.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Reading</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}</button>
      </div>
      {selected ? <div className="report-content">{selected.content}</div> : <div className="empty-state">No reports yet</div>}
    </div>
  )
}

export default function B4Reading() {
  const [tab, setTab] = useState('books')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B4 — Reading (Mind)</h1></div>
      <div className="tabs">
        {[['books', 'Books'], ['log', 'Daily Log'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'books'  && <Books />}
      {tab === 'log'    && <DailyLog />}
      {tab === 'report' && <WeeklyReport />}
    </div>
  )
}
