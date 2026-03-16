import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

export default function CrossBucketPanel() {
  const [crossReport, setCrossReport]   = useState<any>(null)
  const [crossReports, setCrossReports] = useState<any[]>([])
  const [generating, setGenerating]     = useState(false)

  useEffect(() => {
    api.cross.get().then((r: any) => {
      if (Array.isArray(r) && r.length > 0) { setCrossReports(r); setCrossReport(r[0]) }
    })
  }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const r = await api.cross.generate() as any
      setCrossReport(r)
      const updated = await api.cross.get() as any[]
      setCrossReports(updated)
    } finally { setGenerating(false) }
  }

  return (
    <div>
      <div className="flex-between mb-md">
        <h2 style={{ fontSize: '0.95rem' }}>Cross-Bucket Synthesis</h2>
        <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
          {generating ? <><span className="spinner" />&nbsp;</> : '⚡ Run'}
        </button>
      </div>

      {crossReports.length > 1 && (
        <div className="tag-row mb-md">
          {crossReports.slice(0, 4).map((r: any) => (
            <button
              key={r.id}
              className={`btn btn-sm ${crossReport?.id === r.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCrossReport(r)}
            >{r.weekOf}</button>
          ))}
        </div>
      )}

      {crossReport
        ? <div className="report-content" style={{ fontSize: '0.8rem' }}>{crossReport.content}</div>
        : (
          <div className="empty-state" style={{ padding: '1rem 0', textAlign: 'left' }}>
            No synthesis yet. Hit ⚡ Run to generate your first cross-bucket report.
          </div>
        )}
    </div>
  )
}
