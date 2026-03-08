# Развёртывание на Beget (бесплатный хостинг)

Flask работает на Beget, но настройка сложнее, чем на Timeweb/Railway. Нужен SSH-доступ и ручная установка.

---

## Что потребуется

- Аккаунт Beget (бесплатный тариф поддерживает Python)
- SSH-доступ (включи в панели Beget)
- Файловый менеджер или FTP для загрузки файлов

---

## Шаг 1. Подготовка файлов

Загрузи на хостинг все файлы проекта в папку сайта (например, `~/diplom/` или в подпапку домена):
- `app.py`
- `requirements.txt`
- все `.html`, папки `css/`, `js/`

---

## Шаг 2. SSH и Docker-окружение

1. Подключись по SSH: `ssh логин@сервер.beget.com`
2. Перейди в Docker-окружение (см. [инструкцию Beget](https://beget.com/ru/kb/how-to/web-apps/obshhie-svedeniya-po-ustanovke-prilozhenij-virtualnoe-okruzhenie-docker))
3. Перейди в папку проекта: `cd ~/diplom` (или твой путь)

---

## Шаг 3. Установка зависимостей

```bash
pip3 install -r requirements.txt --user --ignore-installed
```

Флаг `--user` на Beget обязателен. Путь к пакетам будет примерно: `~/.local/lib/python3.X/site-packages`

---

## Шаг 4. Файл passenger_wsgi.py

Создай в корне проекта файл `passenger_wsgi.py`:

```python
# -*- coding: utf-8 -*-
import sys, os

# Путь к проекту (замени u/user на первую букву логина и сам логин)
sys.path.insert(0, '/home/u/user/diplom')
sys.path.insert(0, '/home/u/user/.local/lib/python3.6/site-packages')

os.chdir('/home/u/user/diplom')
from app import app as application
```

Замени `u/user` на свой путь (например, для логина `ivanov` будет `/home/i/ivanov`). Проверь версию Python: `python3 --version` и подставь правильный путь к site-packages.

---

## Шаг 5. Файл .htaccess

В корне проекта создай `.htaccess`:

```
PassengerEnabled On
PassengerAppRoot /home/u/user/diplom
PassengerPython /usr/bin/python3
```

Замени путь на свой.

---

## Шаг 6. Переменные окружения

На виртуальном хостинге Beget переменные окружения настраиваются сложнее. Можно прописать в `app.py` в начале (только для теста!):

```python
import os
os.environ.setdefault('SECRET_KEY', 'твой-секретный-ключ')
os.environ.setdefault('ADMIN_EMAILS', 'твой@email.ru')
```

Или использовать файл `.env` в папке проекта (если Beget его подхватывает).

---

## Шаг 7. Перезапуск

```bash
touch tmp/restart.txt
```

(Создай папку `tmp` в корне проекта, если её нет.)

---

## Сложности

| Проблема | Решение |
|----------|---------|
| Старая версия Python | Beget может иметь Python 3.6 — некоторые пакеты могут не установиться |
| Много зависимостей | qrcode, reportlab, openpyxl — проверь совместимость |
| SQLite | Должен работать, путь к БД — в папке проекта |
| Нет поддержки на бесплатном тарифе | Ошибки придётся разбирать самому |

---

## Рекомендация

Для диплома **проще использовать Timeweb** (от 1 ₽) или **Railway** (бесплатно) — там деплой из GitHub в пару кликов. Beget подойдёт, если нужен именно бесплатный российский хостинг и есть время разбираться с настройкой.

Подробная документация Beget: [Установка Flask](https://beget.com/ru/kb/how-to/web-apps/python#ustanovka-mikrofreymvorka-flask)
