#!/usr/bin/env python3
"""
Скрипт для получения OAuth токена Google

Использование:
1. Скачайте credentials.json из Google Cloud Console
2. Запустите: python3 get_oauth_token.py
3. Авторизуйтесь в браузере
4. Скопируйте полученный токен в .env
"""

import os
import sys
import json

print("🔐 Получение OAuth токена для Google Drive\n")
print("=" * 60)

# Проверяем наличие credentials.json
if not os.path.exists('credentials.json'):
    print("\n❌ Файл credentials.json не найден!")
    print("\n📋 Инструкция:")
    print("\n1. Откройте: https://console.cloud.google.com")
    print("2. Выберите проект: barbercrm-production")
    print("3. APIs & Services → Credentials")
    print("4. + CREATE CREDENTIALS → OAuth client ID")
    print("\n   Если просит настроить OAuth consent screen:")
    print("   - CONFIGURE CONSENT SCREEN")
    print("   - User Type: External → CREATE")
    print("   - App name: BarberCRM")
    print("   - User support email: ваш email")
    print("   - Developer contact: ваш email")
    print("   - SAVE AND CONTINUE (3 раза)")
    print("   - Test users: добавьте свой email")
    print("\n5. Вернитесь в Credentials → + CREATE CREDENTIALS → OAuth client ID")
    print("6. Application type: Desktop app")
    print("7. Name: BarberCRM Desktop")
    print("8. CREATE")
    print("9. Скачайте JSON файл → Сохраните как credentials.json")
    print("\n10. Запустите этот скрипт снова\n")
    sys.exit(1)

# Устанавливаем библиотеки
print("\n1️⃣ Установка библиотек...")
import subprocess
try:
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", "-q",
        "google-auth-oauthlib", "google-auth-httplib2", "google-api-python-client"
    ])
    print("   ✅ Библиотеки установлены\n")
except:
    print("   ❌ Ошибка установки. Попробуйте вручную:")
    print("   pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    sys.exit(1)

# Запускаем OAuth flow
print("2️⃣ Запуск авторизации...")
print("   Сейчас откроется браузер для авторизации\n")

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets'
]

try:
    flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
    creds = flow.run_local_server(port=0)
    
    print("\n✅ Авторизация успешна!\n")
    
    # Формируем токен для .env
    token_data = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }
    
    # Сохраняем в файл
    with open('token.json', 'w') as f:
        json.dump(token_data, f, indent=2)
    
    print("✅ Токен сохранён в файл: token.json\n")
    
    # Показываем как добавить в .env
    token_json = json.dumps(token_data)
    
    print("=" * 60)
    print("\n📋 ДОБАВЬТЕ ЭТО В ВАШ ФАЙЛ .env:\n")
    print("GOOGLE_OAUTH_TOKEN=" + token_json)
    print("\n" + "=" * 60)
    
    # Также сохраняем в отдельный файл для удобства
    with open('oauth_for_env.txt', 'w') as f:
        f.write("GOOGLE_OAUTH_TOKEN=" + token_json)
    
    print("\n💾 Также сохранено в файл: oauth_for_env.txt")
    print("   Можете просто скопировать оттуда\n")
    
    print("=" * 60)
    print("\n🎯 СЛЕДУЮЩИЕ ШАГИ:\n")
    print("1. Откройте файл .env")
    print("2. Добавьте или замените строку GOOGLE_OAUTH_TOKEN")
    print("3. Сохраните .env")
    print("4. Деплойте проект (git push)")
    print("5. Добавьте GOOGLE_OAUTH_TOKEN в GitHub Secrets\n")
    
    print("✅ Готово! Теперь файлы будут создаваться на вашем личном Google Drive\n")

except Exception as e:
    print(f"\n❌ Ошибка: {e}\n")
    print("Возможные причины:")
    print("- credentials.json неправильного формата")
    print("- OAuth consent screen не настроен")
    print("- Ваш email не добавлен в Test users\n")
    sys.exit(1)