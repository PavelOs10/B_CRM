#!/bin/bash
# ====================================================
# BarberCRM v5.0 — Скрипт деплоя
# ====================================================
# Использование:
#   Первый раз:  bash deploy.sh
#   Обновление:  cd /opt/barber-crm-app && git pull && bash deploy.sh
# ====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="/var/www/barber-crm/frontend"
NGINX_CONF="/etc/nginx/sites-available/barber-crm"
NGINX_LINK="/etc/nginx/sites-enabled/barber-crm"

echo ""
echo "=========================================="
echo "  BarberCRM v5.0 — Деплой"
echo "=========================================="
echo ""

# ---------- 0. Проверка docker compose ----------
echo -n "[0/6] Проверка Docker Compose... "
if docker compose version > /dev/null 2>&1; then
    DC="docker compose"
    echo -e "${GREEN}OK${NC} (docker compose)"
elif docker-compose --version > /dev/null 2>&1; then
    DC="docker-compose"
    echo -e "${GREEN}OK${NC} (docker-compose)"
else
    echo -e "${RED}НЕ НАЙДЕН${NC}"
    echo ""
    echo "  Устанавливаю docker-compose-v2..."
    apt-get update -qq && apt-get install -y -qq docker-compose-v2
    if docker compose version > /dev/null 2>&1; then
        DC="docker compose"
        echo -e "  ${GREEN}✓ Установлен${NC}"
    else
        echo -e "  ${RED}Не удалось установить. Установите вручную:${NC}"
        echo "    apt install docker-compose-v2"
        exit 1
    fi
fi

# ---------- 1. Проверка .env ----------
echo -n "[1/6] Проверка .env... "
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}НЕТ ФАЙЛА${NC}"
    echo ""
    echo "  Создайте .env из примера:"
    echo "    cp .env.example .env"
    echo "    nano .env"
    echo ""
    exit 1
fi
echo -e "${GREEN}OK${NC}"

# ---------- 2. Фронтенд ----------
echo -n "[2/6] Копирование фронтенда... "
mkdir -p "$FRONTEND_DIR"
cp "$PROJECT_DIR/frontend/index.html" "$FRONTEND_DIR/"
cp "$PROJECT_DIR/frontend/App.jsx" "$FRONTEND_DIR/"
cp "$PROJECT_DIR/frontend/logo.png" "$FRONTEND_DIR/" 2>/dev/null || true
echo -e "${GREEN}OK${NC} → $FRONTEND_DIR"

# ---------- 3. Nginx ----------
echo -n "[3/6] Настройка Nginx... "
NGINX_CHANGED=false

if [ ! -f "$NGINX_CONF" ]; then
    cp "$PROJECT_DIR/nginx/barber-crm.conf" "$NGINX_CONF"
    ln -sf "$NGINX_CONF" "$NGINX_LINK"
    NGINX_CHANGED=true
    echo -e "${GREEN}СОЗДАН${NC}"
else
    # Проверяем, изменился ли конфиг
    if ! diff -q "$PROJECT_DIR/nginx/barber-crm.conf" "$NGINX_CONF" > /dev/null 2>&1; then
        cp "$PROJECT_DIR/nginx/barber-crm.conf" "$NGINX_CONF"
        NGINX_CHANGED=true
        echo -e "${YELLOW}ОБНОВЛЁН${NC}"
    else
        echo -e "${GREEN}БЕЗ ИЗМЕНЕНИЙ${NC}"
    fi
fi

if [ "$NGINX_CHANGED" = true ]; then
    echo -n "      Проверка конфигурации Nginx... "
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo -e "${GREEN}OK, перезагружен${NC}"
    else
        echo -e "${RED}ОШИБКА КОНФИГА!${NC}"
        echo "  Основной сайт НЕ затронут. Исправьте nginx/barber-crm.conf"
        nginx -t
        exit 1
    fi
fi

# ---------- 4. Остановка старых контейнеров ----------
echo -n "[4/6] Остановка старых контейнеров... "
cd "$PROJECT_DIR"
$DC down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}OK${NC}"

# ---------- 5. Сборка и запуск ----------
echo "[5/6] Сборка Docker-образов..."
$DC build --no-cache
echo ""

echo -n "[5/6] Запуск контейнеров... "
$DC up -d
echo -e "${GREEN}OK${NC}"

# ---------- 6. Проверка ----------
echo ""
echo "[6/6] Проверка (ожидание 10 сек)..."
sleep 10

echo ""
BACKEND_OK=false
FRONTEND_OK=false
BOT_OK=false

# Backend
if curl -sf http://127.0.0.1:8100/health > /dev/null 2>&1; then
    echo -e "  Backend:  ${GREEN}✓ работает${NC} (127.0.0.1:8100)"
    BACKEND_OK=true
else
    echo -e "  Backend:  ${RED}✗ не отвечает${NC}"
    echo "  Логи: docker logs barber_crm_backend --tail=20"
fi

# Frontend
if curl -sf http://127.0.0.1:8080/ > /dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✓ работает${NC} (порт 8080)"
    FRONTEND_OK=true
else
    echo -e "  Frontend: ${RED}✗ не отвечает на порту 8080${NC}"
fi

# Bot
if docker ps --filter "name=barber_crm_bot" --filter "status=running" --format '{{.Names}}' | grep -q barber_crm_bot; then
    echo -e "  Telegram: ${GREEN}✓ работает${NC}"
    BOT_OK=true
else
    echo -e "  Telegram: ${YELLOW}⚠ не запущен${NC} (возможно нет токена)"
fi

# Итог
echo ""
echo "=========================================="
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "  ${GREEN}✓ Деплой завершён успешно!${NC}"
else
    echo -e "  ${YELLOW}⚠ Деплой завершён с предупреждениями${NC}"
fi
echo "=========================================="
echo ""
echo "  CRM:    http://$(hostname -I | awk '{print $1}'):8080"
echo "  Сайт:   https://barber-house.academy (не затронут)"
echo ""
echo "  Обновление в будущем:"
echo "    cd $PROJECT_DIR && git pull && bash deploy.sh"
echo ""
