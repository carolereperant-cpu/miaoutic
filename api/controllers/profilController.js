// ============================================================
// controllers/profilController.js
// All these routes are for logged-in adopters: the user id
// always comes from the token (req.utilisateur), never from the
// request, so nobody can read or change someone else's profile.
// ============================================================

const { matchedData } = require('express-validator');
const ProfilModel = require('../models/ProfilModel');
const AnimalModel = require('../models/AnimalModel');
const ProfilService = require('../services/ProfilService');
const CompatibiliteService = require('../services/CompatibiliteService');

const profilService = new ProfilService({
  profilModel: ProfilModel,
  animalModel: AnimalModel,
  compatibiliteService: new CompatibiliteService(),
});

/** GET /api/profil */
async function getProfil(req, res) {
  res.json(await profilService.get(req.utilisateur.id));
}

/** PUT /api/profil - creates or updates the questionnaire */
async function saveProfil(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  res.json(await profilService.save(req.utilisateur.id, data));
}

/** GET /api/profil/matchs - animals sorted by compatibility */
async function listMatchs(req, res) {
  res.json(await profilService.listMatchs(req.utilisateur.id));
}

/** GET /api/profil/compatibilite/:idAnimal - detailed score */
async function getCompatibilite(req, res) {
  const { idAnimal } = matchedData(req, { locations: ['params'] });
  res.json(await profilService.compatibilityWith(req.utilisateur.id, idAnimal));
}

module.exports = { getProfil, saveProfil, listMatchs, getCompatibilite };
