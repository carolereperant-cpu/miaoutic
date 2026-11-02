// ============================================================
// controllers/animalController.js
// Receives the HTTP request, calls the service, sends the
// response. No SQL and no business rule here.
// ============================================================

const { matchedData } = require('express-validator');
const AnimalModel = require('../models/AnimalModel');
const AnimalService = require('../services/AnimalService');
const { withTransaction } = require('../utils/transaction');

const animalService = new AnimalService(AnimalModel, withTransaction);

// ------------------------------------------------------------
// Public
// ------------------------------------------------------------

/** GET /api/animaux - public list, with optional filters */
async function listAnimals(req, res) {
  // matchedData returns only the validated (and converted) values
  const { espece, taille, nom } = matchedData(req, { locations: ['query'] });
  const animals = await animalService.listPublic({ idEspece: espece, taille, nom });
  res.json(animals);
}

/** GET /api/animaux/coups-de-coeur - favourites of the home page */
async function listCoupsDeCoeur(req, res) {
  const animals = await animalService.listCoupsDeCoeur();
  res.json(animals);
}

/** GET /api/animaux/:id - full sheet of one animal */
async function getAnimal(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const animal = await animalService.getById(id);
  res.json(animal);
}

// ------------------------------------------------------------
// Shelter
// ------------------------------------------------------------

/** GET /api/animaux/gestion - every animal, for the dashboard */
async function listAnimalsForShelter(req, res) {
  res.json(await animalService.listForShelter());
}

/** POST /api/animaux - creates an animal */
async function createAnimal(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const animal = await animalService.create(data);
  res.status(201).json(animal);
}

/** PUT /api/animaux/:id - updates an animal */
async function updateAnimal(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const data = matchedData(req, { locations: ['body'] });
  res.json(await animalService.update(id, data));
}

/** PATCH /api/animaux/:id/statut - available or reserved */
async function changeAnimalStatut(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const { statut } = matchedData(req, { locations: ['body'] });
  res.json(await animalService.changeStatus(id, statut));
}

/** DELETE /api/animaux/:id */
async function deleteAnimal(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  await animalService.remove(id);
  res.status(204).end(); // 204 = done, nothing to send back
}

module.exports = {
  listAnimals,
  listCoupsDeCoeur,
  getAnimal,
  listAnimalsForShelter,
  createAnimal,
  updateAnimal,
  changeAnimalStatut,
  deleteAnimal,
};
