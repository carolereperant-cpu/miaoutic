// ============================================================
// models/EspeceModel.js
// Data access component for the species (menu of the site).
// ============================================================

const pool = require('../config/database');

class EspeceModel {
  /**
   * All species with the number of animals currently available.
   * LEFT JOIN keeps a species even when it has no animal.
   * @returns {Promise<{id_espece: number, nom_espece: string, nb_disponibles: number}[]>}
   */
  static async findAllWithCount() {
    const sql = `
      SELECT e.id_espece, e.nom_espece, COUNT(a.id_animal) AS nb_disponibles
      FROM espece e
      LEFT JOIN race r   ON r.id_espece = e.id_espece
      LEFT JOIN animal a ON a.id_race = r.id_race AND a.statut = 'disponible'
      GROUP BY e.id_espece, e.nom_espece
      ORDER BY e.id_espece`;

    const [rows] = await pool.execute(sql);
    return rows;
  }
}

module.exports = EspeceModel;
