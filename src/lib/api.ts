// src/lib/api.ts — typed client for the FastAPI backend

export const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function req<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

const get  = <T>(p: string) => req<T>(p)
const post = <T>(p: string, b: unknown) => req<T>(p, 'POST', b)
const put  = <T>(p: string, b: unknown) => req<T>(p, 'PUT', b)
const patch = <T>(p: string, b?: unknown) => req<T>(p, 'PATCH', b)
const del  = <T>(p: string) => req<T>(p, 'DELETE')

// ── User ─────────────────────────────────────────────────────────────────────
export const api = {
  user: {
    get: ()        => get('/user'),
    setWeights: (w: Record<string, number>) => put('/user/goal-weights', w),
  },

  // ── Planning ───────────────────────────────────────────────────────────────
  prep: {
    get: ()        => get('/prep'),
    save: (b: unknown) => put('/prep', b),
  },
  month: {
    get: ()        => get('/month-plan'),
    save: (b: unknown) => put('/month-plan', b),
  },
  week: {
    get: ()        => get('/week-plan'),
    save: (b: unknown) => put('/week-plan', b),
  },

  // ── B1 — Work ──────────────────────────────────────────────────────────────
  b1: {
    todos:   { get: () => get('/b1/todos'), add: (b: unknown) => post('/b1/todos', b) },
    todo:    { complete: (id: string) => patch(`/b1/todos/${id}/complete`), del: (id: string) => del(`/b1/todos/${id}`) },
    logs:    { get: () => get('/b1/logs'), add: (b: unknown) => post('/b1/logs', b) },
    reports: { get: () => get('/b1/reports'), generate: () => post('/b1/reports/generate', {}) },
  },

  // ── B2 — Build ─────────────────────────────────────────────────────────────
  b2: {
    logs:       { get: () => get('/b2/logs'), add: (b: unknown) => post('/b2/logs', b) },
    milestones: { get: () => get('/b2/milestones'), add: (b: unknown) => post('/b2/milestones', b) },
    reports:    { get: () => get('/b2/reports'), generate: () => post('/b2/reports/generate', {}) },
  },

  // ── B3 — Fitness ───────────────────────────────────────────────────────────
  b3: {
    logs:    { get: () => get('/b3/logs'), add: (b: unknown) => post('/b3/logs', b) },
    tennis:  { get: () => get('/b3/tennis'), add: (b: unknown) => post('/b3/tennis', b) },
    reports: { get: () => get('/b3/reports'), generate: () => post('/b3/reports/generate', {}) },
  },

  // ── B4 — Reading ───────────────────────────────────────────────────────────
  b4: {
    logs:    { get: () => get('/b4/logs'), add: (b: unknown) => post('/b4/logs', b) },
    books:   { get: () => get('/b4/books'), add: (b: unknown) => post('/b4/books', b), complete: (id: string) => patch(`/b4/books/${id}/complete`) },
    reports: { get: () => get('/b4/reports'), generate: () => post('/b4/reports/generate', {}) },
  },

  // ── B5 — Social ────────────────────────────────────────────────────────────
  b5: {
    logs:    { get: () => get('/b5/logs'), add: (b: unknown) => post('/b5/logs', b) },
    jobs:    { get: () => get('/b5/jobs'), add: (b: unknown) => post('/b5/jobs', b), status: (id: string, s: string) => patch(`/b5/jobs/${id}/status`, { status: s }) },
    reports: { get: () => get('/b5/reports'), generate: () => post('/b5/reports/generate', {}) },
  },

  // ── B6 — Connections ───────────────────────────────────────────────────────
  b6: {
    contacts:    { get: () => get('/b6/contacts'), add: (b: unknown) => post('/b6/contacts', b) },
    interaction: (id: string, b: unknown) => post(`/b6/contacts/${id}/interactions`, b),
    status:      (id: string, s: string) => patch(`/b6/contacts/${id}/status`, { status: s }),
    link:        (b: unknown) => post('/b6/contacts/link-chain', b),
    reports:     { get: () => get('/b6/reports'), generate: () => post('/b6/reports/generate', {}) },
  },

  // ── B7 — Idea Lab ──────────────────────────────────────────────────────────
  b7: {
    ideas:   { get: () => get('/b7/ideas'), add: (b: unknown) => post('/b7/ideas', b) },
    stage:   (id: string, s: string) => patch(`/b7/ideas/${id}/stage`, { stage: s }),
    kill:    (id: string, b: unknown) => post(`/b7/ideas/${id}/kill`, b),
    park:    (id: string, b: unknown) => post(`/b7/ideas/${id}/park`, b),
    journal: (id: string, t: string) => post(`/b7/ideas/${id}/journal`, { text: t }),
    reports: { get: () => get('/b7/reports'), generate: () => post('/b7/reports/generate', {}) },
  },

  // ── Cross-bucket ───────────────────────────────────────────────────────────
  cross: {
    get:      () => get('/cross-bucket-reports'),
    generate: () => post('/cross-bucket-reports/generate', {}),
  },
}
