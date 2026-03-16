import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'

const WORKOUT_TYPES = ['strength', 'cardio', 'mobility', 'tennis']
const SURFACES = ['hard', 'clay', 'grass']
const MATCH_TYPES = ['casual', 'competitive', 'tournament']

function FitnessLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), workoutType: 'strength', durationMinutes: '', energyPostWorkout: 7, sleepQuality: '', weight: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setLogs(await api.b3.logs.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b3.logs.add({ ...form, durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null, sleepQuality: form.sleepQuality ? parseInt(form.sleepQuality) : null, weight: form.weight ? parseFloat(form.weight) : null })
      load()
    } catch { alert('Save failed — please try again') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="card">
      <h2 className="mb-md">Log Workout</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group"><label>Type</label>
            <select value={form.workoutType} onChange={e => set('workoutType', e.target.value)}>
              {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Duration (min)</label><input type="number" value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)} placeholder="60" /></div>
          <div className="form-group"><label>Energy Post (1–10)</label><input type="number" value={form.energyPostWorkout} onChange={e => set('energyPostWorkout', +e.target.value)} min={1} max={10} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Sleep Quality (1–10)</label><input type="number" value={form.sleepQuality} onChange={e => set('sleepQuality', e.target.value)} min={1} max={10} /></div>
          <div className="form-group"><label>Weight (lbs)</label><input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} step={0.1} /></div>
        </div>
        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How did it feel?" /></div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
      </form>
      <div className="mt-lg">
        {logs.slice(0, 7).map(l => (
          <div key={l.id} className="list-item">
            <span className="muted" style={{ fontSize: '0.8rem', minWidth: 80 }}>{l.date}</span>
            <span className="badge badge-purple">{l.workoutType}</span>
            {l.durationMinutes && <span className="badge badge-gray">{l.durationMinutes}m</span>}
            {l.energyPostWorkout && <span className="badge badge-yellow">⚡{l.energyPostWorkout}</span>}
            {l.notes && <span className="muted" style={{ fontSize: '0.8rem' }}>{l.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function TennisLog() {
  const [matches, setMatches] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), opponentName: '', score: '', result: 'win', surface: 'hard', matchType: 'casual', skillFocus: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setMatches(await api.b3.tennis.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b3.tennis.add(form)
      setForm(f => ({ ...f, opponentName: '', score: '', skillFocus: '', notes: '' }))
      load()
    } catch { alert('Save failed — please try again') }
    finally { setSubmitting(false) }
  }

  const wins = matches.filter(m => m.result === 'win').length
  const losses = matches.filter(m => m.result === 'loss').length

  return (
    <div className="card">
      <h2 className="mb-md">Tennis Log</h2>
      <div className="stat-row">
        <div className="stat"><div className="stat-label">Wins</div><div className="stat-value success">{wins}</div></div>
        <div className="stat"><div className="stat-label">Losses</div><div className="stat-value danger">{losses}</div></div>
        <div className="stat"><div className="stat-label">Win %</div><div className="stat-value">{matches.length > 0 ? `${Math.round(wins / matches.length * 100)}%` : '—'}</div></div>
      </div>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group"><label>Opponent</label><input value={form.opponentName} onChange={e => set('opponentName', e.target.value)} required placeholder="Name" /></div>
          <div className="form-group"><label>Score</label><input value={form.score} onChange={e => set('score', e.target.value)} placeholder="6-4, 3-6, 6-2" required /></div>
          <div className="form-group"><label>Result</label>
            <select value={form.result} onChange={e => set('result', e.target.value)}>
              <option>win</option><option>loss</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Surface</label><select value={form.surface} onChange={e => set('surface', e.target.value)}>{SURFACES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label>Type</label><select value={form.matchType} onChange={e => set('matchType', e.target.value)}>{MATCH_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="form-group"><label>Skill Focus</label><input value={form.skillFocus} onChange={e => set('skillFocus', e.target.value)} placeholder="e.g. serve kick" /></div>
        </div>
        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Tactics, observations…" /></div>
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Log Match'}</button>
      </form>
      <div className="mt-lg">
        {matches.slice(0, 10).map(m => (
          <div key={m.id} className="list-item">
            <span className="muted" style={{ fontSize: '0.8rem', minWidth: 80 }}>{m.date}</span>
            <span>vs <strong>{m.opponentName}</strong> {m.score}</span>
            <span className={`badge ${m.result === 'win' ? 'badge-green' : 'badge-red'}`}>{m.result}</span>
            <span className="badge badge-gray">{m.surface}</span>
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

  const load = async () => { const r = await api.b3.reports.get() as any[]; setReports(r); if (r.length > 0 && !selected) setSelected(r[0]) }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b3.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex-between mb-md">
        <h2>Weekly Report — Fitness</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}</button>
      </div>
      {selected ? <div className="report-content">{selected.content}</div> : <div className="empty-state">No reports yet</div>}
    </div>
  )
}

export default function B3Fitness() {
  const [tab, setTab] = useState('fitness')
  return (
    <div>
      <div className="page-header"><h1 className="page-title">B3 — Fitness</h1></div>
      <div className="tabs">
        {[['fitness', 'Workouts'], ['tennis', 'Tennis'], ['report', 'Weekly Report']].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'fitness' && <FitnessLog />}
      {tab === 'tennis'  && <TennisLog />}
      {tab === 'report'  && <WeeklyReport />}
    </div>
  )
}
