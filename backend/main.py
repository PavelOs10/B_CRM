from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import gspread
from google.oauth2.service_account import Credentials
import json
import os
from datetime import datetime

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Sheets credentials
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SERVICE_ACCOUNT_INFO = json.loads(os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '{}'))
SPREADSHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')

def get_sheets_client():
    creds = Credentials.from_service_account_info(SERVICE_ACCOUNT_INFO, scopes=SCOPES)
    return gspread.authorize(creds)

# Филиалы
BRANCHES = [
    "Станкевича",
    "Центральный",
    "Восточный",
    "Западный"
]

# ============= МОДЕЛИ ДАННЫХ =============

class LoginRequest(BaseModel):
    branch: str

class MorningEvent(BaseModel):
    date: str
    event_type: str
    participants: int
    efficiency: int
    comment: str
    branch: str

class FieldVisit(BaseModel):
    date: str
    master_name: str
    haircut_quality: int
    service_quality: int
    additional_services_comment: str
    additional_services_rating: int
    cosmetics_comment: str
    cosmetics_rating: int
    standards_comment: str
    standards_rating: int
    errors_comment: str
    next_check_date: Optional[str] = None
    branch: str

class OneOnOneMeeting(BaseModel):
    date: str
    master_name: str
    goal: str
    results: str
    development_plan: str
    indicator: str
    next_meeting_date: Optional[str] = None
    branch: str

class WeeklyMetrics(BaseModel):
    period: str  # "1-я неделя", "2-я неделя" и т.д.
    average_check_plan: float
    average_check_fact: float
    cosmetics_plan: float
    cosmetics_fact: float
    additional_services_plan: float
    additional_services_fact: float
    branch: str

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
    branch: str

class MasterPlan(BaseModel):
    month: str
    master_name: str
    average_check_plan: float
    average_check_fact: float
    additional_services_plan: int
    additional_services_fact: int
    sales_plan: float
    sales_fact: float
    salary_plan: float
    salary_fact: float
    branch: str

class Reviews(BaseModel):
    week: str  # "1-я неделя"
    manager_name: str
    plan: int
    fact: int
    monthly_target: int
    branch: str

class BranchSummary(BaseModel):
    branch: str
    manager: str
    month: str
    morning_events_goal: int
    field_visits_goal: int
    one_on_one_goal: int
    weekly_reports_goal: int
    master_plans_goal: int
    reviews_goal: int
    new_employees_goal: int

# ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

def ensure_sheet_exists(client, spreadsheet_id: str, sheet_name: str, headers: List[str]):
    """Создает лист если его нет и добавляет заголовки"""
    try:
        spreadsheet = client.open_by_key(spreadsheet_id)
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=20)
            worksheet.append_row(headers)
        
        # Проверяем наличие заголовков
        if not worksheet.row_values(1):
            worksheet.append_row(headers)
        
        return worksheet
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка работы с Google Sheets: {str(e)}")

def insert_row_at_top(worksheet, data: List[Any]):
    """Вставляет данные во вторую строку (после заголовков), сдвигая остальные вниз"""
    worksheet.insert_row(data, index=2)

# ============= API ENDPOINTS =============

@app.get("/")
def read_root():
    return {"message": "Barber CRM API"}

@app.get("/branches")
def get_branches():
    return {"branches": BRANCHES}

@app.post("/login")
def login(request: LoginRequest):
    if request.branch not in BRANCHES:
        raise HTTPException(status_code=400, detail="Неверный филиал")
    return {"success": True, "branch": request.branch}

# ============= УТРЕННИЕ МЕРОПРИЯТИЯ =============

@app.post("/morning-events")
def submit_morning_events(events: List[MorningEvent]):
    client = get_sheets_client()
    sheet_name = f"Утренние мероприятия - {events[0].branch}"
    headers = ["Дата отправки", "Дата", "Тип мероприятия", "Участники", "Эффективность", "Комментарий", "Филиал"]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for event in events:
        row = [
            timestamp,
            event.date,
            event.event_type,
            event.participants,
            event.efficiency,
            event.comment,
            event.branch
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(events)} записей"}

@app.get("/morning-events/{branch}")
def get_morning_events(branch: str):
    client = get_sheets_client()
    sheet_name = f"Утренние мероприятия - {branch}"
    
    try:
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(sheet_name)
        records = worksheet.get_all_records()
        return {"data": records}
    except:
        return {"data": []}

# ============= ПОЛЕВЫЕ ВЫХОДЫ =============

@app.post("/field-visits")
def submit_field_visits(visits: List[FieldVisit]):
    client = get_sheets_client()
    sheet_name = f"Полевые выходы - {visits[0].branch}"
    headers = [
        "Дата отправки", "Дата", "Имя мастера", "Качество стрижек", "Качество сервиса",
        "Доп. услуги (комментарий)", "Доп. услуги (оценка)", "Косметика (комментарий)",
        "Косметика (оценка)", "Стандарты (комментарий)", "Стандарты (оценка)",
        "Выявление ошибок", "Общая оценка", "Дата следующей проверки", "Филиал"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for visit in visits:
        # Расчет общей оценки
        total_score = round((
            visit.haircut_quality + 
            visit.service_quality + 
            visit.additional_services_rating + 
            visit.cosmetics_rating + 
            visit.standards_rating
        ) / 5, 1)
        
        row = [
            timestamp,
            visit.date,
            visit.master_name,
            visit.haircut_quality,
            visit.service_quality,
            visit.additional_services_comment,
            visit.additional_services_rating,
            visit.cosmetics_comment,
            visit.cosmetics_rating,
            visit.standards_comment,
            visit.standards_rating,
            visit.errors_comment,
            total_score,
            visit.next_check_date or "",
            visit.branch
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(visits)} проверок"}

# ============= ONE-ON-ONE ВСТРЕЧИ =============

@app.post("/one-on-one")
def submit_one_on_one(meetings: List[OneOnOneMeeting]):
    client = get_sheets_client()
    sheet_name = f"One-on-One - {meetings[0].branch}"
    headers = [
        "Дата отправки", "Дата встречи", "Имя мастера", "Цель встречи",
        "Результаты", "План развития", "Показатель", "Дата следующей встречи", "Филиал"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for meeting in meetings:
        row = [
            timestamp,
            meeting.date,
            meeting.master_name,
            meeting.goal,
            meeting.results,
            meeting.development_plan,
            meeting.indicator,
            meeting.next_meeting_date or "",
            meeting.branch
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(meetings)} встреч"}

# ============= ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============

@app.post("/weekly-metrics")
def submit_weekly_metrics(metrics: WeeklyMetrics):
    client = get_sheets_client()
    sheet_name = f"Еженедельные показатели - {metrics.branch}"
    headers = [
        "Дата отправки", "Период", "Средний чек (план)", "Средний чек (факт)",
        "Косметика (план)", "Косметика (факт)", "Доп. услуги (план)", "Доп. услуги (факт)",
        "Выполнение среднего чека %", "Выполнение косметики %", "Выполнение доп. услуг %", "Филиал"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Расчет процентов выполнения
    avg_check_perf = round((metrics.average_check_fact / metrics.average_check_plan * 100), 1) if metrics.average_check_plan > 0 else 0
    cosmetics_perf = round((metrics.cosmetics_fact / metrics.cosmetics_plan * 100), 1) if metrics.cosmetics_plan > 0 else 0
    additional_perf = round((metrics.additional_services_fact / metrics.additional_services_plan * 100), 1) if metrics.additional_services_plan > 0 else 0
    
    row = [
        timestamp,
        metrics.period,
        metrics.average_check_plan,
        metrics.average_check_fact,
        metrics.cosmetics_plan,
        metrics.cosmetics_fact,
        metrics.additional_services_plan,
        metrics.additional_services_fact,
        avg_check_perf,
        cosmetics_perf,
        additional_perf,
        metrics.branch
    ]
    insert_row_at_top(worksheet, row)
    
    return {"success": True}

# ============= ЧЕК-ЛИСТ АДАПТАЦИИ =============

@app.post("/newbie-adaptation")
def submit_newbie_adaptation(adaptations: List[NewbieAdaptation]):
    client = get_sheets_client()
    sheet_name = f"Адаптация новичков - {adaptations[0].branch}"
    headers = [
        "Дата отправки", "Дата начала", "Имя новичка", "Практика стрижек",
        "Стандарты сервиса", "Гигиена и санитария", "Доп. услуги",
        "Продажа косметики", "Основы iClient", "Статус адаптации", "Филиал"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for adaptation in adaptations:
        row = [
            timestamp,
            adaptation.start_date,
            adaptation.name,
            adaptation.haircut_practice,
            adaptation.service_standards,
            adaptation.hygiene_sanitation,
            adaptation.additional_services,
            adaptation.cosmetics_sales,
            adaptation.iclient_basics,
            adaptation.status,
            adaptation.branch
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(adaptations)} записей"}

# ============= ИНДИВИДУАЛЬНЫЕ ПЛАНЫ =============

@app.post("/master-plans")
def submit_master_plans(plans: List[MasterPlan]):
    client = get_sheets_client()
    sheet_name = f"Планы мастеров - {plans[0].branch}"
    headers = [
        "Дата отправки", "Месяц", "Имя мастера", "Средний чек (план)", "Средний чек (факт)",
        "Доп. услуги кол-во (план)", "Доп. услуги кол-во (факт)",
        "Объем продаж (план)", "Объем продаж (факт)", "Зарплата (план)", "Зарплата (факт)",
        "Выполнение среднего чека %", "Выполнение доп. услуг %",
        "Выполнение продаж %", "Выполнение зарплаты %", "Филиал"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for plan in plans:
        # Расчет процентов
        avg_check_perf = round((plan.average_check_fact / plan.average_check_plan * 100), 1) if plan.average_check_plan > 0 else 0
        services_perf = round((plan.additional_services_fact / plan.additional_services_plan * 100), 1) if plan.additional_services_plan > 0 else 0
        sales_perf = round((plan.sales_fact / plan.sales_plan * 100), 1) if plan.sales_plan > 0 else 0
        salary_perf = round((plan.salary_fact / plan.salary_plan * 100), 1) if plan.salary_plan > 0 else 0
        
        row = [
            timestamp,
            plan.month,
            plan.master_name,
            plan.average_check_plan,
            plan.average_check_fact,
            plan.additional_services_plan,
            plan.additional_services_fact,
            plan.sales_plan,
            plan.sales_fact,
            plan.salary_plan,
            plan.salary_fact,
            avg_check_perf,
            services_perf,
            sales_perf,
            salary_perf,
            plan.branch
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(plans)} планов"}

# ============= ОТЗЫВЫ =============

@app.post("/reviews")
def submit_reviews(review: Reviews):
    client = get_sheets_client()
    sheet_name = f"Отзывы - {review.branch}"
    headers = [
        "Дата отправки", "Неделя", "Имя управляющего", "План отзывов",
        "Факт отзывов", "Целевой показатель за месяц", "Выполнение недели %", "Филиал"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Расчет процента выполнения недели
    week_perf = round((review.fact / review.plan * 100), 1) if review.plan > 0 else 0
    
    row = [
        timestamp,
        review.week,
        review.manager_name,
        review.plan,
        review.fact,
        review.monthly_target,
        week_perf,
        review.branch
    ]
    insert_row_at_top(worksheet, row)
    
    return {"success": True}

# ============= СВОДКА ПО ФИЛИАЛУ =============

@app.post("/branch-summary")
def submit_branch_summary(summary: BranchSummary):
    client = get_sheets_client()
    sheet_name = f"Сводка - {summary.branch}"
    
    # Получаем данные из других листов для подсчета текущих значений
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    
    def count_records(sheet_name_pattern: str, month: str) -> int:
        try:
            worksheet = spreadsheet.worksheet(sheet_name_pattern)
            records = worksheet.get_all_records()
            # Фильтруем по месяцу если есть поле с датой
            return len([r for r in records if month.lower() in str(r).lower()])
        except:
            return 0
    
    headers = [
        "Дата отправки", "Филиал", "Управляющий", "Месяц",
        "Метрика", "Текущее количество", "Цель на месяц", "Выполнение %"
    ]
    
    worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Метрики
    metrics = [
        ("Утренние мероприятия", count_records(f"Утренние мероприятия - {summary.branch}", summary.month), summary.morning_events_goal),
        ("Полевые выходы", count_records(f"Полевые выходы - {summary.branch}", summary.month), summary.field_visits_goal),
        ("One-on-One встречи", count_records(f"One-on-One - {summary.branch}", summary.month), summary.one_on_one_goal),
        ("Еженедельные отчёты", count_records(f"Еженедельные показатели - {summary.branch}", summary.month), summary.weekly_reports_goal),
        ("Индивидуальные планы", count_records(f"Планы мастеров - {summary.branch}", summary.month), summary.master_plans_goal),
        ("Отзывы", count_records(f"Отзывы - {summary.branch}", summary.month), summary.reviews_goal),
        ("Новые сотрудники", count_records(f"Адаптация новичков - {summary.branch}", summary.month), summary.new_employees_goal),
    ]
    
    for metric_name, current, goal in metrics:
        performance = round((current / goal * 100), 1) if goal > 0 else 0
        row = [
            timestamp,
            summary.branch,
            summary.manager,
            summary.month,
            metric_name,
            current,
            goal,
            performance
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
