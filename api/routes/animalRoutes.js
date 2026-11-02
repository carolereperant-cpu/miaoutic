// ============================================================
// routes/animalRoutes.js
// URL -> (access control) -> validation rules -> validate -> controller
// ============================================================

const { Router } = require('express');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  listAnimalsRules, animalIdRules, animalBodyRules, animalStatutRules,
} = require('../middlewares/validators/animalValidators');
const {
  listAnimals, listCoupsDeCoeur, getAnimal,
  listAnimalsForShelter, createAnimal, updateAnimal, changeAnimalStatut, deleteAnimal,
} = require('../controllers/animalController');

const router = Router();
const refuge = [authenticate, authorize('refuge')];

// Public
router.get('/', listAnimalsRules, validate, listAnimals);

// Fixed paths are declared before "/:id", otherwise "coups-de-coeur"
// and "gestion" would be read as an id
router.get('/coups-de-coeur', listCoupsDeCoeur);
router.get('/gestion', refuge, listAnimalsForShelter);

router.get('/:id', animalIdRules, validate, getAnimal);

// Shelter
router.post('/', refuge, animalBodyRules, validate, createAnimal);
router.put('/:id', refuge, animalIdRules, animalBodyRules, validate, updateAnimal);
router.patch('/:id/statut', refuge, animalIdRules, animalStatutRules, validate, changeAnimalStatut);
router.delete('/:id', refuge, animalIdRules, validate, deleteAnimal);

module.exports = router;
