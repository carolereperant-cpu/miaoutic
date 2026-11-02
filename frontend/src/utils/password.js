// ============================================================
// utils/password.js
// Password rules: same as the API (CNIL recommendation).
// ============================================================

export const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 12 caractères', test: (value) => value.length >= 12 },
  { id: 'lower', label: 'Une minuscule', test: (value) => /[a-z]/.test(value) },
  { id: 'upper', label: 'Une majuscule', test: (value) => /[A-Z]/.test(value) },
  { id: 'digit', label: 'Un chiffre', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'Un caractère spécial (#, !, @…)', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

/** @returns {boolean} true when every rule is respected */
export function isPasswordValid(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
