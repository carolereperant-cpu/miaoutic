// ============================================================
// controllers/animalController.js
// Receives the HTTP request, calls the service, sends the
// response. No SQL and no business rule here.
// ============================================================

const { matchedData } = require('express-validator');
const AnimalModel = require('../models/AnimalModel');
const AnimalService = require('../services/AnimalService');

const animalService = new AnimalService(AnimalModel);

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

module.exports = { listAnimals, listCoupsDeCoeur, getAnimal };
