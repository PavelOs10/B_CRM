# BarberCRM v5.0

CRM-система для сети барбершопов Barber House.

## Установка (первый раз)

```bash
# 1. Клонировать
cd /opt
git clone https://github.com/<ваш-репо>/barber-crm-app.git
cd barber-crm-app

# 2. Настроить
cp .env.example .env
nano .env

# 3. Запустить
bash deploy.sh
```

CRM будет доступна: `http://ВАШ_IP:8080`

## Обновление

```bash
cd /opt/barber-crm-app
git pull
bash deploy.sh
```

## Что где

| Компонент | Адрес | Описание |
|-----------|-------|----------|
| CRM | http://IP:8080 | Веб-интерфейс |
| Backend API | 127.0.0.1:8100 | FastAPI + SQLite (Docker) |
| Telegram-бот | — | Работает через Backend API |
| Сайт | https://barber-house.academy | Не затрагивается |

## Структура

```
barber-crm-app/
├── backend/           # FastAPI + SQLite (Docker)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/          # React SPA (раздаётся Nginx хоста)
│   ├── index.html
│   ├── App.jsx
│   └── logo.png
├── telegram-bot/      # Telegram-бот (Docker)
│   ├── bot.py
│   ├── requirements.txt
│   └── Dockerfile
├── nginx/
│   └── barber-crm.conf   # Конфиг для Nginx (порт 8080)
├── docker-compose.yml     # Backend + Bot
├── deploy.sh              # Скрипт деплоя
├── .env.example           # Шаблон настроек
└── .gitignore
```

## Бэкап базы данных

```bash
docker cp barber_crm_backend:/app/data/barbercrm.db ./backup_$(date +%Y%m%d).db
```
