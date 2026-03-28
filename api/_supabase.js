// api/_supabase.js — shared Supabase REST helper (no SDK needed)

const SB_URL = process.env.SUPABASE_URL || 'https://rbqfmhyuzdizaexbfcem.supabase.co';
const SB_KEY = process.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWZtaHl1emRpemFleGJmY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDQwOTIsImV4cCI6MjA5MDEyMDA5Mn0.jXYe6qqqc5NCxvMPVVhiGqMYXfyiQ92bj5eCQt2J4WM';

const HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

/** GET rows from a Supabase table using a query string */
async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: HEADERS });
  if (!res.ok) return [];
  return res.json();
}

/** UPSERT (insert with merge) one or more rows */
async function sbUpsert(table, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(data),
  });
  return res;
}

/** PATCH rows matching a PostgREST filter string (e.g. "code=eq.abc12") */
async function sbPatch(table, filter, data) {
  return fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
}

/** DELETE rows matching a filter */
async function sbDelete(table, filter) {
  return fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
}

module.exports = { sbGet, sbUpsert, sbPatch, sbDelete };
