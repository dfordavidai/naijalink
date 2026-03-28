// api/hits.js
// Returns recent bot-hit events for the Googlebot Activity footer feed.
// GET /api/hits?limit=50

const { sbGet } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

  try {
    const rows = await sbGet(
      `ic_short_links?hits=gt.0&order=updated_at.desc&limit=${limit}&select=code,hits,updated_at`
    );
    res.status(200).json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
