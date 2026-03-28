// api/sitemap.js
// Generates a live XML sitemap from all active short links in Supabase.
// Googlebot re-fetches this after every GSC Sitemaps API push.

const { sbGet } = require('./_supabase');

const BASE = 'https://tinubunews.com.ng';

module.exports = async function handler(req, res) {
  let rows = [];
  try {
    rows = await sbGet('ic_short_links?select=code,updated_at&order=updated_at.desc&limit=50000');
  } catch (_) { /* serve empty sitemap on DB error */ }

  const today = new Date().toISOString();

  const urls = (rows || []).map(r => {
    const lastmod = r.updated_at ? r.updated_at.split('T')[0] : today.split('T')[0];
    return `  <url>
    <loc>${BASE}/link/${r.code}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
