// api/indexnow-key.js
// Serves the IndexNow key verification file at /indexcore.txt
// Bing/Yandex verify ownership by fetching this before accepting submissions.

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send('indexcore');
};
