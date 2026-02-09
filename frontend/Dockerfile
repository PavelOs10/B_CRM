FROM nginx:stable-alpine

# Копируем файлы фронтенда
COPY . /usr/share/nginx/html/

# Исправляем права
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Запуск без daemon (чтобы не зависал)
CMD ["nginx", "-g", "daemon off;"]

# Добавляем graceful shutdown
STOPSIGNAL SIGQUIT