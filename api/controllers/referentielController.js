// ============================================================
// controllers/referentielController.js
// ============================================================

const ReferentielModel = require('../models/ReferentielModel');
const ReferentielService = require('../services/ReferentielService');

const referentielService = new ReferentielService(ReferentielModel);

/** GET /api/races */
async function listRaces(req, res) {
  res.json(await referentielService.listRaces());
}

/** GET /api/vaccins */
async function listVaccins(req, res) {
  res.json(await referentielService.listVaccins());
}

module.exports = { listRaces, listVaccins };
