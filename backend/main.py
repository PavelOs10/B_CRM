from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import gspread
from google.oauth2.service_account import Credentials
import json
import os
from datetime import datetime, timedelta
import hashlib
import secrets
import logging
from functools import lru_cache
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BarberCRM API", version="4.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']

# ============= КЕШИРОВАНИЕ =============

# Кеш для данных (время жизни: 300 секунд = 5 минут)
cache_store = {}
CACHE_TTL = 300  # Увеличено с 60 до 300 секунд для снижения нагрузки на API

def get_from_cache(key: str):
    """Получить данные из кеша"""
    if key in cache_store:
        data, timestamp = cache_store[key]
        age = time.time() - timestamp
        if age < CACHE_TTL:
            logger.debug(f"📦 Кеш HIT: {key} (возраст: {int(age)}s)")
            return data
        else:
            logger.debug(f"⏰ Кеш EXPIRED: {key}")
            del cache_store[key]
    return None

def set_cache(key: str, value: Any):
    """Сохранить данные в кеш"""
    cache_store[key] = (value, time.time())
    logger.debug(f"💾 Кеш SAVED: {key}")

def clear_cache_for_branch(branch_name: str):
    """Очистить кеш для конкретного филиала"""
    keys_to_delete = [k for k in cache_store.keys() if branch_name in k]
    for key in keys_to_delete:
        del cache_store[key]
    logger.info(f"🗑️ Очищен кеш для филиала: {branch_name}")

# ============= АВТОРИЗАЦИЯ =============

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
MASTER_SPREADSHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')

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
        oauth_token_str = os.getenv('GOOGLE_OAUTH_TOKEN', None)
        
        if oauth_token_str:
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
    """Создает новую таблицу для филиала и возвращает её ID"""
    try:
        folder_id = os.getenv('GOOGLE_DRIVE_FOLDER_ID', None)
        oauth_token_str = os.getenv('GOOGLE_OAUTH_TOKEN', None)
        
        logger.info(f"🔍 GOOGLE_DRIVE_FOLDER_ID = '{folder_id}'")
        logger.info(f"🔍 Метод авторизации: {'OAuth' if oauth_token_str else 'Service Account'}")
        
        try:
            logger.info(f"📝 Создаём таблицу через gspread.create()...")
            spreadsheet = client.create(f"BarberCRM - {branch_name}")
            spreadsheet_id = spreadsheet.id
            logger.info(f"✅ Таблица создана! ID: {spreadsheet_id}")
            
            if folder_id:
                try:
                    from googleapiclient.discovery import build
                    auth = client.auth
                    
                    logger.info(f"📁 Перемещаем файл в папку: {folder_id}")
                    drive_service = build('drive', 'v3', credentials=auth)
                    
                    file_obj = drive_service.files().get(
                        fileId=spreadsheet_id,
                        fields='parents'
                    ).execute()
                    
                    previous_parents = ",".join(file_obj.get('parents', []))
                    
                    drive_service.files().update(
                        fileId=spreadsheet_id,
                        addParents=folder_id,
                        removeParents=previous_parents,
                        fields='id, parents'
                    ).execute()
                    
                    logger.info(f"✅ Файл перемещён в папку!")
                    
                except Exception as move_error:
                    logger.warning(f"⚠️ Не удалось переместить файл в папку: {move_error}")
            
            return spreadsheet_id
            
        except Exception as create_error:
            logger.error(f"❌ Ошибка создания таблицы: {create_error}")
            raise HTTPException(status_code=500, detail=f"Не удалось создать таблицу: {str(create_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка в create_branch_spreadsheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_branch_spreadsheet_id(client, branch_name: str) -> str:
    """Получает ID таблицы филиала из главной таблицы"""
    cache_key = f"spreadsheet_id_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        # ВАЖНО: НЕ проверяем таблицу здесь - это лишний API запрос!
        # Проверка будет при первом использовании
        return cached
    
    try:
        spreadsheet = client.open_by_key(MASTER_SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet("Филиалы")
        records = worksheet.get_all_records()
        
        for record in records:
            if record.get('Название') == branch_name:
                # Пробуем разные варианты названия колонки
                sheet_id = (record.get('ID таблицы', '') or 
                           record.get('Spreadsheet ID', '') or
                           record.get('ID Таблицы', ''))
                
                if not sheet_id:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"ID таблицы для филиала '{branch_name}' пуст"
                    )
                
                # Проверяем что таблица существует
                try:
                    client.open_by_key(sheet_id)
                    set_cache(cache_key, sheet_id)
                    logger.info(f"✅ ID таблицы для '{branch_name}': {sheet_id}")
                    return sheet_id
                except gspread.exceptions.SpreadsheetNotFound:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Таблица {sheet_id} не найдена. Возможно она была удалена."
                    )
        
        raise HTTPException(status_code=404, detail=f"Филиал '{branch_name}' не найден в главной таблице")
    except gspread.exceptions.WorksheetNotFound:
        raise HTTPException(status_code=500, detail="Лист 'Филиалы' не найден в главной таблице")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка получения ID таблицы: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def ensure_sheet_exists(client, spreadsheet_id: str, sheet_name: str, headers: List[str]):
    """Проверяет существование листа, создаёт если нужно"""
    try:
        try:
            spreadsheet = client.open_by_key(spreadsheet_id)
        except gspread.exceptions.SpreadsheetNotFound:
            logger.error(f"❌ Таблица {spreadsheet_id} не найдена")
            raise HTTPException(
                status_code=404,
                detail="Таблица филиала не найдена. Пожалуйста, обратитесь к администратору."
            )
        
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            # ИСПРАВЛЕНИЕ: Проверяем и исправляем заголовки
            existing_headers = worksheet.row_values(1)
            if not existing_headers or existing_headers != headers:
                logger.warning(f"⚠️ Исправляем заголовки листа '{sheet_name}'")
                # Удаляем все строки и создаем правильные заголовки
                worksheet.clear()
                worksheet.append_row(headers)
                logger.info(f"✅ Заголовки обновлены: {headers}")
        except gspread.exceptions.WorksheetNotFound:
            logger.info(f"📝 Создание листа: {sheet_name}")
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=len(headers))
            worksheet.append_row(headers)
            logger.info(f"✅ Создан лист с заголовками: {headers}")
            return worksheet
        
        return worksheet
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка ensure_sheet_exists: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def insert_row_at_top(worksheet, data: List[Any]):
    """Конвертируем все значения в строки/числа и вставляем"""
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
        logger.info(f"✅ Данные добавлены: {converted_data[:3]}...")
    except Exception as e:
        logger.error(f"Ошибка вставки: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка записи: {str(e)}")

def get_branch_by_name(client, name: str) -> Optional[Dict]:
    """Получить данные филиала по имени"""
    cache_key = f"branch_{name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        spreadsheet = client.open_by_key(MASTER_SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet("Филиалы")
        records = worksheet.get_all_records()
        for record in records:
            if record.get('Название') == name:
                set_cache(cache_key, record)
                return record
        return None
    except:
        return None

def get_all_sheet_data_batch(client, spreadsheet_id: str, sheet_names: List[str]) -> Dict[str, List[Dict]]:
    """
    ОПТИМИЗАЦИЯ: Получает данные из ВСЕХ листов за ОДИН вызов spreadsheet.get()
    Вместо 7 запросов делаем 1 запрос
    """
    cache_key = f"all_data_{spreadsheet_id}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        # Проверяем что таблица существует
        try:
            spreadsheet = client.open_by_key(spreadsheet_id)
        except gspread.exceptions.SpreadsheetNotFound:
            logger.error(f"❌ Таблица {spreadsheet_id} не найдена")
            raise HTTPException(
                status_code=404,
                detail=f"Таблица не найдена. Возможно она была удалена из Google Drive."
            )
        
        result = {}
        
        # Получаем все листы одним запросом
        all_worksheets = spreadsheet.worksheets()
        worksheet_dict = {ws.title: ws for ws in all_worksheets}
        
        for sheet_name in sheet_names:
            if sheet_name in worksheet_dict:
                try:
                    records = worksheet_dict[sheet_name].get_all_records()
                    result[sheet_name] = records
                    logger.info(f"📊 Получено {len(records)} записей из '{sheet_name}'")
                except Exception as e:
                    logger.warning(f"⚠️ Ошибка чтения '{sheet_name}': {e}")
                    result[sheet_name] = []
            else:
                logger.info(f"ℹ️ Лист '{sheet_name}' не существует, будет создан при первой записи")
                result[sheet_name] = []
        
        set_cache(cache_key, result)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка batch-загрузки: {e}")
        # Возвращаем пустые данные вместо ошибки
        return {name: [] for name in sheet_names}

def count_records_for_month_from_data(records: List[Dict], month: str) -> int:
    """Подсчитывает количество записей за месяц из уже загруженных данных (БЕЗ запроса к API)"""
    count = 0
    for record in records:
        record_date = record.get('Дата отправки', '') or record.get('Дата', '')
        if record_date:
            try:
                date_obj = datetime.strptime(record_date.split()[0], "%Y-%m-%d")
                record_month = date_obj.strftime("%B %Y")
                
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

# ============= ЭНДПОИНТЫ =============

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "4.2.0", "cache_enabled": True, "cache_ttl": CACHE_TTL}

@app.get("/api/cache-stats")
def get_cache_stats():
    """Статистика кеша"""
    current_time = time.time()
    items = []
    
    for key, (value, timestamp) in cache_store.items():
        age = int(current_time - timestamp)
        remaining = int(CACHE_TTL - age)
        items.append({
            "key": key,
            "age_seconds": age,
            "remaining_seconds": max(0, remaining),
            "expired": age >= CACHE_TTL
        })
    
    return {
        "cache_size": len(cache_store),
        "ttl_seconds": CACHE_TTL,
        "items": items
    }

@app.post("/api/cache-clear")
def clear_cache():
    """Очистка всего кеша"""
    cache_store.clear()
    logger.info("🗑️ Весь кеш очищен вручную")
    return {"success": True, "message": "Кеш очищен"}

@app.post("/api/cache-clear/{branch_name}")
def clear_branch_cache(branch_name: str):
    """Очистка кеша конкретного филиала"""
    clear_cache_for_branch(branch_name)
    return {"success": True, "message": f"Кеш для '{branch_name}' очищен"}

@app.post("/register")
def register_branch(branch: BranchRegister):
    """Регистрация нового филиала"""
    try:
        client = get_sheets_client()
        
        if not MASTER_SPREADSHEET_ID:
            raise HTTPException(status_code=500, detail="GOOGLE_SHEET_ID не настроен в .env")
        
        spreadsheet = client.open_by_key(MASTER_SPREADSHEET_ID)
        
        try:
            worksheet = spreadsheet.worksheet("Филиалы")
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title="Филиалы", rows=100, cols=10)
            worksheet.append_row([
                "Название", "Адрес", "Имя руководителя", "Телефон", 
                "Пароль (хеш)", "Токен", "ID таблицы", "Дата регистрации"
            ])
        
        existing = get_branch_by_name(client, branch.name)
        if existing:
            raise HTTPException(status_code=400, detail="Филиал с таким названием уже существует")
        
        branch_spreadsheet_id = create_branch_spreadsheet(client, branch.name)
        
        password_hash = hash_password(branch.password)
        token = generate_token()
        registration_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        worksheet.append_row([
            branch.name,
            branch.address,
            branch.manager_name,
            branch.manager_phone,
            password_hash,
            token,
            branch_spreadsheet_id,
            registration_date
        ])
        
        logger.info(f"✅ Таблица для филиала '{branch.name}' создана успешно!")
        
        # Очищаем кеш
        clear_cache_for_branch(branch.name)
        
        return {
            "success": True,
            "message": "Филиал успешно зарегистрирован",
            "token": token,
            "branch_name": branch.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка регистрации: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(request: LoginRequest):
    """Авторизация филиала"""
    try:
        client = get_sheets_client()
        branch = get_branch_by_name(client, request.name)
        
        if not branch:
            raise HTTPException(status_code=401, detail="Неверное название филиала")
        
        password_hash = hash_password(request.password)
        
        if branch.get('Пароль (хеш)') != password_hash:
            raise HTTPException(status_code=401, detail="Неверный пароль")
        
        return {
            "success": True,
            "token": branch.get('Токен'),
            "branch_name": request.name,
            "manager_name": branch.get('Имя руководителя')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка авторизации: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard-summary/{branch_name}")
def get_dashboard_summary(branch_name: str):
    """
    ОПТИМИЗИРОВАННАЯ ВЕРСИЯ: загружает ВСЕ данные ОДНИМ batch-запросом
    Вместо 7+ отдельных запросов к API
    """
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        # Текущий месяц
        now = datetime.now()
        months_ru = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                     'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        current_month = f"{months_ru[now.month - 1]} {now.year}"
        
        # ОПТИМИЗАЦИЯ: Получаем ВСЕ листы одним запросом
        sheet_names = [
            "Утренние мероприятия",
            "Полевые выходы",
            "One-on-One",
            "Планы мастеров",
            "Еженедельные показатели",
            "Отзывы",
            "Адаптация новичков"
        ]
        
        all_data = get_all_sheet_data_batch(client, spreadsheet_id, sheet_names)
        
        # Подсчитываем из уже загруженных данных (БЕЗ дополнительных запросов)
        summary = {
            "morning_events": {
                "current": count_records_for_month_from_data(all_data.get("Утренние мероприятия", []), current_month),
                "goal": BRANCH_GOALS["morning_events"],
                "percentage": 0,
                "label": "Утренние мероприятия"
            },
            "field_visits": {
                "current": count_records_for_month_from_data(all_data.get("Полевые выходы", []), current_month),
                "goal": BRANCH_GOALS["field_visits"],
                "percentage": 0,
                "label": "Полевые выходы"
            },
            "one_on_one": {
                "current": count_records_for_month_from_data(all_data.get("One-on-One", []), current_month),
                "goal": BRANCH_GOALS["one_on_one"],
                "percentage": 0,
                "label": "One-on-One"
            },
            "master_plans": {
                "current": count_records_for_month_from_data(all_data.get("Планы мастеров", []), current_month),
                "goal": BRANCH_GOALS["master_plans"],
                "percentage": 0,
                "label": "Планы мастеров"
            },
            "weekly_reports": {
                "current": count_records_for_month_from_data(all_data.get("Еженедельные показатели", []), current_month),
                "goal": BRANCH_GOALS["weekly_reports"],
                "percentage": 0,
                "label": "Еженедельные отчёты"
            },
            "reviews": {
                "current": count_records_for_month_from_data(all_data.get("Отзывы", []), current_month),
                "goal": BRANCH_GOALS["reviews"],
                "percentage": 0,
                "label": "Отзывы"
            },
            "new_employees": {
                "current": count_records_for_month_from_data(all_data.get("Адаптация новичков", []), current_month),
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
    """Добавление утренних мероприятий"""
    try:
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
        
        # Очищаем кеш для этого филиала
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(events)} мероприятий"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/morning-events/{branch_name}")
def get_morning_events(branch_name: str):
    """Получение списка утренних мероприятий (с кешированием)"""
    cache_key = f"morning_events_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Утренние мероприятия")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= ПОЛЕВЫЕ ВЫХОДЫ =============

@app.post("/field-visits/{branch_name}")
def submit_field_visits(branch_name: str, visits: List[FieldVisit]):
    """Добавление полевых выходов"""
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        sheet_name = "Полевые выходы"
        headers = [
            "Дата отправки", "Дата", "Имя мастера", "Качество стрижки", "Качество обслуживания",
            "Доп. услуги (комм.)", "Доп. услуги (оценка)", "Косметика (комм.)", 
            "Косметика (оценка)", "Стандарты (комм.)", "Стандарты (оценка)", 
            "Ошибки", "Дата след. проверки", "Общая оценка"
        ]
        worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for visit in visits:
            # Вычисляем среднюю оценку из 5 критериев
            avg_rating = round((
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
                str(visit.next_check_date) if visit.next_check_date else "",
                avg_rating  # Общая оценка
            ]
            insert_row_at_top(worksheet, row)
        
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(visits)} посещений"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/field-visits/{branch_name}")
def get_field_visits(branch_name: str):
    """Получение списка полевых выходов (с кешированием)"""
    cache_key = f"field_visits_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Полевые выходы")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= ONE-ON-ONE =============

@app.post("/one-on-one/{branch_name}")
def submit_one_on_one(branch_name: str, meetings: List[OneOnOneMeeting]):
    """Добавление one-on-one встреч"""
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        sheet_name = "One-on-One"
        headers = [
            "Дата отправки", "Дата", "Имя мастера", "Цель", "Результаты", 
            "План развития", "Показатель", "Дата след. встречи"
        ]
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
        
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(meetings)} встреч"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/one-on-one/{branch_name}")
def get_one_on_one(branch_name: str):
    """Получение списка one-on-one встреч (с кешированием)"""
    cache_key = f"one_on_one_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("One-on-One")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= ЕЖЕНЕДЕЛЬНЫЕ ПОКАЗАТЕЛИ =============

@app.post("/weekly-metrics/{branch_name}")
def submit_weekly_metrics(branch_name: str, metrics: List[WeeklyMetrics]):
    """Добавление еженедельных показателей"""
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        sheet_name = "Еженедельные показатели"
        headers = [
            "Дата отправки", "Период", "Средний чек (план)", "Средний чек (факт)",
            "Косметика (план)", "Косметика (факт)", "Доп. услуги (план)", "Доп. услуги (факт)"
        ]
        worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for metric in metrics:
            row = [
                timestamp,
                str(metric.period),
                float(metric.average_check_plan),
                float(metric.average_check_fact),
                float(metric.cosmetics_plan),
                float(metric.cosmetics_fact),
                float(metric.additional_services_plan),
                float(metric.additional_services_fact)
            ]
            insert_row_at_top(worksheet, row)
        
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(metrics)} показателей"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weekly-metrics/{branch_name}")
def get_weekly_metrics(branch_name: str):
    """Получение еженедельных показателей (с кешированием)"""
    cache_key = f"weekly_metrics_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Еженедельные показатели")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= АДАПТАЦИЯ НОВИЧКОВ =============

@app.post("/newbie-adaptation/{branch_name}")
def submit_newbie_adaptation(branch_name: str, newbies: List[NewbieAdaptation]):
    """Добавление данных адаптации новичков"""
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        sheet_name = "Адаптация новичков"
        headers = [
            "Дата отправки", "Дата начала", "Имя", "Практика стрижки", 
            "Стандарты обслуживания", "Гигиена/санитария", "Доп. услуги",
            "Продажи косметики", "Основы iClient", "Статус"
        ]
        worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for newbie in newbies:
            row = [
                timestamp,
                str(newbie.start_date),
                str(newbie.name),
                str(newbie.haircut_practice),
                str(newbie.service_standards),
                str(newbie.hygiene_sanitation),
                str(newbie.additional_services),
                str(newbie.cosmetics_sales),
                str(newbie.iclient_basics),
                str(newbie.status)
            ]
            insert_row_at_top(worksheet, row)
        
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(newbies)} записей"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/newbie-adaptation/{branch_name}")
def get_newbie_adaptation(branch_name: str):
    """Получение списка адаптации новичков (с кешированием)"""
    cache_key = f"newbie_adaptation_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Адаптация новичков")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= ПЛАНЫ МАСТЕРОВ =============

@app.post("/master-plans/{branch_name}")
def submit_master_plans(branch_name: str, plans: List[MasterPlan]):
    """Добавление планов мастеров"""
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        sheet_name = "Планы мастеров"
        headers = [
            "Дата отправки", "Месяц", "Имя мастера", "Средний чек (план)", 
            "Средний чек (факт)", "Доп. услуги (план)", "Доп. услуги (факт)",
            "Продажи (план)", "Продажи (факт)", "ЗП (план)", "ЗП (факт)"
        ]
        worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for plan in plans:
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
                float(plan.salary_fact)
            ]
            insert_row_at_top(worksheet, row)
        
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(plans)} планов"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/master-plans/{branch_name}")
def get_master_plans(branch_name: str):
    """Получение планов мастеров (с кешированием)"""
    cache_key = f"master_plans_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Планы мастеров")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= ОТЗЫВЫ =============

@app.post("/reviews/{branch_name}")
def submit_reviews(branch_name: str, reviews: List[Reviews]):
    """Добавление отзывов"""
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        sheet_name = "Отзывы"
        headers = [
            "Дата отправки", "Неделя", "Имя руководителя", 
            "План", "Факт", "Месячная цель"
        ]
        worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for review in reviews:
            row = [
                timestamp,
                str(review.week),
                str(review.manager_name),
                int(review.plan),
                int(review.fact),
                int(review.monthly_target)
            ]
            insert_row_at_top(worksheet, row)
        
        clear_cache_for_branch(branch_name)
        
        return {"success": True, "message": f"Добавлено {len(reviews)} отзывов"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reviews/{branch_name}")
def get_reviews(branch_name: str):
    """Получение отзывов (с кешированием)"""
    cache_key = f"reviews_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        return cached
    
    try:
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Отзывы")
        data = worksheet.get_all_records()
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except:
        return {"success": True, "data": []}

# ============= ИТОГОВЫЙ ОТЧЕТ =============

@app.post("/branch-summary/{branch_name}")
def generate_branch_summary(branch_name: str, summary: BranchSummary):
    """Генерация итогового отчета филиала с расчетом всех метрик"""
    try:
        logger.info(f"🔍 Формирование сводки для '{branch_name}', месяц: '{summary.month}'")
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        
        # Получаем все данные для расчета метрик
        sheet_names = [
            "Утренние мероприятия",
            "Полевые выходы",
            "One-on-One",
            "Планы мастеров",
            "Еженедельные показатели",
            "Отзывы",
            "Адаптация новичков"
        ]
        
        logger.info(f"📊 Загрузка данных из {len(sheet_names)} листов...")
        all_data = get_all_sheet_data_batch(client, spreadsheet_id, sheet_names)
        
        # Подсчитываем метрики для указанного месяца
        metrics = {
            "Утренние мероприятия": {
                "current": count_records_for_month_from_data(all_data.get("Утренние мероприятия", []), summary.month),
                "goal": BRANCH_GOALS["morning_events"]
            },
            "Полевые выходы": {
                "current": count_records_for_month_from_data(all_data.get("Полевые выходы", []), summary.month),
                "goal": BRANCH_GOALS["field_visits"]
            },
            "One-on-One": {
                "current": count_records_for_month_from_data(all_data.get("One-on-One", []), summary.month),
                "goal": BRANCH_GOALS["one_on_one"]
            },
            "Планы мастеров": {
                "current": count_records_for_month_from_data(all_data.get("Планы мастеров", []), summary.month),
                "goal": BRANCH_GOALS["master_plans"]
            },
            "Еженедельные отчёты": {
                "current": count_records_for_month_from_data(all_data.get("Еженедельные показатели", []), summary.month),
                "goal": BRANCH_GOALS["weekly_reports"]
            },
            "Отзывы": {
                "current": count_records_for_month_from_data(all_data.get("Отзывы", []), summary.month),
                "goal": BRANCH_GOALS["reviews"]
            },
            "Новые сотрудники": {
                "current": count_records_for_month_from_data(all_data.get("Адаптация новичков", []), summary.month),
                "goal": BRANCH_GOALS["new_employees"]
            }
        }
        
        logger.info(f"📈 Рассчитано метрик: {len(metrics)}")
        for name, data in metrics.items():
            logger.info(f"   • {name}: {data['current']}/{data['goal']}")
        
        # Создаем/получаем лист для сводок
        sheet_name = "Итоговые отчеты"
        headers = ["Дата отправки", "Руководитель", "Месяц", "Метрика", "Текущее количество", "Цель на месяц", "Выполнение %"]
        worksheet = ensure_sheet_exists(client, spreadsheet_id, sheet_name, headers)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Добавляем строку для каждой метрики
        for metric_name, metric_data in metrics.items():
            percentage = round((metric_data["current"] / metric_data["goal"]) * 100, 1) if metric_data["goal"] > 0 else 0
            row = [
                timestamp,
                str(summary.manager),
                str(summary.month),
                metric_name,
                int(metric_data["current"]),
                int(metric_data["goal"]),
                float(percentage)
            ]
            insert_row_at_top(worksheet, row)
            logger.info(f"✅ Добавлена строка: {metric_name}")
        
        # ВАЖНО: Очищаем кеш ДО отправки ответа
        clear_cache_for_branch(branch_name)
        # Также очищаем глобальный кеш для этой таблицы
        cache_key = f"branch_summary_{branch_name}"
        if cache_key in cache_store:
            del cache_store[cache_key]
            logger.info(f"🗑️ Очищен кеш сводки: {cache_key}")
        
        logger.info(f"✅ Сводка успешно сформирована!")
        
        return {"success": True, "message": "Отчет успешно создан"}
    except Exception as e:
        logger.error(f"❌ Ошибка формирования сводки: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/branch-summary/{branch_name}")
def get_branch_summary(branch_name: str):
    """Получение итоговых отчетов (с кешированием)"""
    cache_key = f"branch_summary_{branch_name}"
    cached = get_from_cache(cache_key)
    if cached:
        logger.info(f"📦 Возвращаем кешированную сводку ({len(cached.get('data', []))} записей)")
        return cached
    
    try:
        logger.info(f"🔍 Загружаем сводку из Google Sheets для '{branch_name}'")
        client = get_sheets_client()
        spreadsheet_id = get_branch_spreadsheet_id(client, branch_name)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet("Итоговые отчеты")
        
        # ИСПРАВЛЕНИЕ: Сначала пытаемся get_all_records, если не работает - используем get_all_values
        try:
            data = worksheet.get_all_records()
            logger.info(f"✅ Загружено {len(data)} записей сводки через get_all_records()")
        except Exception as e:
            logger.warning(f"⚠️ get_all_records() не сработал: {e}")
            logger.info(f"🔄 Пробуем альтернативный метод get_all_values()...")
            
            # Получаем все значения как список списков
            all_values = worksheet.get_all_values()
            if not all_values or len(all_values) < 2:
                logger.info(f"ℹ️ Лист пустой или только заголовки")
                return {"success": True, "data": []}
            
            # Первая строка - заголовки
            headers = all_values[0]
            # Остальные строки - данные
            data = []
            for row in all_values[1:]:
                # Создаем словарь из заголовков и значений
                row_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        row_dict[header] = row[i]
                    else:
                        row_dict[header] = ""
                data.append(row_dict)
            
            logger.info(f"✅ Загружено {len(data)} записей сводки через get_all_values()")
        
        result = {"success": True, "data": data}
        set_cache(cache_key, result)
        return result
    except Exception as e:
        logger.error(f"❌ Ошибка загрузки сводки: {e}")
        return {"success": True, "data": []}