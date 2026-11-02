// ============================================================
// models/ProfilModel.js
// Data access component for the adopter questionnaire
// (table profil_adoptant, one row per adopter).
// ============================================================

const pool = require('../config/database');

const COLUMNS = 'id_utilisateur, logement, a_enfants, a_chien, a_chat, temps_disponible, date_maj';

class ProfilModel {
  /**
   * @param {number} idUtilisateur
   * @param {object} [db] - pool or transaction connection
   * @returns {Promise<object|null>} null if the questionnaire was never filled in
   */
  static async findByUser(idUtilisateur, db = pool) {
    const [rows] = await db.execute(`SELECT ${COLUMNS} FROM profil_adoptant WHERE id_utilisateur = ?`, [idUtilisateur]);
    return rows[0] ?? null;
  }

  /**
   * Creates the questionnaire, or updates it if it already exists
   * (one single query: INSERT ... ON DUPLICATE KEY UPDATE).
   * VALUES(column) is used because it works on both MySQL and MariaDB.
   * @param {number} idUtilisateur
   * @param {{ logement: string, aEnfants: boolean, aChien: boolean, aChat: boolean, tempsDisponible: string }} data
   */
  static async save(idUtilisateur, { logement, aEnfants, aChien, aChat, tempsDisponible }, db = pool) {
    const sql = `
      INSERT INTO profil_adoptant (id_utilisateur, logement, a_enfants, a_chien, a_chat, temps_disponible)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        logement = VALUES(logement),
        a_enfants = VALUES(a_enfants),
        a_chien = VALUES(a_chien),
        a_chat = VALUES(a_chat),
        temps_disponible = VALUES(temps_disponible)`;

    await db.execute(sql, [idUtilisateur, logement, aEnfants, aChien, aChat, tempsDisponible]);
  }
}

module.exports = ProfilModel;
