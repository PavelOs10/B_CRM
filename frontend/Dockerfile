FROM nginx:stable-alpine

# Копируем файлы фронтенда
COPY . /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
