# LinguaSite

Лендинг LinguaVibe и веб-админка подписок.

## Структура

```
public/
  index.html
  site.webmanifest
  assets/css/main.css
  assets/js/main.js
  assets/images/     — скриншоты
  assets/icons/      — favicon, PWA icons
  admin/             — панель /admin
server.js            — статика + прокси API
```

## Запуск

```bash
cp .env.example .env
# ADMIN_API_KEY — тот же ключ, что ADMIN_API_KEY в linguaserver
npm install
npm start
```

Сайт: http://localhost:8080  
Админка: http://localhost:8080/admin

## Docker

```bash
docker compose up -d --build
```

## Деплой с linguaserver (Caddy)

В `.env` linguaserver задайте `ADMIN_API_KEY`. В `.env` LinguaSite — тот же ключ и `LINGUASERVER_URL=http://app:3000` (внутри Docker-сети).

Пример блока Caddy вместо `file_server`:

```
main.gidcam.online {
    reverse_proxy site:8080
}
```

Старый монолитный `index.html` в корне репозитория можно удалить после копирования ассетов в `public/assets/`.
