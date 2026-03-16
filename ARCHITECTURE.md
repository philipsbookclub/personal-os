# ARCHITECTURE.md — Personal OS System Specification

**Version:** 1.0 — March 2026  
**Status:** Active Build

---

## 1. What This System Is

Personal OS is a custom life-tracking and intelligence platform built for a single operator running multiple simultaneous workstreams. It is not a task manager, a journal app, or a wellness tracker — it is all three, unified under a single data layer with an AI synthesis engine that generates reports across and between every domain.

The system is organized into **7 Buckets** — life domains with distinct metrics, input cadences, and reporting templates. Each Bucket produces its own weekly report. A separate cross-bucket synthesis report is generated weekly by Claude (Anthropic's AI) using all 7 Bucket summaries as context.

**Core design principle:** Capture fast, report deep. Daily input per bucket should take under 3 minutes. The intelligence layer does the synthesis automatically — the operator just logs and reviews.

---

## 2. System Architecture — Six Layers

| Layer | Name | Function |
|-------|------|----------|
| 1 | **Capture** | Voice transcription, text input, to-do entry, journal logging. Every interaction goes through this layer first. |
| 2 | **Data Store** | Single JSON/SQLite database. One source of truth for all 7 Buckets. No data lives outside this store. |
| 3 | **Planning Framework** | Prep → Monthly theme + priorities → Weekly scorecard + MVW → Daily top-3 execution. |
| 4 | **Domain Modules** | 7 Buckets, each with its own metric schema, input template, and report structure. |
| 5 | **Intelligence Layer** | Claude API. Receives all Bucket summaries and generates per-bucket and cross-bucket weekly reports. |
| 6 | **Dashboard** | Per-bucket views, holistic weekly view, Contacts tracker, to-do management, report generation. |

---

## 3. Planning Framework

Four nested phases. Each feeds the one below — a Tuesday to-do is traceable back to a monthly identity statement.

| Phase | Cadence | Contents |
|-------|---------|----------|
| **PREP** | One-time setup | Identity statement, baseline week audit, short-term and long-term goals across all Buckets |
| **MONTH** | Monthly | Theme, top 3 priorities, time split per priority, 5 measurable metrics, 3 preemptive obstacles |
| **WEEK** | Weekly | Theme, 3–5 intended outcomes, numerical scorecard from monthly quotas, Minimum Viable Week floor, key dates |
| **DAY** | Daily | Top 3 priorities, time blocks, habit stacks, trim fat — logged via voice or quick text per Bucket |

---

## 4. The Seven Buckets

### B1 — Work (UGOA)
*Primary income driver. Agricultural grant navigation and USDA program administration.*

**Work Modes** (tag every daily log entry):

| Mode | Description |
|------|-------------|
| Depth | Heads-down execution on a specific program or deliverable |
| Breadth | Coordinating across multiple programs, producers, or counties simultaneously |
| Exploration | New technology, new USDA programs, new business opportunities, research |
| Management | People, process, delegation, contractor oversight, team communication |

**Metrics:**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Primary work mode | Tag: depth / breadth / explore / manage | Daily tag |
| Tasks completed vs. planned | Count | To-do crossoff (fuzzy match from voice log) |
| Hours logged | Number | Voice log or manual input |
| Producer / client interactions | Count | Parsed from voice log |
| Applications / deliverables submitted | Count | Tagged in voice log |
| Shining moment of the week | Text | Weekly prompt — 2 sentences |
| Hardest challenge + resolution | Text | Weekly prompt — voice or text |
| Quantified value created | Number + type ($ / hours / risk) | Weekly prompt — optional |
| Energy / focus score | 1–10 | End-of-day tap |

**Weekly Report Sections:**
- Week Summary — 2–3 sentences, direct assessment
- Mode Analysis — what kind of work dominated and what it signals
- Wins — specific, named tasks and outcomes
- Open Loops — unfinished items and why they matter
- One Thing — single most important priority for next week
- Pattern Alert — honest flag on any concerning data trends

---

### B2 — Build (Magister + AI Learning)
*Chess training platform targeting acquisition. Parallel AI skill development.*

**Magister Metrics:**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Build mode | Tag: product / strategy / outreach / fundraising | Daily tag |
| Milestone progress | % or named stage | Weekly update |
| Features shipped / tasks completed | Count | To-do crossoff |
| User / retention metrics | Number | Manual input when available |
| Co-founder alignment check | 1–5 | Weekly prompt |
| Mentors contacted | Count | Voice log or to-do |
| Key decision made this week | Text | Weekly prompt |
| Biggest blocker | Text | Weekly prompt |
| Hours logged | Number | Voice log |

**AI Learning Metrics:**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Hours studied | Number | Voice log |
| Topic / tool covered | Text | Voice log |
| Something built or applied | Yes/No | Weekly prompt |
| Key insight captured | Text | Journal prompt |

**Weekly Report Sections:**
- Magister: what shipped or moved forward
- Milestone proximity: on track for 12–18 month acquisition target
- Mentor pipeline: who was contacted, any responses
- AI learning: one applied insight from the week
- Co-founder pulse: alignment score with context

---

### B3 — Fitness
*Consistency-based body tracking plus detailed tennis match log.*

**General Fitness Metrics:**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Workouts completed | Count | Daily log |
| Workout type | Tag: strength / cardio / mobility / tennis | Daily tag |
| Session duration | Minutes | Voice log |
| Consistency streak | Days | Auto-derived |
| Energy level post-workout | 1–10 | Quick tap |
| Rest days taken | Count | Auto-derived from no workout logged |
| Weight | Number | Weekly input |
| Sleep quality | 1–10 | Morning tap |

**Tennis Match Log (per entry):**

| Field | Type | Captured Via |
|-------|------|-------------|
| Date | Date | Auto |
| Opponent name | Text | Voice log |
| Score | Set by set | Voice log |
| Win / Loss | Auto-derived | From score |
| Surface | Tag: hard / clay / grass | Quick tag |
| Match type | Tag: casual / competitive / tournament | Quick tag |
| Notes | Text | Voice log — tactics, observations |
| Skill focus that session | Text | Voice log |

**Weekly Report Sections:**
- Consistency rate: workouts completed vs. target
- Streak status and trend
- Tennis record this week: W/L, opponents, key notes
- Energy trend: average post-workout score
- Flag: any rest deficit or overtraining signal

---

### B4 — Mind (Reading)
*Deep reading across classics and nonfiction as primary intellectual input.*

**Reading Metrics (Primary):**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Pages / chapters read | Number | Voice log |
| Book title + author | Text | Set when starting a book |
| Genre | Tag: classic / nonfiction / business / other | Quick tag |
| Reading streak | Days | Auto-derived |
| Key takeaway or quote | Text | Journal prompt |
| Applied to something? | Yes/No + what | Weekly prompt |
| Books completed this month | Count | Auto-derived |

**Chess (Lightweight — Background Only):**

| Metric | Type | Captured Via |
|--------|------|-------------|
| ELO rating | Number | Manual — when you feel like it |
| Minutes played | Number | Voice log |

**Weekly Report Sections:**
- Reading volume: pages this week, book progress
- Takeaway of the week: the one idea that stuck
- Application flag: did anything read connect to Magister, UGOA, or a current problem
- Book completion rate vs. monthly goal

---

### B5 — Social / Career
*Job search pipeline, general networking, TikTok content (activates ~4 weeks).*

**Job Search Metrics:**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Applications sent | Count | Voice log |
| Responses received | Count | Voice log |
| Interviews scheduled | Count | Voice log |
| Connections made toward search | Count | Voice log |
| Target companies | List | Manual — updated as needed |
| Weekly momentum score | 1–5 | Your gut — weekly prompt |

**General Networking:**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Meaningful conversations | Count | Voice log |
| Follow-ups sent | Count | Voice log |
| Events attended | Count | Voice log |

**TikTok / Content (Placeholder — activates ~4 weeks):**

| Metric | Type | Captured Via |
|--------|------|-------------|
| Videos posted | Count | Manual |
| Views | Number | Manual |
| Followers delta | Number | Weekly input |
| Content type | Tag | Quick tag |
| Hours spent creating | Number | Voice log |

**Weekly Report Sections:**
- Job search pipeline: apps sent, responses, interviews — momentum score
- Networking: meaningful interactions, follow-up rate
- TikTok: inactive until activated — videos, views, trend
- Flag: anything going cold that needs attention

---

### B6 — Connections & Serendipity
*Narrative graph of random encounters → relationships → opportunities. Shared with Bucket 5.*

This Bucket is event-driven, not daily. You log an entry when something happens. Over time it builds a directed graph of how people and opportunities connect.

**Contact Record (per person):**

| Field | Type | Captured Via |
|-------|------|-------------|
| Name | Text | Manual |
| Where met | Text | Voice log (gym, golf, event, intro, etc.) |
| Date | Date | Auto |
| How you got there | Link | Points to previous node in chain |
| First impression / notes | Text | Voice log |
| Follow-up taken | Yes/No + what | Voice log |
| Category | Tag: personal / business / creative / mentor | Quick tag |
| Status | Tag: new / warm / active / dormant | Updated manually |
| Led to | Link | Points forward to next node when known |

**Interaction Log (per interaction):**

| Field | Type | Captured Via |
|-------|------|-------------|
| Interaction type | Tag: hangout / call-video / text-dm / event / business-mtg | Quick tag |
| Date | Date | Auto |
| Note | Text | Optional — voice or text |
| This month count | Count | Auto-derived — shown on contact card |
| All-time count by type | Count per type | Auto-derived |

**Derived Chain Metrics:**

| Metric | Type | Source |
|--------|------|--------|
| New connections this week | Count | Auto-derived from entries |
| Active chains in progress | Count | Auto-derived |
| Chain-to-opportunity conversion | % over time | Tracked as chains close |
| Follow-up completion rate | % | Auto-derived |
| Contacts going cold (2+ weeks no activity) | List | Auto-flagged in weekly report |

**Weekly Report Sections:**
- New connections logged this week
- Active chains: who are you mid-conversation with
- Going cold: contacts flagged for follow-up
- Chain highlight: any serendipity connection that led somewhere notable
- Interaction frequency: who you spent the most time with this month

---

### B7 — Idea Lab
*Full pipeline from spark to execution. Honest kill tracking included.*

No idea is too small to log. No abandonment is a failure. The value is in the pattern over time — what kinds of ideas you actually execute, where your best ones come from, how quickly you move from spark to action.

**Idea Entry Fields:**

| Field | Type | Captured Via |
|-------|------|-------------|
| Idea title | Text — one line | Manual or voice |
| Description | Text | Voice log — as much or little as needed |
| Date captured | Date | Auto |
| Origin | Tag: shower / reading / conversation / serendipity / work / other | Quick tag |
| Linked to | Link | Optional — person from B6, book from B4, etc. |
| Category | Tag: business / product / creative / personal / other | Quick tag |
| Stage | Tag — see pipeline below | Updated as idea moves |
| Notes / journal | Text | Running log as idea evolves |

**Idea Pipeline Stages:**

| Stage | Meaning |
|-------|---------|
| Spark | Just captured — unexamined |
| Explored | Thought through, basic research done |
| Validated | Talked to someone, tested an assumption, got signal |
| In Progress | Actively building or executing |
| Executed | Shipped, done, live |
| Parked | Not now but not dead — revisit with a date |
| Killed | Dead — with a "died well / died poorly" flag and reason |

> **The kill flag:** When an idea is killed, answer one question: "Died well or died poorly?" Died well = tested, real signal, rational call. Died poorly = faded from inattention. This distinction, tracked over time, is one of the most honest metrics in the system.

**Derived Metrics:**

| Metric | Type | Source |
|--------|------|--------|
| Ideas generated this week | Count | Auto-derived from entries |
| Ideas by pipeline stage | Count per stage | Auto-derived |
| Execution rate | % reaching In Progress or beyond | Auto-derived |
| Average time: Spark to Explored | Days | Auto-derived |
| Kill rate + died-well % | % | Auto-derived |
| Origin breakdown | Which sources generate most ideas | Auto-derived |
| Serendipity linkage rate | % of ideas originating from a B6 connection | Cross-bucket derived |

**Weekly Report Sections:**
- Ideas generated this week: count and origins
- Pipeline movement: what advanced, what stalled
- Forcing function: any ideas sitting at Spark/Explored for 3+ weeks — kill or commit
- Kill log: what died this week and how well
- Execution rate trend: is it improving

---

## 5. Reporting System

### Tier 1 — Daily Log

Per-bucket. Low friction. Target: under 3 minutes per bucket.

| Bucket | Input Method | What Gets Captured |
|--------|-------------|-------------------|
| B1 — Work | Voice → parse + to-do crossoff | Mode, hours, tasks, interactions, energy, value |
| B2 — Build | Voice or text | Build mode, hours, milestone update, blockers |
| B3 — Fitness | Quick tap + voice | Workout type, duration, energy, match details (tennis) |
| B4 — Reading | Voice or text | Pages, book, key takeaway |
| B5 — Social | Voice or text | Applications, conversations, follow-ups |
| B6 — Connections | Event-driven — log when it happens | New contact, interaction type, chain link |
| B7 — Idea Lab | Event-driven — log when it happens | Idea title, origin, stage, notes |

**Voice-to-task crossoff (B1):** The daily log parses the voice transcript and fuzzy-matches spoken content against open to-do items. Matched tasks are surfaced for one-tap confirmation. This keeps the to-do list current without a separate update step.

---

### Tier 2 — Individual Bucket Weekly Reports

Generated once per week per bucket via manual trigger in the dashboard.

**What Claude receives (per bucket):**
1. Operator identity and bucket context
2. This week's structured log entries
3. Completed and open to-dos
4. The monthly theme and priorities
5. Manual prompt responses (shining moment, biggest challenge)

**Tone instruction:** Direct and specific. No filler. No motivational language. Write like a sharp advisor who knows the operator's business.

Each report follows its bucket-specific template (defined above in Section 4).

---

### Tier 3 — Cross-Bucket Weekly Synthesis

Generated once per week using all 7 Bucket summaries as a single Claude API call. This report cannot be produced by any single-bucket tool — it requires the unified data layer.

**What the cross-bucket report surfaces:**
- Time allocation vs. stated goal weights — where you said you'd spend time vs. where you actually did
- Inter-bucket impact — e.g., "Your B6 serendipity activity generated 3 of your 5 B7 ideas this week"
- Crowded-out buckets — which domains got deprioritized and whether that was intentional
- Reading-to-application bridge — did B4 reading feed B1 work or B2 build this week
- Connections-to-opportunities pipeline — how active chains in B6 are progressing toward B1 or B7 outcomes
- Energy and consistency correlation — does B3 fitness consistency correlate with B1 work energy scores
- What to do next — top 3 cross-domain priorities for the coming week based on goal weights and gaps

**Output sections:**

| Section | Contents |
|---------|----------|
| Week Snapshot | One-paragraph honest summary of the whole week across all domains |
| Time Allocation | Actual hours/energy per bucket vs. stated goal weights — gap analysis |
| Cross-Domain Signals | Specific connections between buckets observed in the data |
| Pattern Alerts | Anything concerning: a bucket going dark, energy declining, execution rate dropping |
| Next Week's Top 3 | Three cross-domain priorities ranked by impact on stated goals |

---

## 6. Shared Layer — Contacts Tracker

The Contacts Tracker is a shared data layer between B5 (Social/Career) and B6 (Connections & Serendipity). A person who appears in both contexts — met serendipitously, then becomes a business contact — has one record with a full interaction history.

**Contact card shows:**
- Name, bucket tag (Social / Serendipity / Both), notes
- This-month interaction count — shown prominently
- All-time interaction count
- Interaction log: type, date, note per entry
- Type breakdown: total count per type (Hangout / Call / Text / Event / Business Mtg)

**Going-cold flag:** Any contact with no logged interaction in 14+ days is automatically surfaced in the weekly cross-bucket report.

---

## 7. Data Schema

All app state in `/data/store.json`:

```typescript
interface Store {
  user: {
    name: string;
    goalWeights: Record<BucketId, number>; // % of life energy, should sum to 100
  };
  prep: {
    identityStatement: string;
    baselineWeek: Record<string, string>;
    shortTermGoals: string[];
    longTermGoals: string[];
    completedAt?: string;
  };
  monthPlan: {
    theme: string;
    month: string; // "2026-03"
    priorities: Array<{ title: string; timePercent: number; keyFocus: string }>;
    metrics: string[];
    obstacles: string[];
  };
  weekPlan: {
    theme: string;
    weekOf: string; // ISO date of Monday
    outcomes: string[];
    scorecard: Record<string, number>;
    minimumViableWeek: string;
    keyDates: string[];
    wins: string[];
    mistakes: string[];
    nois: string[]; // Notes of Importance
  };
  buckets: {
    b1: {
      todos: Todo[];
      logs: WorkLog[];
      weeklyReports: WeeklyReport[];
    };
    b2: {
      logs: BuildLog[];
      milestones: Milestone[];
      weeklyReports: WeeklyReport[];
    };
    b3: {
      logs: FitnessLog[];
      tennisMatches: TennisMatch[];
      weeklyReports: WeeklyReport[];
    };
    b4: {
      logs: ReadingLog[];
      books: Book[];
      weeklyReports: WeeklyReport[];
    };
    b5: {
      logs: SocialLog[];
      jobApplications: JobApplication[];
      weeklyReports: WeeklyReport[];
    };
    b6: {
      contacts: Contact[];
      weeklyReports: WeeklyReport[];
    };
    b7: {
      ideas: Idea[];
      weeklyReports: WeeklyReport[];
    };
  };
  crossBucketReports: CrossBucketReport[];
}
```

Full type definitions in `/src/schemas/index.ts`.

---

## 8. Build Phases

| Phase | Focus | Deliverables |
|-------|-------|-------------|
| 1 | Foundation | PREP onboarding + Month/Week/Day planning views |
| 2 | Daily Execution | Work daily log with voice input, to-do crossoff, all 7 bucket input forms |
| 3 | Tracking | Domain metric trackers, tennis match log, idea pipeline, contact interaction history |
| 4 | Reports | Per-bucket weekly report generation, cross-bucket synthesis report |
| 5 | Intelligence | Plan vs. reality gap analysis, what-to-do-next engine, pattern alerts |
| 6 | Voice + Polish | Full voice transcription pipeline, persistent storage, mobile optimization |

**Current status:** Phase 2 in progress. B1 daily log, to-do crossoff, and weekly report are live as a working prototype. Contacts Tracker (shared B5/B6 layer) is built. Next: initialize Vite project, migrate prototype into proper component structure, extend to all 7 buckets.
