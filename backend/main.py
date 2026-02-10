from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any
import gspread
from google.oauth2.service_account import Credentials
import json
import os
from datetime import datetime
import hashlib
import secrets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BarberCRM API", version="3.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

def get_service_account_info():
    try:
        json_str = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '{}')
        if json_str == '{}':
            logger.error("GOOGLE_SERVICE_ACCOUNT_JSON не установлен")
            return None
        info = json.loads(json_str)
        if 'private_key' in info:
            info['private_key'] = info['private_key'].replace('\\n', '\n')
        return info
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга: {e}")
        return None

SERVICE_ACCOUNT_INFO = get_service_account_info()
SPREADSHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_sheets_client():
    try:
        if not SERVICE_ACCOUNT_INFO or not SPREADSHEET_ID:
            raise HTTPException(status_code=500, detail="Google Sheets не настроен")
        creds = Credentials.from_service_account_info(SERVICE_ACCOUNT_INFO, scopes=SCOPES)
        return gspread.authorize(creds)
    except Exception as e:
        logger.error(f"Ошибка авторизации: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    additional_services_comment: str
    additional_services_rating: int = Field(..., ge=1, le=10)
    cosmetics_comment: str
    cosmetics_rating: int = Field(..., ge=1, le=10)
    standards_comment: str
    standards_rating: int = Field(..., ge=1, le=10)
    errors_comment: str
    next_check_date: Optional[str] = None

class OneOnOneMeeting(BaseModel):
    date: str
    master_name: str
    goal: str
    results: str
    development_plan: str
    indicator: str
    next_meeting_date: Optional[str] = None

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
    plan: int = Field(..., ge=0)
    fact: int = Field(..., ge=0)
    monthly_target: int = Field(..., ge=0)

class BranchSummary(BaseModel):
    manager: str
    month: str
    morning_events_goal: int = Field(..., ge=0)
    field_visits_goal: int = Field(..., ge=0)
    one_on_one_goal: int = Field(..., ge=0)
    weekly_reports_goal: int = Field(..., ge=0)
    master_plans_goal: int = Field(..., ge=0)
    reviews_goal: int = Field(..., ge=0)
    new_employees_goal: int = Field(..., ge=0)

# ============= УТИЛИТЫ =============

def ensure_sheet_exists(client, spreadsheet_id: str, sheet_name: str, headers: List[str]):
    try:
        spreadsheet = client.open_by_key(spreadsheet_id)
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            logger.info(f"Создание листа: {sheet_name}")
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=20)
            worksheet.append_row(headers)
            return worksheet
        
        if not worksheet.row_values(1):
            worksheet.append_row(headers)
        return worksheet
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def insert_row_at_top(worksheet, data: List[Any]):
    """ИСПРАВЛЕНО: Конвертируем все значения в строки/числа"""
    try:
        # Конвертируем данные в правильный формат
        converted_data = []
        for item in data:
            if item is None:
                converted_data.append("")
            elif isinstance(item, (int, float)):
                converted_data.append(item)
            else:
                converted_data.append(str(item))
        
        worksheet.insert_row(converted_data, index=2)
        logger.info(f"Данные добавлены: {converted_data}")
    except Exception as e:
        logger.error(f"Ошибка вставки: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка записи: {str(e)}")

def get_branch_by_name(client, name: str) -> Optional[Dict]:
    try:
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet("Филиалы")
        records = worksheet.get_all_records()
        for record in records:
            if record.get('Название') == name:
                return record
        return None
    except:
        return None

# ============= API =============

@app.get("/")
def read_root():
    return {"message": "Barber CRM API v3.0.1", "status": "online"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/register")
def register_branch(branch: BranchRegister):
    client = get_sheets_client()
    if get_branch_by_name(client, branch.name):
        raise HTTPException(status_code=400, detail="Филиал существует")
    headers = ["Дата регистрации", "Название", "Адрес", "Управляющий", "Телефон", "Пароль (хеш)", "Токен", "Статус"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, "Филиалы", headers)
    token = generate_token()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    row = [timestamp, branch.name, branch.address, branch.manager_name, branch.manager_phone, hash_password(branch.password), token, "Активен"]
    insert_row_at_top(worksheet, row)
    return {"success": True, "token": token, "branch": {"name": branch.name}}

@app.post("/login")
def login(request: LoginRequest):
    client = get_sheets_client()
    branch = get_branch_by_name(client, request.name)
    if not branch:
        raise HTTPException(status_code=401, detail="Филиал не найден")
    if branch.get('Пароль (хеш)') != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Неверный пароль")
    return {"success": True, "token": branch.get('Токен'), "branch": {"name": branch.get('Название'), "address": branch.get('Адрес'), "manager": branch.get('Управляющий')}}

# ============= УТРЕННИЕ МЕРОПРИЯТИЯ =============

@app.post("/morning-events/{branch_name}")
def submit_morning_events(branch_name: str, events: List[MorningEvent]):
    client = get_sheets_client()
    sheet_name = f"Утренние мероприятия - {branch_name}"
    headers = ["Дата отправки", "Неделя", "Дата", "Тип мероприятия", "Участники", "Эффективность", "Комментарий"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for event in events:
        row = [
            timestamp,
            int(event.week),
            str(event.date),
            str(event.event_type),
            int(event.participants),
            int(event.efficiency),
            str(event.comment) if event.comment else ""
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(events)} записей"}

@app.get("/morning-events/{branch_name}")
def get_morning_events(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Утренние мероприятия - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ПОЛЕВЫЕ ВЫХОДЫ =============

@app.post("/field-visits/{branch_name}")
def submit_field_visits(branch_name: str, visits: List[FieldVisit]):
    client = get_sheets_client()
    sheet_name = f"Полевые выходы - {branch_name}"
    headers = ["Дата отправки", "Дата", "Имя мастера", "Качество стрижек", "Качество сервиса", "Доп. услуги (комментарий)", "Доп. услуги (оценка)", "Косметика (комментарий)", "Косметика (оценка)", "Стандарты (комментарий)", "Стандарты (оценка)", "Выявление ошибок", "Общая оценка", "Дата следующей проверки"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for visit in visits:
        total_score = round((visit.haircut_quality + visit.service_quality + visit.additional_services_rating + visit.cosmetics_rating + visit.standards_rating) / 5, 1)
        row = [
            timestamp,
            str(visit.date),
            str(visit.master_name),
            int(visit.haircut_quality),
            int(visit.service_quality),
            str(visit.additional_services_comment),
            int(visit.additional_services_rating),
            str(visit.cosmetics_comment),
            int(visit.cosmetics_rating),
            str(visit.standards_comment),
            int(visit.standards_rating),
            str(visit.errors_comment),
            float(total_score),
            str(visit.next_check_date) if visit.next_check_date else ""
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(visits)} проверок"}

@app.get("/field-visits/{branch_name}")
def get_field_visits(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Полевые выходы - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ONE-ON-ONE =============

@app.post("/one-on-one/{branch_name}")
def submit_one_on_one(branch_name: str, meetings: List[OneOnOneMeeting]):
    client = get_sheets_client()
    sheet_name = f"One-on-One - {branch_name}"
    headers = ["Дата отправки", "Дата встречи", "Имя мастера", "Цель встречи", "Результаты", "План развития", "Показатель", "Дата следующей встречи"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for meeting in meetings:
        row = [
            timestamp,
            str(meeting.date),
            str(meeting.master_name),
            str(meeting.goal),
            str(meeting.results),
            str(meeting.development_plan),
            str(meeting.indicator),
            str(meeting.next_meeting_date) if meeting.next_meeting_date else ""
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(meetings)} встреч"}

@app.get("/one-on-one/{branch_name}")
def get_one_on_one(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"One-on-One - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============

@app.post("/weekly-metrics/{branch_name}")
def submit_weekly_metrics(branch_name: str, metrics: WeeklyMetrics):
    client = get_sheets_client()
    sheet_name = f"Еженедельные показатели - {branch_name}"
    headers = ["Дата отправки", "Период", "Средний чек (план)", "Средний чек (факт)", "Косметика (план)", "Косметика (факт)", "Доп. услуги (план)", "Доп. услуги (факт)", "Выполнение среднего чека %", "Выполнение косметики %", "Выполнение доп. услуг %"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    avg_perf = round((metrics.average_check_fact / metrics.average_check_plan * 100), 1) if metrics.average_check_plan > 0 else 0
    cosm_perf = round((metrics.cosmetics_fact / metrics.cosmetics_plan * 100), 1) if metrics.cosmetics_plan > 0 else 0
    add_perf = round((metrics.additional_services_fact / metrics.additional_services_plan * 100), 1) if metrics.additional_services_plan > 0 else 0
    
    row = [
        timestamp,
        str(metrics.period),
        float(metrics.average_check_plan),
        float(metrics.average_check_fact),
        float(metrics.cosmetics_plan),
        float(metrics.cosmetics_fact),
        float(metrics.additional_services_plan),
        float(metrics.additional_services_fact),
        float(avg_perf),
        float(cosm_perf),
        float(add_perf)
    ]
    insert_row_at_top(worksheet, row)
    return {"success": True}

@app.get("/weekly-metrics/{branch_name}")
def get_weekly_metrics(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Еженедельные показатели - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= АДАПТАЦИЯ НОВИЧКОВ =============

@app.post("/newbie-adaptation/{branch_name}")
def submit_newbie_adaptation(branch_name: str, adaptations: List[NewbieAdaptation]):
    client = get_sheets_client()
    sheet_name = f"Адаптация новичков - {branch_name}"
    headers = ["Дата отправки", "Дата начала", "Имя новичка", "Практика стрижек", "Стандарты сервиса", "Гигиена и санитария", "Доп. услуги", "Продажа косметики", "Основы iClient", "Статус адаптации"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for adaptation in adaptations:
        row = [
            timestamp,
            str(adaptation.start_date),
            str(adaptation.name),
            str(adaptation.haircut_practice),
            str(adaptation.service_standards),
            str(adaptation.hygiene_sanitation),
            str(adaptation.additional_services),
            str(adaptation.cosmetics_sales),
            str(adaptation.iclient_basics),
            str(adaptation.status)
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(adaptations)} записей"}

@app.get("/newbie-adaptation/{branch_name}")
def get_newbie_adaptation(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Адаптация новичков - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ПЛАНЫ МАСТЕРОВ =============

@app.post("/master-plans/{branch_name}")
def submit_master_plans(branch_name: str, plans: List[MasterPlan]):
    client = get_sheets_client()
    sheet_name = f"Планы мастеров - {branch_name}"
    headers = ["Дата отправки", "Месяц", "Имя мастера", "Средний чек (план)", "Средний чек (факт)", "Доп. услуги кол-во (план)", "Доп. услуги кол-во (факт)", "Объем продаж (план)", "Объем продаж (факт)", "Зарплата (план)", "Зарплата (факт)", "Выполнение среднего чека %", "Выполнение доп. услуг %", "Выполнение продаж %", "Выполнение зарплаты %"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for plan in plans:
        avg_perf = round((plan.average_check_fact / plan.average_check_plan * 100), 1) if plan.average_check_plan > 0 else 0
        serv_perf = round((plan.additional_services_fact / plan.additional_services_plan * 100), 1) if plan.additional_services_plan > 0 else 0
        sales_perf = round((plan.sales_fact / plan.sales_plan * 100), 1) if plan.sales_plan > 0 else 0
        sal_perf = round((plan.salary_fact / plan.salary_plan * 100), 1) if plan.salary_plan > 0 else 0
        
        row = [
            timestamp,
            str(plan.month),
            str(plan.master_name),
            float(plan.average_check_plan),
            float(plan.average_check_fact),
            int(plan.additional_services_plan),
            int(plan.additional_services_fact),
            float(plan.sales_plan),
            float(plan.sales_fact),
            float(plan.salary_plan),
            float(plan.salary_fact),
            float(avg_perf),
            float(serv_perf),
            float(sales_perf),
            float(sal_perf)
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(plans)} планов"}

@app.get("/master-plans/{branch_name}")
def get_master_plans(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Планы мастеров - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ОТЗЫВЫ =============

@app.post("/reviews/{branch_name}")
def submit_reviews(branch_name: str, review: Reviews):
    client = get_sheets_client()
    sheet_name = f"Отзывы - {branch_name}"
    headers = ["Дата отправки", "Неделя", "Имя управляющего", "План отзывов", "Факт отзывов", "Целевой показатель за месяц", "Выполнение недели %"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    week_perf = round((review.fact / review.plan * 100), 1) if review.plan > 0 else 0
    
    row = [
        timestamp,
        str(review.week),
        str(review.manager_name),
        int(review.plan),
        int(review.fact),
        int(review.monthly_target),
        float(week_perf)
    ]
    insert_row_at_top(worksheet, row)
    return {"success": True}

@app.get("/reviews/{branch_name}")
def get_reviews(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Отзывы - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= СВОДКА =============

@app.post("/branch-summary/{branch_name}")
def submit_branch_summary(branch_name: str, summary: BranchSummary):
    client = get_sheets_client()
    sheet_name = f"Сводка - {branch_name}"
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    
    def count_records(sname: str, month: str) -> int:
        try:
            ws = spreadsheet.worksheet(sname)
            records = ws.get_all_records()
            return len([r for r in records if month.lower() in str(r).lower()])
        except:
            return 0
    
    headers = ["Дата отправки", "Филиал", "Управляющий", "Месяц", "Метрика", "Текущее количество", "Цель на месяц", "Выполнение %"]
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    metrics = [
        ("Утренние мероприятия", count_records(f"Утренние мероприятия - {branch_name}", summary.month), summary.morning_events_goal),
        ("Полевые выходы", count_records(f"Полевые выходы - {branch_name}", summary.month), summary.field_visits_goal),
        ("One-on-One встречи", count_records(f"One-on-One - {branch_name}", summary.month), summary.one_on_one_goal),
        ("Еженедельные отчёты", count_records(f"Еженедельные показатели - {branch_name}", summary.month), summary.weekly_reports_goal),
        ("Индивидуальные планы", count_records(f"Планы мастеров - {branch_name}", summary.month), summary.master_plans_goal),
        ("Отзывы", count_records(f"Отзывы - {branch_name}", summary.month), summary.reviews_goal),
        ("Новые сотрудники", count_records(f"Адаптация новичков - {branch_name}", summary.month), summary.new_employees_goal),
    ]
    
    for metric_name, current, goal in metrics:
        performance = round((current / goal * 100), 1) if goal > 0 else 0
        row = [
            timestamp,
            str(branch_name),
            str(summary.manager),
            str(summary.month),
            str(metric_name),
            int(current),
            int(goal),
            float(performance)
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True}

@app.get("/branch-summary/{branch_name}")
def get_branch_summary(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(f"Сводка - {branch_name}")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
