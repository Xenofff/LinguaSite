const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const LINGUASERVER_URL = (process.env.LINGUASERVER_URL || 'https://api.gidcam.online').replace(/\/$/, '');
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';

app.set('trust proxy', 1);

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false }));

if (!SESSION_SECRET) {
  console.warn('[auth] SESSION_SECRET is not set — using insecure default for development only');
}

app.use(
  session({
    secret: SESSION_SECRET || 'linguavibe-dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

function isAuthenticated(req) {
  return req.session?.authenticated === true;
}

function requireAdminPage(req, res, next) {
  if (isAuthenticated(req)) return next();
  return res.redirect('/login');
}

function requireAdminApi(req, res, next) {
  if (isAuthenticated(req)) return next();
  return res.status(401).json({ error: 'Требуется авторизация' });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLoginPage(errorMessage = '') {
  const errorBlock = errorMessage
    ? `<p class="login-error" role="alert">${escapeHtml(errorMessage)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinguaVibe — Вход</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/login/login.css">
</head>
<body>
  <div class="login-layout">
    <div class="login-card">
      <a href="/" class="back-link">← На сайт</a>
      <h1>LinguaVibe Admin</h1>
      <p class="subtitle">Войдите для доступа к панели управления</p>
      ${errorBlock}
      <form method="post" action="/login" class="login-form">
        <label class="field">
          <span>Логин</span>
          <input type="text" name="username" autocomplete="username" required autofocus>
        </label>
        <label class="field">
          <span>Пароль</span>
          <input type="password" name="password" autocomplete="current-password" required>
        </label>
        <button type="submit" class="btn btn-primary">Войти</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

app.get('/login', (req, res) => {
  if (isAuthenticated(req)) {
    return res.redirect('/admin');
  }
  res.type('html').send(renderLoginPage());
});

app.post('/login', (req, res) => {
  const username = (req.body?.username || '').trim();
  const password = req.body?.password || '';

  if (!ADMIN_PASSWORD) {
    return res
      .status(500)
      .type('html')
      .send(renderLoginPage('ADMIN_PASSWORD не настроен на сервере'));
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    return req.session.save((err) => {
      if (err) {
        console.error('[auth] session save failed:', err);
        return res.status(500).type('html').send(renderLoginPage('Ошибка сессии, попробуйте снова'));
      }
      return res.redirect('/admin');
    });
  }

  return res.status(401).type('html').send(renderLoginPage('Неверный логин или пароль'));
});

app.use('/admin/api', requireAdminApi, async (req, res) => {
  if (!ADMIN_API_KEY) {
    return res.status(500).json({ error: 'ADMIN_API_KEY не настроен на сервере сайта' });
  }

  const targetUrl = `${LINGUASERVER_URL}${req.originalUrl}`;
  const headers = {
    'X-Admin-Key': ADMIN_API_KEY,
    Accept: 'application/json',
  };
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    return res.send(text);
  } catch (err) {
    console.error('[admin proxy]', err);
    return res.status(502).json({ error: 'Не удалось связаться с API сервера' });
  }
});

app.get('/admin', requireAdminPage, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LinguaSite listening on http://0.0.0.0:${PORT}`);
});
