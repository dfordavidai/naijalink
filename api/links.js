// api/links.js
// REST proxy for short-link operations — called from the LinkCore dashboard.
// Keeps Supabase credentials server-side (never exposed in browser JS).
//
// GET    /api/links?project_id=xxx       — list links for a project
// POST   /api/links                      — create short link(s)
// PATCH  /api/links?id=xxx               — update verdict / hits / submitted
// DELETE /api/links?id=xxx               — delete a link

const { sbGet, sbUpsert, sbPatch, sbDelete } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {
    // ── GET ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { project_id, code } = req.query;
      let path = 'lc_links?order=added_at.asc';
      if (project_id) path += `&project_id=eq.${encodeURIComponent(project_id)}`;
      if (code)       path += `&code=eq.${encodeURIComponent(code)}`;
      const data = await sbGet(path);
      res.status(200).json(data);
      return;
    }

    // ── POST ─────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body;
      if (!body) { res.status(400).json({ error: 'Empty body' }); return; }
      const rows = Array.isArray(body) ? body : [body];

      // Save to lc_links table
      await sbUpsert('lc_links', rows);

      // Also register codes in ic_short_links (redirect table)
      const shorts = rows.map(r => ({ code: r.code, target: r.original }));
      await sbUpsert('ic_short_links', shorts);

      res.status(201).json({ created: rows.length });
      return;
    }

    // ── PATCH ─────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      const { id, code } = req.query;
      const body = req.body;
      if (!body) { res.status(400).json({ error: 'Empty body' }); return; }

      if (id) {
        await sbPatch('lc_links', `id=eq.${id}`, body);
        // Sync hits to ic_short_links if included
        if (body.hits !== undefined && code) {
          await sbPatch('ic_short_links', `code=eq.${code}`, { hits: body.hits });
        }
        res.status(200).json({ ok: true });
        return;
      }

      if (code) {
        await sbPatch('ic_short_links', `code=eq.${code}`, body);
        res.status(200).json({ ok: true });
        return;
      }

      res.status(400).json({ error: 'Provide id or code query param' });
      return;
    }

    // ── DELETE ─────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id, code } = req.query;
      if (!id && !code) { res.status(400).json({ error: 'Provide id or code' }); return; }

      if (id)   await sbDelete('lc_links',       `id=eq.${id}`);
      if (code) await sbDelete('ic_short_links',  `code=eq.${code}`);

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[/api/links]', err);
    res.status(500).json({ error: err.message });
  }
};
