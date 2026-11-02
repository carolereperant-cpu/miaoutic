// ============================================================
// middlewares/validators/animalValidators.js
// Validation rules for the animal routes (express-validator).
// Every value sent by the user is checked BEFORE it is used:
// type, allowed values, length, consistency of the dates.
// Unknown fields are ignored because the controllers only read
// matchedData().
// ============================================================

const { query, param, body } = require('express-validator');

const TAILLES = ['petit', 'moyen', 'grand'];
const SEXES = ['male', 'femelle'];
const ENERGIES = ['calme', 'modere', 'energique'];
const IDENTIFICATIONS = ['puce', 'tatouage', 'aucune'];
const SHELTER_STATUSES = ['disponible', 'reserve'];

// Letters (accents included), spaces, hyphens and apostrophes
const NAME_PATTERN = /^\p{L}[\p{L} '’-]*$/u;

/** Today as 'YYYY-MM-DD' (local date), to refuse dates in the future */
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 'YYYY-MM-DD' strings can be compared directly as text
const dateRule = (field, label) => body(field)
  .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage(`${label} doit être une date au format AAAA-MM-JJ.`)
  .bail()
  .custom((value) => value <= today()).withMessage(`${label} ne peut pas être dans le futur.`);

const booleanRule = (field) => body(field)
  .isBoolean({ strict: true }).withMessage(`Le champ ${field} doit valoir true ou false.`)
  .toBoolean(true);

// ------------------------------------------------------------
// Public routes
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Shelter routes
// ------------------------------------------------------------

/** POST /api/animaux and PUT /api/animaux/:id */
const animalBodyRules = [
  body('nom')
    .isString().withMessage('Le nom est obligatoire.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Le nom doit contenir de 1 à 50 caractères.')
    .bail()
    .matches(NAME_PATTERN).withMessage('Le nom contient des caractères non autorisés.'),

  body('sexe').isIn(SEXES).withMessage(`Le sexe doit valoir : ${SEXES.join(', ')}.`),
  dateRule('dateNaissance', 'La date de naissance'),
  body('taille').isIn(TAILLES).withMessage(`La taille doit valoir : ${TAILLES.join(', ')}.`),
  body('energie').isIn(ENERGIES).withMessage(`L'énergie doit valoir : ${ENERGIES.join(', ')}.`),

  booleanRule('okEnfants'),
  booleanRule('okChiens'),
  booleanRule('okChats'),
  booleanRule('besoinJardin'),
  booleanRule('sterilise'),
  booleanRule('coupDeCoeur'),

  body('description')
    .isString().withMessage('La description est obligatoire.')
    .bail()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('La description doit contenir de 10 à 2000 caractères.'),

  body('identification').isIn(IDENTIFICATIONS).withMessage(`L'identification doit valoir : ${IDENTIFICATIONS.join(', ')}.`),

  // Optional fields: may be absent or null
  body('remarquesSante')
    .optional({ values: 'null' })
    .isString().withMessage('Les remarques de santé doivent être un texte.')
    .bail()
    .trim()
    .isLength({ max: 1000 }).withMessage('Les remarques de santé ne doivent pas dépasser 1000 caractères.'),

  body('photo')
    .optional({ values: 'null' })
    .isURL({ protocols: ['https'], require_protocol: true }).withMessage('La photo doit être une adresse https.')
    .isLength({ max: 255 }).withMessage('L\'adresse de la photo est trop longue.'),

  dateRule('dateArrivee', 'La date d\'arrivée')
    .custom((value, { req }) => value >= req.body.dateNaissance)
    .withMessage('La date d\'arrivée ne peut pas précéder la date de naissance.'),

  body('idRace').isInt({ min: 1 }).withMessage('La race est invalide.').toInt(),

  // Vaccinations: optional list of { idVaccin, date }
  body('vaccinations')
    .optional()
    .isArray({ max: 30 }).withMessage('Les vaccinations doivent être une liste (30 au maximum).')
    .bail()
    .custom((list) => {
      const keys = list.map((v) => `${v?.idVaccin}|${v?.date}`);
      return new Set(keys).size === keys.length;
    }).withMessage('La même vaccination est indiquée deux fois.'),
  body('vaccinations.*.idVaccin').isInt({ min: 1 }).withMessage('Le vaccin est invalide.').toInt(),
  dateRule('vaccinations.*.date', 'La date de vaccination')
    .custom((value, { req }) => value >= req.body.dateNaissance)
    .withMessage('Une vaccination ne peut pas précéder la naissance.'),
];

/** PATCH /api/animaux/:id/statut */
const animalStatutRules = [
  body('statut')
    .isIn(SHELTER_STATUSES)
    .withMessage(`Le statut doit valoir : ${SHELTER_STATUSES.join(', ')} (l'adoption passe par une demande).`),
];

module.exports = { listAnimalsRules, animalIdRules, animalBodyRules, animalStatutRules };
