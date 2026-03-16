# Personal OS

**Owner:** Philip  
**Version:** 1.0 — March 2026  
**Status:** Active Build — Phase 2 in progress

---

## What This Is

Personal OS is a custom life-tracking and intelligence platform for a single operator running multiple simultaneous workstreams. It combines a task manager, daily journal, domain tracker, and AI synthesis engine into one unified system.

The system is organized into **7 Buckets** (life domains), each with its own metrics, input cadence, and weekly report. A cross-bucket synthesis report is generated weekly by Claude API using all 7 Bucket summaries as context.

**Core principle:** Capture fast, report deep. Daily input per bucket < 3 minutes. The intelligence layer does the synthesis automatically.

---

## Quick Start

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Current Build State

| Module | Status |
|--------|--------|
| B1 Work daily log + voice input | ✅ Built |
| B1 To-do crossoff (fuzzy match) | ✅ Built |
| B1 Weekly report (Claude API) | ✅ Built |
| Contacts Tracker (B5/B6 shared) | ✅ Built |
| B2–B7 bucket input forms | 🔲 Next |
| Persistent storage | 🔲 Next |
| Cross-bucket synthesis report | 🔲 Next |
| Planning layer (Month/Week/Day) | 🔲 Next |
| Voice transcription (Whisper.js) | 🔲 Next |

---

## The 7 Buckets

| # | Bucket | Primary Metric | Report Cadence |
|---|--------|---------------|----------------|
| B1 | Work — UGOA | Mode split + value created | Daily log + weekly |
| B2 | Build — Magister + AI | Milestone progress + mentors contacted | Daily log + weekly |
| B3 | Fitness | Consistency streak + tennis match log | Daily log + weekly |
| B4 | Mind — Reading | Books + takeaways applied | Daily log + weekly |
| B5 | Social / Career | Job pipeline + networking | Daily log + weekly |
| B6 | Connections & Serendipity | Chain depth + conversion | Event-driven + weekly |
| B7 | Idea Lab | Execution rate + kill quality | Event-driven + weekly |

---

## Reporting Tiers

### Tier 1 — Daily Log
Per-bucket. Voice or text. Under 3 minutes. B1 uses fuzzy-match to crossoff to-dos from voice transcript.

### Tier 2 — Individual Weekly Reports
One report per bucket, generated via Claude API. Each uses bucket-specific prompt template in `/src/prompts/`.

### Tier 3 — Cross-Bucket Synthesis
One report using all 7 bucket summaries. Surfaces inter-domain patterns: time allocation vs. goal weights, B6→B7 serendipity linkage, B3→B1 energy correlation, going-cold contacts, what to do next.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React (Vite) |
| State | Zustand |
| Data store | `/data/store.json` — single source of truth |
| Voice input | Whisper.js (in-browser, no backend) |
| AI reports | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Forms | react-hook-form |
| Charts | Recharts |
| Date utils | date-fns |

---

## File Structure

```
/personal-os
  /src
    /components
      /capture          ← voice input, daily log form
      /planning         ← prep, month, week, day views
      /domains          ← one folder per bucket (b1-work, b2-build, etc.)
      /dashboard        ← holistic view, contacts, report triggers
    /lib
      store.ts          ← all read/write helpers (never mutate store directly)
      claude.ts         ← Claude API wrapper — all AI calls go through here
    /prompts
      b1-work.ts        ← weekly report prompt for Work bucket
      b2-build.ts
      b3-fitness.ts
      b4-reading.ts
      b5-social.ts
      b6-connections.ts
      b7-idealab.ts
      cross-bucket.ts   ← cross-bucket synthesis prompt
    /schemas
      index.ts          ← all domain metric type definitions
      b1-work.ts        ← Work bucket schema
      b2-build.ts
      b3-fitness.ts
      b4-reading.ts
      b5-social.ts
      b6-connections.ts
      b7-idealab.ts
  /data
    store.json          ← single source of truth for all buckets
  ARCHITECTURE.md       ← full system spec (this doc's companion)
  CLAUDE.md             ← instructions for Claude Code autonomous sessions
  .claude/
    instructions.md     ← same as CLAUDE.md, read by Cline extension
  README.md             ← this file
```

---

## Claude Code / Cline Setup

1. Install Claude Code: `npm install -g @anthropic-ai/claude-code`
2. Or install Cline extension in VS Code
3. Both read `CLAUDE.md` at project root automatically
4. Start a session: `claude` in terminal, or open Cline sidebar
5. Claude will read `CLAUDE.md`, understand current state, and continue the build

See `CLAUDE.md` for full autonomous build instructions.

---

## Environment Variables

Create `.env` at project root:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

The Claude API key is injected via Vite env — never commit `.env` to git.

---

## Data Schema Overview

All app state lives in `/data/store.json`. Structure:

```json
{
  "user": { "name": "Philip", "goalWeights": { "b1": 30, "b2": 25, ... } },
  "prep": { "identityStatement": "", "baselineWeek": {}, "goals": {} },
  "monthPlan": { "theme": "", "priorities": [], "metrics": [], "obstacles": [] },
  "weekPlan": { "theme": "", "outcomes": [], "scorecard": {}, "mvw": "" },
  "buckets": {
    "b1": { "todos": [], "logs": [], "weeklyReports": [] },
    "b2": { "logs": [], "milestones": [], "weeklyReports": [] },
    "b3": { "logs": [], "tennisMatches": [], "weeklyReports": [] },
    "b4": { "logs": [], "books": [], "weeklyReports": [] },
    "b5": { "logs": [], "jobApplications": [], "weeklyReports": [] },
    "b6": { "contacts": [], "weeklyReports": [] },
    "b7": { "ideas": [], "weeklyReports": [] }
  },
  "crossBucketReports": []
}
```

**Rule:** Never mutate `store.json` directly in components. Always use helpers in `/src/lib/store.ts`.
