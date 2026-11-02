// ============================================================
// middlewares/validators/animalValidators.js
// Validation rules for the animal routes (express-validator).
// Every value sent by the user is checked BEFORE it is used:
// type, allowed values, length. Unknown parameters are ignored
// because the controllers only read matchedData().
// ============================================================

const { query, param } = require('express-validator');

const TAILLES = ['petit', 'moyen', 'grand'];

/** GET /api/animaux?espece=&taille=&nom= */
const listAnimalsRules = [
  query('espece')
    .optional()
    .isInt({ min: 1 }).withMessage('L\'espèce doit être un identifiant numérique.')
    .toInt(),

  query('taille')
    .optional()
    .isIn(TAILLES).withMessage(`La taille doit valoir : ${TAILLES.join(', ')}.`),

  query('nom')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Le nom recherché doit contenir de 1 à 50 caractères.'),
];

/** Routes with an :id parameter */
const animalIdRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('L\'identifiant de l\'animal est invalide.')
    .toInt(),
];

module.exports = { listAnimalsRules, animalIdRules };
