import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'

const BUCKET_OPTS = ['serendipity', 'social', 'both']
const CATEGORIES = ['personal', 'business', 'creative', 'mentor']
const STATUSES = ['new', 'warm', 'active', 'dormant']
const INTERACTION_TYPES = ['hangout', 'call-video', 'text-dm', 'event', 'business-mtg']

function AddInteractionModal({ contactId, onClose, onSaved }: { contactId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'hangout', date: new Date().toISOString().slice(0, 10), note: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b6.interaction(contactId, form)
      onSaved(); onClose()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + (err instanceof Error ? err.message : String(err))) }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 420 }}>
        <div className="flex-between mb-md"><h2>Log Interaction</h2><button className="btn btn-ghost btn-sm" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {INTERACTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Note</label><textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="What happened?" /></div>
          <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        </form>
      </div>
    </div>
  )
}

function ContactCard({ c, onLog }: { c: any; onLog: (id: string) => void }) {
  const sorted = [...(c.interactions || [])].sort((a: any, b: any) => b.date.localeCompare(a.date))
  const last = sorted[0]
  const daysSince = last ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000) : null
  const cold = daysSince !== null && daysSince >= 14 && c.status !== 'dormant'

  return (
    <div className="card mb-md">
      <div className="flex-between">
        <div>
          <strong>{c.name}</strong>
          {c.whereMet && <span className="muted" style={{ fontSize: '0.8rem' }}> · {c.whereMet}</span>}
          <div className="tag-row">
            <span className="badge badge-purple">{c.bucket}</span>
            {c.category && <span className="badge badge-gray">{c.category}</span>}
            <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'new' ? 'badge-yellow' : 'badge-gray'}`}>{c.status}</span>
            {cold && <span className="badge badge-red">⚠ {daysSince}d cold</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: '0.75rem' }}>{c.interactions?.length || 0} interactions</div>
          {last && <div className="muted" style={{ fontSize: '0.75rem' }}>{last.date}</div>}
          <button className="btn btn-ghost btn-sm mt-sm" onClick={() => onLog(c.id)}>+ Log</button>
        </div>
      </div>
      {c.notes && <p className="muted mt-sm" style={{ fontSize: '0.8rem' }}>{c.notes}</p>}
    </div>
  )
}

function ContactList() {
  const [contacts, setContacts] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [logFor, setLogFor] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ name: '', bucket: 'serendipity', category: '', status: 'new', whereMet: '', metAt: new Date().toISOString().slice(0, 10), notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setContacts(await api.b6.contacts.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b6.contacts.add({ ...form, category: form.category || null })
      setForm(f => ({ ...f, name: '', whereMet: '', notes: '' }))
      setShowAdd(false); load()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + (err instanceof Error ? err.message : String(err))) }
    finally { setSubmitting(false) }
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
  const cold = contacts.filter(c => c.status !== 'dormant' && c.interactions?.length > 0 &&
    [...c.interactions].sort((a: any, b: any) => b.date.localeCompare(a.date))[0]?.date < twoWeeksAgo)

  const filtered = filter === 'cold' ? cold : filter === 'all' ? contacts : contacts.filter(c => c.status === filter)

  return (
    <div>
      {logFor && <AddInteractionModal contactId={logFor} onClose={() => setLogFor(null)} onSaved={load} />}

      <div className="flex-between mb-md">
        <div className="tag-row">
          {([['all', `All (${contacts.length})`], ['active', 'Active'], ['cold', `⚠ Cold (${cold.length})`]] as [string, string][]).map(([k, l]) => (
            <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add Contact</button>
      </div>

      {showAdd && (
        <div className="card mb-md">
          <h3 className="mb-md">New Contact</h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div className="form-group"><label>Where Met</label><input value={form.whereMet} onChange={e => set('whereMet', e.target.value)} placeholder="gym, event, intro…" /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.metAt} onChange={e => set('metAt', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Bucket</label><select value={form.bucket} onChange={e => set('bucket', e.target.value)}>{BUCKET_OPTS.map(b => <option key={b}>{b}</option>)}</select></div>
              <div className="form-group"><label>Category</label><select value={form.category} onChange={e => set('category', e.target.value)}><option value="">—</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="First impression, context…" /></div>
            <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Add Contact'}</button>
          </form>
        </div>
      )}

      {filtered.length === 0 && <div className="empty-state">No contacts</div>}
      {filtered.map(c => <ContactCard key={c.id} c={c} onLog={setLogFor} />)}
    </div>
  )
}

function WeeklyReport() {
  const [, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => { const r = await api.b6.reports.get() as any[]; setReports(r); if (r.length > 0 && !selected) setSelected(r[0]) }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b6.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Connections</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}</button>
      </div>
      {selected ? <div className="report-content">{selected.content}</div> : <div className="empty-state">No reports yet</div>}
    </div>
  )
}

export default function B6Connections() {
  const [tab, setTab] = useState('contacts')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B6 — Connections</h1></div>
      <div className="tabs">
        {[['contacts', 'Contacts'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'contacts' && <ContactList />}
      {tab === 'report'   && <WeeklyReport />}
    </div>
  )
}
