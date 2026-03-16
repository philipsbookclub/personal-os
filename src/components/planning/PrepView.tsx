import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PrepView() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    identityStatement: '',
    baselineWeek: Object.fromEntries(DAYS.map(d => [d, ''])),
    shortTermGoals: ['', '', ''],
    longTermGoals: ['', '', ''],
  })

  useEffect(() => {
    api.prep.get().then((d: any) => {
      if (d && d.identityStatement !== undefined) {
        setForm({
          identityStatement: d.identityStatement || '',
          baselineWeek: { ...Object.fromEntries(DAYS.map(day => [day, ''])), ...(d.baselineWeek || {}) },
          shortTermGoals: d.shortTermGoals?.length ? d.shortTermGoals : ['', '', ''],
          longTermGoals: d.longTermGoals?.length ? d.longTermGoals : ['', '', ''],
        })
      }
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.prep.save({ identityStatement: form.identityStatement, baselineWeek: form.baselineWeek, shortTermGoals: form.shortTermGoals.filter(Boolean), longTermGoals: form.longTermGoals.filter(Boolean) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const updateGoal = (list: 'shortTermGoals' | 'longTermGoals', i: number, v: string) =>
    setForm(f => { const arr = [...f[list]]; arr[i] = v; return { ...f, [list]: arr } })

  return (
    <div>
      <div className="page-header"><h1 className="page-title">PREP — Identity &amp; Goals</h1></div>
      <form onSubmit={submit}>
        <div className="card mb-md">
          <h2 className="mb-md">Identity Statement</h2>
          <p className="muted mb-md" style={{ fontSize: '0.8rem' }}>Who are you becoming? What does success look like in 12 months?</p>
          <textarea value={form.identityStatement} onChange={e => setForm(f => ({ ...f, identityStatement: e.target.value }))} placeholder="I am a founder building X while developing Y, defined by Z…" style={{ minHeight: 100 }} />
        </div>

        <div className="card mb-md">
          <h2 className="mb-md">Baseline Week</h2>
          <p className="muted mb-md" style={{ fontSize: '0.8rem' }}>What does a typical day look like right now?</p>
          {DAYS.map(day => (
            <div key={day} className="form-group">
              <label>{day}</label>
              <input value={form.baselineWeek[day] || ''} onChange={e => setForm(f => ({ ...f, baselineWeek: { ...f.baselineWeek, [day]: e.target.value } }))} placeholder={`Typical ${day}…`} />
            </div>
          ))}
        </div>

        <div className="grid-2 mb-md">
          <div className="card">
            <h2 className="mb-md">Short-Term Goals (1–3 months)</h2>
            {form.shortTermGoals.map((g, i) => (
              <div key={i} className="form-group"><label>Goal {i + 1}</label><input value={g} onChange={e => updateGoal('shortTermGoals', i, e.target.value)} placeholder="What do you want to accomplish?" /></div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, shortTermGoals: [...f.shortTermGoals, ''] }))}>+ Add</button>
          </div>
          <div className="card">
            <h2 className="mb-md">Long-Term Goals (6–12 months)</h2>
            {form.longTermGoals.map((g, i) => (
              <div key={i} className="form-group"><label>Goal {i + 1}</label><input value={g} onChange={e => updateGoal('longTermGoals', i, e.target.value)} placeholder="Where do you want to be?" /></div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, longTermGoals: [...f.longTermGoals, ''] }))}>+ Add</button>
          </div>
        </div>

        <button className="btn btn-primary" type="submit">{saved ? '✓ Saved' : 'Save Prep'}</button>
      </form>
    </div>
  )
}
