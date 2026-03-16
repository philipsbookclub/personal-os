import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

function getMondayISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().slice(0, 10)
}

export default function WeekView() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    weekOf: getMondayISO(), theme: '', intent: '',
    outcomes: ['', '', ''],
    scorecard: {} as Record<string, number>,
    minimumViableWeek: '',
    keyDates: [''], wins: [''], mistakes: [''], nois: [''],
  })
  const [scorecardKey, setScorecardKey] = useState('')
  const [scorecardVal, setScorecardVal] = useState('')

  useEffect(() => {
    api.week.get().then((d: any) => {
      if (d && d.weekOf) {
        setForm({ weekOf: d.weekOf, theme: d.theme || '', intent: d.intent || '', outcomes: d.outcomes?.length ? d.outcomes : ['', '', ''], scorecard: d.scorecard || {}, minimumViableWeek: d.minimumViableWeek || '', keyDates: d.keyDates?.length ? d.keyDates : [''], wins: d.wins?.length ? d.wins : [''], mistakes: d.mistakes?.length ? d.mistakes : [''], nois: d.nois?.length ? d.nois : [''] })
      }
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.week.save({ ...form, outcomes: form.outcomes.filter(Boolean), keyDates: form.keyDates.filter(Boolean), wins: form.wins.filter(Boolean), mistakes: form.mistakes.filter(Boolean), nois: form.nois.filter(Boolean) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  type ListKey = 'outcomes' | 'keyDates' | 'wins' | 'mistakes' | 'nois'
  const updateList = (k: ListKey, i: number, v: string) => setForm(f => { const arr = [...f[k]]; arr[i] = v; return { ...f, [k]: arr } })
  const addToList = (k: ListKey) => setForm(f => ({ ...f, [k]: [...f[k], ''] }))

  const addScorecard = () => {
    if (!scorecardKey.trim()) return
    setForm(f => ({ ...f, scorecard: { ...f.scorecard, [scorecardKey]: parseFloat(scorecardVal) || 0 } }))
    setScorecardKey(''); setScorecardVal('')
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Week Plan — {form.weekOf}</h1></div>
      <form onSubmit={submit}>
        <div className="card mb-md">
          <h2 className="mb-md">Week Frame</h2>
          <div className="form-row">
            <div className="form-group"><label>Week Of (Monday)</label><input type="date" value={form.weekOf} onChange={e => setForm(f => ({ ...f, weekOf: e.target.value }))} /></div>
            <div className="form-group" style={{ flex: 2 }}><label>Theme</label><input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="One phrase that frames this week…" /></div>
          </div>
          <div className="form-group"><label>Intent</label><textarea value={form.intent} onChange={e => setForm(f => ({ ...f, intent: e.target.value }))} placeholder="What is the point of this week?" /></div>
          <div className="form-group"><label>Minimum Viable Week</label><input value={form.minimumViableWeek} onChange={e => setForm(f => ({ ...f, minimumViableWeek: e.target.value }))} placeholder="If everything goes wrong, what 3 things still make this week a success?" /></div>
        </div>

        <div className="card mb-md">
          <div className="flex-between mb-md"><h2>Intended Outcomes (3–5)</h2><button type="button" className="btn btn-ghost btn-sm" onClick={() => addToList('outcomes')}>+</button></div>
          {form.outcomes.map((o, i) => <div key={i} className="form-group"><input value={o} onChange={e => updateList('outcomes', i, e.target.value)} placeholder={`Outcome ${i + 1}…`} /></div>)}
        </div>

        <div className="card mb-md">
          <div className="flex-between mb-md"><h2>Scorecard</h2></div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input value={scorecardKey} onChange={e => setScorecardKey(e.target.value)} placeholder="Metric…" style={{ flex: 2 }} />
            <input type="number" value={scorecardVal} onChange={e => setScorecardVal(e.target.value)} placeholder="Target" style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={addScorecard}>Add</button>
          </div>
          {Object.entries(form.scorecard).map(([k, v]) => (
            <div key={k} className="list-item">
              <span style={{ flex: 1 }}>{k}</span>
              <span className="badge badge-purple">{v}</span>
              <button type="button" onClick={() => setForm(f => { const sc = { ...f.scorecard }; delete sc[k]; return { ...f, scorecard: sc } })} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-md">
          <div className="card">
            <div className="flex-between mb-md"><h2>Key Dates</h2><button type="button" className="btn btn-ghost btn-sm" onClick={() => addToList('keyDates')}>+</button></div>
            {form.keyDates.map((d, i) => <div key={i} className="form-group"><input value={d} onChange={e => updateList('keyDates', i, e.target.value)} placeholder="Event or deadline…" /></div>)}
          </div>
          <div className="card">
            <div className="flex-between mb-md"><h2>Notes of Importance</h2><button type="button" className="btn btn-ghost btn-sm" onClick={() => addToList('nois')}>+</button></div>
            {form.nois.map((n, i) => <div key={i} className="form-group"><input value={n} onChange={e => updateList('nois', i, e.target.value)} placeholder="Important note…" /></div>)}
          </div>
        </div>

        <div className="grid-2 mb-md">
          <div className="card">
            <div className="flex-between mb-md"><h2>Wins</h2><button type="button" className="btn btn-ghost btn-sm" onClick={() => addToList('wins')}>+</button></div>
            {form.wins.map((w, i) => <div key={i} className="form-group"><input value={w} onChange={e => updateList('wins', i, e.target.value)} placeholder="Win…" /></div>)}
          </div>
          <div className="card">
            <div className="flex-between mb-md"><h2>Mistakes</h2><button type="button" className="btn btn-ghost btn-sm" onClick={() => addToList('mistakes')}>+</button></div>
            {form.mistakes.map((m, i) => <div key={i} className="form-group"><input value={m} onChange={e => updateList('mistakes', i, e.target.value)} placeholder="What would you do differently?" /></div>)}
          </div>
        </div>

        <button className="btn btn-primary" type="submit">{saved ? '✓ Saved' : 'Save Week Plan'}</button>
      </form>
    </div>
  )
}
