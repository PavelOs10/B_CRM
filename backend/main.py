from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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

app = FastAPI(title="BarberCRM API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']

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
MASTER_SPREADSHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')  # Главная таблица для хранения филиалов

BRANCH_GOALS = {
    "morning_events": 16,
    "field_visits": 4,
    "one_on_one": 6,
    "weekly_reports": 4,
    "master_plans": 10,
    "reviews": 60,
    "new_employees": 10
}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_sheets_client():
    """
    Получить клиент для работы с Google Sheets
    Поддерживает два метода авторизации:
    1. OAuth (GOOGLE_OAUTH_TOKEN) - для личного Google Drive, не требует биллинга
    2. Service Account (GOOGLE_SERVICE_ACCOUNT_JSON) - для корпоративного использования
    """
    try:
        # Проверяем наличие OAuth токена
        oauth_token_str = os.getenv('GOOGLE_OAUTH_TOKEN', None)
        
        if oauth_token_str:
            # МЕТОД 1: OAuth авторизация (рекомендуется для РФ)
            logger.info("🔐 Используем OAuth авторизацию (личный Google Drive)")
            
            from google.oauth2.credentials import Credentials as OAuthCredentials
            
            try:
                token_data = json.loads(oauth_token_str)
                
                creds = OAuthCredentials(
                    token=token_data.get('token'),
                    refresh_token=token_data.get('refresh_token'),
                    token_uri=token_data.get('token_uri', 'https://oauth2.googleapis.com/token'),
                    client_id=token_data.get('client_id'),
                    client_secret=token_data.get('client_secret'),
                    scopes=SCOPES
                )
                
                # Проверяем и обновляем токен если истёк
                if creds.expired and creds.refresh_token:
                    from google.auth.transport.requests import Request
                    logger.info("🔄 Обновляем истёкший OAuth токен...")
                    creds.refresh(Request())
                    logger.info("✅ Токен обновлён")
                
                return gspread.authorize(creds)
                
            except Exception as oauth_error:
                logger.error(f"❌ Ошибка OAuth авторизации: {oauth_error}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Ошибка OAuth авторизации. Возможно токен истёк. Запустите get_oauth_token.py для получения нового токена. Ошибка: {str(oauth_error)}"
                )
        
        else:
            # МЕТОД 2: Service Account авторизация (требует биллинга)
            logger.info("🔐 Используем Service Account авторизацию")
            
            if not SERVICE_ACCOUNT_INFO:
                raise HTTPException(
                    status_code=500, 
                    detail="Google Sheets не настроен. Укажите GOOGLE_OAUTH_TOKEN или GOOGLE_SERVICE_ACCOUNT_JSON в .env"
                )
            
            creds = Credentials.from_service_account_info(SERVICE_ACCOUNT_INFO, scopes=SCOPES)
            return gspread.authorize(creds)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка авторизации: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка авторизации Google: {str(e)}")

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
    plan: int = Field(default=13, ge=0)
    fact: int = Field(..., ge=0)
    monthly_target: int = Field(default=52, ge=0)

class BranchSummary(BaseModel):
    manager: str
    month: str

# ============= УТИЛИТЫ =============

def create_branch_spreadsheet(client, branch_name: str) -> str:
    """Создает новую таблицу для филиала и возвращает её ID
    
    При использовании OAuth файлы создаются на личном Google Drive пользователя
    При использовании Service Account - на диске сервисного аккаунта
    """
    try:
        folder_id = os.getenv('GOOGLE_DRIVE_FOLDER_ID', None)
        oauth_token_str = os.getenv('GOOGLE_OAUTH_TOKEN', None)
        
        logger.info(f"🔍 GOOGLE_DRIVE_FOLDER_ID = '{folder_id}'")
        logger.info(f"🔍 Метод авторизации: {'OAuth' if oauth_token_str else 'Service Account'}")
        
        # МЕТОД 1: Создание через gspread (работает для обоих типов авторизации)
        try:
            logger.info(f"📝 Создаём таблицу через gspread.create()...")
            spreadsheet = client.create(f"BarberCRM - {branch_name}")
            spreadsheet_id = spreadsheet.id
            logger.info(f"✅ Таблица создана! ID: {spreadsheet_id}")
            
            # Если указана папка - перемещаем туда
            if folder_id:
                try:
                    from googleapiclient.discovery import build
                    
                    # Получаем credentials из текущей сессии gspread
                    auth = client.auth
                    
                    logger.info(f"📁 Перемещаем файл в папку: {folder_id}")
                    drive_service = build('drive', 'v3', credentials=auth)
                    
                    # Получаем текущих родителей
                    file_obj = drive_service.files().get(
                        fileId=spreadsheet_id,
                        fields='parents'
                    ).execute()
                    
                    previous_parents = ",".join(file_obj.get('parents', []))
                    
                    # Перемещаем
                    drive_service.files().update(
                        fileId=spreadsheet_id,
                        addParents=folder_id,
                        removeParents=previous_parents,
                        fields='id, parents'
                    ).execute()
                    
                    logger.info(f"✅ Файл перемещён в папку!")
                    
                except Exception as move_error:
                    logger.warning(f"⚠️ Не удалось переместить в папку: {move_error}")
                    logger.warning(f"⚠️ Файл останется в корне Drive")
            
            logger.info(f"✅ Таблица для филиала '{branch_name}' создана успешно!")
            return spreadsheet_id
            
        except Exception as create_error:
            logger.error(f"❌ Ошибка создания через gspread: {create_error}")
            
            error_str = str(create_error)
            
            # Детальная диагностика
            if 'storageQuotaExceeded' in error_str:
                if oauth_token_str:
                    raise HTTPException(
                        status_code=507,
                        detail="Превышена квота хранилища на вашем Google Drive. Освободите место в Google Drive и попробуйте снова."
                    )
                else:
                    raise HTTPException(
                        status_code=507,
                        detail="Превышена квота хранилища сервисного аккаунта. Решение: используйте OAuth авторизацию (GOOGLE_OAUTH_TOKEN) вместо Service Account. Запустите get_oauth_token.py для настройки."
                    )
            
            elif '403' in error_str:
                if oauth_token_str:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Ошибка доступа. Проверьте что токен OAuth актуальный. Возможно нужно получить новый токен через get_oauth_token.py. Ошибка: {error_str}"
                    )
                else:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Ошибка доступа к Google Drive API. Для Service Account требуется настроенный биллинг в Google Cloud Console. Рекомендуется использовать OAuth (GOOGLE_OAUTH_TOKEN). Ошибка: {error_str}"
                    )
            
            raise HTTPException(
                status_code=500, 
                detail=f"Не удалось создать таблицу: {error_str}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Неожиданная ошибка: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания таблицы: {str(e)}")

def get_branch_spreadsheet_id(client, branch_name: str) -> str:
    """Получает ID таблицы филиала из главной таблицы или создает новую"""
    try:
        # Открываем главную таблицу
        master_spreadsheet = client.open_by_key(MASTER_SPREADSHEET_ID)
        
        # Получаем или создаем лист "Филиалы"
        try:
            branches_sheet = master_spreadsheet.worksheet("Филиалы")
        except gspread.exceptions.WorksheetNotFound:
            branches_sheet = master_spreadsheet.add_worksheet(title="Филиалы", rows=100, cols=10)
            branches_sheet.append_row(["Название", "Адрес", "Управляющий", "Телефон", "Пароль (хеш)", "Токен", "Дата регистрации", "Spreadsheet ID"])
        
        # Ищем филиал
        records = branches_sheet.get_all_records()
        for i, record in enumerate(records, start=2):
            if record.get('Название') == branch_name:
                spreadsheet_id = record.get('Spreadsheet ID', '')
                if spreadsheet_id:
                    return spreadsheet_id
                else:
                    # Если ID нет, создаем таблицу и обновляем запись
                    spreadsheet_id = create_branch_spreadsheet(client, branch_name)
                    branches_sheet.update_cell(i, 8, spreadsheet_id)
                    return spreadsheet_id
        
        # Если филиал не найден
        raise HTTPException(status_code=404, detail="Филиал не найден")
    except Exception as e:
        logger.error(f"Ошибка получения ID таблицы: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    """Конвертируем все значения в строки/числа"""
    try:
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
        spreadsheet = client.open_by_key(MASTER_SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet("Филиалы")
        records = worksheet.get_all_records()
        for record in records:
            if record.get('Название') == name:
                return record
        return None
    except:
        return None

def count_records_for_month(client, spreadsheet_id: str, sheet_prefix: str, month: str) -> int:
    """Подсчитывает количество записей за месяц"""
    try:
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(sheet_prefix)
        records = worksheet.get_all_records()
        
        # Фильтруем записи по месяцу
        count = 0
        for record in records:
            record_date = record.get('Дата отправки', '') or record.get('Дата', '')
            if record_date:
                try:
                    date_obj = datetime.strptime(record_date.split()[0], "%Y-%m-%d")
                    record_month = date_obj.strftime("%B %Y")
                    
                    # Преобразуем месяц на русский
                    months_ru = {
                        'January': 'Январь', 'February': 'Февраль', 'March': 'Март',
                        'April': 'Апрель', 'May': 'Май', 'June': 'Июнь',
                        'July': 'Июль', 'August': 'Август', 'September': 'Сентябрь',
                        'October': 'Октябрь', 'November': 'Ноябрь', 'December': 'Декабрь'
                    }
                    
                    month_en = record_month.split()[0]
                    year = record_month.split()[1]
                    record_month_ru = f"{months_ru.get(month_en, month_en)} {year}"
                    
                    if record_month_ru == month:
                        count += 1
                except:
                    continue
        
        return count
    except gspread.exceptions.WorksheetNotFound:
        return 0
    except Exception as e:
        logger.error(f"Ошибка подсчета: {e}")
        return 0

# ============= РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ =============

@app.post("/register")
def register_branch(branch: BranchRegister):
    client = get_sheets_client()
    
    # Проверка на дубликаты
    existing = get_branch_by_name(client, branch.name)
    if existing:
        raise HTTPException(status_code=400, detail="Филиал с таким названием уже существует")
    
    # Создаем таблицу для нового филиала
    spreadsheet_id = create_branch_spreadsheet(client, branch.name)
    
    # Добавляем филиал в главную таблицу
    try:
        spreadsheet = client.open_by_key(MASTER_SPREADSHEET_ID)
        try:
            worksheet = spreadsheet.worksheet("Филиалы")
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title="Филиалы", rows=100, cols=10)
            worksheet.append_row(["Название", "Адрес", "Управляющий", "Телефон", "Пароль (хеш)", "Токен", "Дата регистрации", "Spreadsheet ID"])
        
        password_hash = hash_password(branch.password)
        token = generate_token()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        worksheet.append_row([
            branch.name,
            branch.address,
            branch.manager_name,
            branch.manager_phone,
            password_hash,
            token,
            timestamp,
            spreadsheet_id
        ])
        
        return {"success": True, "message": "Филиал успешно зарегистрирован"}
    except Exception as e:
        logger.error(f"Ошибка регистрации: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(credentials: LoginRequest):
    client = get_sheets_client()
    branch = get_branch_by_name(client, credentials.name)
    
    if not branch:
        raise HTTPException(status_code=401, detail="Неверное название филиала или пароль")
    
    password_hash = hash_password(credentials.password)
    if branch.get('Пароль (хеш)') != password_hash:
        raise HTTPException(status_code=401, detail="Неверное название филиала или пароль")
    
    return {
        "success": True,
        "token": branch.get('Токен'),
        "branch": {
            "name": branch.get('Название'),
            "address": branch.get('Адрес'),
            "manager": branch.get('Управляющий'),
            "phone": branch.get('Телефон'),
            "spreadsheet_id": branch.get('Spreadsheet ID')
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "4.0.0"}

# ============= ДАШБОРД =============

@app.get("/dashboard-summary/{branch_name}")
def get_dashboard_summary(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        # Текущий месяц
        now = datetime.now()
        months_ru = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                     'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        current_month = f"{months_ru[now.month - 1]} {now.year}"
        
        summary = {
            "morning_events": {
                "current": count_records_for_month(client, spreadsheet_id, "Утренние мероприятия", current_month),
                "goal": BRANCH_GOALS["morning_events"],
                "percentage": 0,
                "label": "Утренние мероприятия"
            },
            "field_visits": {
                "current": count_records_for_month(client, spreadsheet_id, "Полевые выходы", current_month),
                "goal": BRANCH_GOALS["field_visits"],
                "percentage": 0,
                "label": "Полевые выходы"
            },
            "one_on_one": {
                "current": count_records_for_month(client, spreadsheet_id, "One-on-One", current_month),
                "goal": BRANCH_GOALS["one_on_one"],
                "percentage": 0,
                "label": "One-on-One"
            },
            "master_plans": {
                "current": count_records_for_month(client, spreadsheet_id, "Планы мастеров", current_month),
                "goal": BRANCH_GOALS["master_plans"],
                "percentage": 0,
                "label": "Планы мастеров"
            },
            "weekly_reports": {
                "current": count_records_for_month(client, spreadsheet_id, "Еженедельные показатели", current_month),
                "goal": BRANCH_GOALS["weekly_reports"],
                "percentage": 0,
                "label": "Еженедельные отчёты"
            },
            "reviews": {
                "current": count_records_for_month(client, spreadsheet_id, "Отзывы", current_month),
                "goal": BRANCH_GOALS["reviews"],
                "percentage": 0,
                "label": "Отзывы"
            },
            "new_employees": {
                "current": count_records_for_month(client, spreadsheet_id, "Адаптация новичков", current_month),
                "goal": BRANCH_GOALS["new_employees"],
                "percentage": 0,
                "label": "Новые сотрудники"
            }
        }
        
        # Рассчитываем проценты
        for key in summary:
            if summary[key]["goal"] > 0:
                summary[key]["percentage"] = round((summary[key]["current"] / summary[key]["goal"]) * 100, 1)
        
        return {"success": True, "summary": summary}
    except Exception as e:
        logger.error(f"Ошибка загрузки дашборда: {e}")
        return {"success": False, "error": str(e)}

# ============= УТРЕННИЕ МЕРОПРИЯТИЯ =============

@app.post("/morning-events/{branch_name}")
def submit_morning_events(branch_name: str, events: List[MorningEvent]):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Утренние мероприятия"
    headers = ["Дата отправки", "Дата", "Неделя", "Тип мероприятия", "Участники", "Эффективность", "Комментарий"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for event in events:
        row = [
            timestamp,
            str(event.date),
            int(event.week),
            str(event.event_type),
            int(event.participants),
            int(event.efficiency),
            str(event.comment)
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(events)} мероприятий"}

@app.get("/morning-events/{branch_name}")
def get_morning_events(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Утренние мероприятия")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ПОЛЕВЫЕ ВЫХОДЫ =============

@app.post("/field-visits/{branch_name}")
def submit_field_visits(branch_name: str, visits: List[FieldVisit]):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Полевые выходы"
    headers = [
        "Дата отправки", "Дата", "Имя мастера", "Качество стрижек", "Качество сервиса",
        "Комментарий доп. услуги", "Оценка доп. услуги", "Комментарий косметика",
        "Оценка косметика", "Комментарий стандарты", "Оценка стандарты",
        "Выявленные ошибки", "Общая оценка", "Дата следующей проверки"
    ]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for visit in visits:
        # ИСПРАВЛЕНО: средняя оценка вместо суммы
        overall_score = round((
            visit.haircut_quality + 
            visit.service_quality + 
            visit.additional_services_rating + 
            visit.cosmetics_rating + 
            visit.standards_rating
        ) / 5, 1)
        
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
            float(overall_score),
            str(visit.next_check_date) if visit.next_check_date else ""
        ]
        insert_row_at_top(worksheet, row)
    
    return {"success": True, "message": f"Добавлено {len(visits)} проверок"}

@app.get("/field-visits/{branch_name}")
def get_field_visits(branch_name: str):
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Полевые выходы")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ONE-ON-ONE =============

@app.post("/one-on-one/{branch_name}")
def submit_one_on_one(branch_name: str, meetings: List[OneOnOneMeeting]):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "One-on-One"
    headers = ["Дата отправки", "Дата встречи", "Имя мастера", "Стояла цель", "Результаты работы", "План развития", "Показатель", "Дата следующей встречи"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
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
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("One-on-One")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============

@app.post("/weekly-metrics/{branch_name}")
def submit_weekly_metrics(branch_name: str, metrics: WeeklyMetrics):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Еженедельные показатели"
    headers = ["Дата отправки", "Период", "Средний чек (план)", "Средний чек (факт)", "Косметика (план)", "Косметика (факт)", "Доп. услуги (план)", "Доп. услуги (факт)", "Выполнение среднего чека %", "Выполнение косметики %", "Выполнение доп. услуг %"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
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
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Еженедельные показатели")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= АДАПТАЦИЯ НОВИЧКОВ =============

@app.post("/newbie-adaptation/{branch_name}")
def submit_newbie_adaptation(branch_name: str, adaptations: List[NewbieAdaptation]):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Адаптация новичков"
    headers = ["Дата отправки", "Дата начала", "Имя новичка", "Практика стрижек", "Стандарты сервиса", "Гигиена и санитария", "Доп. услуги", "Продажа косметики", "Основы iClient", "Статус адаптации"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
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
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Адаптация новичков")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ПЛАНЫ МАСТЕРОВ =============

@app.post("/master-plans/{branch_name}")
def submit_master_plans(branch_name: str, plans: List[MasterPlan]):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Планы мастеров"
    headers = ["Дата отправки", "Месяц", "Имя мастера", "Средний чек (план)", "Средний чек (факт)", "Доп. услуги кол-во (план)", "Доп. услуги кол-во (факт)", "Объем продаж (план)", "Объем продаж (факт)", "Зарплата (план)", "Зарплата (факт)", "Выполнение среднего чека %", "Выполнение доп. услуг %", "Выполнение продаж %", "Выполнение зарплаты %"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
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
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Планы мастеров")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= ОТЗЫВЫ =============

@app.post("/reviews/{branch_name}")
def submit_reviews(branch_name: str, review: Reviews):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Отзывы"
    headers = ["Дата отправки", "Неделя", "Имя управляющего", "План отзывов", "Факт отзывов", "Целевой показатель за месяц", "Выполнение недели %"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
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
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Отзывы")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

# ============= СВОДКА =============

@app.post("/branch-summary/{branch_name}")
def submit_branch_summary(branch_name: str, summary: BranchSummary):
    client = get_sheets_client()
    spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
    
    sheet_name = "Сводка"
    headers = ["Дата отправки", "Филиал", "Управляющий", "Месяц", "Метрика", "Текущее количество", "Цель на месяц", "Выполнение %"]
    worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    metrics = [
        ("Утренние мероприятия", count_records_for_month(client, spreadsheet_id, "Утренние мероприятия", summary.month), BRANCH_GOALS["morning_events"]),
        ("Полевые выходы", count_records_for_month(client, spreadsheet_id, "Полевые выходы", summary.month), BRANCH_GOALS["field_visits"]),
        ("One-on-One встречи", count_records_for_month(client, spreadsheet_id, "One-on-One", summary.month), BRANCH_GOALS["one_on_one"]),
        ("Еженедельные отчёты", count_records_for_month(client, spreadsheet_id, "Еженедельные показатели", summary.month), BRANCH_GOALS["weekly_reports"]),
        ("Индивидуальные планы", count_records_for_month(client, spreadsheet_id, "Планы мастеров", summary.month), BRANCH_GOALS["master_plans"]),
        ("Отзывы", count_records_for_month(client, spreadsheet_id, "Отзывы", summary.month), BRANCH_GOALS["reviews"]),
        ("Новые сотрудники", count_records_for_month(client, spreadsheet_id, "Адаптация новичков", summary.month), BRANCH_GOALS["new_employees"]),
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
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Сводка")
        return {"success": True, "data": worksheet.get_all_records()}
    except:
        return {"success": True, "data": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)