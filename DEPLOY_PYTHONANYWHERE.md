# Развёртывание на PythonAnywhere

Пошаговая инструкция по размещению проекта на PythonAnywhere.

---

## 1. Регистрация

1. Зайди на [pythonanywhere.com](https://www.pythonanywhere.com)
2. Нажми **Pricing & signup** → **Create a Beginner account** (бесплатно)
3. Зарегистрируйся (email + пароль)

---

## 2. Создание веб-приложения

1. Войди в аккаунт
2. Открой вкладку **Web**
3. Нажми **Add a new web app**
4. Выбери **Manual configuration** (не Django)
5. Выбери **Python 3.10** (или новее)
6. Нажми **Next** до завершения

---

## 3. Загрузка файлов проекта

### Вариант А: через веб-интерфейс

1. Открой вкладку **Files**
2. Перейди в папку `/home/ТВОЙ_ЛОГИН/`
3. Создай папку `diplom` (или другое имя)
4. Зайди в неё
5. Загрузи все файлы проекта (структура должна совпадать):
   - `app.py`, `wsgi.py`, `requirements.txt`
   - `index.html`, `login.html`, `register.html`, `dashboard.html`, `vote.html`, `results.html`
   - `feed.html`, `respond.html`, `dec-results.html`, `admin.html`, `banned.html`, `forgot.html`
   - `terms.html`, `privacy.html`
   - папка `css/` → styles.css, dashboard.css, feed.css
   - папка `js/` → main.js, dashboard.js, feed.js

### Вариант Б: через Git (если проект в репозитории)

1. Открой вкладку **Consoles** → **Bash**
2. Выполни:
```bash
cd ~
git clone https://github.com/ТВОЙ_ЛОГИН/ТВОЙ_РЕПОЗИТОРИЙ.git diplom
cd diplom
```

---

## 4. Виртуальное окружение и зависимости

1. Вкладка **Consoles** → **Bash**
2. Выполни (подставь свой логин):

```bash
cd ~/diplom
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 5. Настройка WSGI

1. Вкладка **Web**
2. В разделе **Code** нажми на ссылку **WSGI configuration file** (что-то вроде `/var/www/твойлогин_pythonanywhere_com_wsgi.py`)
3. Удали всё содержимое и вставь:

```python
import sys
import os

# Путь к проекту (замени ТВОЙ_ЛОГИН на свой логин!)
path = '/home/ТВОЙ_ЛОГИН/diplom'
if path not in sys.path:
    sys.path.insert(0, path)

os.chdir(path)

from app import app as application
```

4. **Сохрани** (кнопка Save)

---

## 6. Переменные окружения (важно!)

1. Вкладка **Web**
2. Прокрути до **Environment variables**
3. Добавь переменные (кнопка **Enter** после каждой):

| Переменная | Значение |
|------------|----------|
| `SECRET_KEY` | Любая случайная строка (например: `openssl rand -hex 32` в терминале) |
| `ADMIN_EMAILS` | Твой email для доступа в админку (через запятую, если несколько) |

Пример: `ADMIN_EMAILS` = `ivan@mail.ru`

---

## 7. Virtualenv в Web-приложении

1. Вкладка **Web**
2. В разделе **Virtualenv** нажми на серую ссылку
3. Введи путь: `/home/ТВОЙ_ЛОГИН/diplom/venv`
4. Нажми зелёную галочку

---

## 8. Static files (опционально)

На PythonAnywhere можно настроить раздачу статики через веб-сервер. Но твой проект отдаёт всё через Flask, поэтому этот шаг можно пропустить.

---

## 9. Запуск

1. Вкладка **Web**
2. Нажми зелёную кнопку **Reload** (справа вверху)

---

## 10. Проверка

Открой в браузере: **https://ТВОЙ_ЛОГИН.pythonanywhere.com**

Должна открыться главная страница. Зарегистрируй первого пользователя — он станет админом, если его email указан в `ADMIN_EMAILS`.

---

## Возможные ошибки

### 500 Internal Server Error
- Открой вкладку **Web** → **Error log**
- Посмотри последние строки — там будет текст ошибки

### ModuleNotFoundError
- Проверь, что virtualenv указан правильно
- Убедись, что `pip install -r requirements.txt` выполнен в активированном venv

### База данных
- При первом запуске создаётся `database.db` в папке проекта
- На бесплатном тарифе файлы сохраняются между перезапусками

---

## OAuth (Яндекс, VK, Google) — если нужен вход через соцсети

На бесплатном тарифе PythonAnywhere домен будет `твойлогин.pythonanywhere.com`. В настройках OAuth приложений укажи:
- Redirect URI: `https://твойлогин.pythonanywhere.com/login` (или тот путь, который использует твой код)
- Добавь переменные `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` и т.д. в Environment variables
