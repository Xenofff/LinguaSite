const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const LINGUASERVER_URL = (process.env.LINGUASERVER_URL || 'https://api.gidcam.online').replace(/\/$/, '');
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const SITE_ADMIN_PASSWORD = process.env.SITE_ADMIN_PASSWORD || '';

app.use(express.json({ limit: '32kb' }));

function siteAdminAuthorized(req) {
  if (!SITE_ADMIN_PASSWORD) return true;
  const provided =
    req.headers['x-site-admin'] ||
    req.query.site_admin ||
    '';
  return provided === SITE_ADMIN_PASSWORD;
}

app.use('/admin/api', async (req, res) => {
  if (!siteAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Неверный пароль админки' });
  }
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

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LinguaSite listening on http://0.0.0.0:${PORT}`);
});
