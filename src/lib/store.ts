// /src/lib/store.ts
// All read/write helpers for the data store
// Components never mutate the store directly — always use these functions

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Store, Todo, WorkLog, BuildLog, FitnessLog, TennisMatch,
  ReadingLog, Book, SocialLog, JobApplication, Contact,
  Interaction, Idea, MonthPlan, WeekPlan, PrepData
} from '../schemas/index';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Default empty store ────────────────────────────────────────────────────

const defaultStore: Store = {
  user: {
    name: 'Philip',
    goalWeights: { b1: 30, b2: 25, b3: 15, b4: 10, b5: 10, b6: 5, b7: 5 },
  },
  prep: {
    identityStatement: '',
    baselineWeek: {},
    shortTermGoals: [],
    longTermGoals: [],
  },
  monthPlan: {
    month: new Date().toISOString().slice(0, 7),
    theme: '',
    identityStatement: '',
    priorities: [],
    obstacles: [],
  },
  weekPlan: {
    weekOf: new Date().toISOString().slice(0, 10),
    theme: '',
    intent: '',
    outcomes: [],
    scorecard: {},
    minimumViableWeek: '',
    keyDates: [],
    wins: [],
    mistakes: [],
    nois: [],
  },
  buckets: {
    b1: { todos: [], logs: [], weeklyReports: [] },
    b2: { logs: [], milestones: [], weeklyReports: [] },
    b3: { logs: [], tennisMatches: [], weeklyReports: [] },
    b4: { logs: [], books: [], weeklyReports: [] },
    b5: { logs: [], jobApplications: [], weeklyReports: [] },
    b6: { contacts: [], weeklyReports: [] },
    b7: { ideas: [], weeklyReports: [] },
  },
  crossBucketReports: [],
};

// ── Zustand store ──────────────────────────────────────────────────────────

interface StoreActions {
  // User + prep
  updateGoalWeights: (weights: Partial<Store['user']['goalWeights']>) => void;
  savePrep: (prep: PrepData) => void;
  saveMonthPlan: (plan: MonthPlan) => void;
  saveWeekPlan: (plan: WeekPlan) => void;

  // B1 — Work
  addWorkLog: (log: Omit<WorkLog, 'id'>) => void;
  addTodo: (text: string, priority: Todo['priority']) => void;
  completeTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  saveWorkWeeklyReport: (content: string) => void;

  // B2 — Build
  addBuildLog: (log: Omit<BuildLog, 'id'>) => void;
  saveBuildWeeklyReport: (content: string) => void;

  // B3 — Fitness
  addFitnessLog: (log: Omit<FitnessLog, 'id'>) => void;
  addTennisMatch: (match: Omit<TennisMatch, 'id'>) => void;
  saveFitnessWeeklyReport: (content: string) => void;

  // B4 — Reading
  addReadingLog: (log: Omit<ReadingLog, 'id'>) => void;
  startBook: (book: Omit<Book, 'id'>) => void;
  completeBook: (id: string) => void;
  saveReadingWeeklyReport: (content: string) => void;

  // B5 — Social
  addSocialLog: (log: Omit<SocialLog, 'id'>) => void;
  addJobApplication: (app: Omit<JobApplication, 'id'>) => void;
  updateJobApplicationStatus: (id: string, status: JobApplication['status']) => void;
  saveSocialWeeklyReport: (content: string) => void;

  // B6 — Connections
  addContact: (contact: Omit<Contact, 'id' | 'interactions'>) => void;
  addInteraction: (contactId: string, interaction: Omit<Interaction, 'id'>) => void;
  updateContactStatus: (id: string, status: Contact['status']) => void;
  linkContactChain: (fromId: string, toId: string) => void;
  saveConnectionsWeeklyReport: (content: string) => void;

  // B7 — Idea Lab
  addIdea: (idea: Omit<Idea, 'id' | 'journal'>) => void;
  advanceIdeaStage: (id: string, stage: Idea['stage']) => void;
  killIdea: (id: string, quality: Idea['killQuality'], reason: string) => void;
  parkIdea: (id: string, until: string) => void;
  addIdeaJournalEntry: (ideaId: string, text: string) => void;
  saveIdeaLabWeeklyReport: (content: string) => void;

  // Cross-bucket
  saveCrossBucketReport: (content: string) => void;
}

type StoreState = Store & StoreActions;

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...defaultStore,

      // ── User + prep ──────────────────────────────────────────────────────

      updateGoalWeights: (weights) =>
        set((s) => ({ user: { ...s.user, goalWeights: { ...s.user.goalWeights, ...weights } } })),

      savePrep: (prep) => set({ prep: { ...prep, completedAt: new Date().toISOString() } }),
      saveMonthPlan: (plan) => set({ monthPlan: plan }),
      saveWeekPlan: (plan) => set({ weekPlan: plan }),

      // ── B1 ───────────────────────────────────────────────────────────────

      addWorkLog: (log) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b1: { ...s.buckets.b1, logs: [{ ...log, id: generateId() }, ...s.buckets.b1.logs] },
          },
        })),

      addTodo: (text, priority) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b1: {
              ...s.buckets.b1,
              todos: [
                ...s.buckets.b1.todos,
                { id: generateId(), text, done: false, priority, createdAt: new Date().toISOString() },
              ],
            },
          },
        })),

      completeTodo: (id) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b1: {
              ...s.buckets.b1,
              todos: s.buckets.b1.todos.map((t) =>
                t.id === id ? { ...t, done: true, completedAt: new Date().toISOString() } : t
              ),
            },
          },
        })),

      deleteTodo: (id) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b1: { ...s.buckets.b1, todos: s.buckets.b1.todos.filter((t) => t.id !== id) },
          },
        })),

      saveWorkWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b1: {
              ...s.buckets.b1,
              weeklyReports: [
                ...s.buckets.b1.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b1' },
              ],
            },
          },
        })),

      // ── B2 ───────────────────────────────────────────────────────────────

      addBuildLog: (log) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b2: { ...s.buckets.b2, logs: [{ ...log, id: generateId() }, ...s.buckets.b2.logs] },
          },
        })),

      saveBuildWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b2: {
              ...s.buckets.b2,
              weeklyReports: [
                ...s.buckets.b2.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b2' },
              ],
            },
          },
        })),

      // ── B3 ───────────────────────────────────────────────────────────────

      addFitnessLog: (log) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b3: { ...s.buckets.b3, logs: [{ ...log, id: generateId() }, ...s.buckets.b3.logs] },
          },
        })),

      addTennisMatch: (match) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b3: {
              ...s.buckets.b3,
              tennisMatches: [{ ...match, id: generateId() }, ...s.buckets.b3.tennisMatches],
            },
          },
        })),

      saveFitnessWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b3: {
              ...s.buckets.b3,
              weeklyReports: [
                ...s.buckets.b3.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b3' },
              ],
            },
          },
        })),

      // ── B4 ───────────────────────────────────────────────────────────────

      addReadingLog: (log) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b4: { ...s.buckets.b4, logs: [{ ...log, id: generateId() }, ...s.buckets.b4.logs] },
          },
        })),

      startBook: (book) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b4: { ...s.buckets.b4, books: [...s.buckets.b4.books, { ...book, id: generateId() }] },
          },
        })),

      completeBook: (id) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b4: {
              ...s.buckets.b4,
              books: s.buckets.b4.books.map((b) =>
                b.id === id ? { ...b, completedAt: new Date().toISOString() } : b
              ),
            },
          },
        })),

      saveReadingWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b4: {
              ...s.buckets.b4,
              weeklyReports: [
                ...s.buckets.b4.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b4' },
              ],
            },
          },
        })),

      // ── B5 ───────────────────────────────────────────────────────────────

      addSocialLog: (log) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b5: { ...s.buckets.b5, logs: [{ ...log, id: generateId() }, ...s.buckets.b5.logs] },
          },
        })),

      addJobApplication: (app) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b5: {
              ...s.buckets.b5,
              jobApplications: [...s.buckets.b5.jobApplications, { ...app, id: generateId() }],
            },
          },
        })),

      updateJobApplicationStatus: (id, status) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b5: {
              ...s.buckets.b5,
              jobApplications: s.buckets.b5.jobApplications.map((a) =>
                a.id === id ? { ...a, status } : a
              ),
            },
          },
        })),

      saveSocialWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b5: {
              ...s.buckets.b5,
              weeklyReports: [
                ...s.buckets.b5.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b5' },
              ],
            },
          },
        })),

      // ── B6 ───────────────────────────────────────────────────────────────

      addContact: (contact) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b6: {
              ...s.buckets.b6,
              contacts: [...s.buckets.b6.contacts, { ...contact, id: generateId(), interactions: [] }],
            },
          },
        })),

      addInteraction: (contactId, interaction) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b6: {
              ...s.buckets.b6,
              contacts: s.buckets.b6.contacts.map((c) =>
                c.id === contactId
                  ? { ...c, interactions: [...c.interactions, { ...interaction, id: generateId() }] }
                  : c
              ),
            },
          },
        })),

      updateContactStatus: (id, status) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b6: {
              ...s.buckets.b6,
              contacts: s.buckets.b6.contacts.map((c) => (c.id === id ? { ...c, status } : c)),
            },
          },
        })),

      linkContactChain: (fromId, toId) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b6: {
              ...s.buckets.b6,
              contacts: s.buckets.b6.contacts.map((c) => {
                if (c.id === fromId) return { ...c, ledToContactId: toId };
                if (c.id === toId) return { ...c, cameFromContactId: fromId };
                return c;
              }),
            },
          },
        })),

      saveConnectionsWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b6: {
              ...s.buckets.b6,
              weeklyReports: [
                ...s.buckets.b6.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b6' },
              ],
            },
          },
        })),

      // ── B7 ───────────────────────────────────────────────────────────────

      addIdea: (idea) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b7: {
              ...s.buckets.b7,
              ideas: [...s.buckets.b7.ideas, { ...idea, id: generateId(), journal: [] }],
            },
          },
        })),

      advanceIdeaStage: (id, stage) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b7: {
              ...s.buckets.b7,
              ideas: s.buckets.b7.ideas.map((i) =>
                i.id === id
                  ? {
                      ...i,
                      stage,
                      executedAt: stage === 'executed' ? new Date().toISOString() : i.executedAt,
                    }
                  : i
              ),
            },
          },
        })),

      killIdea: (id, quality, reason) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b7: {
              ...s.buckets.b7,
              ideas: s.buckets.b7.ideas.map((i) =>
                i.id === id
                  ? { ...i, stage: 'killed', killedAt: new Date().toISOString(), killQuality: quality, killReason: reason }
                  : i
              ),
            },
          },
        })),

      parkIdea: (id, until) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b7: {
              ...s.buckets.b7,
              ideas: s.buckets.b7.ideas.map((i) =>
                i.id === id ? { ...i, stage: 'parked', parkedUntil: until } : i
              ),
            },
          },
        })),

      addIdeaJournalEntry: (ideaId, text) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b7: {
              ...s.buckets.b7,
              ideas: s.buckets.b7.ideas.map((i) =>
                i.id === ideaId
                  ? {
                      ...i,
                      journal: [
                        ...i.journal,
                        { id: generateId(), date: todayISO(), text },
                      ],
                    }
                  : i
              ),
            },
          },
        })),

      saveIdeaLabWeeklyReport: (content) =>
        set((s) => ({
          buckets: {
            ...s.buckets,
            b7: {
              ...s.buckets.b7,
              weeklyReports: [
                ...s.buckets.b7.weeklyReports,
                { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'b7' },
              ],
            },
          },
        })),

      // ── Cross-bucket ─────────────────────────────────────────────────────

      saveCrossBucketReport: (content) =>
        set((s) => ({
          crossBucketReports: [
            ...s.crossBucketReports,
            { id: generateId(), weekOf: todayISO(), generatedAt: new Date().toISOString(), content, bucketId: 'cross-bucket' },
          ],
        })),
    }),
    {
      name: 'personal-os-store', // localStorage key
      version: 1,
    }
  )
);
