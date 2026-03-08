# Постоянный URL — один раз настроил Яндекс и Google

При каждом новом запуске `cloudflared tunnel --url ...` выдается **новый** адрес (типа `https://случайное-слово.trycloudflare.com`). Из‑за этого в кабинетах Яндекс и Google снова приходится добавлять новые URI.

Чтобы **не менять** настройки OAuth каждый раз, есть два варианта.

---

## Вариант 1: Зафиксировать URL в .env (минимум действий)

1. Запусти туннель: `.\cloudflared.exe tunnel --url http://localhost:5000`
2. В консоли скопируй выданный URL, например: `https://thought-advanced-sublime-applying.trycloudflare.com`
3. В файле **.env** пропиши (подставь свой URL):
   ```
   OAUTH_BASE_URL=https://твой-поддомен.trycloudflare.com
   ```
   Без слэша в конце.
4. Перезапусти Flask.
5. Открой в браузере **https://твой-поддомен.trycloudflare.com/oauth-setup** и скопируй оттуда все URI в настройки Яндекс и Google (как написано на странице).

Пока ты **не перезапускаешь** cloudflared, этот URL будет работать. Как только запустишь туннель заново и получишь другой адрес — нужно будет в .env подставить новый URL, перезапустить Flask и **добавить** новые URI в Яндекс и Google (старые можно не удалять).

---

## Вариант 2: Именованный туннель Cloudflare (постоянный адрес)

Если нужен **один и тот же** URL всегда (чтобы в Яндекс и Google ничего больше не трогать):

1. Зарегистрируйся на [cloudflare.com](https://cloudflare.com) (бесплатно).
2. Добавь свой домен в Cloudflare (или бесплатный домен, например с Freenom / get.afraid.org и т.п.) и переключи NS на Cloudflare.
3. В папке проекта выполни:
   ```bash
   .\cloudflared.exe tunnel login
   ```
   Откроется браузер — войди в Cloudflare и выбери свой домен.
4. Создай туннель:
   ```bash
   .\cloudflared.exe tunnel create diplom
   ```
   Сохрани выданный UUID туннеля.
5. В папке **%USERPROFILE%\.cloudflared** создай или отредактируй **config.yml**:
   ```yaml
   url: http://localhost:5000
   tunnel: <UUID-туннеля-или-имя diplom>
   credentials-file: C:\Users\ТВОЙ_ЛОГИН\.cloudflared\<UUID>.json
   ```
   Путь к `credentials-file` смотри в выводе команды `tunnel create`.
6. Привяжи поддомен к туннелю (подставь свой домен и поддомен, например `app`):
   ```bash
   .\cloudflared.exe tunnel route dns diplom app.твой-домен.com
   ```
7. Запускай туннель:
   ```bash
   .\cloudflared.exe tunnel run diplom
   ```
8. Постоянный адрес сайта будет: **https://app.твой-домен.com**
9. В **.env** пропиши:
   ```
   OAUTH_BASE_URL=https://app.твой-домен.com
   ```
   Перезапусти Flask.
10. Открой **https://app.твой-домен.com/oauth-setup** и один раз добавь показанные там URI в Яндекс и Google. После этого их уже не нужно менять при перезапуске туннеля.

Подробная документация: [Create a locally-managed tunnel · Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/).
