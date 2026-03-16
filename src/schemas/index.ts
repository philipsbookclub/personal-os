// /src/schemas/index.ts
// All domain metric type definitions for Personal OS
// These are the source of truth for the data store shape

export type BucketId = 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7';

export type WorkMode = 'depth' | 'breadth' | 'exploration' | 'management';
export type BuildMode = 'product' | 'strategy' | 'outreach' | 'fundraising';
export type WorkoutType = 'strength' | 'cardio' | 'mobility' | 'tennis';
export type TennisSurface = 'hard' | 'clay' | 'grass';
export type TennisMatchType = 'casual' | 'competitive' | 'tournament';
export type ReadingGenre = 'classic' | 'nonfiction' | 'business' | 'other';
export type ContactBucket = 'social' | 'serendipity' | 'both';
export type ContactCategory = 'personal' | 'business' | 'creative' | 'mentor';
export type ContactStatus = 'new' | 'warm' | 'active' | 'dormant';
export type InteractionType = 'hangout' | 'call-video' | 'text-dm' | 'event' | 'business-mtg';
export type IdeaOrigin = 'shower' | 'reading' | 'conversation' | 'serendipity' | 'work' | 'other';
export type IdeaCategory = 'business' | 'product' | 'creative' | 'personal' | 'other';
export type IdeaStage = 'spark' | 'explored' | 'validated' | 'in-progress' | 'executed' | 'parked' | 'killed';
export type KillQuality = 'died-well' | 'died-poorly';
export type TodoPriority = 'urgent' | 'important' | 'normal' | 'explore';

// ── SHARED ─────────────────────────────────────────────────────────────────

export interface WeeklyReport {
  id: string;
  weekOf: string; // ISO date of Monday
  generatedAt: string;
  content: string; // raw Claude output
  bucketId: BucketId | 'cross-bucket';
}

// ── B1 — WORK ──────────────────────────────────────────────────────────────

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: TodoPriority;
  createdAt: string;
  completedAt?: string;
}

export interface WorkLog {
  id: string;
  date: string; // ISO date
  text: string; // voice transcript or typed log
  mode: WorkMode | null;
  energy: number; // 1-10
  hoursLogged: number | null;
  valueCreated: string | null; // e.g. "$12k application submitted"
  completedTodoIds: string[];
  producerInteractions: number;
  applicationsSubmitted: number;
}

// ── B2 — BUILD ─────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completedAt?: string;
  notes: string;
}

export interface BuildLog {
  id: string;
  date: string;
  text: string;
  mode: BuildMode | null;
  hoursLogged: number | null;
  milestoneUpdate: string | null;
  blockers: string | null;
  coFounderAlignment: number | null; // 1-5
  mentorsContacted: number;
  keyDecision: string | null;
  // AI Learning sub-track
  aiLearningHours: number | null;
  aiTopic: string | null;
  aiApplied: boolean | null;
  aiInsight: string | null;
}

// ── B3 — FITNESS ───────────────────────────────────────────────────────────

export interface FitnessLog {
  id: string;
  date: string;
  workoutType: WorkoutType;
  durationMinutes: number | null;
  energyPostWorkout: number | null; // 1-10
  sleepQuality: number | null; // 1-10
  weight: number | null;
  notes: string | null;
}

export interface TennisMatch {
  id: string;
  date: string;
  opponentName: string;
  score: string; // e.g. "6-4, 3-6, 6-2"
  result: 'win' | 'loss';
  surface: TennisSurface;
  matchType: TennisMatchType;
  skillFocus: string | null;
  notes: string | null;
}

// ── B4 — READING ───────────────────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: ReadingGenre;
  startedAt: string;
  completedAt?: string;
  totalPages: number | null;
}

export interface ReadingLog {
  id: string;
  date: string;
  bookId: string;
  pagesRead: number | null;
  chaptersRead: string | null;
  keyTakeaway: string | null;
  quote: string | null;
  appliedTo: string | null; // what domain/project did this connect to
  chessElo: number | null; // lightweight chess tracking
  chessMinutes: number | null;
}

// ── B5 — SOCIAL / CAREER ───────────────────────────────────────────────────

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  appliedAt: string;
  status: 'applied' | 'response' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  notes: string | null;
}

export interface SocialLog {
  id: string;
  date: string;
  applicationsSubmitted: number;
  responsesReceived: number;
  interviewsScheduled: number;
  connectionsForSearch: number;
  meaningfulConversations: number;
  followUpsSent: number;
  eventsAttended: number;
  momentumScore: number | null; // 1-5
  // TikTok (activates later)
  videosPosted: number;
  views: number;
  followersGained: number;
  hoursCreating: number | null;
  notes: string | null;
}

// ── B6 — CONNECTIONS & SERENDIPITY ─────────────────────────────────────────

export interface Interaction {
  id: string;
  type: InteractionType;
  date: string;
  monthKey: string; // "2026-03"
  note: string | null;
}

export interface Contact {
  id: string;
  name: string;
  bucket: ContactBucket;
  category: ContactCategory | null;
  status: ContactStatus;
  whereMet: string | null;
  metAt: string; // ISO date
  cameFromContactId: string | null; // chain link: previous node
  ledToContactId: string | null; // chain link: next node
  notes: string | null;
  followUpTaken: string | null;
  interactions: Interaction[];
}

// ── B7 — IDEA LAB ──────────────────────────────────────────────────────────

export interface IdeaJournalEntry {
  id: string;
  date: string;
  text: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  capturedAt: string;
  origin: IdeaOrigin;
  category: IdeaCategory;
  stage: IdeaStage;
  linkedContactId: string | null; // link to B6 contact
  linkedBookId: string | null; // link to B4 book
  journal: IdeaJournalEntry[];
  killedAt?: string;
  killQuality?: KillQuality;
  killReason?: string;
  parkedUntil?: string;
  executedAt?: string;
}

// ── PLANNING ───────────────────────────────────────────────────────────────

export interface PrepData {
  identityStatement: string;
  baselineWeek: Record<string, string>; // day -> description of typical day
  shortTermGoals: string[]; // week to month
  longTermGoals: string[]; // 6 months to a year
  completedAt?: string;
}

export interface MonthPlan {
  month: string; // "2026-03"
  theme: string;
  identityStatement: string;
  priorities: Array<{
    title: string;
    timePercent: number;
    keyFocus: string;
    metrics: string[]; // 5 numerical metrics
  }>;
  obstacles: string[]; // 3 potential derailers
}

export interface WeekPlan {
  weekOf: string; // ISO date of Monday
  theme: string;
  intent: string;
  outcomes: string[]; // 3-5
  scorecard: Record<string, number>; // metric -> target number
  minimumViableWeek: string;
  keyDates: string[];
  wins: string[];
  mistakes: string[];
  nois: string[]; // Notes of Importance
}

// ── ROOT STORE ─────────────────────────────────────────────────────────────

export interface Store {
  user: {
    name: string;
    goalWeights: Record<BucketId, number>; // % of life energy, should sum to 100
  };
  prep: PrepData;
  monthPlan: MonthPlan;
  weekPlan: WeekPlan;
  buckets: {
    b1: { todos: Todo[]; logs: WorkLog[]; weeklyReports: WeeklyReport[] };
    b2: { logs: BuildLog[]; milestones: Milestone[]; weeklyReports: WeeklyReport[] };
    b3: { logs: FitnessLog[]; tennisMatches: TennisMatch[]; weeklyReports: WeeklyReport[] };
    b4: { logs: ReadingLog[]; books: Book[]; weeklyReports: WeeklyReport[] };
    b5: { logs: SocialLog[]; jobApplications: JobApplication[]; weeklyReports: WeeklyReport[] };
    b6: { contacts: Contact[]; weeklyReports: WeeklyReport[] };
    b7: { ideas: Idea[]; weeklyReports: WeeklyReport[] };
  };
  crossBucketReports: WeeklyReport[];
}
