// ============================================================
// middlewares/validators/profilValidators.js
// Validation of the adopter questionnaire.
// ============================================================

const { body, param } = require('express-validator');

const LOGEMENTS = ['appartement', 'maison_sans_jardin', 'maison_avec_jardin'];
const TEMPS = ['faible', 'moyen', 'eleve'];

// Only true or false are accepted (not "yes", 1, "on"...)
const booleanRule = (field) => body(field)
  .isBoolean({ strict: true }).withMessage(`Le champ ${field} doit valoir true ou false.`)
  .toBoolean(true);

/** PUT /api/profil */
const saveProfilRules = [
  body('logement').isIn(LOGEMENTS).withMessage(`Le logement doit valoir : ${LOGEMENTS.join(', ')}.`),
  booleanRule('aEnfants'),
  booleanRule('aChien'),
  booleanRule('aChat'),
  body('tempsDisponible').isIn(TEMPS).withMessage(`Le temps disponible doit valoir : ${TEMPS.join(', ')}.`),
];

/** GET /api/profil/compatibilite/:idAnimal */
const compatibiliteRules = [
  param('idAnimal').isInt({ min: 1 }).withMessage('L\'identifiant de l\'animal est invalide.').toInt(),
];

module.exports = { saveProfilRules, compatibiliteRules };
