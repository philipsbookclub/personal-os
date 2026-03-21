import { useState, useEffect, useRef } from 'react'
import { api } from '../../../lib/api'
import { useDictation } from '../../../hooks/useDictation'

const BUILD_MODES = ['product', 'strategy', 'outreach', 'fundraising']

// ── Glass card style for sections overlaid on the video ─────────────────────
const glass: React.CSSProperties = {
  background: 'rgba(10, 10, 14, 0.85)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: '10px',
  padding: '1.5rem',
}

function SectionEyebrow({ index, title }: { index: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <span style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', opacity: 0.8, flexShrink: 0 }}>
        {index}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}>
        {title}
      </h2>
    </div>
  )
}

// ── Daily Log ────────────────────────────────────────────────────────────────
function DailyLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    text: '', mode: '', hoursLogged: '', milestoneUpdate: '',
    blockers: '', coFounderAlignment: '', mentorsContacted: 0,
    keyDecision: '', aiLearningHours: '', aiTopic: '', aiInsight: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setLogs(await api.b2.logs.get() as any[])
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const { listening: dictating, toggle: toggleDictation } = useDictation(
    t => setForm(f => ({ ...f, text: f.text + (f.text ? ' ' : '') + t }))
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b2.logs.add({
        ...form,
        hoursLogged:       form.hoursLogged       ? parseFloat(form.hoursLogged)       : null,
        aiLearningHours:   form.aiLearningHours   ? parseFloat(form.aiLearningHours)   : null,
        coFounderAlignment: form.coFounderAlignment ? parseInt(form.coFounderAlignment) : null,
        mode: form.mode || null,
      })
      setForm(f => ({ ...f, text: '', milestoneUpdate: '', blockers: '', keyDecision: '', aiInsight: '', aiTopic: '' }))
      load()
    } catch (err) {
      console.error('Save error:', err)
      alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <SectionEyebrow index="01" title="Daily Log" />
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mode</label>
            <select value={form.mode} onChange={e => set('mode', e.target.value)}>
              <option value="">— select —</option>
              {BUILD_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Hours</label>
            <input type="number" value={form.hoursLogged} onChange={e => set('hoursLogged', e.target.value)} placeholder="0" step={0.5} />
          </div>
          <div className="form-group">
            <label>Mentors</label>
            <input type="number" value={form.mentorsContacted} onChange={e => set('mentorsContacted', +e.target.value)} min={0} />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Log
            <button
              type="button" onClick={toggleDictation}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, color: dictating ? 'var(--red, #ef4444)' : 'inherit', opacity: dictating ? 1 : 0.5 }}
            >
              {dictating ? '⏹ stop' : '🎤'}
            </button>
          </label>
          <textarea value={form.text} onChange={e => set('text', e.target.value)} placeholder="What happened on Magister today…" required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Milestone Update</label>
            <input value={form.milestoneUpdate} onChange={e => set('milestoneUpdate', e.target.value)} placeholder="Progress…" />
          </div>
          <div className="form-group">
            <label>Co-founder Alignment (1–5)</label>
            <input type="number" value={form.coFounderAlignment} onChange={e => set('coFounderAlignment', e.target.value)} min={1} max={5} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Key Decision</label>
            <input value={form.keyDecision} onChange={e => set('keyDecision', e.target.value)} placeholder="Decision made…" />
          </div>
          <div className="form-group">
            <label>Blockers</label>
            <input value={form.blockers} onChange={e => set('blockers', e.target.value)} placeholder="What's blocking…" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>AI Learning Hours</label>
            <input type="number" value={form.aiLearningHours} onChange={e => set('aiLearningHours', e.target.value)} placeholder="0" step={0.5} />
          </div>
          <div className="form-group">
            <label>AI Topic</label>
            <input value={form.aiTopic} onChange={e => set('aiTopic', e.target.value)} placeholder="What you studied…" />
          </div>
          <div className="form-group">
            <label>AI Insight</label>
            <input value={form.aiInsight} onChange={e => set('aiInsight', e.target.value)} placeholder="Key insight…" />
          </div>
        </div>

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Log'}
        </button>
      </form>

      <div className="mt-lg">
        {logs.length === 0 && <div className="empty-state">No logs yet</div>}
        {logs.slice(0, 7).map(l => (
          <div key={l.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="flex-between" style={{ width: '100%' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>{l.date}</span>
              <div className="tag-row">
                {l.mode               && <span className="badge badge-purple">{l.mode}</span>}
                {l.hoursLogged        && <span className="badge badge-gray">{l.hoursLogged}h</span>}
                {l.coFounderAlignment && <span className="badge badge-yellow">align {l.coFounderAlignment}/5</span>}
              </div>
            </div>
            <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>{l.text}</p>
            {l.blockers && <p className="muted mt-sm" style={{ fontSize: '0.8rem' }}>⚠ {l.blockers}</p>}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Milestones ───────────────────────────────────────────────────────────────
function Milestones() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', targetDate: new Date().toISOString().slice(0, 10), notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => setMilestones(await api.b2.milestones.get() as any[])
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.b2.milestones.add(form)
      setForm(f => ({ ...f, title: '', notes: '' }))
      load()
    } catch (err) {
      console.error('Save error:', err)
      alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <SectionEyebrow index="02" title="Milestones" />
      <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Milestone title…" required style={{ flex: 2 }}
        />
        <input
          type="date" value={form.targetDate}
          onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>Add</button>
      </form>

      {milestones.length === 0 && <div className="empty-state">No milestones set</div>}
      {milestones.map(m => (
        <div key={m.id} className="list-item">
          <div style={{ flex: 1 }}>
            <span style={{ textDecoration: m.completedAt ? 'line-through' : 'none' }}>{m.title}</span>
            <div className="tag-row">
              <span className={`badge ${m.completedAt ? 'badge-green' : 'badge-yellow'}`}>
                {m.completedAt ? '✓ done' : `target: ${m.targetDate}`}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

// ── Weekly Report ────────────────────────────────────────────────────────────
function WeeklyReport() {
  const [, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => {
    const r = await api.b2.reports.get() as any[]
    setReports(r)
    if (r.length > 0 && !selected) setSelected(r[0])
  }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setLoading(true)
    try { const r = await api.b2.reports.generate() as any; setSelected(r); load() }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="flex-between mb-md">
        <SectionEyebrow index="03" title="Weekly Report" />
        <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spinner" />&nbsp;Generating…</> : '⚡ Generate'}
        </button>
      </div>
      {selected
        ? <div className="report-content">{selected.content}</div>
        : <div className="empty-state">No reports yet</div>
      }
    </>
  )
}

// ── B2Build — scroll-driven video page ──────────────────────────────────────
export default function B2Build() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')!

    // Match canvas pixel dimensions to the viewport
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // rAF render loop — draws the current video frame every tick
    let rafId: number
    const render = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)

    // Scrub video on window scroll
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (!max) return
      const p = Math.max(0, Math.min(1, window.scrollY / max))
      setProgress(p)
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = p * video.duration
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      {/* Hidden video source */}
      <video
        ref={videoRef}
        src="/chess-dust-trial.mp4"
        preload="auto"
        muted
        playsInline
        style={{ display: 'none' }}
      />

      {/* Fixed canvas — renders video frames, sits below content (z-index: 0) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          objectFit: 'cover',
        }}
      />

      {/* Dark vignette overlay on the canvas */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(160deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Scroll progress bar — top edge of the main-content area */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress * 100}%`,
        height: '2px',
        background: 'var(--accent)',
        zIndex: 2,
        pointerEvents: 'none',
        transition: 'width 80ms linear',
      }} />

      {/* All page content — z-index: 1 lifts it above the fixed canvas */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Hero ──────────────────────────────────────────── */}
        <section style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem', opacity: 0.85 }}>
            B2 — Build · Magister
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1, color: '#fff', letterSpacing: '-0.03em' }}>
            Build Log
          </h1>
          <p style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem', maxWidth: '40ch', lineHeight: 1.65 }}>
            Chess training platform. Scroll through the page — the video advances frame by frame with you.
          </p>

          {/* Section progress markers */}
          <div style={{ display: 'flex', gap: '1.75rem', marginTop: '2rem' }}>
            {[
              { label: 'Daily Log',     threshold: 0    },
              { label: 'Milestones',    threshold: 0.33 },
              { label: 'Weekly Report', threshold: 0.66 },
            ].map(({ label, threshold }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{
                  width: '28px',
                  height: '2px',
                  background: progress >= threshold ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
                  transition: 'background 0.4s ease',
                  borderRadius: '1px',
                }} />
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Daily Log ─────────────────────────────────────── */}
        <section style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
          <div style={glass}>
            <DailyLog />
          </div>
        </section>

        {/* ── Milestones ────────────────────────────────────── */}
        <section style={{ minHeight: '80vh', paddingBottom: '5rem' }}>
          <div style={glass}>
            <Milestones />
          </div>
        </section>

        {/* ── Weekly Report ─────────────────────────────────── */}
        <section style={{ minHeight: '70vh', paddingBottom: '5rem' }}>
          <div style={glass}>
            <WeeklyReport />
          </div>
        </section>
      </div>
    </>
  )
}
