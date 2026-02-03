# Sending real password-reset emails

The backend can send real emails when you configure SMTP.

## 1. Set environment variables

Before starting the backend, set:

- **MAIL_USERNAME** – e.g. your Gmail address
- **MAIL_PASSWORD** – e.g. a [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your normal password)

Optional:

- **MAIL_HOST** – default `smtp.gmail.com`
- **MAIL_PORT** – default `587`
- **app.frontend.url** – base URL of the frontend (default `http://localhost:3000`), used in the reset link in the email

## 2. Gmail example

1. Turn on 2-Step Verification for your Google account.
2. Create an App Password: Google Account → Security → 2-Step Verification → App passwords.
3. Start the backend with:

   ```powershell
   $env:MAIL_USERNAME="your.email@gmail.com"
   $env:MAIL_PASSWORD="your-16-char-app-password"
   # then run the backend (e.g. .\mvnw.cmd spring-boot:run)
   ```

## 3. Other providers (SendGrid, Mailgun, etc.)

Set the same env vars to your provider’s SMTP values, and optionally in `application.properties`:

- `spring.mail.host` – SMTP host
- `spring.mail.port` – e.g. 587 for TLS
- `spring.mail.username` / `spring.mail.password` – or use `MAIL_USERNAME` and `MAIL_PASSWORD`

## 4. When mail is not configured

If **MAIL_USERNAME** (and **MAIL_PASSWORD**) are not set:

- The app still runs.
- Forgot-password still returns success (no info leak).
- No email is sent; the API response may include a **resetLink** so you can open it in the browser for testing (demo only).
