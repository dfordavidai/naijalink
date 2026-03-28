// api/robots.js
// Serves a crawl-optimised robots.txt.
// Crawl-delay: 0 on Googlebot = maximum aggressiveness.

const BASE = 'https://tinubunews.com.ng';

module.exports = function handler(req, res) {
  const txt = `User-agent: *
Allow: /
Disallow: /api/

User-agent: Googlebot
Crawl-delay: 0
Allow: /
Allow: /link/

User-agent: Bingbot
Crawl-delay: 0
Allow: /

Sitemap: ${BASE}/sitemap.xml
Sitemap: ${BASE}/feed.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(txt);
};
