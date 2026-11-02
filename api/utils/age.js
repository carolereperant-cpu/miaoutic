// ============================================================
// utils/age.js
// Computes the age of an animal from its birth date.
// The database stores the birth date, not the age, because an
// age stored once would be wrong a few months later.
// ============================================================

/**
 * @param {string} birthDate - 'YYYY-MM-DD'
 * @param {Date} [today] - reference date (injectable for the tests)
 * @returns {{ annees: number, mois: number, libelle: string }}
 *   annees + mois = exact age; libelle = text shown on the site
 */
function computeAge(birthDate, today = new Date()) {
  const [year, month, day] = birthDate.split('-').map(Number);

  // Full months elapsed since the birth date
  let totalMonths = (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month);
  if (today.getDate() < day) {
    totalMonths -= 1; // this month's "birthday" is not reached yet
  }
  totalMonths = Math.max(0, totalMonths);

  const annees = Math.floor(totalMonths / 12);
  const mois = totalMonths % 12;

  let libelle;
  if (annees >= 1) {
    libelle = `${annees} an${annees > 1 ? 's' : ''}`;
  } else if (mois >= 1) {
    libelle = `${mois} mois`;
  } else {
    libelle = 'Moins d\'un mois';
  }

  return { annees, mois, libelle };
}

module.exports = { computeAge };
