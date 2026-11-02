// ============================================================
// models/ReferentielModel.js
// Reference lists used by the shelter forms (select boxes):
// breeds and vaccines.
// ============================================================

const pool = require('../config/database');

class ReferentielModel {
  /** Breeds with their species, sorted by species then name. */
  static async findRaces() {
    const sql = `
      SELECT r.id_race, r.nom_race, e.id_espece, e.nom_espece
      FROM race r
      JOIN espece e ON e.id_espece = r.id_espece
      ORDER BY e.id_espece, r.nom_race`;
    const [rows] = await pool.execute(sql);
    return rows;
  }

  /** Vaccines, sorted by name. */
  static async findVaccins() {
    const [rows] = await pool.execute('SELECT id_vaccin, nom_vaccin FROM vaccin ORDER BY nom_vaccin');
    return rows;
  }
}

module.exports = ReferentielModel;
