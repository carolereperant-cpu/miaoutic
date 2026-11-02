// ============================================================
// middlewares/validators/authValidators.js
// Validation rules for sign-up and login.
//
// Password policy: recommendation of the CNIL (French data
// protection authority, deliberation 2022-100) for a password
// used alone: at least 12 characters mixing upper case, lower
// case, digits and special characters.
// ============================================================

const { body } = require('express-validator');

// Letters (accents included), spaces, hyphens and apostrophes
const NAME_PATTERN = /^\p{L}[\p{L} '’-]*$/u;

const emailRule = () => body('email')
  .trim()
  .isEmail().withMessage('L\'adresse email est invalide.')
  .isLength({ max: 255 }).withMessage('L\'adresse email est trop longue.')
  .toLowerCase();

const nameRule = (field, label) => body(field)
  .trim()
  .isLength({ min: 1, max: 100 }).withMessage(`${label} doit contenir de 1 à 100 caractères.`)
  .bail() // one message is enough when the field is empty
  .matches(NAME_PATTERN).withMessage(`${label} contient des caractères non autorisés.`);

/** POST /api/auth/inscription */
const registerRules = [
  emailRule(),

  body('motDePasse')
    .isString().withMessage('Le mot de passe est obligatoire.')
    .bail() // stop here if there is no password at all
    .isLength({ min: 12 }).withMessage('Le mot de passe doit contenir au moins 12 caractères.')
    // bcrypt only uses the first 72 bytes: refuse longer passwords
    // instead of silently ignoring their end
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Le mot de passe est trop long.')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir une minuscule.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule.')
    .matches(/\d/).withMessage('Le mot de passe doit contenir un chiffre.')
    .matches(/[^A-Za-z0-9]/).withMessage('Le mot de passe doit contenir un caractère spécial.'),

  nameRule('prenom', 'Le prénom'),
  nameRule('nom', 'Le nom'),
];

/** POST /api/auth/connexion */
const loginRules = [
  emailRule(),
  body('motDePasse')
    .isString().withMessage('Le mot de passe est obligatoire.')
    .bail()
    .isLength({ min: 1, max: 200 }).withMessage('Le mot de passe est obligatoire.'),
];

module.exports = { registerRules, loginRules };
