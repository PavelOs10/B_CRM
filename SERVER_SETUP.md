# Инструкция по настройке сервера для BarberCRM

## Требования к серверу

- Ubuntu 20.04 или новее
- Минимум 2GB RAM
- Минимум 20GB диска
- Открытые порты: 80, 443, 22

## 1. Подключение к серверу

```bash
ssh root@ваш_ip_адрес
```

## 2. Установка Docker

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Добавление репозитория Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Установка Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

## 3. Настройка SSH ключей для GitHub Actions

На вашем локальном компьютере:

```bash
# Создание SSH ключа
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Сохраните ключ в ~/.ssh/github_actions (не ~/.ssh/id_rsa!)
```

На сервере:

```bash
# Добавьте публичный ключ в authorized_keys
nano ~/.ssh/authorized_keys

# Вставьте содержимое файла github_actions.pub
# Сохраните (Ctrl+O, Enter, Ctrl+X)

# Установите правильные права
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## 4. Создание директории для приложения

```bash
mkdir -p /opt/barber-crm
cd /opt/barber-crm
```

## 5. Настройка GitHub Secrets

В вашем репозитории GitHub:

1. Перейдите в Settings → Secrets and variables → Actions
2. Нажмите "New repository secret"
3. Добавьте следующие секреты:

### JWT_SECRET
```
ваш_случайный_секретный_ключ_минимум_32_символа
```

### GOOGLE_SHEET_ID
```
id_вашей_google_таблицы
```

### GOOGLE_SERVICE_ACCOUNT_JSON
```json
{
  "type": "service_account",
  "project_id": "ваш-проект",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

### SERVER_HOST
```
ваш_ip_адрес
```

### SERVER_USER
```
root
```

### SSH_PRIVATE_KEY
Содержимое файла `~/.ssh/github_actions` (приватный ключ)

## 6. Первый деплой

```bash
# Вручную склонируйте репозиторий для первого раза
cd /opt/barber-crm
git clone https://github.com/ваш-username/barber-crm.git .

# Создайте .env файл
nano .env

# Вставьте:
JWT_SECRET=ваш_секретный_ключ
GOOGLE_SHEET_ID=id_таблицы
GOOGLE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'

# Сохраните (Ctrl+O, Enter, Ctrl+X)

# Запустите приложение
docker-compose up -d --build

# Проверьте статус
docker-compose ps
docker-compose logs
```

## 7. Настройка Nginx (опционально, для HTTPS)

```bash
# Установка Nginx
apt install -y nginx certbot python3-certbot-nginx

# Создание конфигурации
nano /etc/nginx/sites-available/barbercrm

# Вставьте:
server {
    listen 80;
    server_name ваш_домен.ru;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Активация конфигурации
ln -s /etc/nginx/sites-available/barbercrm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Получение SSL сертификата (если используете домен)
certbot --nginx -d ваш_домен.ru
```

## 8. Автоматические обновления через GitHub

Теперь при каждом push в main ветку GitHub Actions автоматически:
1. Подключится к серверу по SSH
2. Остановит старые контейнеры
3. Скачает новый код
4. Пересоберёт и запустит контейнеры

## 9. Мониторинг

```bash
# Просмотр логов
docker-compose logs -f

# Просмотр только backend логов
docker-compose logs -f backend

# Перезапуск приложения
docker-compose restart

# Остановка
docker-compose down

# Полная пересборка
docker-compose down
docker-compose up -d --build
```

## 10. Резервное копирование

```bash
# Создание бэкапа
tar -czf barbercrm-backup-$(date +%Y%m%d).tar.gz /opt/barber-crm

# Автоматический бэкап (crontab)
crontab -e

# Добавьте строку (бэкап каждый день в 3:00):
0 3 * * * tar -czf /root/backups/barbercrm-$(date +\%Y\%m\%d).tar.gz /opt/barber-crm
```

## Troubleshooting

### Порты заняты
```bash
# Проверка занятых портов
netstat -tulpn | grep :80
netstat -tulpn | grep :8000

# Остановка конфликтующих сервисов
systemctl stop apache2  # если установлен Apache
```

### Ошибки Docker
```bash
# Очистка Docker
docker system prune -a

# Перезапуск Docker
systemctl restart docker
```

### Логи заполняют диск
```bash
# Настройка ротации логов Docker
nano /etc/docker/daemon.json

# Вставьте:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Перезапустите Docker
systemctl restart docker
```

## Готово!

Приложение доступно по адресу: `http://ваш_ip_адрес` или `https://ваш_домен.ru`

API доступно по адресу: `http://ваш_ip_адрес:8000` или `https://ваш_домен.ru/api`
