// ============================================================
// controllers/healthController.js
// Health check: tells whether the API and its database answer.
// Used to check an installation or a deployment.
// ============================================================

const pool = require('../config/database');

/** GET /api/health */
async function health(req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ api: 'ok', database: 'ok' });
  } catch {
    // 503 = service temporarily unavailable
    res.status(503).json({ api: 'ok', database: 'indisponible' });
  }
}

module.exports = { health };
