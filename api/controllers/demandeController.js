// ============================================================
// controllers/demandeController.js
// ============================================================

const { matchedData } = require('express-validator');
const DemandeModel = require('../models/DemandeModel');
const AnimalModel = require('../models/AnimalModel');
const ProfilModel = require('../models/ProfilModel');
const DemandeService = require('../services/DemandeService');
const CompatibiliteService = require('../services/CompatibiliteService');
const { withTransaction } = require('../utils/transaction');

const demandeService = new DemandeService({
  demandeModel: DemandeModel,
  animalModel: AnimalModel,
  profilModel: ProfilModel,
  compatibiliteService: new CompatibiliteService(),
  withTransaction,
});

/** POST /api/demandes (adopter) */
async function createDemande(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const demande = await demandeService.create(req.utilisateur.id, data);
  res.status(201).json(demande);
}

/** GET /api/demandes/mes-demandes (adopter) */
async function listMesDemandes(req, res) {
  res.json(await demandeService.listForAdopter(req.utilisateur.id));
}

/** PATCH /api/demandes/:id/annulation (adopter) */
async function cancelDemande(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  res.json(await demandeService.cancel(req.utilisateur.id, id));
}

/** GET /api/demandes (shelter) */
async function listDemandes(req, res) {
  const { statut } = matchedData(req, { locations: ['query'] });
  res.json(await demandeService.listForShelter({ statut }));
}

/** PATCH /api/demandes/:id/statut (shelter) */
async function changeStatut(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const { statut } = matchedData(req, { locations: ['body'] });
  res.json(await demandeService.changeStatus(id, statut));
}

module.exports = { createDemande, listMesDemandes, cancelDemande, listDemandes, changeStatut };
