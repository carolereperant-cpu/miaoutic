// ============================================================
// routes/animalRoutes.js
// URL -> validation rules -> validate -> controller
// ============================================================

const { Router } = require('express');
const validate = require('../middlewares/validate');
const { listAnimalsRules, animalIdRules } = require('../middlewares/validators/animalValidators');
const { listAnimals, listCoupsDeCoeur, getAnimal } = require('../controllers/animalController');

const router = Router();

router.get('/', listAnimalsRules, validate, listAnimals);

// Declared before "/:id", otherwise "coups-de-coeur" would be read as an id
router.get('/coups-de-coeur', listCoupsDeCoeur);

router.get('/:id', animalIdRules, validate, getAnimal);

module.exports = router;
