# main.py — Personal OS FastAPI backend
# Connects to Neon PostgreSQL for all persistent storage
# Claude API calls are proxied server-side (API key never exposed to frontend)

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import psycopg2
import psycopg2.pool
from dotenv import load_dotenv
import anthropic

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
print(f"[startup] DATABASE_URL set: {bool(DATABASE_URL)}")
print(f"[startup] ANTHROPIC_API_KEY set: {bool(ANTHROPIC_API_KEY)}")
print(f"[startup] All env keys: {[k for k in os.environ.keys() if 'URL' in k or 'KEY' in k or 'PORT' in k]}")
MODEL = "claude-sonnet-4-20250514"

# ── Connection pool ─────────────────────────────────────────────────────────

pool: psycopg2.pool.SimpleConnectionPool | None = None


def get_conn():
    return pool.getconn()


def put_conn(conn):
    pool.putconn(conn)


def query(sql: str, params=None, fetch: str = "all"):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        if fetch == "one":
            return cur.fetchone()
        if fetch == "all":
            return cur.fetchall()
        return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_conn(conn)


def row_to_dict(row, cols):
    if row is None:
        return None
    return dict(zip(cols, row))


def rows_to_dicts(rows, cols):
    return [dict(zip(cols, r)) for r in rows]


# ── DB Init ─────────────────────────────────────────────────────────────────

def init_db():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                id TEXT PRIMARY KEY DEFAULT 'philip',
                name TEXT NOT NULL DEFAULT 'Philip',
                goal_weights JSONB NOT NULL DEFAULT '{"b1":30,"b2":25,"b3":15,"b4":10,"b5":10,"b6":5,"b7":5}'
            );

            INSERT INTO user_settings (id, name, goal_weights)
            VALUES ('philip', 'Philip', '{"b1":30,"b2":25,"b3":15,"b4":10,"b5":10,"b6":5,"b7":5}')
            ON CONFLICT (id) DO NOTHING;

            CREATE TABLE IF NOT EXISTS prep_data (
                id TEXT PRIMARY KEY DEFAULT 'main',
                identity_statement TEXT NOT NULL DEFAULT '',
                baseline_week JSONB NOT NULL DEFAULT '{}',
                short_term_goals JSONB NOT NULL DEFAULT '[]',
                long_term_goals JSONB NOT NULL DEFAULT '[]',
                completed_at TEXT
            );

            INSERT INTO prep_data (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

            CREATE TABLE IF NOT EXISTS month_plans (
                id TEXT PRIMARY KEY,
                month TEXT NOT NULL,
                theme TEXT NOT NULL DEFAULT '',
                identity_statement TEXT NOT NULL DEFAULT '',
                priorities JSONB NOT NULL DEFAULT '[]',
                obstacles JSONB NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS week_plans (
                id TEXT PRIMARY KEY,
                week_of TEXT NOT NULL,
                theme TEXT NOT NULL DEFAULT '',
                intent TEXT NOT NULL DEFAULT '',
                outcomes JSONB NOT NULL DEFAULT '[]',
                scorecard JSONB NOT NULL DEFAULT '{}',
                minimum_viable_week TEXT NOT NULL DEFAULT '',
                key_dates JSONB NOT NULL DEFAULT '[]',
                wins JSONB NOT NULL DEFAULT '[]',
                mistakes JSONB NOT NULL DEFAULT '[]',
                nois JSONB NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            );

            -- B1
            CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                done BOOLEAN NOT NULL DEFAULT FALSE,
                priority TEXT NOT NULL DEFAULT 'normal',
                created_at TEXT NOT NULL,
                completed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS work_logs (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                text TEXT NOT NULL,
                mode TEXT,
                energy INTEGER,
                hours_logged REAL,
                value_created TEXT,
                completed_todo_ids JSONB NOT NULL DEFAULT '[]',
                producer_interactions INTEGER NOT NULL DEFAULT 0,
                applications_submitted INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            -- B2
            CREATE TABLE IF NOT EXISTS milestones (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                target_date TEXT NOT NULL,
                completed_at TEXT,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS build_logs (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                text TEXT NOT NULL,
                mode TEXT,
                hours_logged REAL,
                milestone_update TEXT,
                blockers TEXT,
                co_founder_alignment INTEGER,
                mentors_contacted INTEGER NOT NULL DEFAULT 0,
                key_decision TEXT,
                ai_learning_hours REAL,
                ai_topic TEXT,
                ai_applied BOOLEAN,
                ai_insight TEXT,
                created_at TEXT NOT NULL
            );

            -- B3
            CREATE TABLE IF NOT EXISTS fitness_logs (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                workout_type TEXT NOT NULL,
                duration_minutes INTEGER,
                energy_post_workout INTEGER,
                sleep_quality INTEGER,
                weight REAL,
                notes TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tennis_matches (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                opponent_name TEXT NOT NULL,
                score TEXT NOT NULL,
                result TEXT NOT NULL,
                surface TEXT NOT NULL DEFAULT 'hard',
                match_type TEXT NOT NULL DEFAULT 'casual',
                skill_focus TEXT,
                notes TEXT,
                created_at TEXT NOT NULL
            );

            -- B4
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                genre TEXT NOT NULL DEFAULT 'nonfiction',
                started_at TEXT NOT NULL,
                completed_at TEXT,
                total_pages INTEGER,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reading_logs (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                book_id TEXT REFERENCES books(id),
                pages_read INTEGER,
                chapters_read TEXT,
                key_takeaway TEXT,
                quote TEXT,
                applied_to TEXT,
                chess_elo INTEGER,
                chess_minutes INTEGER,
                created_at TEXT NOT NULL
            );

            -- B5
            CREATE TABLE IF NOT EXISTS job_applications (
                id TEXT PRIMARY KEY,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                applied_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'applied',
                notes TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS social_logs (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                applications_submitted INTEGER NOT NULL DEFAULT 0,
                responses_received INTEGER NOT NULL DEFAULT 0,
                interviews_scheduled INTEGER NOT NULL DEFAULT 0,
                connections_for_search INTEGER NOT NULL DEFAULT 0,
                meaningful_conversations INTEGER NOT NULL DEFAULT 0,
                follow_ups_sent INTEGER NOT NULL DEFAULT 0,
                events_attended INTEGER NOT NULL DEFAULT 0,
                momentum_score INTEGER,
                videos_posted INTEGER NOT NULL DEFAULT 0,
                views INTEGER NOT NULL DEFAULT 0,
                followers_gained INTEGER NOT NULL DEFAULT 0,
                hours_creating REAL,
                notes TEXT,
                created_at TEXT NOT NULL
            );

            -- B6
            CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                bucket TEXT NOT NULL DEFAULT 'serendipity',
                category TEXT,
                status TEXT NOT NULL DEFAULT 'new',
                where_met TEXT,
                met_at TEXT NOT NULL,
                came_from_contact_id TEXT,
                led_to_contact_id TEXT,
                notes TEXT,
                follow_up_taken TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS interactions (
                id TEXT PRIMARY KEY,
                contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                date TEXT NOT NULL,
                month_key TEXT NOT NULL,
                note TEXT,
                created_at TEXT NOT NULL
            );

            -- B7
            CREATE TABLE IF NOT EXISTS ideas (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                captured_at TEXT NOT NULL,
                origin TEXT NOT NULL DEFAULT 'other',
                category TEXT NOT NULL DEFAULT 'other',
                stage TEXT NOT NULL DEFAULT 'spark',
                linked_contact_id TEXT,
                linked_book_id TEXT,
                killed_at TEXT,
                kill_quality TEXT,
                kill_reason TEXT,
                parked_until TEXT,
                executed_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS idea_journal_entries (
                id TEXT PRIMARY KEY,
                idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
                date TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            -- Reports
            CREATE TABLE IF NOT EXISTS weekly_reports (
                id TEXT PRIMARY KEY,
                bucket_id TEXT NOT NULL,
                week_of TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                content TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cross_bucket_reports (
                id TEXT PRIMARY KEY,
                week_of TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                content TEXT NOT NULL
            );
        """)
        conn.commit()
    finally:
        cur.close()
        put_conn(conn)


# ── App lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set in .env")
    pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
    init_db()
    print("✅ Neon database connected and tables initialized")
    yield
    pool.closeall()


app = FastAPI(title="Personal OS API", version="1.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://philipsbookclub.github.io",
    os.getenv("FRONTEND_URL", ""),   # set this in Railway if using Vercel
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def today_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


# ── Claude helpers ──────────────────────────────────────────────────────────

OPERATOR_CONTEXT = """You are a sharp personal advisor generating reports for Philip.

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
- Be honest about gaps and patterns. Flag concerns clearly."""


def call_claude(prompt: str) -> str:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=OPERATOR_CONTEXT,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": now_iso()}


# ── User Settings ───────────────────────────────────────────────────────────

class GoalWeights(BaseModel):
    b1: int = 30
    b2: int = 25
    b3: int = 15
    b4: int = 10
    b5: int = 10
    b6: int = 5
    b7: int = 5


@app.get("/user")
def get_user():
    row = query(
        "SELECT name, goal_weights FROM user_settings WHERE id = 'philip'",
        fetch="one",
    )
    if not row:
        raise HTTPException(404, "User not found")
    return {"name": row[0], "goalWeights": row[1]}


@app.put("/user/goal-weights")
def update_goal_weights(weights: GoalWeights):
    query(
        "UPDATE user_settings SET goal_weights = %s WHERE id = 'philip'",
        (json.dumps(weights.model_dump()),),
        fetch="none",
    )
    return weights


# ── Prep ────────────────────────────────────────────────────────────────────

class PrepPayload(BaseModel):
    identityStatement: str = ""
    baselineWeek: dict = {}
    shortTermGoals: List[str] = []
    longTermGoals: List[str] = []


@app.get("/prep")
def get_prep():
    row = query(
        "SELECT identity_statement, baseline_week, short_term_goals, long_term_goals, completed_at FROM prep_data WHERE id = 'main'",
        fetch="one",
    )
    if not row:
        return {}
    return {
        "identityStatement": row[0],
        "baselineWeek": row[1],
        "shortTermGoals": row[2],
        "longTermGoals": row[3],
        "completedAt": row[4],
    }


@app.put("/prep")
def save_prep(payload: PrepPayload):
    query(
        """UPDATE prep_data SET
            identity_statement = %s,
            baseline_week = %s,
            short_term_goals = %s,
            long_term_goals = %s,
            completed_at = %s
           WHERE id = 'main'""",
        (
            payload.identityStatement,
            json.dumps(payload.baselineWeek),
            json.dumps(payload.shortTermGoals),
            json.dumps(payload.longTermGoals),
            now_iso(),
        ),
        fetch="none",
    )
    return {"ok": True}


# ── Month Plan ───────────────────────────────────────────────────────────────

class MonthPlanPayload(BaseModel):
    month: str
    theme: str = ""
    identityStatement: str = ""
    priorities: List[dict] = []
    obstacles: List[str] = []


@app.get("/month-plan")
def get_month_plan():
    row = query(
        "SELECT id, month, theme, identity_statement, priorities, obstacles FROM month_plans ORDER BY created_at DESC LIMIT 1",
        fetch="one",
    )
    if not row:
        return {}
    return {
        "id": row[0], "month": row[1], "theme": row[2],
        "identityStatement": row[3], "priorities": row[4], "obstacles": row[5],
    }


@app.put("/month-plan")
def save_month_plan(payload: MonthPlanPayload):
    existing = query(
        "SELECT id FROM month_plans WHERE month = %s", (payload.month,), fetch="one"
    )
    if existing:
        query(
            """UPDATE month_plans SET theme=%s, identity_statement=%s, priorities=%s, obstacles=%s
               WHERE month=%s""",
            (payload.theme, payload.identityStatement, json.dumps(payload.priorities),
             json.dumps(payload.obstacles), payload.month),
            fetch="none",
        )
    else:
        query(
            """INSERT INTO month_plans (id, month, theme, identity_statement, priorities, obstacles, created_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s)""",
            (new_id(), payload.month, payload.theme, payload.identityStatement,
             json.dumps(payload.priorities), json.dumps(payload.obstacles), now_iso()),
            fetch="none",
        )
    return {"ok": True}


# ── Week Plan ────────────────────────────────────────────────────────────────

class WeekPlanPayload(BaseModel):
    weekOf: str
    theme: str = ""
    intent: str = ""
    outcomes: List[str] = []
    scorecard: dict = {}
    minimumViableWeek: str = ""
    keyDates: List[str] = []
    wins: List[str] = []
    mistakes: List[str] = []
    nois: List[str] = []


@app.get("/week-plan")
def get_week_plan():
    row = query(
        """SELECT id, week_of, theme, intent, outcomes, scorecard,
                  minimum_viable_week, key_dates, wins, mistakes, nois
           FROM week_plans ORDER BY created_at DESC LIMIT 1""",
        fetch="one",
    )
    if not row:
        return {}
    return {
        "id": row[0], "weekOf": row[1], "theme": row[2], "intent": row[3],
        "outcomes": row[4], "scorecard": row[5], "minimumViableWeek": row[6],
        "keyDates": row[7], "wins": row[8], "mistakes": row[9], "nois": row[10],
    }


@app.put("/week-plan")
def save_week_plan(payload: WeekPlanPayload):
    existing = query(
        "SELECT id FROM week_plans WHERE week_of = %s", (payload.weekOf,), fetch="one"
    )
    if existing:
        query(
            """UPDATE week_plans SET theme=%s, intent=%s, outcomes=%s, scorecard=%s,
                  minimum_viable_week=%s, key_dates=%s, wins=%s, mistakes=%s, nois=%s
               WHERE week_of=%s""",
            (payload.theme, payload.intent, json.dumps(payload.outcomes),
             json.dumps(payload.scorecard), payload.minimumViableWeek,
             json.dumps(payload.keyDates), json.dumps(payload.wins),
             json.dumps(payload.mistakes), json.dumps(payload.nois), payload.weekOf),
            fetch="none",
        )
    else:
        query(
            """INSERT INTO week_plans
               (id, week_of, theme, intent, outcomes, scorecard, minimum_viable_week,
                key_dates, wins, mistakes, nois, created_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (new_id(), payload.weekOf, payload.theme, payload.intent,
             json.dumps(payload.outcomes), json.dumps(payload.scorecard),
             payload.minimumViableWeek, json.dumps(payload.keyDates),
             json.dumps(payload.wins), json.dumps(payload.mistakes),
             json.dumps(payload.nois), now_iso()),
            fetch="none",
        )
    return {"ok": True}


# ── B1 — Work ───────────────────────────────────────────────────────────────

class TodoCreate(BaseModel):
    text: str
    priority: str = "normal"


class WorkLogCreate(BaseModel):
    date: str
    text: str
    mode: Optional[str] = None
    energy: Optional[int] = None
    hoursLogged: Optional[float] = None
    valueCreated: Optional[str] = None
    completedTodoIds: List[str] = []
    producerInteractions: int = 0
    applicationsSubmitted: int = 0


@app.get("/b1/todos")
def get_todos():
    rows = query("SELECT id, text, done, priority, created_at, completed_at FROM todos ORDER BY created_at DESC")
    return [{"id": r[0], "text": r[1], "done": r[2], "priority": r[3], "createdAt": r[4], "completedAt": r[5]} for r in rows]


@app.post("/b1/todos")
def add_todo(payload: TodoCreate):
    tid = new_id()
    query(
        "INSERT INTO todos (id, text, done, priority, created_at) VALUES (%s,%s,%s,%s,%s)",
        (tid, payload.text, False, payload.priority, now_iso()),
        fetch="none",
    )
    return {"id": tid, "text": payload.text, "done": False, "priority": payload.priority}


@app.patch("/b1/todos/{todo_id}/complete")
def complete_todo(todo_id: str):
    query(
        "UPDATE todos SET done=TRUE, completed_at=%s WHERE id=%s",
        (now_iso(), todo_id), fetch="none",
    )
    return {"ok": True}


@app.delete("/b1/todos/{todo_id}")
def delete_todo(todo_id: str):
    query("DELETE FROM todos WHERE id=%s", (todo_id,), fetch="none")
    return {"ok": True}


@app.get("/b1/logs")
def get_work_logs():
    rows = query(
        """SELECT id, date, text, mode, energy, hours_logged, value_created,
                  completed_todo_ids, producer_interactions, applications_submitted
           FROM work_logs ORDER BY date DESC LIMIT 30"""
    )
    return [
        {"id": r[0], "date": r[1], "text": r[2], "mode": r[3], "energy": r[4],
         "hoursLogged": r[5], "valueCreated": r[6], "completedTodoIds": r[7],
         "producerInteractions": r[8], "applicationsSubmitted": r[9]}
        for r in rows
    ]


@app.post("/b1/logs")
def add_work_log(payload: WorkLogCreate):
    lid = new_id()
    query(
        """INSERT INTO work_logs
           (id, date, text, mode, energy, hours_logged, value_created,
            completed_todo_ids, producer_interactions, applications_submitted, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (lid, payload.date, payload.text, payload.mode, payload.energy,
         payload.hoursLogged, payload.valueCreated, json.dumps(payload.completedTodoIds),
         payload.producerInteractions, payload.applicationsSubmitted, now_iso()),
        fetch="none",
    )
    return {"id": lid, **payload.model_dump()}


@app.get("/b1/reports")
def get_work_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b1' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b1/reports/generate")
def generate_work_report():
    logs = query(
        """SELECT mode, energy, hours_logged, applications_submitted, producer_interactions, value_created
           FROM work_logs ORDER BY date DESC LIMIT 7"""
    )
    todos_done = query("SELECT text FROM todos WHERE done=TRUE")
    todos_open = query("SELECT priority, text FROM todos WHERE done=FALSE")
    month = query(
        "SELECT theme, priorities FROM month_plans ORDER BY created_at DESC LIMIT 1", fetch="one"
    )

    mode_breakdown = {}
    for r in logs:
        if r[0]:
            mode_breakdown[r[0]] = mode_breakdown.get(r[0], 0) + 1

    avg_energy = round(sum(r[1] or 7 for r in logs) / max(len(logs), 1), 1)
    total_hours = sum(r[2] or 0 for r in logs)
    total_apps = sum(r[3] or 0 for r in logs)
    total_producers = sum(r[4] or 0 for r in logs)
    value_notes = [r[5] for r in logs if r[5]]

    prompt = f"""Generate the weekly Work (UGOA) report for Philip.

THIS WEEK'S DATA:
- Daily log entries: {len(logs)}
- Work mode breakdown: {json.dumps(mode_breakdown)}
- Completed tasks: {'; '.join(r[0] for r in todos_done) or 'none logged'}
- Open tasks: {'; '.join(f'[{r[0]}] {r[1]}' for r in todos_open)}
- Average energy score: {avg_energy}/10
- Total hours logged: {total_hours}h
- Applications submitted: {total_apps}
- Producer interactions: {total_producers}
- Value created: {'; '.join(value_notes) or 'not quantified'}

MONTH CONTEXT:
- Theme: {month[0] if month else 'not set'}
- Top priorities: {', '.join(p['title'] for p in (month[1] if month else [])) if month else 'not set'}

Generate a report with these exact sections:
1. WEEK SUMMARY (2-3 sentences, direct)
2. MODE ANALYSIS (what dominated and what it means for UGOA)
3. WINS (specific, use actual task names)
4. OPEN LOOPS (what's unfinished and why it matters)
5. ONE THING (single most important priority for next week)
6. PATTERN ALERT (honest flag — be direct, not gentle)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b1", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── B2 — Build ──────────────────────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    title: str
    targetDate: str
    notes: str = ""


class BuildLogCreate(BaseModel):
    date: str
    text: str
    mode: Optional[str] = None
    hoursLogged: Optional[float] = None
    milestoneUpdate: Optional[str] = None
    blockers: Optional[str] = None
    coFounderAlignment: Optional[int] = None
    mentorsContacted: int = 0
    keyDecision: Optional[str] = None
    aiLearningHours: Optional[float] = None
    aiTopic: Optional[str] = None
    aiApplied: Optional[bool] = None
    aiInsight: Optional[str] = None


@app.get("/b2/milestones")
def get_milestones():
    rows = query("SELECT id, title, target_date, completed_at, notes FROM milestones ORDER BY target_date ASC")
    return [{"id": r[0], "title": r[1], "targetDate": r[2], "completedAt": r[3], "notes": r[4]} for r in rows]


@app.post("/b2/milestones")
def add_milestone(payload: MilestoneCreate):
    mid = new_id()
    query(
        "INSERT INTO milestones (id, title, target_date, notes, created_at) VALUES (%s,%s,%s,%s,%s)",
        (mid, payload.title, payload.targetDate, payload.notes, now_iso()), fetch="none",
    )
    return {"id": mid, **payload.model_dump()}


@app.get("/b2/logs")
def get_build_logs():
    rows = query(
        """SELECT id, date, text, mode, hours_logged, milestone_update, blockers,
                  co_founder_alignment, mentors_contacted, key_decision,
                  ai_learning_hours, ai_topic, ai_applied, ai_insight
           FROM build_logs ORDER BY date DESC LIMIT 30"""
    )
    return [
        {"id": r[0], "date": r[1], "text": r[2], "mode": r[3], "hoursLogged": r[4],
         "milestoneUpdate": r[5], "blockers": r[6], "coFounderAlignment": r[7],
         "mentorsContacted": r[8], "keyDecision": r[9], "aiLearningHours": r[10],
         "aiTopic": r[11], "aiApplied": r[12], "aiInsight": r[13]}
        for r in rows
    ]


@app.post("/b2/logs")
def add_build_log(payload: BuildLogCreate):
    lid = new_id()
    query(
        """INSERT INTO build_logs
           (id, date, text, mode, hours_logged, milestone_update, blockers,
            co_founder_alignment, mentors_contacted, key_decision,
            ai_learning_hours, ai_topic, ai_applied, ai_insight, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (lid, payload.date, payload.text, payload.mode, payload.hoursLogged,
         payload.milestoneUpdate, payload.blockers, payload.coFounderAlignment,
         payload.mentorsContacted, payload.keyDecision, payload.aiLearningHours,
         payload.aiTopic, payload.aiApplied, payload.aiInsight, now_iso()),
        fetch="none",
    )
    return {"id": lid, **payload.model_dump()}


@app.get("/b2/reports")
def get_build_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b2' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b2/reports/generate")
def generate_build_report():
    logs = query(
        """SELECT mode, hours_logged, mentors_contacted, co_founder_alignment,
                  key_decision, blockers, ai_learning_hours, ai_insight
           FROM build_logs ORDER BY date DESC LIMIT 7"""
    )
    milestone = query(
        "SELECT title FROM milestones WHERE completed_at IS NULL ORDER BY target_date ASC LIMIT 1", fetch="one"
    )
    mode_breakdown = {}
    for r in logs:
        if r[0]:
            mode_breakdown[r[0]] = mode_breakdown.get(r[0], 0) + 1

    prompt = f"""Generate the weekly Build (Magister + AI Learning) report for Philip.

THIS WEEK'S DATA:
- Build mode breakdown: {json.dumps(mode_breakdown)}
- Hours on Magister: {sum(r[1] or 0 for r in logs)}h
- Mentors contacted: {sum(r[2] or 0 for r in logs)}
- Co-founder alignment (latest): {next((r[3] for r in logs if r[3]), 'not logged')}/5
- Active milestone: {milestone[0] if milestone else 'none set'}
- Key decisions: {'; '.join(r[4] for r in logs if r[4]) or 'none logged'}
- Blockers: {'; '.join(r[5] for r in logs if r[5]) or 'none logged'}
- AI learning hours: {sum(r[6] or 0 for r in logs)}h
- AI insights: {'; '.join(r[7] for r in logs if r[7]) or 'none logged'}

ACQUISITION CONTEXT: Targeting Chess.com or Duolingo acquisition in 12-18 months.

Generate a report with these exact sections:
1. SHIPPED / MOVED FORWARD (what actually got done on Magister)
2. MILESTONE PROXIMITY (on track for acquisition timeline? be honest)
3. MENTOR PIPELINE (who was contacted, any responses or next steps)
4. AI LEARNING (one applied insight — only counts if it connects to something being built)
5. CO-FOUNDER PULSE (alignment score with context — flag low scores)
6. PATTERN ALERT (anything concerning)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b2", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── B3 — Fitness ─────────────────────────────────────────────────────────────

class FitnessLogCreate(BaseModel):
    date: str
    workoutType: str
    durationMinutes: Optional[int] = None
    energyPostWorkout: Optional[int] = None
    sleepQuality: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None


class TennisMatchCreate(BaseModel):
    date: str
    opponentName: str
    score: str
    result: str
    surface: str = "hard"
    matchType: str = "casual"
    skillFocus: Optional[str] = None
    notes: Optional[str] = None


@app.get("/b3/logs")
def get_fitness_logs():
    rows = query(
        """SELECT id, date, workout_type, duration_minutes, energy_post_workout,
                  sleep_quality, weight, notes
           FROM fitness_logs ORDER BY date DESC LIMIT 30"""
    )
    return [
        {"id": r[0], "date": r[1], "workoutType": r[2], "durationMinutes": r[3],
         "energyPostWorkout": r[4], "sleepQuality": r[5], "weight": r[6], "notes": r[7]}
        for r in rows
    ]


@app.post("/b3/logs")
def add_fitness_log(payload: FitnessLogCreate):
    lid = new_id()
    query(
        """INSERT INTO fitness_logs
           (id, date, workout_type, duration_minutes, energy_post_workout,
            sleep_quality, weight, notes, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (lid, payload.date, payload.workoutType, payload.durationMinutes,
         payload.energyPostWorkout, payload.sleepQuality, payload.weight,
         payload.notes, now_iso()),
        fetch="none",
    )
    return {"id": lid, **payload.model_dump()}


@app.get("/b3/tennis")
def get_tennis_matches():
    rows = query(
        """SELECT id, date, opponent_name, score, result, surface, match_type, skill_focus, notes
           FROM tennis_matches ORDER BY date DESC LIMIT 30"""
    )
    return [
        {"id": r[0], "date": r[1], "opponentName": r[2], "score": r[3], "result": r[4],
         "surface": r[5], "matchType": r[6], "skillFocus": r[7], "notes": r[8]}
        for r in rows
    ]


@app.post("/b3/tennis")
def add_tennis_match(payload: TennisMatchCreate):
    mid = new_id()
    query(
        """INSERT INTO tennis_matches
           (id, date, opponent_name, score, result, surface, match_type, skill_focus, notes, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (mid, payload.date, payload.opponentName, payload.score, payload.result,
         payload.surface, payload.matchType, payload.skillFocus, payload.notes, now_iso()),
        fetch="none",
    )
    return {"id": mid, **payload.model_dump()}


@app.get("/b3/reports")
def get_fitness_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b3' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b3/reports/generate")
def generate_fitness_report():
    logs = query(
        "SELECT workout_type, energy_post_workout, sleep_quality FROM fitness_logs ORDER BY date DESC LIMIT 7"
    )
    matches = query(
        "SELECT opponent_name, score, result FROM tennis_matches ORDER BY date DESC LIMIT 5"
    )
    type_breakdown = {}
    for r in logs:
        type_breakdown[r[0]] = type_breakdown.get(r[0], 0) + 1
    wins = sum(1 for r in matches if r[2] == "win")
    losses = sum(1 for r in matches if r[2] == "loss")
    avg_energy = round(sum(r[1] or 7 for r in logs) / max(len(logs), 1), 1)

    prompt = f"""Generate the weekly Fitness report for Philip.

THIS WEEK'S DATA:
- Workouts completed: {len(logs)}
- Workout types: {json.dumps(type_breakdown)}
- Average post-workout energy: {avg_energy}/10
- Tennis this week: {len(matches)} matches ({wins}W / {losses}L)
- Tennis match details: {'; '.join(f'vs {r[0]} {r[1]} ({r[2]})' for r in matches) or 'none'}

Generate a report with these exact sections:
1. CONSISTENCY (workouts vs. target, streak status)
2. TENNIS RECORD (W/L, opponent notes, skill observations)
3. ENERGY TREND (post-workout scores — what they signal)
4. FLAG (rest deficit, overtraining, or consistency gap — be direct)
5. ONE THING (single most important physical focus for next week)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b3", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── B4 — Reading ─────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    title: str
    author: str
    genre: str = "nonfiction"
    startedAt: str
    totalPages: Optional[int] = None


class ReadingLogCreate(BaseModel):
    date: str
    bookId: Optional[str] = None
    pagesRead: Optional[int] = None
    chaptersRead: Optional[str] = None
    keyTakeaway: Optional[str] = None
    quote: Optional[str] = None
    appliedTo: Optional[str] = None
    chessElo: Optional[int] = None
    chessMinutes: Optional[int] = None


@app.get("/b4/books")
def get_books():
    rows = query(
        "SELECT id, title, author, genre, started_at, completed_at, total_pages FROM books ORDER BY started_at DESC"
    )
    return [
        {"id": r[0], "title": r[1], "author": r[2], "genre": r[3],
         "startedAt": r[4], "completedAt": r[5], "totalPages": r[6]}
        for r in rows
    ]


@app.post("/b4/books")
def start_book(payload: BookCreate):
    bid = new_id()
    query(
        "INSERT INTO books (id, title, author, genre, started_at, total_pages, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (bid, payload.title, payload.author, payload.genre, payload.startedAt, payload.totalPages, now_iso()),
        fetch="none",
    )
    return {"id": bid, **payload.model_dump()}


@app.patch("/b4/books/{book_id}/complete")
def complete_book(book_id: str):
    query("UPDATE books SET completed_at=%s WHERE id=%s", (now_iso(), book_id), fetch="none")
    return {"ok": True}


@app.get("/b4/logs")
def get_reading_logs():
    rows = query(
        """SELECT id, date, book_id, pages_read, chapters_read, key_takeaway,
                  quote, applied_to, chess_elo, chess_minutes
           FROM reading_logs ORDER BY date DESC LIMIT 30"""
    )
    return [
        {"id": r[0], "date": r[1], "bookId": r[2], "pagesRead": r[3], "chaptersRead": r[4],
         "keyTakeaway": r[5], "quote": r[6], "appliedTo": r[7], "chessElo": r[8], "chessMinutes": r[9]}
        for r in rows
    ]


@app.post("/b4/logs")
def add_reading_log(payload: ReadingLogCreate):
    lid = new_id()
    query(
        """INSERT INTO reading_logs
           (id, date, book_id, pages_read, chapters_read, key_takeaway,
            quote, applied_to, chess_elo, chess_minutes, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (lid, payload.date, payload.bookId, payload.pagesRead, payload.chaptersRead,
         payload.keyTakeaway, payload.quote, payload.appliedTo,
         payload.chessElo, payload.chessMinutes, now_iso()),
        fetch="none",
    )
    return {"id": lid, **payload.model_dump()}


@app.get("/b4/reports")
def get_reading_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b4' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b4/reports/generate")
def generate_reading_report():
    logs = query(
        "SELECT pages_read, key_takeaway, applied_to FROM reading_logs ORDER BY date DESC LIMIT 7"
    )
    current_book = query(
        "SELECT title, author, genre FROM books WHERE completed_at IS NULL ORDER BY started_at DESC LIMIT 1",
        fetch="one",
    )
    month_str = datetime.utcnow().strftime("%Y-%m")
    books_this_month = query(
        "SELECT COUNT(*) FROM books WHERE completed_at LIKE %s", (f"{month_str}%",), fetch="one"
    )

    prompt = f"""Generate the weekly Reading (Mind) report for Philip.

THIS WEEK'S DATA:
- Total pages read: {sum(r[0] or 0 for r in logs)}
- Current book: {f'{current_book[0]} by {current_book[1]} ({current_book[2]})' if current_book else 'none logged'}
- Key takeaways: {'; '.join(r[1] for r in logs if r[1]) or 'none logged'}
- Applied to something: {'; '.join(r[2] for r in logs if r[2]) or 'none'}
- Books completed this month: {books_this_month[0] if books_this_month else 0}

Generate a report with these exact sections:
1. READING VOLUME (pages, progress through current book)
2. TAKEAWAY OF THE WEEK (the single most useful idea — be specific)
3. APPLICATION FLAG (did anything read directly connect to Magister, UGOA, or a current problem)
4. COMPLETION RATE (on track for monthly book goal)
5. PATTERN ALERT (is reading passive consumption or feeding the work — be honest)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b4", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── B5 — Social ──────────────────────────────────────────────────────────────

class SocialLogCreate(BaseModel):
    date: str
    applicationsSubmitted: int = 0
    responsesReceived: int = 0
    interviewsScheduled: int = 0
    connectionsForSearch: int = 0
    meaningfulConversations: int = 0
    followUpsSent: int = 0
    eventsAttended: int = 0
    momentumScore: Optional[int] = None
    videosPosted: int = 0
    views: int = 0
    followersGained: int = 0
    hoursCreating: Optional[float] = None
    notes: Optional[str] = None


class JobApplicationCreate(BaseModel):
    company: str
    role: str
    appliedAt: str
    notes: Optional[str] = None


@app.get("/b5/logs")
def get_social_logs():
    rows = query(
        """SELECT id, date, applications_submitted, responses_received, interviews_scheduled,
                  connections_for_search, meaningful_conversations, follow_ups_sent,
                  events_attended, momentum_score, videos_posted, views,
                  followers_gained, hours_creating, notes
           FROM social_logs ORDER BY date DESC LIMIT 30"""
    )
    return [
        {"id": r[0], "date": r[1], "applicationsSubmitted": r[2], "responsesReceived": r[3],
         "interviewsScheduled": r[4], "connectionsForSearch": r[5], "meaningfulConversations": r[6],
         "followUpsSent": r[7], "eventsAttended": r[8], "momentumScore": r[9],
         "videosPosted": r[10], "views": r[11], "followersGained": r[12],
         "hoursCreating": r[13], "notes": r[14]}
        for r in rows
    ]


@app.post("/b5/logs")
def add_social_log(payload: SocialLogCreate):
    lid = new_id()
    query(
        """INSERT INTO social_logs
           (id, date, applications_submitted, responses_received, interviews_scheduled,
            connections_for_search, meaningful_conversations, follow_ups_sent,
            events_attended, momentum_score, videos_posted, views,
            followers_gained, hours_creating, notes, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (lid, payload.date, payload.applicationsSubmitted, payload.responsesReceived,
         payload.interviewsScheduled, payload.connectionsForSearch,
         payload.meaningfulConversations, payload.followUpsSent, payload.eventsAttended,
         payload.momentumScore, payload.videosPosted, payload.views,
         payload.followersGained, payload.hoursCreating, payload.notes, now_iso()),
        fetch="none",
    )
    return {"id": lid, **payload.model_dump()}


@app.get("/b5/jobs")
def get_job_applications():
    rows = query(
        "SELECT id, company, role, applied_at, status, notes FROM job_applications ORDER BY applied_at DESC"
    )
    return [{"id": r[0], "company": r[1], "role": r[2], "appliedAt": r[3], "status": r[4], "notes": r[5]} for r in rows]


@app.post("/b5/jobs")
def add_job_application(payload: JobApplicationCreate):
    jid = new_id()
    query(
        "INSERT INTO job_applications (id, company, role, applied_at, status, notes, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (jid, payload.company, payload.role, payload.appliedAt, "applied", payload.notes, now_iso()),
        fetch="none",
    )
    return {"id": jid, "status": "applied", **payload.model_dump()}


@app.patch("/b5/jobs/{job_id}/status")
def update_job_status(job_id: str, status: str):
    query("UPDATE job_applications SET status=%s WHERE id=%s", (status, job_id), fetch="none")
    return {"ok": True}


@app.get("/b5/reports")
def get_social_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b5' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b5/reports/generate")
def generate_social_report():
    logs = query(
        """SELECT applications_submitted, responses_received, interviews_scheduled,
                  connections_for_search, meaningful_conversations, follow_ups_sent,
                  events_attended, momentum_score
           FROM social_logs ORDER BY date DESC LIMIT 7"""
    )
    prompt = f"""Generate the weekly Social / Career report for Philip.

THIS WEEK'S DATA:
- Job applications sent: {sum(r[0] or 0 for r in logs)}
- Responses received: {sum(r[1] or 0 for r in logs)}
- Interviews scheduled: {sum(r[2] or 0 for r in logs)}
- Connections for job search: {sum(r[3] or 0 for r in logs)}
- Meaningful conversations: {sum(r[4] or 0 for r in logs)}
- Follow-ups sent: {sum(r[5] or 0 for r in logs)}
- Events attended: {sum(r[6] or 0 for r in logs)}
- Momentum score: {next((r[7] for r in logs if r[7]), 'not rated')}/5
- TikTok: INACTIVE (activates in ~4 weeks)

Context: Job search is medium priority, just starting.

Generate a report with these exact sections:
1. JOB PIPELINE (apps, responses, interviews — is momentum building)
2. NETWORKING (meaningful interactions, follow-up rate)
3. TIKTOK STATUS (placeholder — note activation timeline)
4. FLAG (anything going stale or needing attention)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b5", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── B6 — Connections ─────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    name: str
    bucket: str = "serendipity"
    category: Optional[str] = None
    status: str = "new"
    whereMet: Optional[str] = None
    metAt: str
    notes: Optional[str] = None
    followUpTaken: Optional[str] = None


class InteractionCreate(BaseModel):
    type: str
    date: str
    note: Optional[str] = None


class ChainLink(BaseModel):
    fromId: str
    toId: str


@app.get("/b6/contacts")
def get_contacts():
    contacts = query(
        """SELECT id, name, bucket, category, status, where_met, met_at,
                  came_from_contact_id, led_to_contact_id, notes, follow_up_taken
           FROM contacts ORDER BY met_at DESC"""
    )
    result = []
    for c in contacts:
        interactions = query(
            "SELECT id, type, date, month_key, note FROM interactions WHERE contact_id=%s ORDER BY date DESC",
            (c[0],),
        )
        result.append({
            "id": c[0], "name": c[1], "bucket": c[2], "category": c[3], "status": c[4],
            "whereMet": c[5], "metAt": c[6], "cameFromContactId": c[7], "ledToContactId": c[8],
            "notes": c[9], "followUpTaken": c[10],
            "interactions": [
                {"id": i[0], "type": i[1], "date": i[2], "monthKey": i[3], "note": i[4]}
                for i in interactions
            ],
        })
    return result


@app.post("/b6/contacts")
def add_contact(payload: ContactCreate):
    cid = new_id()
    query(
        """INSERT INTO contacts
           (id, name, bucket, category, status, where_met, met_at, notes, follow_up_taken, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (cid, payload.name, payload.bucket, payload.category, payload.status,
         payload.whereMet, payload.metAt, payload.notes, payload.followUpTaken, now_iso()),
        fetch="none",
    )
    return {"id": cid, **payload.model_dump(), "interactions": []}


@app.post("/b6/contacts/{contact_id}/interactions")
def add_interaction(contact_id: str, payload: InteractionCreate):
    iid = new_id()
    month_key = payload.date[:7]
    query(
        "INSERT INTO interactions (id, contact_id, type, date, month_key, note, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (iid, contact_id, payload.type, payload.date, month_key, payload.note, now_iso()),
        fetch="none",
    )
    return {"id": iid, "contactId": contact_id, **payload.model_dump(), "monthKey": month_key}


@app.patch("/b6/contacts/{contact_id}/status")
def update_contact_status(contact_id: str, status: str):
    query("UPDATE contacts SET status=%s WHERE id=%s", (status, contact_id), fetch="none")
    return {"ok": True}


@app.post("/b6/contacts/link-chain")
def link_chain(payload: ChainLink):
    query("UPDATE contacts SET led_to_contact_id=%s WHERE id=%s", (payload.toId, payload.fromId), fetch="none")
    query("UPDATE contacts SET came_from_contact_id=%s WHERE id=%s", (payload.fromId, payload.toId), fetch="none")
    return {"ok": True}


@app.get("/b6/reports")
def get_connections_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b6' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b6/reports/generate")
def generate_connections_report():
    two_weeks_ago = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

    contacts = query("SELECT id, name, met_at, status FROM contacts")
    new_this_week = [c for c in contacts if c[2] >= week_ago]

    # Going cold: active contacts with no recent interaction
    going_cold = []
    for c in contacts:
        if c[3] == "dormant":
            continue
        last = query(
            "SELECT date FROM interactions WHERE contact_id=%s ORDER BY date DESC LIMIT 1",
            (c[0],), fetch="one"
        )
        if last and last[0] < two_weeks_ago:
            going_cold.append(c[1])

    active_chains = query(
        "SELECT COUNT(*) FROM contacts WHERE came_from_contact_id IS NOT NULL OR led_to_contact_id IS NOT NULL",
        fetch="one",
    )
    total = query("SELECT COUNT(*) FROM contacts", fetch="one")

    prompt = f"""Generate the weekly Connections & Serendipity report for Philip.

THIS WEEK'S DATA:
- New connections this week: {len(new_this_week)} ({', '.join(c[1] for c in new_this_week) or 'none'})
- Active chains: {active_chains[0] if active_chains else 0}
- Going cold (14+ days no contact): {', '.join(going_cold) or 'none'}
- Total contacts tracked: {total[0] if total else 0}

Generate a report with these exact sections:
1. NEW CONNECTIONS (who, where, initial notes)
2. ACTIVE CHAINS (who are you mid-conversation with — what's the chain so far)
3. GOING COLD (names + last contact date — action required)
4. CHAIN HIGHLIGHT (any serendipity connection that led somewhere notable this week)
5. INTERACTION FREQUENCY (who you talked to most this month — is that intentional)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b6", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── B7 — Idea Lab ────────────────────────────────────────────────────────────

class IdeaCreate(BaseModel):
    title: str
    description: str = ""
    capturedAt: str
    origin: str = "other"
    category: str = "other"
    stage: str = "spark"
    linkedContactId: Optional[str] = None
    linkedBookId: Optional[str] = None


class IdeaStageUpdate(BaseModel):
    stage: str


class IdeaKill(BaseModel):
    killQuality: str
    killReason: str


class IdeaPark(BaseModel):
    parkedUntil: str


class IdeaJournalAdd(BaseModel):
    text: str


@app.get("/b7/ideas")
def get_ideas():
    ideas = query(
        """SELECT id, title, description, captured_at, origin, category, stage,
                  linked_contact_id, linked_book_id, killed_at, kill_quality,
                  kill_reason, parked_until, executed_at
           FROM ideas ORDER BY captured_at DESC"""
    )
    result = []
    for idea in ideas:
        journal = query(
            "SELECT id, date, text FROM idea_journal_entries WHERE idea_id=%s ORDER BY date ASC",
            (idea[0],),
        )
        result.append({
            "id": idea[0], "title": idea[1], "description": idea[2], "capturedAt": idea[3],
            "origin": idea[4], "category": idea[5], "stage": idea[6],
            "linkedContactId": idea[7], "linkedBookId": idea[8], "killedAt": idea[9],
            "killQuality": idea[10], "killReason": idea[11], "parkedUntil": idea[12],
            "executedAt": idea[13],
            "journal": [{"id": j[0], "date": j[1], "text": j[2]} for j in journal],
        })
    return result


@app.post("/b7/ideas")
def add_idea(payload: IdeaCreate):
    iid = new_id()
    query(
        """INSERT INTO ideas
           (id, title, description, captured_at, origin, category, stage,
            linked_contact_id, linked_book_id, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (iid, payload.title, payload.description, payload.capturedAt, payload.origin,
         payload.category, payload.stage, payload.linkedContactId, payload.linkedBookId, now_iso()),
        fetch="none",
    )
    return {"id": iid, **payload.model_dump(), "journal": []}


@app.patch("/b7/ideas/{idea_id}/stage")
def advance_idea_stage(idea_id: str, payload: IdeaStageUpdate):
    executed_at = now_iso() if payload.stage == "executed" else None
    if executed_at:
        query("UPDATE ideas SET stage=%s, executed_at=%s WHERE id=%s", (payload.stage, executed_at, idea_id), fetch="none")
    else:
        query("UPDATE ideas SET stage=%s WHERE id=%s", (payload.stage, idea_id), fetch="none")
    return {"ok": True}


@app.post("/b7/ideas/{idea_id}/kill")
def kill_idea(idea_id: str, payload: IdeaKill):
    query(
        "UPDATE ideas SET stage='killed', killed_at=%s, kill_quality=%s, kill_reason=%s WHERE id=%s",
        (now_iso(), payload.killQuality, payload.killReason, idea_id), fetch="none",
    )
    return {"ok": True}


@app.post("/b7/ideas/{idea_id}/park")
def park_idea(idea_id: str, payload: IdeaPark):
    query(
        "UPDATE ideas SET stage='parked', parked_until=%s WHERE id=%s",
        (payload.parkedUntil, idea_id), fetch="none",
    )
    return {"ok": True}


@app.post("/b7/ideas/{idea_id}/journal")
def add_idea_journal_entry(idea_id: str, payload: IdeaJournalAdd):
    eid = new_id()
    query(
        "INSERT INTO idea_journal_entries (id, idea_id, date, text, created_at) VALUES (%s,%s,%s,%s,%s)",
        (eid, idea_id, today_iso(), payload.text, now_iso()), fetch="none",
    )
    return {"id": eid, "ideaId": idea_id, "date": today_iso(), "text": payload.text}


@app.get("/b7/reports")
def get_idealab_reports():
    rows = query(
        "SELECT id, bucket_id, week_of, generated_at, content FROM weekly_reports WHERE bucket_id='b7' ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "bucketId": r[1], "weekOf": r[2], "generatedAt": r[3], "content": r[4]} for r in rows]


@app.post("/b7/reports/generate")
def generate_idealab_report():
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    three_weeks_ago = (datetime.utcnow() - timedelta(days=21)).strftime("%Y-%m-%d")

    new_ideas = query(
        "SELECT title, origin FROM ideas WHERE captured_at >= %s", (week_ago,)
    )
    killed = query(
        "SELECT title, kill_quality FROM ideas WHERE killed_at >= %s", (week_ago,)
    )
    stalled = query(
        "SELECT title, captured_at FROM ideas WHERE stage IN ('spark','explored') AND captured_at <= %s AND killed_at IS NULL",
        (three_weeks_ago,)
    )
    stage_counts = query(
        "SELECT stage, COUNT(*) FROM ideas WHERE killed_at IS NULL GROUP BY stage"
    )
    total_live = query(
        "SELECT COUNT(*) FROM ideas WHERE killed_at IS NULL AND stage != 'executed'", fetch="one"
    )

    prompt = f"""Generate the weekly Idea Lab report for Philip.

THIS WEEK'S DATA:
- New ideas this week: {len(new_ideas)} ({', '.join(f'"{r[0]}" [{r[1]}]' for r in new_ideas) or 'none'})
- Killed this week: {', '.join(f'"{r[0]}" ({r[1]})' for r in killed) or 'none'}
- Pipeline: {json.dumps(dict(stage_counts))}
- Stalled at Spark/Explored for 3+ weeks: {', '.join(f'"{r[0]}" ({r[1]})' for r in stalled) or 'none'}
- Total live ideas: {total_live[0] if total_live else 0}

Generate a report with these exact sections:
1. IDEAS GENERATED (count, origins — what's sparking ideas this week)
2. PIPELINE MOVEMENT (what advanced, what stalled)
3. KILL OR COMMIT (force a decision on each stalled idea — be direct)
4. KILL LOG (what died this week — died well or died poorly, and why that distinction matters)
5. EXECUTION RATE TREND (honest read on whether ideas are moving to action)"""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO weekly_reports (id, bucket_id, week_of, generated_at, content) VALUES (%s,%s,%s,%s,%s)",
        (rid, "b7", today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── Cross-bucket synthesis ───────────────────────────────────────────────────

@app.get("/cross-bucket-reports")
def get_cross_bucket_reports():
    rows = query(
        "SELECT id, week_of, generated_at, content FROM cross_bucket_reports ORDER BY generated_at DESC"
    )
    return [{"id": r[0], "weekOf": r[1], "generatedAt": r[2], "content": r[3]} for r in rows]


@app.post("/cross-bucket-reports/generate")
def generate_cross_bucket_report():
    user = query("SELECT goal_weights FROM user_settings WHERE id='philip'", fetch="one")
    goal_weights = user[0] if user else {}

    month = query(
        "SELECT theme, priorities FROM month_plans ORDER BY created_at DESC LIMIT 1", fetch="one"
    )

    bucket_ids = ["b1", "b2", "b3", "b4", "b5", "b6", "b7"]
    summaries = []
    for bid in bucket_ids:
        latest = query(
            "SELECT content FROM weekly_reports WHERE bucket_id=%s ORDER BY generated_at DESC LIMIT 1",
            (bid,), fetch="one"
        )
        content = latest[0][:300] + "..." if latest else "No report generated yet"
        summaries.append(f"{bid.upper()}: {content}")

    prompt = f"""Generate the Cross-Bucket Weekly Synthesis Report for Philip.

GOAL WEIGHTS (% of life energy Philip intends to allocate):
{chr(10).join(f'{k}: {v}%' for k, v in goal_weights.items())}

BUCKET SUMMARIES THIS WEEK:
{chr(10).join(summaries)}

MONTH THEME: {month[0] if month else 'not set'}
MONTH PRIORITIES: {', '.join(p['title'] for p in (month[1] if month else [])) if month else 'not set'}

Generate the cross-bucket synthesis with these exact sections:

1. WEEK SNAPSHOT
One honest paragraph summarizing how the week went across all domains. Don't be gentle.

2. TIME ALLOCATION
Compare actual time/energy per bucket against stated goal weights. Name the gaps specifically.

3. CROSS-DOMAIN SIGNALS
Specific connections observed between buckets this week. Only report real signals.

4. PATTERN ALERTS
Anything concerning across the system. Name it directly.

5. NEXT WEEK'S TOP 3
Three cross-domain priorities for next week, ranked by impact on stated goals."""

    content = call_claude(prompt)
    rid = new_id()
    query(
        "INSERT INTO cross_bucket_reports (id, week_of, generated_at, content) VALUES (%s,%s,%s,%s)",
        (rid, today_iso(), now_iso(), content), fetch="none",
    )
    return {"id": rid, "content": content}


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
