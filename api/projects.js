// api/projects.js
// REST proxy for project operations.
//
// GET    /api/projects               — list all projects
// POST   /api/projects               — create project
// DELETE /api/projects?id=xxx        — delete project + its links

const { sbGet, sbUpsert, sbDelete } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {
    if (req.method === 'GET') {
      const data = await sbGet('lc_projects?order=created_at.asc');
      res.status(200).json(data);
      return;
    }

    if (req.method === 'POST') {
      const proj = req.body;
      if (!proj || !proj.id || !proj.name) {
        res.status(400).json({ error: 'id and name required' });
        return;
      }
      await sbUpsert('lc_projects', [proj]);
      res.status(201).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) { res.status(400).json({ error: 'Provide id' }); return; }

      // Cascade: delete all links for this project
      await sbDelete('lc_links', `project_id=eq.${id}`);
      await sbDelete('lc_projects', `id=eq.${id}`);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[/api/projects]', err);
    res.status(500).json({ error: err.message });
  }
};
