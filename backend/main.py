from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import os
from datetime import datetime, timedelta
import hashlib
import secrets
import logging
import time
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import io
import sqlite3
from contextlib import contextmanager
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BarberCRM API", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= НАСТРОЙКИ ИЗ .env =============
REPORT_EMAIL_TO = os.getenv('REPORT_EMAIL_TO', '')
SMTP_HOST = os.getenv('SMTP_HOST', 'mail.example.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_USE_SSL = os.getenv('SMTP_USE_SSL', 'false').lower() == 'true'

ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD_HASH = hashlib.sha256(os.getenv('ADMIN_PASSWORD', 'admin').encode()).hexdigest()

DB_PATH = os.getenv('DB_PATH', '/app/data/barbercrm.db')

BRANCH_GOALS = {
    "morning_events": 16,
    "field_visits": 4,
    "one_on_one": 6,
    "weekly_reports": 4,
    "master_plans": 10,
    "reviews": 52,
    "new_employees": 10
}

# ============= DATABASE =============

def get_db_path():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    return DB_PATH

@contextmanager
def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Инициализация базы данных"""
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS branches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            address TEXT NOT NULL,
            manager_name TEXT NOT NULL,
            manager_phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS morning_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            date TEXT NOT NULL,
            week INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            participants INTEGER NOT NULL,
            efficiency INTEGER NOT NULL,
            comment TEXT DEFAULT '',
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS field_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            date TEXT NOT NULL,
            master_name TEXT NOT NULL,
            haircut_quality INTEGER NOT NULL,
            service_quality INTEGER NOT NULL,
            additional_services_comment TEXT DEFAULT '',
            additional_services_rating INTEGER NOT NULL,
            cosmetics_comment TEXT DEFAULT '',
            cosmetics_rating INTEGER NOT NULL,
            standards_comment TEXT DEFAULT '',
            standards_rating INTEGER NOT NULL,
            errors_comment TEXT DEFAULT '',
            next_check_date TEXT DEFAULT '',
            average_rating REAL NOT NULL,
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS one_on_one (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            date TEXT NOT NULL,
            master_name TEXT NOT NULL,
            goal TEXT NOT NULL,
            results TEXT NOT NULL,
            development_plan TEXT NOT NULL,
            indicator TEXT NOT NULL,
            next_meeting_date TEXT DEFAULT '',
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS weekly_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            period TEXT NOT NULL,
            average_check_plan REAL NOT NULL,
            average_check_fact REAL NOT NULL,
            cosmetics_plan REAL NOT NULL,
            cosmetics_fact REAL NOT NULL,
            additional_services_plan REAL NOT NULL,
            additional_services_fact REAL NOT NULL,
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS master_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            month TEXT NOT NULL,
            master_name TEXT NOT NULL,
            average_check_plan REAL NOT NULL,
            average_check_fact REAL NOT NULL,
            additional_services_plan INTEGER NOT NULL,
            additional_services_fact INTEGER NOT NULL,
            sales_plan REAL NOT NULL,
            sales_fact REAL NOT NULL,
            salary_plan REAL NOT NULL,
            salary_fact REAL NOT NULL,
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            week TEXT NOT NULL,
            manager_name TEXT NOT NULL,
            plan INTEGER NOT NULL DEFAULT 13,
            fact INTEGER NOT NULL,
            monthly_target INTEGER NOT NULL DEFAULT 52,
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS newbie_adaptation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            start_date TEXT NOT NULL,
            name TEXT NOT NULL,
            haircut_practice TEXT NOT NULL,
            service_standards TEXT NOT NULL,
            hygiene_sanitation TEXT NOT NULL,
            additional_services TEXT NOT NULL,
            cosmetics_sales TEXT NOT NULL,
            iclient_basics TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE TABLE IF NOT EXISTS branch_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_name TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            manager TEXT NOT NULL,
            month TEXT NOT NULL,
            metric TEXT NOT NULL,
            current_value INTEGER NOT NULL,
            goal_value INTEGER NOT NULL,
            percentage REAL NOT NULL,
            FOREIGN KEY (branch_name) REFERENCES branches(name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_morning_events_branch ON morning_events(branch_name);
        CREATE INDEX IF NOT EXISTS idx_field_visits_branch ON field_visits(branch_name);
        CREATE INDEX IF NOT EXISTS idx_one_on_one_branch ON one_on_one(branch_name);
        CREATE INDEX IF NOT EXISTS idx_weekly_metrics_branch ON weekly_metrics(branch_name);
        CREATE INDEX IF NOT EXISTS idx_master_plans_branch ON master_plans(branch_name);
        CREATE INDEX IF NOT EXISTS idx_reviews_branch ON reviews(branch_name);
        CREATE INDEX IF NOT EXISTS idx_newbie_adaptation_branch ON newbie_adaptation(branch_name);
        CREATE INDEX IF NOT EXISTS idx_branch_summaries_branch ON branch_summaries(branch_name);
        """)
    logger.info("✅ База данных инициализирована")

# ============= УТИЛИТЫ =============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def parse_date_flexible(date_str: str) -> Optional[datetime]:
    date_str = str(date_str).strip()
    if not date_str:
        return None
    date_part = date_str.split()[0]
    for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"]:
        try:
            return datetime.strptime(date_part, fmt)
        except ValueError:
            continue
    return None

def get_current_month_ru() -> str:
    months_ru = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    now = datetime.now()
    return f"{months_ru[now.month - 1]} {now.year}"

def date_to_month_ru(dt: datetime) -> str:
    months_ru = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return f"{months_ru[dt.month - 1]} {dt.year}"

def count_records_for_month(rows, date_field: str, month: str) -> int:
    count = 0
    for row in rows:
        val = row[date_field] if isinstance(row, dict) else row[date_field]
        dt = parse_date_flexible(str(val))
        if dt and date_to_month_ru(dt) == month:
            count += 1
    return count

def sum_reviews_for_month(rows, month: str) -> int:
    total = 0
    for row in rows:
        dt = parse_date_flexible(str(row['submitted_at']))
        if dt and date_to_month_ru(dt) == month:
            total += int(row['fact'] or 0)
    return total

# ============= МОДЕЛИ =============

class BranchRegister(BaseModel):
    name: str
    address: str
    manager_name: str
    manager_phone: str
    password: str

class LoginRequest(BaseModel):
    name: str
    password: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class MorningEvent(BaseModel):
    week: int = Field(..., ge=1, le=53)
    date: str
    event_type: str
    participants: int = Field(..., ge=0, le=100)
    efficiency: int = Field(..., ge=1, le=5)
    comment: Optional[str] = ""

class FieldVisit(BaseModel):
    date: str
    master_name: str
    haircut_quality: int = Field(..., ge=1, le=10)
    service_quality: int = Field(..., ge=1, le=10)
    additional_services_comment: str = ""
    additional_services_rating: int = Field(..., ge=1, le=10)
    cosmetics_comment: str = ""
    cosmetics_rating: int = Field(..., ge=1, le=10)
    standards_comment: str = ""
    standards_rating: int = Field(..., ge=1, le=10)
    errors_comment: str = ""
    next_check_date: Optional[str] = ""

class OneOnOneMeeting(BaseModel):
    date: str
    master_name: str
    goal: str
    results: str
    development_plan: str
    indicator: str
    next_meeting_date: Optional[str] = ""

class WeeklyMetrics(BaseModel):
    period: str
    average_check_plan: float = Field(..., ge=0)
    average_check_fact: float = Field(..., ge=0)
    cosmetics_plan: float = Field(..., ge=0)
    cosmetics_fact: float = Field(..., ge=0)
    additional_services_plan: float = Field(..., ge=0)
    additional_services_fact: float = Field(..., ge=0)

class NewbieAdaptation(BaseModel):
    start_date: str
    name: str
    haircut_practice: str
    service_standards: str
    hygiene_sanitation: str
    additional_services: str
    cosmetics_sales: str
    iclient_basics: str
    status: str

class MasterPlan(BaseModel):
    month: str
    master_name: str
    average_check_plan: float = Field(..., ge=0)
    average_check_fact: float = Field(..., ge=0)
    additional_services_plan: int = Field(..., ge=0)
    additional_services_fact: int = Field(..., ge=0)
    sales_plan: float = Field(..., ge=0)
    sales_fact: float = Field(..., ge=0)
    salary_plan: float = Field(..., ge=0)
    salary_fact: float = Field(..., ge=0)

class Reviews(BaseModel):
    week: str
    manager_name: str
    plan: int = Field(default=13, ge=0)
    fact: int = Field(..., ge=0)
    monthly_target: int = Field(default=52, ge=0)

class BranchSummary(BaseModel):
    manager: str
    month: str

class EmailReportRequest(BaseModel):
    period_type: str
    custom_date: Optional[str] = None

# ============= STARTUP =============

@app.on_event("startup")
def startup():
    init_db()
    logger.info("🚀 BarberCRM v5.0.0 запущен (SQLite)")

# ============= ЭНДПОИНТЫ =============

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "5.0.0", "storage": "SQLite"}

# ============= АВТОРИЗАЦИЯ =============

@app.post("/register")
def register_branch(branch: BranchRegister):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM branches WHERE name = ?", (branch.name,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Филиал с таким названием уже существует")
        
        token = generate_token()
        conn.execute(
            "INSERT INTO branches (name, address, manager_name, manager_phone, password_hash, token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (branch.name, branch.address, branch.manager_name, branch.manager_phone,
             hash_password(branch.password), token, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )
    
    return {"success": True, "message": "Филиал успешно зарегистрирован", "token": token, "branch_name": branch.name}

@app.post("/login")
def login(request: LoginRequest):
    with get_db() as conn:
        branch = conn.execute("SELECT * FROM branches WHERE name = ?", (request.name,)).fetchone()
        if not branch:
            raise HTTPException(status_code=401, detail="Неверное название филиала")
        if branch['password_hash'] != hash_password(request.password):
            raise HTTPException(status_code=401, detail="Неверный пароль")
        
        return {
            "success": True,
            "token": branch['token'],
            "branch": {"name": request.name, "manager": branch['manager_name']}
        }

@app.post("/admin/login")
def admin_login(request: AdminLoginRequest):
    if request.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Неверный логин")
    if hash_password(request.password) != ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=401, detail="Неверный пароль")
    
    admin_token = generate_token()
    return {
        "success": True,
        "token": admin_token,
        "role": "admin"
    }

@app.get("/branches")
def get_branches():
    with get_db() as conn:
        rows = conn.execute("SELECT name FROM branches ORDER BY name").fetchall()
        return {"success": True, "branches": [r['name'] for r in rows]}

@app.get("/branches/details")
def get_branches_details():
    """Для админки — список филиалов с деталями"""
    with get_db() as conn:
        rows = conn.execute("SELECT name, address, manager_name, manager_phone, created_at FROM branches ORDER BY name").fetchall()
        return {
            "success": True,
            "branches": [dict(r) for r in rows]
        }

# ============= ДАШБОРД =============

@app.get("/dashboard-summary/{branch_name}")
def get_dashboard_summary(branch_name: str):
    current_month = get_current_month_ru()
    
    with get_db() as conn:
        # Проверяем что филиал существует
        branch = conn.execute("SELECT id FROM branches WHERE name = ?", (branch_name,)).fetchone()
        if not branch:
            raise HTTPException(status_code=404, detail=f"Филиал '{branch_name}' не найден")
        
        me_rows = conn.execute("SELECT submitted_at FROM morning_events WHERE branch_name = ?", (branch_name,)).fetchall()
        fv_rows = conn.execute("SELECT submitted_at FROM field_visits WHERE branch_name = ?", (branch_name,)).fetchall()
        oo_rows = conn.execute("SELECT submitted_at FROM one_on_one WHERE branch_name = ?", (branch_name,)).fetchall()
        mp_rows = conn.execute("SELECT submitted_at FROM master_plans WHERE branch_name = ?", (branch_name,)).fetchall()
        wm_rows = conn.execute("SELECT submitted_at FROM weekly_metrics WHERE branch_name = ?", (branch_name,)).fetchall()
        rv_rows = conn.execute("SELECT submitted_at, fact FROM reviews WHERE branch_name = ?", (branch_name,)).fetchall()
        na_rows = conn.execute("SELECT submitted_at FROM newbie_adaptation WHERE branch_name = ?", (branch_name,)).fetchall()
    
    summary = {
        "morning_events": {"current": count_records_for_month(me_rows, 'submitted_at', current_month), "goal": BRANCH_GOALS["morning_events"], "percentage": 0, "label": "Утренние мероприятия"},
        "field_visits": {"current": count_records_for_month(fv_rows, 'submitted_at', current_month), "goal": BRANCH_GOALS["field_visits"], "percentage": 0, "label": "Полевые выходы"},
        "one_on_one": {"current": count_records_for_month(oo_rows, 'submitted_at', current_month), "goal": BRANCH_GOALS["one_on_one"], "percentage": 0, "label": "One-on-One"},
        "master_plans": {"current": count_records_for_month(mp_rows, 'submitted_at', current_month), "goal": BRANCH_GOALS["master_plans"], "percentage": 0, "label": "Планы мастеров"},
        "weekly_reports": {"current": count_records_for_month(wm_rows, 'submitted_at', current_month), "goal": BRANCH_GOALS["weekly_reports"], "percentage": 0, "label": "Еженедельные отчёты"},
        "reviews": {"current": sum_reviews_for_month(rv_rows, current_month), "goal": BRANCH_GOALS["reviews"], "percentage": 0, "label": "Отзывы"},
        "new_employees": {"current": count_records_for_month(na_rows, 'submitted_at', current_month), "goal": BRANCH_GOALS["new_employees"], "percentage": 0, "label": "Новые сотрудники"},
    }
    
    for key in summary:
        if summary[key]["goal"] > 0:
            summary[key]["percentage"] = round((summary[key]["current"] / summary[key]["goal"]) * 100, 1)
    
    return {"success": True, "summary": summary}

# ============= УТРЕННИЕ МЕРОПРИЯТИЯ =============

@app.post("/morning-events/{branch_name}")
def submit_morning_events(branch_name: str, events: List[MorningEvent]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for event in events:
            conn.execute(
                "INSERT INTO morning_events (branch_name, submitted_at, date, week, event_type, participants, efficiency, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, event.date, event.week, event.event_type, event.participants, event.efficiency, event.comment or "")
            )
    return {"success": True, "message": f"Добавлено {len(events)} мероприятий"}

@app.get("/morning-events/{branch_name}")
def get_morning_events(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', date as 'Дата', week as 'Неделя', event_type as 'Тип мероприятия', participants as 'Участники', efficiency as 'Эффективность', comment as 'Комментарий' FROM morning_events WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= ПОЛЕВЫЕ ВЫХОДЫ =============

@app.post("/field-visits/{branch_name}")
def submit_field_visits(branch_name: str, visits: List[FieldVisit]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for visit in visits:
            avg = round((visit.haircut_quality + visit.service_quality + visit.additional_services_rating + visit.cosmetics_rating + visit.standards_rating) / 5, 1)
            conn.execute(
                "INSERT INTO field_visits (branch_name, submitted_at, date, master_name, haircut_quality, service_quality, additional_services_comment, additional_services_rating, cosmetics_comment, cosmetics_rating, standards_comment, standards_rating, errors_comment, next_check_date, average_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, visit.date, visit.master_name, visit.haircut_quality, visit.service_quality,
                 visit.additional_services_comment, visit.additional_services_rating, visit.cosmetics_comment,
                 visit.cosmetics_rating, visit.standards_comment, visit.standards_rating, visit.errors_comment,
                 visit.next_check_date or "", avg)
            )
    return {"success": True, "message": f"Добавлено {len(visits)} посещений"}

@app.get("/field-visits/{branch_name}")
def get_field_visits(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', date as 'Дата', master_name as 'Имя мастера', haircut_quality as 'Качество стрижки', service_quality as 'Качество обслуживания', additional_services_comment as 'Доп. услуги (комм.)', additional_services_rating as 'Доп. услуги (оценка)', cosmetics_comment as 'Косметика (комм.)', cosmetics_rating as 'Косметика (оценка)', standards_comment as 'Стандарты (комм.)', standards_rating as 'Стандарты (оценка)', errors_comment as 'Ошибки', next_check_date as 'Дата след. проверки', average_rating as 'Общая оценка' FROM field_visits WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= ONE-ON-ONE =============

@app.post("/one-on-one/{branch_name}")
def submit_one_on_one(branch_name: str, meetings: List[OneOnOneMeeting]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for m in meetings:
            conn.execute(
                "INSERT INTO one_on_one (branch_name, submitted_at, date, master_name, goal, results, development_plan, indicator, next_meeting_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, m.date, m.master_name, m.goal, m.results, m.development_plan, m.indicator, m.next_meeting_date or "")
            )
    return {"success": True, "message": f"Добавлено {len(meetings)} встреч"}

@app.get("/one-on-one/{branch_name}")
def get_one_on_one(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', date as 'Дата', master_name as 'Имя мастера', goal as 'Цель', results as 'Результаты', development_plan as 'План развития', indicator as 'Показатель', next_meeting_date as 'Дата след. встречи' FROM one_on_one WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============

@app.post("/weekly-metrics/{branch_name}")
def submit_weekly_metrics(branch_name: str, metrics: List[WeeklyMetrics]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for m in metrics:
            conn.execute(
                "INSERT INTO weekly_metrics (branch_name, submitted_at, period, average_check_plan, average_check_fact, cosmetics_plan, cosmetics_fact, additional_services_plan, additional_services_fact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, m.period, m.average_check_plan, m.average_check_fact, m.cosmetics_plan, m.cosmetics_fact, m.additional_services_plan, m.additional_services_fact)
            )
    return {"success": True, "message": f"Добавлено {len(metrics)} показателей"}

@app.get("/weekly-metrics/{branch_name}")
def get_weekly_metrics(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', period as 'Период', average_check_plan as 'Средний чек (план)', average_check_fact as 'Средний чек (факт)', cosmetics_plan as 'Косметика (план)', cosmetics_fact as 'Косметика (факт)', additional_services_plan as 'Доп. услуги (план)', additional_services_fact as 'Доп. услуги (факт)' FROM weekly_metrics WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= АДАПТАЦИЯ НОВИЧКОВ =============

@app.post("/newbie-adaptation/{branch_name}")
def submit_newbie_adaptation(branch_name: str, newbies: List[NewbieAdaptation]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for n in newbies:
            conn.execute(
                "INSERT INTO newbie_adaptation (branch_name, submitted_at, start_date, name, haircut_practice, service_standards, hygiene_sanitation, additional_services, cosmetics_sales, iclient_basics, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, n.start_date, n.name, n.haircut_practice, n.service_standards, n.hygiene_sanitation, n.additional_services, n.cosmetics_sales, n.iclient_basics, n.status)
            )
    return {"success": True, "message": f"Добавлено {len(newbies)} записей"}

@app.get("/newbie-adaptation/{branch_name}")
def get_newbie_adaptation(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', start_date as 'Дата начала', name as 'Имя', haircut_practice as 'Практика стрижки', service_standards as 'Стандарты обслуживания', hygiene_sanitation as 'Гигиена/санитария', additional_services as 'Доп. услуги', cosmetics_sales as 'Продажи косметики', iclient_basics as 'Основы iClient', status as 'Статус' FROM newbie_adaptation WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= ПЛАНЫ МАСТЕРОВ =============

@app.post("/master-plans/{branch_name}")
def submit_master_plans(branch_name: str, plans: List[MasterPlan]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for p in plans:
            conn.execute(
                "INSERT INTO master_plans (branch_name, submitted_at, month, master_name, average_check_plan, average_check_fact, additional_services_plan, additional_services_fact, sales_plan, sales_fact, salary_plan, salary_fact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, p.month, p.master_name, p.average_check_plan, p.average_check_fact, p.additional_services_plan, p.additional_services_fact, p.sales_plan, p.sales_fact, p.salary_plan, p.salary_fact)
            )
    return {"success": True, "message": f"Добавлено {len(plans)} планов"}

@app.get("/master-plans/{branch_name}")
def get_master_plans(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', month as 'Месяц', master_name as 'Имя мастера', average_check_plan as 'Средний чек (план)', average_check_fact as 'Средний чек (факт)', additional_services_plan as 'Доп. услуги (план)', additional_services_fact as 'Доп. услуги (факт)', sales_plan as 'Продажи (план)', sales_fact as 'Продажи (факт)', salary_plan as 'ЗП (план)', salary_fact as 'ЗП (факт)' FROM master_plans WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= ОТЗЫВЫ =============

@app.post("/reviews/{branch_name}")
def submit_reviews(branch_name: str, reviews_list: List[Reviews]):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        for r in reviews_list:
            conn.execute(
                "INSERT INTO reviews (branch_name, submitted_at, week, manager_name, plan, fact, monthly_target) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, r.week, r.manager_name, r.plan, r.fact, r.monthly_target)
            )
    return {"success": True, "message": f"Добавлено {len(reviews_list)} отзывов"}

@app.get("/reviews/{branch_name}")
def get_reviews(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', week as 'Неделя', manager_name as 'Имя руководителя', plan as 'План', fact as 'Факт', monthly_target as 'Месячная цель' FROM reviews WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= ИТОГОВЫЙ ОТЧЁТ =============

@app.post("/branch-summary/{branch_name}")
def generate_branch_summary(branch_name: str, summary: BranchSummary):
    with get_db() as conn:
        # Удаляем старые записи за этот месяц
        conn.execute("DELETE FROM branch_summaries WHERE branch_name = ? AND month = ?", (branch_name, summary.month))
        
        me_rows = conn.execute("SELECT submitted_at FROM morning_events WHERE branch_name = ?", (branch_name,)).fetchall()
        fv_rows = conn.execute("SELECT submitted_at FROM field_visits WHERE branch_name = ?", (branch_name,)).fetchall()
        oo_rows = conn.execute("SELECT submitted_at FROM one_on_one WHERE branch_name = ?", (branch_name,)).fetchall()
        mp_rows = conn.execute("SELECT submitted_at FROM master_plans WHERE branch_name = ?", (branch_name,)).fetchall()
        wm_rows = conn.execute("SELECT submitted_at FROM weekly_metrics WHERE branch_name = ?", (branch_name,)).fetchall()
        rv_rows = conn.execute("SELECT submitted_at, fact FROM reviews WHERE branch_name = ?", (branch_name,)).fetchall()
        na_rows = conn.execute("SELECT submitted_at FROM newbie_adaptation WHERE branch_name = ?", (branch_name,)).fetchall()
        
        metrics = {
            "Утренние мероприятия": {"current": count_records_for_month(me_rows, 'submitted_at', summary.month), "goal": BRANCH_GOALS["morning_events"]},
            "Полевые выходы": {"current": count_records_for_month(fv_rows, 'submitted_at', summary.month), "goal": BRANCH_GOALS["field_visits"]},
            "One-on-One": {"current": count_records_for_month(oo_rows, 'submitted_at', summary.month), "goal": BRANCH_GOALS["one_on_one"]},
            "Планы мастеров": {"current": count_records_for_month(mp_rows, 'submitted_at', summary.month), "goal": BRANCH_GOALS["master_plans"]},
            "Еженедельные отчёты": {"current": count_records_for_month(wm_rows, 'submitted_at', summary.month), "goal": BRANCH_GOALS["weekly_reports"]},
            "Отзывы": {"current": sum_reviews_for_month(rv_rows, summary.month), "goal": BRANCH_GOALS["reviews"]},
            "Новые сотрудники": {"current": count_records_for_month(na_rows, 'submitted_at', summary.month), "goal": BRANCH_GOALS["new_employees"]},
        }
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for metric_name, data in metrics.items():
            pct = round((data["current"] / data["goal"]) * 100, 1) if data["goal"] > 0 else 0
            conn.execute(
                "INSERT INTO branch_summaries (branch_name, submitted_at, manager, month, metric, current_value, goal_value, percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (branch_name, timestamp, summary.manager, summary.month, metric_name, data["current"], data["goal"], pct)
            )
    
    return {"success": True, "message": "Отчёт успешно создан"}

@app.get("/branch-summary/{branch_name}")
def get_branch_summary(branch_name: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT submitted_at as 'Дата отправки', manager as 'Руководитель', month as 'Месяц', metric as 'Метрика', current_value as 'Текущее количество', goal_value as 'Цель на месяц', percentage as 'Выполнение %' FROM branch_summaries WHERE branch_name = ? ORDER BY id DESC",
            (branch_name,)
        ).fetchall()
    return {"success": True, "data": [dict(r) for r in rows]}

# ============= АДМИН: ПРОСМОТР ВСЕХ ДАННЫХ =============

@app.get("/admin/all-dashboards")
def admin_all_dashboards():
    """Сводка по всем филиалам для админа"""
    current_month = get_current_month_ru()
    result = []
    
    with get_db() as conn:
        branches = conn.execute("SELECT name, manager_name FROM branches ORDER BY name").fetchall()
        
        for branch in branches:
            bn = branch['name']
            me = count_records_for_month(conn.execute("SELECT submitted_at FROM morning_events WHERE branch_name = ?", (bn,)).fetchall(), 'submitted_at', current_month)
            fv = count_records_for_month(conn.execute("SELECT submitted_at FROM field_visits WHERE branch_name = ?", (bn,)).fetchall(), 'submitted_at', current_month)
            oo = count_records_for_month(conn.execute("SELECT submitted_at FROM one_on_one WHERE branch_name = ?", (bn,)).fetchall(), 'submitted_at', current_month)
            mp = count_records_for_month(conn.execute("SELECT submitted_at FROM master_plans WHERE branch_name = ?", (bn,)).fetchall(), 'submitted_at', current_month)
            wm = count_records_for_month(conn.execute("SELECT submitted_at FROM weekly_metrics WHERE branch_name = ?", (bn,)).fetchall(), 'submitted_at', current_month)
            rv = sum_reviews_for_month(conn.execute("SELECT submitted_at, fact FROM reviews WHERE branch_name = ?", (bn,)).fetchall(), current_month)
            na = count_records_for_month(conn.execute("SELECT submitted_at FROM newbie_adaptation WHERE branch_name = ?", (bn,)).fetchall(), 'submitted_at', current_month)
            
            result.append({
                "branch_name": bn,
                "manager": branch['manager_name'],
                "month": current_month,
                "morning_events": {"current": me, "goal": BRANCH_GOALS["morning_events"]},
                "field_visits": {"current": fv, "goal": BRANCH_GOALS["field_visits"]},
                "one_on_one": {"current": oo, "goal": BRANCH_GOALS["one_on_one"]},
                "master_plans": {"current": mp, "goal": BRANCH_GOALS["master_plans"]},
                "weekly_reports": {"current": wm, "goal": BRANCH_GOALS["weekly_reports"]},
                "reviews": {"current": rv, "goal": BRANCH_GOALS["reviews"]},
                "new_employees": {"current": na, "goal": BRANCH_GOALS["new_employees"]},
            })
    
    return {"success": True, "data": result, "month": current_month}

@app.get("/admin/branch-data/{branch_name}/{section}")
def admin_get_branch_data(branch_name: str, section: str):
    """Получить данные любой секции любого филиала (для админа)"""
    section_map = {
        "morning-events": "morning_events",
        "field-visits": "field_visits",
        "one-on-one": "one_on_one",
        "weekly-metrics": "weekly_metrics",
        "master-plans": "master_plans",
        "reviews": "reviews",
        "newbie-adaptation": "newbie_adaptation",
        "branch-summary": "branch_summaries",
    }
    
    endpoint_fn = {
        "morning-events": get_morning_events,
        "field-visits": get_field_visits,
        "one-on-one": get_one_on_one,
        "weekly-metrics": get_weekly_metrics,
        "master-plans": get_master_plans,
        "reviews": get_reviews,
        "newbie-adaptation": get_newbie_adaptation,
        "branch-summary": get_branch_summary,
    }
    
    if section not in endpoint_fn:
        raise HTTPException(status_code=400, detail=f"Неизвестная секция: {section}")
    
    return endpoint_fn[section](branch_name)

# ============= EMAIL =============

def get_period_filter_dates(period_type: str, custom_date: Optional[str] = None):
    now = datetime.now()
    if period_type == "day":
        target = datetime.strptime(custom_date, "%Y-%m-%d") if custom_date else now
        start = target.replace(hour=0, minute=0, second=0, microsecond=0)
        end = target.replace(hour=23, minute=59, second=59, microsecond=0)
        label = target.strftime("%d.%m.%Y")
    elif period_type == "week":
        weekday = now.weekday()
        start = (now - timedelta(days=weekday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = (start + timedelta(days=6)).replace(hour=23, minute=59, second=59, microsecond=0)
        label = f"{start.strftime('%d.%m.%Y')} - {end.strftime('%d.%m.%Y')}"
    elif period_type == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end = now.replace(year=now.year + 1, month=1, day=1) - timedelta(seconds=1)
        else:
            end = now.replace(month=now.month + 1, day=1) - timedelta(seconds=1)
        months_ru = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                     'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        label = f"{months_ru[now.month - 1]} {now.year}"
    else:
        start = datetime(2020, 1, 1)
        end = datetime(2099, 12, 31)
        label = "Весь период"
    return start, end, label

def filter_rows_by_period(rows, start, end):
    filtered = []
    for row in rows:
        d = dict(row)
        date_str = d.get('Дата отправки', '') or d.get('submitted_at', '')
        dt = parse_date_flexible(str(date_str))
        if dt and start.date() <= dt.date() <= end.date():
            filtered.append(d)
    return filtered

def build_multi_sheet_xlsx(sheets_data: Dict[str, List[Dict]]) -> bytes:
    wb = Workbook()
    wb.remove(wb.active)
    
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="2E86AB", end_color="2E86AB", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(left=Side(style="thin"), right=Side(style="thin"), top=Side(style="thin"), bottom=Side(style="thin"))
    
    for sheet_name, records in sheets_data.items():
        if not records:
            continue
        ws = wb.create_sheet(title=sheet_name[:31])
        headers = list(records[0].keys())
        
        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border
        
        for row_idx, record in enumerate(records, 2):
            for col_idx, header in enumerate(headers, 1):
                value = record.get(header, "")
                if isinstance(value, str):
                    try:
                        value = float(value) if '.' in value else int(value)
                    except (ValueError, TypeError):
                        pass
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.border = thin_border
        
        for col_idx, header in enumerate(headers, 1):
            max_length = len(str(header))
            for row_idx in range(2, len(records) + 2):
                cv = ws.cell(row=row_idx, column=col_idx).value
                if cv:
                    max_length = max(max_length, len(str(cv)))
            ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = min(max_length + 3, 50)
        ws.freeze_panes = "A2"
    
    if not wb.sheetnames:
        return b""
    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()

def send_email_with_attachments(to_email: str, subject: str, body_html: str, attachments: List[Dict]):
    if not SMTP_USER or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="SMTP не настроен")
    if not to_email:
        raise HTTPException(status_code=500, detail="REPORT_EMAIL_TO не настроен")
    
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body_html, 'html', 'utf-8'))
    
    for att in attachments:
        if att["content"]:
            part = MIMEBase('application', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            part.set_payload(att["content"])
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{att["filename"]}"')
            msg.attach(part)
    
    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        logger.info(f"✅ Email отправлен на {to_email}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки email: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка отправки email: {str(e)}")

@app.post("/send-report/{branch_name}")
def send_report_email(branch_name: str, request: EmailReportRequest):
    start, end, period_label = get_period_filter_dates(request.period_type, request.custom_date)
    
    sections = {
        "Утренние мероприятия": get_morning_events,
        "Полевые выходы": get_field_visits,
        "One-on-One": get_one_on_one,
        "Планы мастеров": get_master_plans,
        "Еженедельные показатели": get_weekly_metrics,
        "Отзывы": get_reviews,
        "Адаптация новичков": get_newbie_adaptation,
        "Итоговые отчеты": get_branch_summary,
    }
    
    sheets_data = {}
    total_records = 0
    
    for name, fn in sections.items():
        result = fn(branch_name)
        records = result.get("data", [])
        if request.period_type != "all":
            records = filter_rows_by_period(records, start, end)
        if records:
            sheets_data[name] = records
            total_records += len(records)
    
    if total_records == 0:
        return {"success": False, "message": f"Нет данных за период: {period_label}"}
    
    xlsx_content = build_multi_sheet_xlsx(sheets_data)
    safe_branch = branch_name.replace(" ", "_").replace("/", "_")
    safe_period = period_label.replace(" ", "_").replace("/", "_").replace(".", "_")
    filename = f"Отчёт_{safe_branch}_{safe_period}.xlsx"
    
    subject = f"Отчёт {branch_name} — {period_label}"
    body_html = f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Отчёт по филиалу: {branch_name}</h2>
        <p><strong>Период:</strong> {period_label}</p>
        <p><strong>Дата формирования:</strong> {datetime.now().strftime('%d.%m.%Y %H:%M')}</p>
        <hr>
        <p>Во вложении Excel-файл с {len(sheets_data)} вкладками ({total_records} записей).</p>
        <hr>
        <p style="color: #888; font-size: 12px;">BarberCRM v5.0</p>
    </body></html>
    """
    
    send_email_with_attachments(REPORT_EMAIL_TO, subject, body_html, [{"filename": filename, "content": xlsx_content}])
    
    return {"success": True, "message": f"Отчёт отправлен на {REPORT_EMAIL_TO}", "period": period_label, "sheets_count": len(sheets_data), "total_records": total_records}

@app.get("/email-config")
def get_email_config():
    return {
        "configured": bool(SMTP_USER and SMTP_PASSWORD and REPORT_EMAIL_TO),
        "smtp_host": SMTP_HOST,
        "smtp_user": SMTP_USER[:3] + "***" if SMTP_USER else "",
        "report_email": REPORT_EMAIL_TO[:3] + "***" if REPORT_EMAIL_TO else ""
    }
