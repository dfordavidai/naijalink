// api/redirect.js
// Handles: GET /link/:code  →  301 redirect to target URL
// Also increments bot-hit counter when User-Agent looks like a crawler.

const { sbGet, sbPatch } = require('./_supabase');

const BASE = 'https://tinubunews.com.ng';

const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
];

function isBot(ua = '') {
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some(b => lower.includes(b));
}

module.exports = async function handler(req, res) {
  const code = req.query.code;

  if (!code || !/^[a-z]{5}$/.test(code)) {
    res.status(400).send('Invalid code');
    return;
  }

  let rows;
  try {
    rows = await sbGet(`ic_short_links?code=eq.${code}&select=code,target,hits`);
  } catch (err) {
    res.status(502).send('DB error');
    return;
  }

  if (!rows || !rows.length) {
    res.status(404).send('Short link not found');
    return;
  }

  const { target, hits } = rows[0];
  const ua = req.headers['user-agent'] || '';
  const bot = isBot(ua);

  // Increment hit counter (fire-and-forget — don't block redirect)
  if (bot) {
    sbPatch('ic_short_links', `code=eq.${code}`, { hits: (hits || 0) + 1 }).catch(() => {});
  }

  const today = new Date().toISOString().split('T')[0];

  // Serve a lightweight HTML page that immediately redirects.
  // This gives Googlebot something to crawl (schema, canonical, meta) before
  // following the redirect — critical for the "freshness crawl" trick.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'all');
  res.setHeader('Server-Timing', 'db;dur=4, cache;dur=1, total;dur=12');
  res.setHeader('Link', `<${BASE}/sitemap.xml>; rel=preconnect`);

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="${BASE}/link/${code}">
  <meta http-equiv="refresh" content="0; url=${target}">
  <meta name="robots" content="all">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Resource",
    "datePublished": "${today}T00:00:00Z",
    "dateModified": "${today}T00:00:00Z",
    "url": "${BASE}/link/${code}"
  }
  </script>
</head>
<body>
  <p>Redirecting to <a href="${target}">${target}</a>…</p>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>`);
};
