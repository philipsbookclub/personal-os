// /src/lib/claude.ts
// All Claude API calls go through this file — never call the API directly from components

import type { Store } from '../schemas/index';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1500;

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function callClaude(prompt: string, systemContext?: string): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemContext || OPERATOR_CONTEXT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text;
  if (!text) throw new Error('No text content in Claude response');
  return text;
}

// ── Operator context (injected into every report) ──────────────────────────

const OPERATOR_CONTEXT = `You are a sharp personal advisor generating reports for Philip.

ABOUT PHILIP:
- Co-founder, United Grants of America (UGOA) — agricultural grant navigation, USDA programs
- Co-founder, Magister — chess training platform targeting Chess.com/Duolingo acquisition in 12-18 months
- Tennis player, 4.5-5.0 level, hard courts
- Job search: medium priority, just starting
- TikTok: placeholder, activates in ~4 weeks
- Colleagues: Noelia, Jennifer (UGOA); Joshua (Magister co-founder)

REPORT TONE:
- Direct and specific. No filler. No motivational language.
- Reference actual task names, producer names, program names — not generic placeholders.
- Write like a sharp advisor who knows this business and these goals intimately.
- Be honest about gaps and patterns. Flag concerns clearly.
- Keep reports structured but not bureaucratic.`;

// ── B1 — Work ──────────────────────────────────────────────────────────────

export async function generateWorkWeeklyReport(store: Store): Promise<string> {
  const { b1 } = store.buckets;
  const completedTodos = b1.todos.filter(t => t.done);
  const openTodos = b1.todos.filter(t => !t.done);
  const weekLogs = b1.logs.slice(0, 7); // most recent 7 days
  const modeBreakdown = weekLogs.reduce((acc, l) => {
    if (l.mode) acc[l.mode] = (acc[l.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const avgEnergy = weekLogs.length
    ? (weekLogs.reduce((a, l) => a + (l.energy || 7), 0) / weekLogs.length).toFixed(1)
    : 'N/A';

  const prompt = `Generate the weekly Work (UGOA) report for Philip.

THIS WEEK'S DATA:
- Daily log entries: ${weekLogs.length}
- Work mode breakdown: ${JSON.stringify(modeBreakdown)}
- Completed tasks: ${completedTodos.map(t => t.text).join('; ') || 'none logged'}
- Open tasks: ${openTodos.map(t => `[${t.priority}] ${t.text}`).join('; ')}
- Average energy score: ${avgEnergy}/10
- Total hours logged: ${weekLogs.reduce((a, l) => a + (l.hoursLogged || 0), 0)}h
- Applications submitted: ${weekLogs.reduce((a, l) => a + l.applicationsSubmitted, 0)}
- Producer interactions: ${weekLogs.reduce((a, l) => a + l.producerInteractions, 0)}
- Value created: ${weekLogs.map(l => l.valueCreated).filter(Boolean).join('; ') || 'not quantified'}

MONTH CONTEXT:
- Theme: ${store.monthPlan.theme || 'not set'}
- Top priorities: ${store.monthPlan.priorities.map(p => p.title).join(', ') || 'not set'}

Generate a report with these exact sections:
1. WEEK SUMMARY (2-3 sentences, direct)
2. MODE ANALYSIS (what dominated and what it means for UGOA)
3. WINS (specific, use actual task names)
4. OPEN LOOPS (what's unfinished and why it matters)
5. ONE THING (single most important priority for next week)
6. PATTERN ALERT (honest flag — be direct, not gentle)`;

  return callClaude(prompt);
}

// ── B2 — Build ─────────────────────────────────────────────────────────────

export async function generateBuildWeeklyReport(store: Store): Promise<string> {
  const { b2 } = store.buckets;
  const weekLogs = b2.logs.slice(0, 7);
  const activeMilestone = b2.milestones.find(m => !m.completedAt);

  const prompt = `Generate the weekly Build (Magister + AI Learning) report for Philip.

THIS WEEK'S DATA:
- Build mode breakdown: ${JSON.stringify(weekLogs.reduce((acc, l) => { if (l.mode) acc[l.mode] = (acc[l.mode] || 0) + 1; return acc; }, {} as Record<string, number>))}
- Hours on Magister: ${weekLogs.reduce((a, l) => a + (l.hoursLogged || 0), 0)}h
- Mentors contacted: ${weekLogs.reduce((a, l) => a + l.mentorsContacted, 0)}
- Co-founder alignment (latest): ${weekLogs.find(l => l.coFounderAlignment)?.coFounderAlignment || 'not logged'}/5
- Active milestone: ${activeMilestone?.title || 'none set'}
- Key decisions: ${weekLogs.map(l => l.keyDecision).filter(Boolean).join('; ') || 'none logged'}
- Blockers: ${weekLogs.map(l => l.blockers).filter(Boolean).join('; ') || 'none logged'}
- AI learning hours: ${weekLogs.reduce((a, l) => a + (l.aiLearningHours || 0), 0)}h
- AI insights: ${weekLogs.map(l => l.aiInsight).filter(Boolean).join('; ') || 'none logged'}

ACQUISITION CONTEXT: Targeting Chess.com or Duolingo acquisition in 12-18 months.

Generate a report with these exact sections:
1. SHIPPED / MOVED FORWARD (what actually got done on Magister)
2. MILESTONE PROXIMITY (on track for acquisition timeline? be honest)
3. MENTOR PIPELINE (who was contacted, any responses or next steps)
4. AI LEARNING (one applied insight — only counts if it connects to something being built)
5. CO-FOUNDER PULSE (alignment score with context — flag low scores)
6. PATTERN ALERT (anything concerning)`;

  return callClaude(prompt);
}

// ── B3 — Fitness ───────────────────────────────────────────────────────────

export async function generateFitnessWeeklyReport(store: Store): Promise<string> {
  const { b3 } = store.buckets;
  const weekLogs = b3.logs.slice(0, 7);
  const weekMatches = b3.tennisMatches.slice(0, 5);
  const wins = weekMatches.filter(m => m.result === 'win').length;
  const losses = weekMatches.filter(m => m.result === 'loss').length;

  const prompt = `Generate the weekly Fitness report for Philip.

THIS WEEK'S DATA:
- Workouts completed: ${weekLogs.length}
- Workout types: ${JSON.stringify(weekLogs.reduce((acc, l) => { acc[l.workoutType] = (acc[l.workoutType] || 0) + 1; return acc; }, {} as Record<string, number>))}
- Average post-workout energy: ${weekLogs.length ? (weekLogs.reduce((a, l) => a + (l.energyPostWorkout || 7), 0) / weekLogs.length).toFixed(1) : 'N/A'}/10
- Average sleep quality: ${weekLogs.filter(l => l.sleepQuality).length ? (weekLogs.filter(l => l.sleepQuality).reduce((a, l) => a + (l.sleepQuality || 7), 0) / weekLogs.filter(l => l.sleepQuality).length).toFixed(1) : 'N/A'}/10
- Tennis this week: ${weekMatches.length} matches (${wins}W / ${losses}L)
- Tennis match details: ${weekMatches.map(m => `vs ${m.opponentName} ${m.score} (${m.result})`).join('; ') || 'none'}

Generate a report with these exact sections:
1. CONSISTENCY (workouts vs. target, streak status)
2. TENNIS RECORD (W/L, opponent notes, skill observations)
3. ENERGY TREND (post-workout scores — what they signal)
4. FLAG (rest deficit, overtraining, or consistency gap — be direct)
5. ONE THING (single most important physical focus for next week)`;

  return callClaude(prompt);
}

// ── B4 — Reading ───────────────────────────────────────────────────────────

export async function generateReadingWeeklyReport(store: Store): Promise<string> {
  const { b4 } = store.buckets;
  const weekLogs = b4.logs.slice(0, 7);
  const currentBook = b4.books.find(b => !b.completedAt);
  const completedThisMonth = b4.books.filter(b => b.completedAt?.startsWith(new Date().toISOString().slice(0, 7))).length;

  const prompt = `Generate the weekly Reading (Mind) report for Philip.

THIS WEEK'S DATA:
- Total pages read: ${weekLogs.reduce((a, l) => a + (l.pagesRead || 0), 0)}
- Current book: ${currentBook ? `${currentBook.title} by ${currentBook.author} (${currentBook.genre})` : 'none logged'}
- Key takeaways: ${weekLogs.map(l => l.keyTakeaway).filter(Boolean).join('; ') || 'none logged'}
- Applied to something: ${weekLogs.map(l => l.appliedTo).filter(Boolean).join('; ') || 'none'}
- Books completed this month: ${completedThisMonth}

Generate a report with these exact sections:
1. READING VOLUME (pages, progress through current book)
2. TAKEAWAY OF THE WEEK (the single most useful idea — be specific)
3. APPLICATION FLAG (did anything read directly connect to Magister, UGOA, or a current problem — this is the most important metric)
4. COMPLETION RATE (on track for monthly book goal)
5. PATTERN ALERT (is reading passive consumption or feeding the work — be honest)`;

  return callClaude(prompt);
}

// ── B5 — Social / Career ───────────────────────────────────────────────────

export async function generateSocialWeeklyReport(store: Store): Promise<string> {
  const { b5 } = store.buckets;
  const weekLogs = b5.logs.slice(0, 7);

  const prompt = `Generate the weekly Social / Career report for Philip.

THIS WEEK'S DATA:
- Job applications sent: ${weekLogs.reduce((a, l) => a + l.applicationsSubmitted, 0)}
- Responses received: ${weekLogs.reduce((a, l) => a + l.responsesReceived, 0)}
- Interviews scheduled: ${weekLogs.reduce((a, l) => a + l.interviewsScheduled, 0)}
- Connections for job search: ${weekLogs.reduce((a, l) => a + l.connectionsForSearch, 0)}
- Meaningful conversations: ${weekLogs.reduce((a, l) => a + l.meaningfulConversations, 0)}
- Follow-ups sent: ${weekLogs.reduce((a, l) => a + l.followUpsSent, 0)}
- Events attended: ${weekLogs.reduce((a, l) => a + l.eventsAttended, 0)}
- Momentum score: ${weekLogs.find(l => l.momentumScore)?.momentumScore || 'not rated'}/5
- TikTok: INACTIVE (activates in ~4 weeks)

Context: Job search is medium priority, just starting.

Generate a report with these exact sections:
1. JOB PIPELINE (apps, responses, interviews — is momentum building)
2. NETWORKING (meaningful interactions, follow-up rate)
3. TIKTOK STATUS (placeholder — note activation timeline)
4. FLAG (anything going stale or needing attention)`;

  return callClaude(prompt);
}

// ── B6 — Connections & Serendipity ─────────────────────────────────────────

export async function generateConnectionsWeeklyReport(store: Store): Promise<string> {
  const { b6 } = store.buckets;
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  const goingCold = b6.contacts.filter(c => {
    if (c.interactions.length === 0) return false;
    const lastInteraction = c.interactions.sort((a, b) => b.date.localeCompare(a.date))[0];
    return lastInteraction.date < twoWeeksAgo && c.status !== 'dormant';
  });

  const activeChains = b6.contacts.filter(c => c.cameFromContactId || c.ledToContactId);
  const newThisWeek = b6.contacts.filter(c => {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return c.metAt >= weekAgo;
  });

  const prompt = `Generate the weekly Connections & Serendipity report for Philip.

THIS WEEK'S DATA:
- New connections this week: ${newThisWeek.length} (${newThisWeek.map(c => `${c.name} (${c.whereMet})`).join(', ') || 'none'})
- Active chains: ${activeChains.length}
- Going cold (14+ days no contact): ${goingCold.map(c => c.name).join(', ') || 'none'}
- Total contacts tracked: ${b6.contacts.length}

Generate a report with these exact sections:
1. NEW CONNECTIONS (who, where, initial notes)
2. ACTIVE CHAINS (who are you mid-conversation with — what's the chain so far)
3. GOING COLD (names + last contact date — action required)
4. CHAIN HIGHLIGHT (any serendipity connection that led somewhere notable this week)
5. INTERACTION FREQUENCY (who you talked to most this month — is that intentional)`;

  return callClaude(prompt);
}

// ── B7 — Idea Lab ──────────────────────────────────────────────────────────

export async function generateIdeaLabWeeklyReport(store: Store): Promise<string> {
  const { b7 } = store.buckets;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  const newThisWeek = b7.ideas.filter(i => i.capturedAt >= weekAgo);
  const killedThisWeek = b7.ideas.filter(i => i.killedAt && i.killedAt >= weekAgo);
  const stalled = b7.ideas.filter(i => 
    ['spark', 'explored'].includes(i.stage) && 
    i.capturedAt <= threeWeeksAgo &&
    !i.killedAt
  );
  const stageCounts = b7.ideas.reduce((acc, i) => {
    if (!i.killedAt) acc[i.stage] = (acc[i.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `Generate the weekly Idea Lab report for Philip.

THIS WEEK'S DATA:
- New ideas this week: ${newThisWeek.length} (${newThisWeek.map(i => `"${i.title}" [${i.origin}]`).join(', ') || 'none'})
- Killed this week: ${killedThisWeek.map(i => `"${i.title}" (${i.killQuality})`).join(', ') || 'none'}
- Pipeline: ${JSON.stringify(stageCounts)}
- Stalled at Spark/Explored for 3+ weeks: ${stalled.map(i => `"${i.title}" (${i.capturedAt})`).join(', ') || 'none'}
- Total live ideas: ${b7.ideas.filter(i => !i.killedAt && i.stage !== 'executed').length}

Generate a report with these exact sections:
1. IDEAS GENERATED (count, origins — what's sparking ideas this week)
2. PIPELINE MOVEMENT (what advanced, what stalled)
3. KILL OR COMMIT (force a decision on each stalled idea — be direct: kill it or set a next action)
4. KILL LOG (what died this week — died well or died poorly, and why that distinction matters)
5. EXECUTION RATE TREND (honest read on whether ideas are moving to action)`;

  return callClaude(prompt);
}

// ── Cross-Bucket Synthesis ─────────────────────────────────────────────────

export async function generateCrossBucketReport(store: Store): Promise<string> {
  // Collect summaries from each bucket's most recent weekly report
  const bucketSummaries = Object.entries(store.buckets).map(([id, bucket]) => {
    const reports = 'weeklyReports' in bucket ? bucket.weeklyReports : [];
    const latest = reports[reports.length - 1];
    return `${id.toUpperCase()}: ${latest ? latest.content.slice(0, 300) + '...' : 'No report generated yet'}`;
  }).join('\n\n');

  const goalWeights = store.user.goalWeights;

  const prompt = `Generate the Cross-Bucket Weekly Synthesis Report for Philip.

GOAL WEIGHTS (% of life energy Philip intends to allocate):
${Object.entries(goalWeights).map(([id, weight]) => `${id}: ${weight}%`).join('\n')}

BUCKET SUMMARIES THIS WEEK:
${bucketSummaries}

MONTH THEME: ${store.monthPlan.theme || 'not set'}
MONTH PRIORITIES: ${store.monthPlan.priorities.map(p => p.title).join(', ') || 'not set'}

Generate the cross-bucket synthesis with these exact sections:

1. WEEK SNAPSHOT
One honest paragraph summarizing how the week went across all domains. Don't be gentle.

2. TIME ALLOCATION
Compare actual time/energy per bucket against stated goal weights. Name the gaps specifically. e.g. "You allocated 60% to Work but said 30% — Magister got crowded out."

3. CROSS-DOMAIN SIGNALS
Specific connections observed between buckets this week. Examples:
- Did B6 serendipity generate B7 ideas?
- Did B4 reading feed B1 or B2?
- Is B3 fitness consistency correlating with B1 energy scores?
- Are B6 contacts progressing toward B1 revenue or B7 opportunities?
Only report real signals — not hypotheticals.

4. PATTERN ALERTS
Anything concerning across the system: a bucket going dark, energy declining, execution rate dropping, a chain going cold, ideas stalling. Name it directly.

5. NEXT WEEK'S TOP 3
Three cross-domain priorities for next week, ranked by impact on stated goals. Each should span or connect multiple buckets.`;

  return callClaude(prompt);
}
