# BarberCRM v5.0 — Система управления сетью барбершопов

## Что изменилось (v4.3 → v5.0)

- **Полный отказ от Google Sheets** — данные хранятся в SQLite на сервере
- **Админ-панель** — отдельный вход для администратора с просмотром всех филиалов
- **Собственный почтовый сервер** — поддержка любого SMTP (STARTTLS и SSL)
- **Вход по IP** — приложение работает на отдельном порту, не мешает основному сайту
- **Nginx-проксирование API** — фронт и бэк общаются через `/api/`, не нужен отдельный порт
- **Все настройки в .env** — деплой через `git pull`, секреты в GitHub Secrets
- **Volume для БД** — данные сохраняются между перезапусками контейнеров

## Архитектура

```
┌──────────────────────────────────────────────────┐
│                   Docker Network                 │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Frontend │   │ Backend  │   │ Telegram Bot │ │
│  │ (Nginx)  │──▶│ (FastAPI)│◀──│  (python-    │ │
│  │  :3000   │   │  :8000   │   │  telegram-bot│ │
│  └──────────┘   └────┬─────┘   └──────────────┘ │
│                      │                           │
│              ┌───────▼────────┐                  │
│              │    SQLite DB   │                  │
│              │  (Docker Vol)  │                  │
│              └────────────────┘                  │
└──────────────────────────────────────────────────┘
```

## Быстрый старт

### 1. Клонирование
```bash
git clone https://github.com/<your-repo>/barber-crm-app.git
cd barber-crm-app
```

### 2. Настройка
```bash
cp .env.example .env
nano .env   # заполните все переменные
```

### 3. Запуск
```bash
docker compose up -d --build
```

После запуска:
- **CRM:** `http://<IP-сервера>:3000`
- **Backend API:** `http://<IP-сервера>:8000`
- **Health check:** `http://<IP-сервера>:8000/health`

## Переменные окружения (.env)

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `APP_PORT` | Порт фронтенда | `3000` |
| `ADMIN_USERNAME` | Логин админа | `admin` |
| `ADMIN_PASSWORD` | Пароль админа | `admin` |
| `SMTP_HOST` | Адрес почтового сервера | `mail.example.com` |
| `SMTP_PORT` | Порт SMTP | `587` |
| `SMTP_USER` | Email отправителя | — |
| `SMTP_PASSWORD` | Пароль SMTP | — |
| `SMTP_USE_SSL` | SSL вместо STARTTLS | `false` |
| `REPORT_EMAIL_TO` | Email получателя отчётов | — |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота | — |
| `BOT_ACCESS_PASSWORD` | Пароль для бота | — |

## GitHub Secrets для CI/CD

| Secret | Описание |
|--------|----------|
| `SERVER_HOST` | IP-адрес сервера |
| `SERVER_USER` | SSH-пользователь |
| `SSH_PASSWORD` | SSH-пароль |
| `APP_PORT` | Порт CRM (например `3000`) |
| `ADMIN_USERNAME` | Логин админа |
| `ADMIN_PASSWORD` | Пароль админа |
| `SMTP_HOST` | SMTP-сервер |
| `SMTP_PORT` | Порт SMTP |
| `SMTP_USER` | Email отправителя |
| `SMTP_PASSWORD` | Пароль SMTP |
| `SMTP_USE_SSL` | `true` или `false` |
| `REPORT_EMAIL_TO` | Email для отчётов |
| `TELEGRAM_BOT_TOKEN` | Токен бота |
| `BOT_ACCESS_PASSWORD` | Пароль бота |

## Структура проекта

```
barber-crm-app/
├── backend/
│   ├── main.py              # FastAPI + SQLite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── App.jsx              # React SPA (CDN + Babel)
│   ├── nginx.conf           # Nginx с проксированием /api/
│   ├── logo.png
│   └── Dockerfile
├── telegram-bot/
│   ├── bot.py
│   ├── requirements.txt
│   └── Dockerfile
├── .github/workflows/
│   └── deploy.yml
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Совместимость с существующим сервером

Сервер уже обслуживает сайт на порту 80 (через домен). CRM запускается на отдельном порту (по умолчанию 3000) и доступна по IP:

- **Сайт:** `https://yourdomain.com` (порт 80/443, через домен)
- **CRM:** `http://YOUR_IP:3000` (по IP-адресу)

## Бэкап данных

База данных хранится в Docker volume `barber_data`. Для бэкапа:

```bash
# Скопировать БД из контейнера
docker cp barber_backend:/app/data/barbercrm.db ./backup_$(date +%Y%m%d).db

# Или найти volume на хосте
docker volume inspect barber-crm-app_barber_data
```
