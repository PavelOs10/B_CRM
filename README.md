# ✂️ BarberCRM — Система управления сетью барбершопов Barber House

<p align="center">
  <img src="frontend/logo.png" alt="Barber House Logo" width="120">
</p>

<p align="center">
  <strong>Внутренняя CRM-система для руководителей филиалов сети барбершопов</strong><br>
  Учёт KPI, контроль мастеров, отчётность — всё в одном месте
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.3.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/python-3.11-green" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104-009688" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED" alt="Docker">
  <img src="https://img.shields.io/badge/deploy-GitHub%20Actions-black" alt="CI/CD">
</p>

---

## 📖 О проекте

BarberCRM — это веб-приложение для сети барбершопов **Barber House**, предназначенное для руководителей филиалов. Система позволяет вести учёт ключевых показателей работы, отслеживать выполнение планов и формировать отчётность. Все данные хранятся в Google Sheets, что обеспечивает прозрачность и доступность без необходимости в собственной базе данных.

### Ключевые возможности

- **Дашборд** — сводка план/факт по всем направлениям работы филиала с визуальным отображением прогресса
- **Утренние мероприятия** — учёт ежедневных собраний команды с оценкой эффективности
- **Полевые выходы** — контроль качества работы мастеров (стрижка, обслуживание, стандарты, продажи)
- **One-on-One встречи** — индивидуальные встречи с мастерами, постановка целей и планов развития
- **Планы мастеров** — отслеживание финансовых показателей каждого мастера (средний чек, продажи, ЗП)
- **Еженедельные показатели** — план/факт по среднему чеку, косметике и доп. услугам
- **Отзывы** — учёт клиентских отзывов с недельной и месячной динамикой
- **Адаптация новичков** — чек-лист стажировки новых сотрудников
- **Итоговые отчёты** — автоматическая генерация месячной сводки по всем метрикам
- **Email-рассылка отчётов** — отправка отчётов в формате Excel на email за выбранный период
- **Telegram-бот** — просмотр данных и дашборда прямо из Telegram (режим только чтение)

---

## 🏗 Архитектура

Проект состоит из трёх сервисов, объединённых в Docker Compose:

```
┌──────────────────────────────────────────────────┐
│                   Docker Network                 │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Frontend │   │ Backend  │   │ Telegram Bot │ │
│  │ (Nginx)  │──▶│ (FastAPI)│◀──│  (python-    │ │
│  │  :80     │   │  :8000   │   │  telegram-bot│ │
│  └──────────┘   └────┬─────┘   └──────────────┘ │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Google Sheets  │
              │  (хранилище)    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Google Drive   │
              │  (файлы таблиц) │
              └─────────────────┘
```

| Сервис | Технологии | Описание |
|--------|-----------|----------|
| **Frontend** | React 18, Tailwind CSS, Nginx | SPA-приложение, отрисовка в браузере через Babel |
| **Backend** | Python 3.11, FastAPI, gspread | REST API, работа с Google Sheets, генерация Excel, отправка email |
| **Telegram Bot** | python-telegram-bot, httpx | Бот для руководителя, работает через Backend API |

---

## 🚀 Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Google Cloud проект с включёнными API: Google Sheets API, Google Drive API
- Сервисный аккаунт Google (или OAuth-токен) — см. раздел «Настройка Google»

### 1. Клонирование репозитория

```bash
git clone https://github.com/<your-username>/barber-crm-app.git
cd barber-crm-app
```

### 2. Настройка переменных окружения

Скопируйте файл-пример и заполните значениями:

```bash
cp .env.example .env
```

Обязательные переменные:

| Переменная | Описание |
|-----------|----------|
| `GOOGLE_SHEET_ID` | ID главной Google-таблицы (из URL) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON-ключ сервисного аккаунта (целиком, в одинарных кавычках) |
| `GOOGLE_DRIVE_FOLDER_ID` | ID папки на Google Drive для таблиц филиалов (опционально) |

Для email-отчётов:

| Переменная | Описание |
|-----------|----------|
| `REPORT_EMAIL_TO` | Email получателя отчётов |
| `SMTP_HOST` | SMTP-сервер (по умолчанию `smtp.gmail.com`) |
| `SMTP_PORT` | Порт (по умолчанию `587`) |
| `SMTP_USER` | Email отправителя |
| `SMTP_PASSWORD` | Пароль приложения (App Password для Gmail) |

Для Telegram-бота:

| Переменная | Описание |
|-----------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather |
| `BOT_ACCESS_PASSWORD` | Пароль для входа в бота (пусто = доступ без пароля) |

### 3. Запуск

```bash
docker compose up -d --build
```

После запуска:
- Фронтенд: `http://localhost`
- Backend API: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

---

## ⚙️ Настройка Google

### Вариант A: Сервисный аккаунт (рекомендуется для продакшена)

1. Откройте [Google Cloud Console](https://console.cloud.google.com)
2. Создайте проект или выберите существующий
3. Включите **Google Sheets API** и **Google Drive API**
4. Перейдите в **IAM & Admin → Service Accounts** → создайте сервисный аккаунт
5. Создайте JSON-ключ и вставьте его содержимое в переменную `GOOGLE_SERVICE_ACCOUNT_JSON`
6. Предоставьте сервисному аккаунту доступ к главной таблице (через «Поделиться»)

### Вариант B: OAuth-токен (для личного Google Drive)

Если у проекта нет биллинга в Google Cloud, можно использовать OAuth:

```bash
python3 di.py
```

Скрипт проведёт через процесс авторизации и сгенерирует токен для переменной `GOOGLE_OAUTH_TOKEN`.

### Подготовка главной таблицы

Создайте Google-таблицу и добавьте лист **«Филиалы»** с заголовками:

```
Название | Адрес | Имя руководителя | Телефон | Пароль (хеш) | Токен | ID таблицы | Дата регистрации
```

ID таблицы из URL `https://docs.google.com/spreadsheets/d/ID_ТУТ/edit` скопируйте в `GOOGLE_SHEET_ID`.

---

## 📡 API

Backend предоставляет REST API на базе FastAPI. Документация автоматически доступна по адресу `http://localhost:8000/docs` (Swagger UI).

### Основные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Проверка состояния сервиса |
| `POST` | `/register` | Регистрация нового филиала |
| `POST` | `/login` | Авторизация филиала |
| `GET` | `/branches` | Список всех филиалов |
| `GET` | `/dashboard-summary/{branch}` | Сводка дашборда |
| `GET/POST` | `/morning-events/{branch}` | Утренние мероприятия |
| `GET/POST` | `/field-visits/{branch}` | Полевые выходы |
| `GET/POST` | `/one-on-one/{branch}` | One-on-One встречи |
| `GET/POST` | `/weekly-metrics/{branch}` | Еженедельные показатели |
| `GET/POST` | `/master-plans/{branch}` | Планы мастеров |
| `GET/POST` | `/reviews/{branch}` | Отзывы |
| `GET/POST` | `/newbie-adaptation/{branch}` | Адаптация новичков |
| `GET/POST` | `/branch-summary/{branch}` | Итоговый отчёт |
| `POST` | `/send-report/{branch}` | Отправка отчёта на email |

### Кеширование

Backend реализует in-memory кеш с TTL 300 секунд для снижения нагрузки на Google Sheets API. Управление кешем:

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/cache-stats` | Статистика кеша |
| `POST` | `/api/cache-clear` | Очистить весь кеш |
| `POST` | `/api/cache-clear/{branch}` | Очистить кеш филиала |

---

## 🤖 Telegram-бот

Бот предназначен для руководителя и работает в режиме «только просмотр». Он общается с Backend по внутренней Docker-сети.

### Возможности

- Просмотр дашборда с прогресс-барами
- Просмотр последних записей по каждому разделу (до 10 записей)
- Навигация по филиалам через кнопки
- Авторизация по паролю (опционально)

### Команды

| Команда | Описание |
|---------|----------|
| `/start` | Запуск бота / вход |
| `/cancel` | Остановка бота |

---

## 🔄 CI/CD

Проект настроен на автоматический деплой через **GitHub Actions**. При пуше в ветку `main` запускается workflow, который:

1. Подключается к серверу по SSH
2. Обновляет код из репозитория
3. Создаёт `.env` из GitHub Secrets
4. Собирает Docker-образы
5. Запускает контейнеры
6. Проверяет health check всех сервисов

### Необходимые GitHub Secrets

| Secret | Описание |
|--------|----------|
| `SERVER_HOST` | IP-адрес или домен сервера |
| `SERVER_USER` | SSH-пользователь |
| `SSH_PASSWORD` | SSH-пароль |
| `GOOGLE_SHEET_ID` | ID главной Google-таблицы |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON сервисного аккаунта |
| `GOOGLE_DRIVE_FOLDER_ID` | ID папки на Google Drive |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота |
| `BOT_ACCESS_PASSWORD` | Пароль доступа к боту |
| `SMTP_USER` | Email отправителя |
| `SMTP_PASSWORD` | Пароль приложения SMTP |
| `REPORT_EMAIL_TO` | Email получателя отчётов |
| `JWT_SECRET` | Секретный ключ |

---

## 📁 Структура проекта

```
barber-crm-app/
├── backend/
│   ├── main.py              # FastAPI-приложение (API, модели, логика)
│   ├── requirements.txt     # Python-зависимости
│   └── Dockerfile
├── frontend/
│   ├── index.html           # Точка входа (React через CDN + Babel)
│   ├── App.jsx              # Основной компонент приложения
│   ├── logo.png             # Логотип Barber House
│   ├── package.json
│   ├── Dockerfile           # Nginx для раздачи статики
│   └── src/
│       ├── api/
│       │   └── index.js     # API-клиент
│       ├── components/
│       │   ├── UI.jsx       # UI-компоненты
│       │   └── Icons.jsx    # SVG-иконки
│       └── utils/
│           ├── config.js    # Конфигурация (URL API, цели KPI)
│           └── helpers.js   # Утилиты
├── telegram-bot/
│   ├── bot.py               # Telegram-бот
│   ├── requirements.txt     # Python-зависимости
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions — автодеплой
├── di.py                    # Скрипт получения OAuth-токена Google
├── docker-compose.yml       # Оркестрация всех сервисов
├── .env.example             # Пример переменных окружения
└── .gitignore
```

---

## 🛠 Технологический стек

**Backend:** Python 3.11, FastAPI, Uvicorn, gspread, google-auth, openpyxl, Pydantic

**Frontend:** React 18 (CDN), Tailwind CSS, Babel (in-browser transpilation), Nginx

**Telegram Bot:** python-telegram-bot 21.6, httpx

**Инфраструктура:** Docker, Docker Compose, GitHub Actions, Google Sheets API, Google Drive API

---

## 📊 Целевые показатели (KPI)

Система отслеживает выполнение месячных целей для каждого филиала:

| Метрика | Цель в месяц |
|---------|-------------|
| Утренние мероприятия | 16 |
| Полевые выходы | 4 |
| One-on-One встречи | 6 |
| Еженедельные отчёты | 4 |
| Планы мастеров | 10 |
| Отзывы | 52 |
| Новые сотрудники | 10 |

---

## 📄 Лицензия

Проект является внутренним продуктом сети барбершопов **Barber House**. 

По вопросам @IDDQD11