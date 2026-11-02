// ============================================================
// utils/formErrors.js
// The API answers 400 with a list of invalid fields:
//   { erreurs: [{ champ: 'email', message: '...' }, ...] }
// This turns it into an object { email: '...' } to show each
// message under its field.
// ============================================================

/**
 * @param {{ erreurs?: { champ: string, message: string }[] }} error
 * @returns {Record<string, string>} first message of each field
 */
export function fieldErrors(error) {
  const result = {};
  for (const { champ, message } of error?.erreurs ?? []) {
    if (!result[champ]) result[champ] = message;
  }
  return result;
}
