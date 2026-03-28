// api/feed.js
// Atom feed — used by PubSubHubbub / WebSub triple-fire channel.
// Google's internal news pipeline subscribes to Atom feeds and triggers
// near-instant crawls when a new entry appears.

const { sbGet } = require('./_supabase');

const BASE = 'https://tinubunews.com.ng';

module.exports = async function handler(req, res) {
  let rows = [];
  try {
    rows = await sbGet(
      'ic_short_links?select=code,target,created_at&order=created_at.desc&limit=500'
    );
  } catch (_) {}

  const now = new Date().toISOString();

  const entries = (rows || []).map(r => {
    const published = r.created_at || now;
    const shortUrl  = `${BASE}/link/${r.code}`;
    return `  <entry>
    <id>${shortUrl}</id>
    <title>Resource ${r.code}</title>
    <link rel="alternate" href="${shortUrl}"/>
    <published>${published}</published>
    <updated>${published}</updated>
    <content type="html"><![CDATA[<a href="${r.target || shortUrl}">View resource</a>]]></content>
  </entry>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:hub="http://pubsubhubbub.appspot.com/">
  <title>NaijaLinker Short Links</title>
  <id>${BASE}/feed.xml</id>
  <link rel="self" href="${BASE}/feed.xml"/>
  <link rel="hub" href="https://pubsubhubbub.appspot.com/"/>
  <updated>${now}</updated>
${entries}
</feed>`;

  res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
};
