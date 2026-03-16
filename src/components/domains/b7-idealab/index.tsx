import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'

const ORIGINS = ['shower', 'reading', 'conversation', 'serendipity', 'work', 'other']
const CATEGORIES = ['business', 'product', 'creative', 'personal', 'other']
const STAGES = ['spark', 'explored', 'validated', 'in-progress', 'executed', 'parked', 'killed']
const STAGE_COLOR: Record<string, string> = { spark: 'badge-yellow', explored: 'badge-purple', validated: 'badge-green', 'in-progress': 'badge-green', executed: 'badge-green', parked: 'badge-gray', killed: 'badge-red' }

function AddIdea({ onAdded }: { onAdded: () => void }) {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', capturedAt: new Date().toISOString().slice(0, 10), origin: 'other', category: 'other', stage: 'spark' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    await api.b7.ideas.add(form)
    setForm(f => ({ ...f, title: '', description: '' }))
    setShow(false); onAdded(); setSubmitting(false)
  }

  if (!show) return <button className="btn btn-primary" onClick={() => setShow(true)}>+ Capture Idea</button>

  return (
    <div className="card mb-md">
      <div className="flex-between mb-md"><h3>Capture Idea</h3><button className="btn btn-ghost btn-sm" onClick={() => setShow(false)}>Cancel</button></div>
      <form onSubmit={submit}>
        <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="One-line idea…" /></div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="As much or as little as needed…" /></div>
        <div className="form-row">
          <div className="form-group"><label>Origin</label><select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}>{ORIGINS.map(o => <option key={o}>{o}</option>)}</select></div>
          <div className="form-group"><label>Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label>Date</label><input type="date" value={form.capturedAt} onChange={e => setForm(f => ({ ...f, capturedAt: e.target.value }))} /></div>
        </div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Idea'}</button>
      </form>
    </div>
  )
}

function IdeaCard({ idea, onRefresh }: { idea: any; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [killForm, setKillForm] = useState({ quality: 'died-well', reason: '' })
  const [journalText, setJournalText] = useState('')
  const [parkDate, setParkDate] = useState('')

  const isAlive = !['killed', 'parked'].includes(idea.stage)
  const nextStages = STAGES.filter(s => s !== idea.stage && s !== 'killed' && s !== 'parked')

  const advance = async (stage: string) => { await api.b7.stage(idea.id, stage); onRefresh() }
  const kill = async () => { if (!killForm.reason) return; await api.b7.kill(idea.id, { killQuality: killForm.quality, killReason: killForm.reason }); onRefresh() }
  const park = async () => { if (!parkDate) return; await api.b7.park(idea.id, { parkedUntil: parkDate }); onRefresh() }
  const addJournal = async () => {
    if (!journalText.trim()) return
    await api.b7.journal(idea.id, journalText)
    setJournalText(''); onRefresh()
  }

  return (
    <div className="card mb-md">
      <div style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div className="flex-between">
          <div>
            <strong>{idea.title}</strong>
            <div className="tag-row">
              <span className={`badge ${STAGE_COLOR[idea.stage] || 'badge-gray'}`}>{idea.stage}</span>
              <span className="badge badge-gray">{idea.origin}</span>
              <span className="badge badge-gray">{idea.category}</span>
            </div>
          </div>
          <span className="muted">{expanded ? '▲' : '▼'}</span>
        </div>
        {idea.description && !expanded && <p className="muted mt-sm" style={{ fontSize: '0.8rem' }}>{idea.description.slice(0, 80)}{idea.description.length > 80 ? '…' : ''}</p>}
      </div>

      {expanded && (
        <div className="mt-md">
          {idea.description && <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{idea.description}</p>}

          {isAlive && (
            <>
              <div className="tag-row mb-md">
                {nextStages.map(s => <button key={s} className="btn btn-ghost btn-sm" onClick={() => advance(s)}>→ {s}</button>)}
              </div>
              <div className="form-group">
                <label>Add Journal Entry</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Note…" style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-sm" onClick={addJournal}>Add</button>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Park Until</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="date" value={parkDate} onChange={e => setParkDate(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-ghost btn-sm" onClick={park}>Park</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Kill</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={killForm.quality} onChange={e => setKillForm(f => ({ ...f, quality: e.target.value }))}>
                      <option value="died-well">Died well</option>
                      <option value="died-poorly">Died poorly</option>
                    </select>
                    <input value={killForm.reason} onChange={e => setKillForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason…" style={{ flex: 2 }} />
                    <button className="btn btn-danger btn-sm" onClick={kill}>Kill</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {idea.journal?.length > 0 && (
            <div className="mt-md">
              <p className="muted mb-md" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Journal</p>
              {idea.journal.map((j: any) => (
                <div key={j.id} className="list-item" style={{ fontSize: '0.8rem' }}>
                  <span className="muted" style={{ minWidth: 80 }}>{j.date}</span>
                  <span>{j.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IdeaList() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [filter, setFilter] = useState('active')

  const load = async () => setIdeas(await api.b7.ideas.get() as any[])
  useEffect(() => { load() }, [])

  const active = ideas.filter(i => !['killed', 'parked'].includes(i.stage))
  const parked = ideas.filter(i => i.stage === 'parked')
  const killed = ideas.filter(i => i.stage === 'killed')
  const displayed = filter === 'active' ? active : filter === 'parked' ? parked : killed

  const stageCounts = STAGES.reduce((acc, s) => ({ ...acc, [s]: ideas.filter(i => i.stage === s).length }), {} as Record<string, number>)

  return (
    <div>
      <div className="stat-row mb-md">
        {Object.entries(stageCounts).filter(([, v]) => v > 0).map(([k, v]) => (
          <div key={k} className="stat"><div className="stat-label">{k}</div><div className="stat-value">{v}</div></div>
        ))}
      </div>
      <div className="flex-between mb-md">
        <div className="tag-row">
          {([['active', `Active (${active.length})`], ['parked', `Parked (${parked.length})`], ['killed', `Killed (${killed.length})`]] as [string, string][]).map(([k, l]) => (
            <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <AddIdea onAdded={load} />
      </div>
      {displayed.length === 0 && <div className="empty-state">No ideas here</div>}
      {displayed.map(i => <IdeaCard key={i.id} idea={i} onRefresh={load} />)}
    </div>
  )
}

function WeeklyReport() {
  const [, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => { const r = await api.b7.reports.get() as any[]; setReports(r); if (r.length > 0 && !selected) setSelected(r[0]) }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b7.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Idea Lab</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}</button>
      </div>
      {selected ? <div className="report-content">{selected.content}</div> : <div className="empty-state">No reports yet</div>}
    </div>
  )
}

export default function B7IdeaLab() {
  const [tab, setTab] = useState('ideas')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B7 — Idea Lab</h1></div>
      <div className="tabs">
        {[['ideas', 'Ideas'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'ideas'  && <IdeaList />}
      {tab === 'report' && <WeeklyReport />}
    </div>
  )
}
