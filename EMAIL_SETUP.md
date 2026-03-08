# Почта не уходит (10054)? Включи Mailgun за 3 минуты

С твоего интернета Gmail SMTP режут — письма по HTTPS через Mailgun будут уходить.

1. Зайди на **https://www.mailgun.com** → **Sign Up** (бесплатно).
2. В панели: **Sending** → **Domains** → скопируй **sandbox-домен** (например `sandbox123abc.mailgun.org`).
3. **Sending** → **API Keys** → скопируй **Private API key** (начинается с `key-`).
4. **Sending** → **Authorized Recipients** → **Add Recipient** → добавь свой email (в sandbox письма идут только на эти адреса).
5. В папке проекта открой файл **`.env`** и добавь две строки (подставь свои значения):
   ```
   MAILGUN_API_KEY=key-твой_ключ
   MAILGUN_DOMAIN=sandbox123abc.mailgun.org
   ```
6. Перезапусти Flask (`python app.py`).

Готово. Сброс пароля и обратная связь снова будут отправляться.
