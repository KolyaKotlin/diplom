# Настройка почты

## Вариант 1: Resend — без домена, на любой email

**Самый простой способ.** Работает на Railway, не нужен свой домен.

1. Зайди на [resend.com](https://resend.com) → **Sign Up** (бесплатно).
2. В панели: **API Keys** → **Create API Key** → скопируй ключ (начинается с `re_`).
3. В Railway Variables или `.env` добавь:
   ```
   RESEND_API_KEY=re_твой_ключ
   ```
4. Готово. Коды подтверждения и обратная связь будут уходить на **любой** email.

Бесплатно: 100 писем/день, 3000/месяц.

---

## Вариант 2: Mailgun (с доменом или sandbox)

**С доменом** — можно отправлять на любой email.  
**Sandbox** — только на адреса из Authorized Recipients.

1. Зайди на [mailgun.com](https://www.mailgun.com) → **Sign Up**.
2. **Sending** → **API Keys** → скопируй **Private API key**.
3. **Sending** → **Domains** → скопируй sandbox-домен или добавь свой.
4. Для sandbox: **Authorized Recipients** → добавь разрешённые email.
5. В `.env` или Railway:
   ```
   MAILGUN_API_KEY=key-твой_ключ
   MAILGUN_DOMAIN=sandbox123.mailgun.org
   ```

---

## Вариант 3: Gmail SMTP (только локально)

Работает только с localhost. На Railway порты SMTP заблокированы.

```
SMTP_EMAIL=твой@gmail.com
SMTP_PASSWORD=пароль_приложения_16_символов
```
