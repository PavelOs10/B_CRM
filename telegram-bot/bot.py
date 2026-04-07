#!/usr/bin/env python3
"""
BarberCRM Telegram Bot — бот для руководителя (только просмотр).
Работает ТОЛЬКО через Backend API по внутренней сети Docker.
Кнопки — ReplyKeyboardMarkup (вместо клавиатуры телефона).
Вход по паролю (BOT_ACCESS_PASSWORD).
"""

import os
import logging
import httpx
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ConversationHandler, filters, ContextTypes,
)

# ─── Настройки ────────────────────────────────────────────────
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://barber_crm_backend:8000")
BOT_ACCESS_PASSWORD = os.getenv("BOT_ACCESS_PASSWORD", "")

logging.basicConfig(
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("barber_bot")

# Авторизованные user_id (в памяти, сбрасывается при рестарте контейнера)
authorized_users: set[int] = set()

# ─── Состояния ────────────────────────────────────────────────
(
    AUTH_PASSWORD,
    MAIN_MENU,
    SELECT_BRANCH,
    BRANCH_MENU,
) = range(4)

# ─── Клавиатуры ───────────────────────────────────────────────
KB_MAIN = ReplyKeyboardMarkup(
    [
        ["📊 Выбрать филиал"],
        ["ℹ️ Помощь", "🚪 Выйти"],
    ],
    resize_keyboard=True,
)

KB_BRANCH_MENU = ReplyKeyboardMarkup(
    [
        ["📈 Дашборд"],
        ["🌅 Утренние мероприятия", "🚶 Полевые выходы"],
        ["🤝 One-on-One", "📋 Планы мастеров"],
        ["📊 Еженедельные показатели", "⭐ Отзывы"],
        ["👶 Адаптация новичков", "📝 Итоговые отчёты"],
        ["🔙 Назад к списку филиалов"],
    ],
    resize_keyboard=True,
)

SECTION_MAP = {
    "🌅 Утренние мероприятия": ("morning-events", "Утренние мероприятия"),
    "🚶 Полевые выходы": ("field-visits", "Полевые выходы"),
    "🤝 One-on-One": ("one-on-one", "One-on-One"),
    "📋 Планы мастеров": ("master-plans", "Планы мастеров"),
    "📊 Еженедельные показатели": ("weekly-metrics", "Еженедельные показатели"),
    "⭐ Отзывы": ("reviews", "Отзывы"),
    "👶 Адаптация новичков": ("newbie-adaptation", "Адаптация новичков"),
    "📝 Итоговые отчёты": ("branch-summary", "Итоговые отчёты"),
}


# ─── HTTP-клиент к Backend API ────────────────────────────────
async def api_get(path: str) -> dict | None:
    """GET-запрос к backend. Возвращает JSON или None."""
    url = f"{BACKEND_URL}/{path}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url)
            logger.info(f"GET {url} → {r.status_code}")
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"API {url}: HTTP {e.response.status_code} — {e.response.text[:200]}")
    except Exception as e:
        logger.error(f"API {url}: {type(e).__name__}: {e}")
    return None


async def fetch_branches() -> list[str]:
    """Получает список филиалов через Backend API."""
    data = await api_get("branches")
    if data and data.get("success"):
        return data.get("branches", [])
    logger.error(f"fetch_branches failed: {data}")
    return []


# ─── Форматирование ───────────────────────────────────────────
def _esc(text: str) -> str:
    """Экранирование для MarkdownV2."""
    for ch in r"_*[]()~`>#+-=|{}.!":
        text = text.replace(ch, f"\\{ch}")
    return text


def _bar(pct: float, n: int = 10) -> str:
    f = int(min(pct, 100) / 100 * n)
    return "▓" * f + "░" * (n - f)


def format_dashboard(data: dict, branch: str) -> str:
    summary = data.get("summary", {})
    lines = [f"📊  *Дашборд: {_esc(branch)}*\n"]

    for key, emoji in [
        ("morning_events", "🌅"), ("field_visits", "🚶"),
        ("one_on_one", "🤝"), ("master_plans", "📋"),
        ("weekly_reports", "📊"), ("reviews", "⭐"),
        ("new_employees", "👶"),
    ]:
        it = summary.get(key, {})
        label = it.get("label", key)
        cur, goal, pct = it.get("current", 0), it.get("goal", 0), it.get("percentage", 0)
        lines.append(f"{emoji} *{_esc(label)}*")
        lines.append(f"    {cur}/{goal}  \\({_esc(str(pct))}%\\)  {_bar(pct)}\n")

    return "\n".join(lines)


def format_records(records: list[dict], section: str, branch: str) -> str:
    if not records:
        return f"📭 В разделе «{_esc(section)}» филиала «{_esc(branch)}» пока нет записей\\."

    total = len(records)
    show = records[:10]
    lines = [
        f"📋 *{_esc(section)}* — {_esc(branch)}",
        f"Всего записей: {total}  \\(последние {len(show)}\\)\n",
    ]

    for i, rec in enumerate(show, 1):
        lines.append(f"─── {i} ───")
        for k, v in rec.items():
            if v in ("", None):
                continue
            lines.append(f"*{_esc(str(k))}:* {_esc(str(v))}")
        lines.append("")

    if total > 10:
        lines.append(f"_\\.\\.\\.и ещё {total - 10}_")
    return "\n".join(lines)


def _split(text: str, limit: int = 4000) -> list[str]:
    if len(text) <= limit:
        return [text]
    parts: list[str] = []
    while text:
        if len(text) <= limit:
            parts.append(text)
            break
        idx = text.rfind("\n", 0, limit)
        if idx == -1:
            idx = limit
        parts.append(text[:idx])
        text = text[idx:].lstrip("\n")
    return parts


async def _send(update: Update, text: str, kb=None, md: bool = True):
    """Отправка с разбивкой длинных сообщений."""
    for chunk in _split(text):
        await update.message.reply_text(
            chunk,
            parse_mode="MarkdownV2" if md else None,
            reply_markup=kb,
        )


# ─── Хэндлеры ────────────────────────────────────────────────

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    user = update.effective_user
    ctx.user_data.clear()

    if not BOT_ACCESS_PASSWORD:
        authorized_users.add(user.id)

    if user.id in authorized_users:
        await _send(update, f"Добро пожаловать, {_esc(user.first_name)}\\!\nВыберите действие\\.", KB_MAIN)
        return MAIN_MENU

    await update.message.reply_text("🔐 Для доступа введите пароль:", reply_markup=ReplyKeyboardRemove())
    return AUTH_PASSWORD


async def auth_handler(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    user = update.effective_user
    pwd = update.message.text.strip()

    try:
        await update.message.delete()
    except Exception:
        pass

    if pwd == BOT_ACCESS_PASSWORD:
        authorized_users.add(user.id)
        logger.info(f"✅ Авторизован: {user.id} ({user.first_name})")
        await _send(update, f"✅ Доступ разрешён\\!\nДобро пожаловать, {_esc(user.first_name)}\\!", KB_MAIN)
        return MAIN_MENU

    logger.warning(f"⛔ Неверный пароль: {user.id}")
    await _send(update, "❌ Неверный пароль\\. Попробуйте ещё раз или /start")
    return AUTH_PASSWORD


async def main_menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    user = update.effective_user

    if BOT_ACCESS_PASSWORD and user.id not in authorized_users:
        await update.message.reply_text("🔐 Сессия истекла. Введите пароль:", reply_markup=ReplyKeyboardRemove())
        return AUTH_PASSWORD

    if text == "📊 Выбрать филиал":
        await update.message.reply_text("⏳ Загружаю список филиалов…")
        branches = await fetch_branches()
        if not branches:
            await update.message.reply_text(
                "❌ Не удалось загрузить список филиалов.\n\n"
                "Возможные причины:\n"
                "• Backend ещё запускается — подождите 30 сек\n"
                "• Нет филиалов в главной таблице",
                reply_markup=KB_MAIN,
            )
            return MAIN_MENU

        ctx.user_data["branches"] = branches
        kb = ReplyKeyboardMarkup([[b] for b in branches] + [["🔙 Назад"]], resize_keyboard=True)
        await update.message.reply_text("Выберите филиал:", reply_markup=kb)
        return SELECT_BRANCH

    if text == "🚪 Выйти":
        authorized_users.discard(user.id)
        ctx.user_data.clear()
        await update.message.reply_text("👋 Вы вышли. Для входа — /start", reply_markup=ReplyKeyboardRemove())
        return ConversationHandler.END

    if text == "ℹ️ Помощь":
        await _send(update,
            "🤖 *BarberCRM Bot*\n\n"
            "Бот для руководителя \\(только просмотр\\)\\.\n\n"
            "📈 *Дашборд* — сводка план/факт\n"
            "🌅 *Утренние мероприятия*\n"
            "🚶 *Полевые выходы*\n"
            "🤝 *One\\-on\\-One*\n"
            "📋 *Планы мастеров*\n"
            "📊 *Еженедельные показатели*\n"
            "⭐ *Отзывы*\n"
            "👶 *Адаптация новичков*\n"
            "📝 *Итоговые отчёты*\n\n"
            "🚪 *Выйти* — завершить сессию",
            KB_MAIN,
        )
        return MAIN_MENU

    return MAIN_MENU


async def select_branch(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text

    if text == "🔙 Назад":
        await update.message.reply_text("Главное меню:", reply_markup=KB_MAIN)
        return MAIN_MENU

    branches = ctx.user_data.get("branches", [])
    if text not in branches:
        await update.message.reply_text("Выберите филиал из списка.")
        return SELECT_BRANCH

    ctx.user_data["branch"] = text
    await _send(update, f"📍 Филиал: *{_esc(text)}*\nВыберите раздел:", KB_BRANCH_MENU)
    return BRANCH_MENU


async def branch_menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    branch = ctx.user_data.get("branch", "")

    if text == "🔙 Назад к списку филиалов":
        branches = ctx.user_data.get("branches") or await fetch_branches()
        ctx.user_data["branches"] = branches
        kb = ReplyKeyboardMarkup([[b] for b in branches] + [["🔙 Назад"]], resize_keyboard=True)
        await update.message.reply_text("Выберите филиал:", reply_markup=kb)
        return SELECT_BRANCH

    if text == "📈 Дашборд":
        await update.message.reply_text("⏳ Загружаю дашборд…")
        data = await api_get(f"dashboard-summary/{branch}")
        if data and data.get("success"):
            await _send(update, format_dashboard(data, branch), KB_BRANCH_MENU)
        else:
            err = (data or {}).get("error", "Нет ответа от сервера")
            await update.message.reply_text(f"❌ Ошибка: {err}", reply_markup=KB_BRANCH_MENU)
        return BRANCH_MENU

    if text in SECTION_MAP:
        endpoint, section_name = SECTION_MAP[text]
        await update.message.reply_text(f"⏳ Загружаю {section_name}…")
        data = await api_get(f"{endpoint}/{branch}")
        if data and data.get("success") is not False:
            records = data.get("data", [])
            await _send(update, format_records(records, section_name, branch), KB_BRANCH_MENU)
        else:
            err = (data or {}).get("error", "Нет ответа от сервера")
            await update.message.reply_text(f"❌ Ошибка: {err}", reply_markup=KB_BRANCH_MENU)
        return BRANCH_MENU

    await update.message.reply_text("Выберите действие из меню.", reply_markup=KB_BRANCH_MENU)
    return BRANCH_MENU


async def cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data.clear()
    await update.message.reply_text("Бот остановлен. /start для запуска.", reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END


# ─── main ─────────────────────────────────────────────────────
def main():
    if not BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN не задан!")
        return

    if not BOT_ACCESS_PASSWORD:
        logger.warning("⚠️ BOT_ACCESS_PASSWORD не задан — доступ без пароля!")

    logger.info(f"🔗 Backend URL: {BACKEND_URL}")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler("start", cmd_start)],
        states={
            AUTH_PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, auth_handler)],
            MAIN_MENU:     [MessageHandler(filters.TEXT & ~filters.COMMAND, main_menu)],
            SELECT_BRANCH: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_branch)],
            BRANCH_MENU:   [MessageHandler(filters.TEXT & ~filters.COMMAND, branch_menu)],
        },
        fallbacks=[CommandHandler("cancel", cancel), CommandHandler("start", cmd_start)],
        allow_reentry=True,
    ))

    logger.info("🤖 BarberCRM Bot запущен (пароль: %s)", "ДА" if BOT_ACCESS_PASSWORD else "НЕТ")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
