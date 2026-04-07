# BarberCRM v5.0 — Система управления сетью барбершопов

## Что изменилось (v4.3 → v5.0)

- **Полный отказ от Google Sheets** — данные хранятся в SQLite на сервере
- **Админ-панель** — отдельный вход для администратора с просмотром всех филиалов
- **Собственный почтовый сервер** — поддержка любого SMTP (STARTTLS и SSL)
- **Интеграция с хостовым Nginx** — CRM по IP:8080, сайт на домене не затрагивается
- **Все настройки в .env** — деплой через `git pull`

## Архитектура на сервере

```
Сервер (166.1.201.183)
│
├── Nginx (хост) — порт 80/443
│   ├── barber-house.academy → /var/www/barber/dist + proxy :3100 (сайт)
│   └── *:8080               → /var/www/barber-crm/frontend + proxy :8100 (CRM)
│
├── Docker
│   ├── barber_crm_backend (:8100 → :8000) — FastAPI + SQLite
│   └── barber_crm_bot — Telegram-бот
│
├── Node.js (:3100) — бэкенд сайта (не трогаем)
└── amnezia-awg2 — VPN (не трогаем)
```

**Ключевой принцип:** CRM живёт на порту 8080, бэкенд на 8100 — оба привязаны к localhost/отдельному порту и никак не пересекаются с сайтом на 80/443.

## Быстрый старт

### 1. Клонирование
```bash
cd /opt
git clone https://github.com/<your-repo>/barber-crm-app.git
cd barber-crm-app
```

### 2. Настройка .env
```bash
cp .env.example .env
nano .env
```

### 3. Деплой фронтенда
```bash
mkdir -p /var/www/barber-crm/frontend
cp frontend/index.html frontend/App.jsx frontend/logo.png /var/www/barber-crm/frontend/
```

### 4. Настройка Nginx
```bash
cp nginx/barber-crm.conf /etc/nginx/sites-available/barber-crm
ln -s /etc/nginx/sites-available/barber-crm /etc/nginx/sites-enabled/barber-crm
nginx -t && systemctl reload nginx
```

### 5. Запуск Docker
```bash
docker compose up -d --build
```

### Проверка
- **CRM:** http://166.1.201.183:8080
- **Backend API:** http://166.1.201.183:8100/health (только с сервера: curl http://127.0.0.1:8100/health)
- **Сайт:** https://barber-house.academy (не затронут)

## Переменные окружения (.env)

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `ADMIN_USERNAME` | Логин админа | `admin` |
| `ADMIN_PASSWORD` | Пароль админа | `admin` |
| `SMTP_HOST` | Почтовый сервер | `mail.example.com` |
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
| `SERVER_HOST` | IP сервера |
| `SERVER_USER` | SSH-пользователь |
| `SSH_PASSWORD` | SSH-пароль |
| `ADMIN_USERNAME` | Логин админа |
| `ADMIN_PASSWORD` | Пароль админа |
| `SMTP_HOST` / `SMTP_PORT` | SMTP-сервер |
| `SMTP_USER` / `SMTP_PASSWORD` | Почтовые реквизиты |
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
│   ├── index.html           # Точка входа
│   ├── App.jsx              # React SPA (всё приложение)
│   └── logo.png
├── telegram-bot/
│   ├── bot.py
│   ├── requirements.txt
│   └── Dockerfile
├── nginx/
│   └── barber-crm.conf      # Конфиг для хостового Nginx (порт 8080)
├── .github/workflows/
│   └── deploy.yml
├── docker-compose.yml        # Только backend + bot (без фронтенда)
├── .env.example
├── .gitignore
└── README.md
```

## Бэкап данных

```bash
# БД в Docker volume
docker cp barber_crm_backend:/app/data/barbercrm.db ./backup_$(date +%Y%m%d).db
```
