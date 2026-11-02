// ============================================================
// controllers/especeController.js
// ============================================================

const EspeceModel = require('../models/EspeceModel');
const EspeceService = require('../services/EspeceService');

const especeService = new EspeceService(EspeceModel);

/** GET /api/especes - species of the menu */
async function listEspeces(req, res) {
  const especes = await especeService.list();
  res.json(especes);
}

module.exports = { listEspeces };
