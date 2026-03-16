# CLAUDE.md — Personal OS Build Instructions

This file is read automatically by Claude Code and Cline at the start of every session.
Do not delete or rename it. Update "Current Task" and "Build State" as work progresses.

---

## Project Identity

**What:** Personal OS — a custom life-tracking + AI reporting dashboard for Philip.  
**Stack:** React (Vite) + Zustand + Anthropic Claude API + Whisper.js  
**Single source of truth:** `/data/store.json` — all app state lives here.  
**AI calls:** All Claude API calls go through `/src/lib/claude.ts` — never call the API directly from components.  
**Mutations:** Never mutate the store directly. Always use helpers in `/src/lib/store.ts`.

---

## Current Build State

| Module | Status |
|--------|--------|
| B1 Work daily log + voice input | ✅ Done — in `personal-os.jsx` (prototype) |
| B1 To-do crossoff (fuzzy match) | ✅ Done |
| B1 Weekly report (Claude API) | ✅ Done |
| Contacts Tracker (B5/B6 shared) | ✅ Done |
| Project scaffold + architecture docs | ✅ Done |
| Vite + React project setup | 🔲 Not started |
| Zustand store + store.ts helpers | 🔲 Not started |
| B2–B7 bucket input forms | 🔲 Not started |
| Persistent storage (store.json) | 🔲 Not started |
| Planning layer (Month/Week/Day) | 🔲 Not started |
| Cross-bucket synthesis report | 🔲 Not started |
| Voice transcription (Whisper.js) | 🔲 Not started |

---

## Current Task

**Initialize the Vite + React project and build the Zustand store layer.**

Steps:
1. Run `npm create vite@latest . -- --template react` (in project root, accept overwrite)
2. Run `npm install zustand date-fns react-hook-form recharts`
3. Create `/src/lib/store.ts` — Zustand store with full schema matching `/data/store.json`
4. Create `/src/lib/claude.ts` — Claude API wrapper with typed functions for each report type
5. Create `/src/schemas/index.ts` — TypeScript types for all 7 bucket schemas
6. Verify dev server runs: `npm run dev`

After completing: update this file's "Current Task" section to the next task.

---

## Next Tasks Queue (in order)

1. ✅ Project scaffold + architecture docs
2. 🔲 Vite + React setup + Zustand store layer (CURRENT)
3. 🔲 Migrate B1 prototype into proper component structure (`/src/components/domains/b1-work/`)
4. 🔲 Build B2–B7 bucket input forms (use B1 as template)
5. 🔲 Build planning layer: Prep onboarding → Month setup → Week setup → Day view
6. 🔲 Build cross-bucket synthesis report (prompt in `/src/prompts/cross-bucket.ts`)
7. 🔲 Add persistent storage: read/write store.json on every mutation
8. 🔲 Integrate Whisper.js for voice transcription
9. 🔲 Build holistic dashboard view with time allocation chart
10. 🔲 Mobile optimization + PWA setup

---

## Architecture Rules (follow these always)

### Data layer
- All state lives in `/data/store.json`
- Never mutate store directly from components
- All reads/writes go through `/src/lib/store.ts` helpers
- Store shape is defined in `/src/schemas/index.ts`

### Claude API
- All API calls go through `/src/lib/claude.ts`
- Always use model: `claude-sonnet-4-20250514`
- API key from env: `import.meta.env.VITE_ANTHROPIC_API_KEY`
- Per-bucket report prompts live in `/src/prompts/b{n}-{name}.ts`
- Cross-bucket synthesis prompt lives in `/src/prompts/cross-bucket.ts`
- Reports are stored back to store after generation

### Component conventions
- One folder per bucket: `/src/components/domains/b1-work/`, `/src/components/domains/b2-build/`, etc.
- Each bucket folder has: `index.tsx` (main view), `DailyLog.tsx`, `WeeklyReport.tsx`, `Metrics.tsx`
- Shared components in `/src/components/dashboard/`
- Planning components in `/src/components/planning/`

### Naming
- Files: kebab-case (`daily-log.tsx`)
- Components: PascalCase (`DailyLog`)
- Store helpers: camelCase (`addWorkLog`, `completeTodo`)
- Prompt functions: camelCase (`buildWorkWeeklyPrompt`)

---

## The 7 Buckets — Quick Reference

| Bucket | Key Metrics | Input Style | Report Sections |
|--------|-------------|-------------|-----------------|
| B1 Work | Mode tag, hours, tasks, energy, value created | Daily voice + to-do crossoff | Summary, Mode Analysis, Wins, Open Loops, One Thing, Pattern Alert |
| B2 Build | Build mode, milestone %, mentors contacted, co-founder alignment | Daily voice/text | Shipped, Milestone proximity, Mentor pipeline, AI insight, Co-founder pulse |
| B3 Fitness | Workout type/streak, tennis match log (opponent/score/notes) | Daily tap + voice | Consistency rate, Streak, Tennis W/L, Energy trend, Flag |
| B4 Reading | Pages, book title/genre, takeaway, applied? | Daily voice/text | Volume, Takeaway of week, Application flag, Completion rate |
| B5 Social | Job apps/responses/interviews, networking count, TikTok (placeholder) | Daily voice/text | Job pipeline, Networking, TikTok (when active), Going cold |
| B6 Connections | Contact node (name/where met/chain link), interaction type + note | Event-driven | New connections, Active chains, Going cold, Chain highlight |
| B7 Idea Lab | Title, origin tag, stage (Spark→Executed→Killed), died-well flag | Event-driven | Ideas generated, Pipeline movement, Kill or commit, Kill log |

---

## Contacts Tracker — Shared B5/B6 Layer

Lives in `/src/components/dashboard/ContactsTracker.tsx`  
Shared between B5 (Social) and B6 (Connections).  
A contact has: name, bucket tag, notes, interaction history (type + date + note).  
Going-cold flag: any contact with no interaction in 14+ days surfaces in weekly cross-bucket report.  
Interaction types: hangout | call-video | text-dm | event | business-mtg

---

## Reporting System

### Per-bucket weekly reports (Tier 2)
- Trigger: manual button in each bucket view
- Input to Claude: structured log entries for the week + open/completed todos + month plan context + operator prompts (shining moment, biggest challenge)
- Tone instruction: direct and specific, no filler, no motivational language, write like a sharp advisor

### Cross-bucket synthesis (Tier 3)
- Trigger: manual button in dashboard
- Input to Claude: all 7 bucket weekly summaries + goal weights + month theme + explicit cross-domain analysis instructions
- Output sections: Week Snapshot | Time Allocation | Cross-Domain Signals | Pattern Alerts | Next Week's Top 3
- Key signals to surface: time vs. goal weight gap, B6→B7 serendipity linkage, B4→B1/B2 reading application, B3→B1 energy correlation, going-cold contacts

---

## Planning Framework

Four nested phases — each feeds the one below:

1. **PREP** (one-time): identity statement, baseline week audit, short + long-term goals
2. **MONTH**: theme, top 3 priorities, time split per priority, 5 metrics, 3 obstacles
3. **WEEK**: theme, 3-5 outcomes, numerical scorecard, Minimum Viable Week floor, key dates
4. **DAY**: top 3 priorities, time blocks, habit stacks — logged per bucket

Core insight: a Tuesday to-do is traceable back to a monthly identity statement.

---

## Operator Context (Philip)

- Co-founder, United Grants of America (UGOA) — agricultural grant navigation, USDA programs
- Co-founder, Magister — chess training platform, targeting Chess.com/Duolingo acquisition in 12-18 months
- Connected to The Seabirds Foundation (ocean conservation nonprofit)
- Tennis player (4.5-5.0 self-assessed, hard courts)
- Job search: medium priority, just starting
- TikTok: placeholder, activates in ~4 weeks
- Colleagues: Noelia, Jennifer (UGOA); Joshua (Magister co-founder)
- Preferred communication: professional, warm, clearly structured
- Work style: deep work mornings, creative/strategic afternoons, minimize context switching

This context should inform tone in all AI-generated reports. Reports know who Philip is and what he's building — they reference actual names, programs, and goals, not generic placeholders.

---

## Environment Setup

```bash
# Install dependencies
npm install

# Create .env file (never commit this)
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env

# Run dev server
npm run dev
```

---

## Key Files to Read Before Building

1. `ARCHITECTURE.md` — full system spec, all bucket metrics, report structures
2. `README.md` — quick start, tech stack, file structure
3. `/src/schemas/index.ts` — data types (build this first)
4. `/src/lib/store.ts` — store helpers (build second)
5. `/src/lib/claude.ts` — API wrapper (build third)

---

## How to Continue a Session

At the start of every Claude Code or Cline session:

1. Read this file (`CLAUDE.md`)
2. Check "Current Build State" — know what's done
3. Read "Current Task" — know exactly what to build next
4. Read the relevant schema and prompt files for the task
5. Build, test, update "Current Build State" when done
6. Update "Current Task" to the next item in "Next Tasks Queue"

Do not skip steps. Do not build out of order without a reason.
