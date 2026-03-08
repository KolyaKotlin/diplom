# Развёртывание на российском хостинге (без VPN)

Инструкция для размещения проекта на **Timeweb Cloud** — сайт будет доступен из России без VPN.

---

## Вариант 1: Timeweb Cloud App Platform (рекомендуется)

### Шаг 1. Регистрация и репозиторий

1. Зайди на [timeweb.cloud](https://timeweb.cloud)
2. Зарегистрируйся
3. Залей проект на **GitHub** (если ещё не залит):
   - Создай репозиторий на github.com
   - Загрузи все файлы проекта (включая `requirements.txt`, `app.py`, HTML, css, js)
   - **Не загружай** `.env` и `database.db` (добавь их в `.gitignore`)

### Шаг 2. Создание приложения

1. В панели Timeweb Cloud открой **App Platform** → **Создать приложение**
2. Выбери **Подключить репозиторий** (GitHub)
3. Укажи свой репозиторий и ветку `main`
4. Выбери тип: **Backend**
5. Язык: **Python**
6. Версия Python: **3.10** или **3.11**

### Шаг 3. Сборка

В разделе **Сборка** добавь команду установки зависимостей (если её нет по умолчанию):

```
pip3 install --upgrade -r requirements.txt
```

### Шаг 4. Запуск

В разделе **Запуск** укажи команду:

```
gunicorn app:app --timeout 120 --bind 0.0.0.0:80
```

### Шаг 5. Переменные окружения

В настройках приложения добавь переменные:

| Переменная      | Значение                                      |
|-----------------|-----------------------------------------------|
| `SECRET_KEY`    | Случайная строка (например: `openssl rand -hex 32`) |
| `ADMIN_EMAILS`  | Твой email для админки                        |

### Шаг 6. Деплой

Нажми **Создать** / **Развернуть**. После сборки получишь ссылку вида:
`https://твоё-приложение-xxxxx.twc1.net`

---

## Вариант 2: VPS Timeweb (ручная настройка)

Если нужен полный контроль или App Platform не подходит.

### Шаг 1. Аренда VPS

1. [timeweb.cloud](https://timeweb.cloud) → **Серверы** → **Создать сервер**
2. Выбери тариф (от ~200 ₽/мес)
3. ОС: **Ubuntu 22.04**

### Шаг 2. Подключение по SSH

```bash
ssh root@IP_ТВОЕГО_СЕРВЕРА
```

### Шаг 3. Установка

```bash
apt update && apt install -y python3 python3-pip python3-venv nginx
cd /var/www
mkdir diplom && cd diplom
```

Загрузи файлы проекта (через `scp`, FileZilla или `git clone`):

```bash
# Если проект на GitHub:
git clone https://github.com/ТВОЙ_ЛОГИН/ТВОЙ_РЕПОЗИТОРИЙ.git .
```

### Шаг 4. Виртуальное окружение

```bash
cd /var/www/diplom
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Шаг 5. Переменные окружения

```bash
export SECRET_KEY="твоя-случайная-строка"
export ADMIN_EMAILS="твой@email.ru"
```

(Или создай файл `.env` в папке проекта)

### Шаг 6. Запуск через systemd

Создай файл `/etc/systemd/system/diplom.service`:

```ini
[Unit]
Description=Diplom Flask App
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/diplom
Environment="SECRET_KEY=твоя-строка"
Environment="ADMIN_EMAILS=твой@email.ru"
ExecStart=/var/www/diplom/venv/bin/gunicorn app:app --bind 127.0.0.1:5000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable diplom
systemctl start diplom
```

### Шаг 7. Nginx

Создай `/etc/nginx/sites-available/diplom`:

```nginx
server {
    listen 80;
    server_name твой-домен.ru;  # или IP
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/diplom /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## Проверка

Открой в браузере твой URL. Сайт должен открываться без VPN.

---

## Другие российские хостинги

- **Beget** — виртуальный хостинг с Python (см. [документацию](https://beget.com/ru/hosting))
- **Selectel** — облако и VPS
- **REG.RU** — VPS с поддержкой Python

Схема та же: загрузить проект, установить зависимости, запустить через gunicorn.
