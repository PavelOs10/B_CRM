#!/usr/bin/env python3
"""
BarberCRM Telegram Bot — бот для руководителя (только просмотр)
Работает через существующий Backend API по внутренней сети Docker.
Используются ReplyKeyboardMarkup (кнопки вместо клавиатуры).
Вход по паролю (BOT_ACCESS_PASSWORD).
"""

import os
import logging
import httpx
from datetime import datetime
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ConversationHandler, filters, ContextTypes,
)

# ─── Настройки ────────────────────────────────────────────────
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://barber_backend:8000")
BOT_ACCESS_PASSWORD = os.getenv("BOT_ACCESS_PASSWORD", "")

logging.basicConfig(
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("barber_bot")

# Множество авторизованных user_id (хранится в памяти, сбрасывается при рестарте)
authorized_users: set[int] = set()

# ─── Состояния ConversationHandler ────────────────────────────
(
    AUTH_PASSWORD,
    MAIN_MENU,
    SELECT_BRANCH,
    BRANCH_MENU,
) = range(4)

# ─── Клавиатуры (ReplyKeyboard — вместо стандартной клавиатуры) ─
KB_MAIN = ReplyKeyboardMarkup(
    [
        ["📊 Выбрать филиал"],
        ["ℹ️ Помощь", "🚪 Выйти"],
    ],
    resize_keyboard=True,
    one_time_keyboard=False,
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
    one_time_keyboard=False,
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


# ─── Вспомогательные функции API ──────────────────────────────
async def api_get(path: str) -> dict | None:
    """GET-запрос к backend."""
    url = f"{BACKEND_URL}/{path}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"API error GET {url}: {e}")
        return None


async def fetch_branches() -> list[str]:
    """Получает список названий филиалов из главной Google-таблицы."""
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        import json

        sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "{}")
        info = json.loads(sa_json)
        if "private_key" in info:
            info["private_key"] = info["private_key"].replace("\\n", "\n")

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
        ]
        creds = Credentials.from_service_account_info(info, scopes=scopes)
        gc = gspread.authorize(creds)

        sheet_id = os.getenv("GOOGLE_SHEET_ID", "")
        spreadsheet = gc.open_by_key(sheet_id)
        ws = spreadsheet.worksheet("Филиалы")
        records = ws.get_all_records()
        return [r["Название"] for r in records if r.get("Название")]
    except Exception as e:
        logger.error(f"Ошибка получения списка филиалов: {e}")
        return []


# ─── Форматирование данных ────────────────────────────────────
def format_dashboard(data: dict, branch: str) -> str:
    """Форматирует дашборд филиала."""
    summary = data.get("summary", {})
    lines = [f"📊  *Дашборд: {_esc(branch)}*\n"]

    order = [
        ("morning_events", "🌅"),
        ("field_visits", "🚶"),
        ("one_on_one", "🤝"),
        ("master_plans", "📋"),
        ("weekly_reports", "📊"),
        ("reviews", "⭐"),
        ("new_employees", "👶"),
    ]

    for key, emoji in order:
        item = summary.get(key, {})
        label = item.get("label", key)
        cur = item.get("current", 0)
        goal = item.get("goal", 0)
        pct = item.get("percentage", 0)
        bar = _progress_bar(pct)
        lines.append(f"{emoji} *{_esc(label)}*")
        lines.append(f"    {cur}/{goal}  \\({_esc(str(pct))}%\\)  {bar}\n")

    return "\n".join(lines)


def _progress_bar(pct: float, length: int = 10) -> str:
    filled = int(min(pct, 100) / 100 * length)
    return "▓" * filled + "░" * (length - filled)


def _esc(text: str) -> str:
    """Экранирование спецсимволов для MarkdownV2."""
    special = r"_*[]()~`>#+-=|{}.!"
    out = []
    for ch in str(text):
        if ch in special:
            out.append(f"\\{ch}")
        else:
            out.append(ch)
    return "".join(out)


def format_records(records: list[dict], section_name: str, branch: str) -> str:
    """Форматирует записи раздела для Telegram."""
    if not records:
        return f"📭 В разделе «{_esc(section_name)}» для филиала «{_esc(branch)}» пока нет записей\\."

    total = len(records)
    show = records[:10]

    lines = [f"📋 *{_esc(section_name)}* — {_esc(branch)}"]
    lines.append(f"Всего записей: {total}  \\(показаны последние {len(show)}\\)\n")

    for i, rec in enumerate(show, 1):
        lines.append(f"─── Запись {i} ───")
        for k, v in rec.items():
            if v == "" or v is None:
                continue
            lines.append(f"*{_esc(str(k))}:* {_esc(str(v))}")
        lines.append("")

    if total > 10:
        lines.append(f"_\\.\\.\\.и ещё {total - 10} записей_")

    return "\n".join(lines)


def _split_message(text: str, max_len: int = 4000) -> list[str]:
    """Разбивает длинное сообщение на части."""
    if len(text) <= max_len:
        return [text]
    parts = []
    while text:
        if len(text) <= max_len:
            parts.append(text)
            break
        idx = text.rfind("\n", 0, max_len)
        if idx == -1:
            idx = max_len
        parts.append(text[:idx])
        text = text[idx:].lstrip("\n")
    return parts


# ─── Хэндлеры ────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Точка входа — проверяем авторизацию или просим пароль."""
    user = update.effective_user
    context.user_data.clear()

    # Если пароль не задан в env — пускаем всех
    if not BOT_ACCESS_PASSWORD:
        authorized_users.add(user.id)
        logger.warning("BOT_ACCESS_PASSWORD не задан — доступ без пароля!")

    if user.id in authorized_users:
        await update.message.reply_text(
            f"Добро пожаловать, {_esc(user.first_name)}\\!\n\n"
            "Выберите действие на клавиатуре ниже\\.",
            reply_markup=KB_MAIN,
            parse_mode="MarkdownV2",
        )
        return MAIN_MENU

    await update.message.reply_text(
        "🔐 Для доступа введите пароль:",
        reply_markup=ReplyKeyboardRemove(),
    )
    return AUTH_PASSWORD


async def auth_password_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Проверка пароля."""
    user = update.effective_user
    entered = update.message.text.strip()

    # Удаляем сообщение с паролем из чата
    try:
        await update.message.delete()
    except Exception:
        pass

    if entered == BOT_ACCESS_PASSWORD:
        authorized_users.add(user.id)
        logger.info(f"✅ Пользователь {user.id} ({user.first_name}) авторизован")
        await update.message.reply_text(
            f"✅ Доступ разрешён\\!\n\n"
            f"Добро пожаловать, {_esc(user.first_name)}\\!\n"
            "Выберите действие на клавиатуре ниже\\.",
            reply_markup=KB_MAIN,
            parse_mode="MarkdownV2",
        )
        return MAIN_MENU
    else:
        logger.warning(f"⛔ Неверный пароль от пользователя {user.id} ({user.first_name})")
        await update.message.reply_text(
            "❌ Неверный пароль\\. Попробуйте ещё раз или нажмите /start",
            parse_mode="MarkdownV2",
        )
        return AUTH_PASSWORD


async def main_menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    user = update.effective_user

    # Проверка сессии после рестарта контейнера
    if BOT_ACCESS_PASSWORD and user.id not in authorized_users:
        await update.message.reply_text(
            "🔐 Сессия истекла\\. Введите пароль:",
            reply_markup=ReplyKeyboardRemove(),
            parse_mode="MarkdownV2",
        )
        return AUTH_PASSWORD

    if text == "📊 Выбрать филиал":
        await update.message.reply_text("⏳ Загружаю список филиалов…")
        branches = await fetch_branches()
        if not branches:
            await update.message.reply_text(
                "❌ Не удалось загрузить список филиалов. Попробуйте позже.",
                reply_markup=KB_MAIN,
            )
            return MAIN_MENU

        context.user_data["branches"] = branches
        kb_rows = [[b] for b in branches]
        kb_rows.append(["🔙 Назад"])
        kb = ReplyKeyboardMarkup(kb_rows, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("Выберите филиал:", reply_markup=kb)
        return SELECT_BRANCH

    if text == "🚪 Выйти":
        authorized_users.discard(user.id)
        context.user_data.clear()
        await update.message.reply_text(
            "👋 Вы вышли\\. Для повторного входа нажмите /start",
            reply_markup=ReplyKeyboardRemove(),
            parse_mode="MarkdownV2",
        )
        return ConversationHandler.END

    if text == "ℹ️ Помощь":
        await update.message.reply_text(
            "🤖 *BarberCRM Bot*\n\n"
            "Бот для руководителя \\(только просмотр\\)\\.\n\n"
            "📊 *Дашборд* — сводка выполнения плана\n"
            "🌅 *Утренние мероприятия* — список мероприятий\n"
            "🚶 *Полевые выходы* — проверки мастеров\n"
            "🤝 *One\\-on\\-One* — индивидуальные встречи\n"
            "📋 *Планы мастеров* — план/факт по мастерам\n"
            "📊 *Еженедельные показатели* — метрики\n"
            "⭐ *Отзывы* — учёт отзывов\n"
            "👶 *Адаптация новичков* — статусы стажёров\n"
            "📝 *Итоговые отчёты* — сводные отчёты\n\n"
            "🚪 *Выйти* — завершить сессию",
            parse_mode="MarkdownV2",
            reply_markup=KB_MAIN,
        )
        return MAIN_MENU

    return MAIN_MENU


async def select_branch_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text

    if text == "🔙 Назад":
        await update.message.reply_text("Главное меню:", reply_markup=KB_MAIN)
        return MAIN_MENU

    branches = context.user_data.get("branches", [])
    if text not in branches:
        await update.message.reply_text("Пожалуйста, выберите филиал из списка.")
        return SELECT_BRANCH

    context.user_data["branch"] = text
    await update.message.reply_text(
        f"📍 Филиал: *{_esc(text)}*\nВыберите раздел:",
        parse_mode="MarkdownV2",
        reply_markup=KB_BRANCH_MENU,
    )
    return BRANCH_MENU


async def branch_menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    branch = context.user_data.get("branch", "")

    if text == "🔙 Назад к списку филиалов":
        branches = context.user_data.get("branches", [])
        if not branches:
            branches = await fetch_branches()
            context.user_data["branches"] = branches
        kb_rows = [[b] for b in branches]
        kb_rows.append(["🔙 Назад"])
        kb = ReplyKeyboardMarkup(kb_rows, resize_keyboard=True, one_time_keyboard=False)
        await update.message.reply_text("Выберите филиал:", reply_markup=kb)
        return SELECT_BRANCH

    if text == "📈 Дашборд":
        await update.message.reply_text("⏳ Загружаю дашборд…")
        data = await api_get(f"dashboard-summary/{branch}")
        if data and data.get("success"):
            msg = format_dashboard(data, branch)
            for chunk in _split_message(msg, 4000):
                await update.message.reply_text(
                    chunk, parse_mode="MarkdownV2", reply_markup=KB_BRANCH_MENU
                )
        else:
            err = data.get("error", "Неизвестная ошибка") if data else "Нет ответа от сервера"
            await update.message.reply_text(
                f"❌ Ошибка загрузки дашборда: {err}",
                reply_markup=KB_BRANCH_MENU,
            )
        return BRANCH_MENU

    if text in SECTION_MAP:
        endpoint, section_name = SECTION_MAP[text]
        await update.message.reply_text(f"⏳ Загружаю {section_name}…")
        data = await api_get(f"{endpoint}/{branch}")
        if data and data.get("success") is not False:
            records = data.get("data", [])
            msg = format_records(records, section_name, branch)
            for chunk in _split_message(msg, 4000):
                await update.message.reply_text(
                    chunk, parse_mode="MarkdownV2", reply_markup=KB_BRANCH_MENU
                )
        else:
            err = data.get("error", "Неизвестная ошибка") if data else "Нет ответа от сервера"
            await update.message.reply_text(
                f"❌ Ошибка: {err}", reply_markup=KB_BRANCH_MENU
            )
        return BRANCH_MENU

    await update.message.reply_text(
        "Пожалуйста, выберите действие из меню.", reply_markup=KB_BRANCH_MENU
    )
    return BRANCH_MENU


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text(
        "Бот остановлен\\. Нажмите /start для запуска\\.",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode="MarkdownV2",
    )
    return ConversationHandler.END


# ─── Запуск ───────────────────────────────────────────────────

def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не задан! Бот не запущен.")
        return

    if not BOT_ACCESS_PASSWORD:
        logger.warning("⚠️ BOT_ACCESS_PASSWORD не задан — бот работает БЕЗ ЗАЩИТЫ ПАРОЛЕМ!")

    app = Application.builder().token(BOT_TOKEN).build()

    conv = ConversationHandler(
        entry_points=[CommandHandler("start", cmd_start)],
        states={
            AUTH_PASSWORD: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, auth_password_handler),
            ],
            MAIN_MENU: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, main_menu_handler),
            ],
            SELECT_BRANCH: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, select_branch_handler),
            ],
            BRANCH_MENU: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, branch_menu_handler),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel), CommandHandler("start", cmd_start)],
        allow_reentry=True,
    )

    app.add_handler(conv)

    logger.info("🤖 BarberCRM Bot запущен (защита паролем: %s)",
                "ДА" if BOT_ACCESS_PASSWORD else "НЕТ")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
