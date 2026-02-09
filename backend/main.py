from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
import gspread
from google.oauth2.service_account import Credentials
import json
import os
from datetime import datetime
import hashlib
import secrets
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BarberCRM API", version="2.0.1")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= КОНФИГУРАЦИЯ =============

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

def get_service_account_info():
    """Безопасное получение credentials с валидацией и исправлением ключа"""
    try:
        json_str = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '{}')
        if json_str == '{}':
            logger.error("GOOGLE_SERVICE_ACCOUNT_JSON не установлен")
            return None
        
        info = json.loads(json_str)
        
        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обработка переносов строк в приватном ключе
        # При передаче через ENV переменные \n часто экранируется
        if 'private_key' in info:
            info['private_key'] = info['private_key'].replace('\\n', '\n')
            
        return info
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
        return None

SERVICE_ACCOUNT_INFO = get_service_account_info()
SPREADSHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')

# === ДИАГНОСТИКА ПРИ СТАРТЕ ===
if SERVICE_ACCOUNT_INFO:
    email = SERVICE_ACCOUNT_INFO.get('client_email', 'Не найден')
    logger.info(f"--- ЗАПУСК СИСТЕМЫ ---")
    logger.info(f"Service Account Email: {email}")
    logger.info(f"Target Spreadsheet ID: {SPREADSHEET_ID}")
    logger.info(f"Пожалуйста, убедитесь, что email {email} является Редактором таблицы.")
else:
    logger.warning("Service Account Credentials не загружены!")

if not SPREADSHEET_ID:
    logger.warning("GOOGLE_SHEET_ID не установлен!")

# ============= УТИЛИТЫ =============

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Генерация безопасного токена"""
    return secrets.token_urlsafe(32)

def get_sheets_client():
    """Получение клиента Google Sheets с обработкой ошибок"""
    try:
        if not SERVICE_ACCOUNT_INFO:
            raise HTTPException(
                status_code=500,
                detail="Google Sheets не настроен. Проверьте GOOGLE_SERVICE_ACCOUNT_JSON"
            )
        
        if not SPREADSHEET_ID:
            raise HTTPException(
                status_code=500,
                detail="Google Sheets ID не установлен. Проверьте GOOGLE_SHEET_ID"
            )
        
        creds = Credentials.from_service_account_info(SERVICE_ACCOUNT_INFO, scopes=SCOPES)
        return gspread.authorize(creds)
    except Exception as e:
        logger.error(f"Ошибка авторизации Google Sheets: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка авторизации Google: {str(e)}"
        )

# ============= МОДЕЛИ ДАННЫХ =============

class BranchRegister(BaseModel):
    name: str
    address: str
    manager_name: str
    manager_phone: str
    password: str
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError('Название филиала должно быть минимум 2 символа')
        if len(v) > 100:
            raise ValueError('Название филиала слишком длинное')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Пароль должен быть минимум 6 символов')
        return v
    
    @validator('manager_phone')
    def validate_phone(cls, v):
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Некорректный номер телефона')
        return cleaned

class LoginRequest(BaseModel):
    name: str
    password: str

class MorningEvent(BaseModel):
    date: str
    event_type: str
    participants: int
    efficiency: int
    comment: str
    
    @validator('participants')
    def validate_participants(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Количество участников должно быть от 0 до 100')
        return v
    
    @validator('efficiency')
    def validate_efficiency(cls, v):
        if v < 1 or v > 10:
            raise ValueError('Эффективность должна быть от 1 до 10')
        return v

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
    
    @validator('haircut_quality', 'service_quality', 'additional_services_rating', 
               'cosmetics_rating', 'standards_rating')
    def validate_rating(cls, v):
        if v < 1 or v > 10:
            raise ValueError('Оценка должна быть от 1 до 10')
        return v

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
    average_check_plan: float
    average_check_fact: float
    cosmetics_plan: float
    cosmetics_fact: float
    additional_services_plan: float
    additional_services_fact: float
    
    @validator('average_check_plan', 'average_check_fact', 'cosmetics_plan', 
               'cosmetics_fact', 'additional_services_plan', 'additional_services_fact')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('Значение не может быть отрицательным')
        return v

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
    average_check_plan: float
    average_check_fact: float
    additional_services_plan: int
    additional_services_fact: int
    sales_plan: float
    sales_fact: float
    salary_plan: float
    salary_fact: float
    
    @validator('average_check_plan', 'average_check_fact', 'sales_plan', 
               'sales_fact', 'salary_plan', 'salary_fact')
    def validate_positive_float(cls, v):
        if v < 0:
            raise ValueError('Значение не может быть отрицательным')
        return v
    
    @validator('additional_services_plan', 'additional_services_fact')
    def validate_positive_int(cls, v):
        if v < 0:
            raise ValueError('Значение не может быть отрицательным')
        return v

class Reviews(BaseModel):
    week: str
    manager_name: str
    plan: int
    fact: int
    monthly_target: int
    
    @validator('plan', 'fact', 'monthly_target')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('Значение не может быть отрицательным')
        return v

class BranchSummary(BaseModel):
    manager: str
    month: str
    morning_events_goal: int
    field_visits_goal: int
    one_on_one_goal: int
    weekly_reports_goal: int
    master_plans_goal: int
    reviews_goal: int
    new_employees_goal: int
    
    @validator('morning_events_goal', 'field_visits_goal', 'one_on_one_goal',
               'weekly_reports_goal', 'master_plans_goal', 'reviews_goal', 'new_employees_goal')
    def validate_goals(cls, v):
        if v < 0 or v > 1000:
            raise ValueError('Цель должна быть от 0 до 1000')
        return v

# ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

def ensure_sheet_exists(client, spreadsheet_id: str, sheet_name: str, headers: List[str]):
    """Создает лист если его нет и добавляет заголовки"""
    try:
        spreadsheet = client.open_by_key(spreadsheet_id)
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            logger.info(f"Создание нового листа: {sheet_name}")
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=20)
            worksheet.append_row(headers)
            return worksheet
        
        # Проверяем наличие заголовков
        if not worksheet.row_values(1):
            worksheet.append_row(headers)
        
        return worksheet
    except gspread.exceptions.APIError as e:
        # Улучшенная диагностика ошибок API
        error_payload = e.response.json() if hasattr(e, 'response') and e.response else {}
        error_message = error_payload.get('error', {}).get('message', str(e))
        
        logger.error(f"Google Sheets API Error: {error_message}")
        
        # Если ошибка 403 (Permission denied)
        if '403' in str(e) or 'permission' in error_message.lower():
             raise HTTPException(
                status_code=500,
                detail=(
                    f"Нет прав доступа к таблице. Убедитесь, что сервисный аккаунт "
                    f"({SERVICE_ACCOUNT_INFO.get('client_email', 'unknown')}) добавлен в редакторы."
                )
            )
            
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка Google Sheets API: {error_message}"
        )
    except Exception as e:
        logger.error(f"Ошибка работы с листом {sheet_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка работы с Google Sheets: {str(e)}"
        )

def insert_row_at_top(worksheet, data: List[Any]):
    """Вставляет данные во вторую строку (после заголовков)"""
    try:
        worksheet.insert_row(data, index=2)
    except Exception as e:
        logger.error(f"Ошибка вставки строки: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка записи данных: {str(e)}"
        )

def get_branch_by_name(client, name: str) -> Optional[Dict]:
    """Получение филиала по имени"""
    try:
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        
        try:
            worksheet = spreadsheet.worksheet("Филиалы")
        except gspread.exceptions.WorksheetNotFound:
            return None
        
        records = worksheet.get_all_records()
        
        for record in records:
            if record.get('Название') == name:
                return record
        
        return None
    except Exception as e:
        logger.error(f"Ошибка поиска филиала: {e}")
        return None

# ============= API ENDPOINTS =============

@app.get("/")
def read_root():
    """Health check"""
    return {
        "message": "Barber CRM API v2.0.1",
        "status": "online",
        "google_sheets_configured": SERVICE_ACCOUNT_INFO is not None and SPREADSHEET_ID != ''
    }

@app.get("/health")
def health_check():
    """Детальная проверка здоровья сервиса"""
    issues = []
    
    if not SERVICE_ACCOUNT_INFO:
        issues.append("GOOGLE_SERVICE_ACCOUNT_JSON не настроен или некорректен")
    
    if not SPREADSHEET_ID:
        issues.append("GOOGLE_SHEET_ID не настроен")
    
    return {
        "status": "healthy" if not issues else "degraded",
        "issues": issues,
        "service_account_email": SERVICE_ACCOUNT_INFO.get('client_email') if SERVICE_ACCOUNT_INFO else None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/register")
def register_branch(branch: BranchRegister):
    """Регистрация нового филиала"""
    try:
        client = get_sheets_client()
        
        # Проверяем существование филиала
        existing_branch = get_branch_by_name(client, branch.name)
        if existing_branch:
            raise HTTPException(
                status_code=400,
                detail="Филиал с таким названием уже существует"
            )
        
        # Создаем/получаем лист "Филиалы"
        headers = [
            "Дата регистрации", "Название", "Адрес", "Управляющий", 
            "Телефон", "Пароль (хеш)", "Токен", "Статус"
        ]
        worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, "Филиалы", headers)
        
        # Генерируем токен и хешируем пароль
        token = generate_token()
        password_hash = hash_password(branch.password)
        
        # Добавляем филиал
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        row = [
            timestamp,
            branch.name,
            branch.address,
            branch.manager_name,
            branch.manager_phone,
            password_hash,
            token,
            "Активен"
        ]
        
        insert_row_at_top(worksheet, row)
        
        logger.info(f"Зарегистрирован новый филиал: {branch.name}")
        
        return {
            "success": True,
            "message": "Филиал успешно зарегистрирован",
            "branch": {
                "name": branch.name,
                "address": branch.address,
                "manager": branch.manager_name
            },
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка регистрации филиала: {e}")
        # Если ошибка не HTTP, оборачиваем её
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера при регистрации: {str(e)}"
        )

@app.post("/login")
def login(request: LoginRequest):
    """Авторизация филиала"""
    try:
        client = get_sheets_client()
        
        branch = get_branch_by_name(client, request.name)
        
        if not branch:
            raise HTTPException(
                status_code=401,
                detail="Филиал не найден"
            )
        
        # Проверяем пароль
        password_hash = hash_password(request.password)
        if branch.get('Пароль (хеш)') != password_hash:
            raise HTTPException(
                status_code=401,
                detail="Неверный пароль"
            )
        
        # Проверяем статус
        if branch.get('Статус') != 'Активен':
            raise HTTPException(
                status_code=403,
                detail="Филиал заблокирован"
            )
        
        logger.info(f"Успешный вход: {request.name}")
        
        return {
            "success": True,
            "token": branch.get('Токен'),
            "branch": {
                "name": branch.get('Название'),
                "address": branch.get('Адрес'),
                "manager": branch.get('Управляющий')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка авторизации: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка авторизации: {str(e)}"
        )

# ============= УТРЕННИЕ МЕРОПРИЯТИЯ =============

@app.post("/morning-events/{branch_name}")
def submit_morning_events(branch_name: str, events: List[MorningEvent]):
    """Добавление утренних мероприятий"""
    try:
        if not events:
            raise HTTPException(status_code=400, detail="Список мероприятий пуст")
        
        client = get_sheets_client()
        sheet_name = f"Утренние мероприятия - {branch_name}"
        headers = ["Дата отправки", "Дата", "Тип мероприятия", "Участники", "Эффективность", "Комментарий"]
        
        worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for event in events:
            row = [
                timestamp,
                event.date,
                event.event_type,
                event.participants,
                event.efficiency,
                event.comment
            ]
            insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлено {len(events)} утренних мероприятий для {branch_name}")
        return {"success": True, "message": f"Добавлено {len(events)} записей"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления утренних мероприятий: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/morning-events/{branch_name}")
def get_morning_events(branch_name: str):
    """Получение утренних мероприятий"""
    try:
        client = get_sheets_client()
        sheet_name = f"Утренние мероприятия - {branch_name}"
        
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(sheet_name)
        records = worksheet.get_all_records()
        
        return {"success": True, "data": records}
        
    except gspread.exceptions.WorksheetNotFound:
        return {"success": True, "data": []}
    except Exception as e:
        logger.error(f"Ошибка получения данных: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ПОЛЕВЫЕ ВЫХОДЫ =============

@app.post("/field-visits/{branch_name}")
def submit_field_visits(branch_name: str, visits: List[FieldVisit]):
    """Добавление полевых выходов"""
    try:
        if not visits:
            raise HTTPException(status_code=400, detail="Список проверок пуст")
        
        client = get_sheets_client()
        sheet_name = f"Полевые выходы - {branch_name}"
        headers = [
            "Дата отправки", "Дата", "Имя мастера", "Качество стрижек", "Качество сервиса",
            "Доп. услуги (комментарий)", "Доп. услуги (оценка)", "Косметика (комментарий)",
            "Косметика (оценка)", "Стандарты (комментарий)", "Стандарты (оценка)",
            "Выявление ошибок", "Общая оценка", "Дата следующей проверки"
        ]
        
        worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for visit in visits:
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
                visit.next_check_date or ""
            ]
            insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлено {len(visits)} полевых выходов для {branch_name}")
        return {"success": True, "message": f"Добавлено {len(visits)} проверок"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления полевых выходов: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ONE-ON-ONE ВСТРЕЧИ =============

@app.post("/one-on-one/{branch_name}")
def submit_one_on_one(branch_name: str, meetings: List[OneOnOneMeeting]):
    """Добавление One-on-One встреч"""
    try:
        if not meetings:
            raise HTTPException(status_code=400, detail="Список встреч пуст")
        
        client = get_sheets_client()
        sheet_name = f"One-on-One - {branch_name}"
        headers = [
            "Дата отправки", "Дата встречи", "Имя мастера", "Цель встречи",
            "Результаты", "План развития", "Показатель", "Дата следующей встречи"
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
                meeting.next_meeting_date or ""
            ]
            insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлено {len(meetings)} встреч для {branch_name}")
        return {"success": True, "message": f"Добавлено {len(meetings)} встреч"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления встреч: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============

@app.post("/weekly-metrics/{branch_name}")
def submit_weekly_metrics(branch_name: str, metrics: WeeklyMetrics):
    """Добавление еженедельных показателей"""
    try:
        client = get_sheets_client()
        sheet_name = f"Еженедельные показатели - {branch_name}"
        headers = [
            "Дата отправки", "Период", "Средний чек (план)", "Средний чек (факт)",
            "Косметика (план)", "Косметика (факт)", "Доп. услуги (план)", "Доп. услуги (факт)",
            "Выполнение среднего чека %", "Выполнение косметики %", "Выполнение доп. услуг %"
        ]
        
        worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
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
            additional_perf
        ]
        insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлены еженедельные показатели для {branch_name}")
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления показателей: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ЧЕК-ЛИСТ АДАПТАЦИИ =============

@app.post("/newbie-adaptation/{branch_name}")
def submit_newbie_adaptation(branch_name: str, adaptations: List[NewbieAdaptation]):
    """Добавление чек-листа адаптации"""
    try:
        if not adaptations:
            raise HTTPException(status_code=400, detail="Список адаптаций пуст")
        
        client = get_sheets_client()
        sheet_name = f"Адаптация новичков - {branch_name}"
        headers = [
            "Дата отправки", "Дата начала", "Имя новичка", "Практика стрижек",
            "Стандарты сервиса", "Гигиена и санитария", "Доп. услуги",
            "Продажа косметики", "Основы iClient", "Статус адаптации"
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
                adaptation.status
            ]
            insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлено {len(adaptations)} чек-листов адаптации для {branch_name}")
        return {"success": True, "message": f"Добавлено {len(adaptations)} записей"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления адаптаций: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ИНДИВИДУАЛЬНЫЕ ПЛАНЫ =============

@app.post("/master-plans/{branch_name}")
def submit_master_plans(branch_name: str, plans: List[MasterPlan]):
    """Добавление планов мастеров"""
    try:
        if not plans:
            raise HTTPException(status_code=400, detail="Список планов пуст")
        
        client = get_sheets_client()
        sheet_name = f"Планы мастеров - {branch_name}"
        headers = [
            "Дата отправки", "Месяц", "Имя мастера", "Средний чек (план)", "Средний чек (факт)",
            "Доп. услуги кол-во (план)", "Доп. услуги кол-во (факт)",
            "Объем продаж (план)", "Объем продаж (факт)", "Зарплата (план)", "Зарплата (факт)",
            "Выполнение среднего чека %", "Выполнение доп. услуг %",
            "Выполнение продаж %", "Выполнение зарплаты %"
        ]
        
        worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for plan in plans:
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
                salary_perf
            ]
            insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлено {len(plans)} планов мастеров для {branch_name}")
        return {"success": True, "message": f"Добавлено {len(plans)} планов"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления планов: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ОТЗЫВЫ =============

@app.post("/reviews/{branch_name}")
def submit_reviews(branch_name: str, review: Reviews):
    """Добавление отзывов"""
    try:
        client = get_sheets_client()
        sheet_name = f"Отзывы - {branch_name}"
        headers = [
            "Дата отправки", "Неделя", "Имя управляющего", "План отзывов",
            "Факт отзывов", "Целевой показатель за месяц", "Выполнение недели %"
        ]
        
        worksheet = ensure_sheet_exists(client, SPREADSHEET_ID, sheet_name, headers)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        week_perf = round((review.fact / review.plan * 100), 1) if review.plan > 0 else 0
        
        row = [
            timestamp,
            review.week,
            review.manager_name,
            review.plan,
            review.fact,
            review.monthly_target,
            week_perf
        ]
        insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлены отзывы для {branch_name}")
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления отзывов: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= СВОДКА ПО ФИЛИАЛУ =============

@app.post("/branch-summary/{branch_name}")
def submit_branch_summary(branch_name: str, summary: BranchSummary):
    """Добавление сводки по филиалу"""
    try:
        client = get_sheets_client()
        sheet_name = f"Сводка - {branch_name}"
        
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        
        def count_records(sheet_name_pattern: str, month: str) -> int:
            try:
                worksheet = spreadsheet.worksheet(sheet_name_pattern)
                records = worksheet.get_all_records()
                return len([r for r in records if month.lower() in str(r).lower()])
            except:
                return 0
        
        headers = [
            "Дата отправки", "Филиал", "Управляющий", "Месяц",
            "Метрика", "Текущее количество", "Цель на месяц", "Выполнение %"
        ]
        
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
                branch_name,
                summary.manager,
                summary.month,
                metric_name,
                current,
                goal,
                performance
            ]
            insert_row_at_top(worksheet, row)
        
        logger.info(f"Добавлена сводка для {branch_name}")
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления сводки: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ОБРАБОТЧИК ОШИБОК =============

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Глобальный обработчик ошибок"""
    logger.error(f"Необработанная ошибка: {exc}")
    return {
        "detail": "Внутренняя ошибка сервера",
        "error": str(exc)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)