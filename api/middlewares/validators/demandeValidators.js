// ============================================================
// middlewares/validators/demandeValidators.js
//
// About XSS: the message is validated (type, length) but stored
// as typed. It is escaped when it is DISPLAYED (React escapes
// every text automatically). Escaping on input would damage the
// data ("l'adoption" would become "l&#x27;adoption").
// ============================================================

const { body, param, query } = require('express-validator');

const ALL_STATUSES = ['recue', 'en_etude', 'acceptee', 'refusee', 'annulee'];
const SHELTER_STATUSES = ['en_etude', 'acceptee', 'refusee'];

const idParamRule = param('id')
  .isInt({ min: 1 }).withMessage('L\'identifiant de la demande est invalide.')
  .toInt();

/** POST /api/demandes */
const createDemandeRules = [
  body('idAnimal')
    .isInt({ min: 1 }).withMessage('L\'animal est invalide.')
    .toInt(),
  body('message')
    .isString().withMessage('Le message est obligatoire.')
    .bail()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Le message doit contenir de 10 à 1000 caractères.'),
];

/** PATCH /api/demandes/:id/annulation */
const cancelDemandeRules = [idParamRule];

/** GET /api/demandes?statut= (shelter) */
const listDemandesRules = [
  query('statut')
    .optional()
    .isIn(ALL_STATUSES).withMessage(`Le statut doit valoir : ${ALL_STATUSES.join(', ')}.`),
];

/** PATCH /api/demandes/:id/statut (shelter) */
const changeStatutRules = [
  idParamRule,
  body('statut')
    .isIn(SHELTER_STATUSES).withMessage(`Le statut doit valoir : ${SHELTER_STATUSES.join(', ')}.`),
];

module.exports = { createDemandeRules, cancelDemandeRules, listDemandesRules, changeStatutRules };
