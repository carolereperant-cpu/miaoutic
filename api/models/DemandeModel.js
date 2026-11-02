// ============================================================
// models/DemandeModel.js
// Data access component for the adoption requests.
// Every method accepts an optional "db": the pool by default, or
// the connection of a transaction when several queries must
// succeed or fail together.
// ============================================================

const pool = require('../config/database');

const ACTIVE_STATUSES = "('recue', 'en_etude')";

class DemandeModel {
  /**
   * @param {{ idUtilisateur: number, idAnimal: number, message: string, score: number }} data
   * @returns {Promise<number>} id of the new request
   * @throws the MySQL error ER_DUP_ENTRY if an active request already
   *   exists for this adopter and this animal (unique index)
   */
  static async create({ idUtilisateur, idAnimal, message, score }, db = pool) {
    const sql = `
      INSERT INTO demande_adoption (id_utilisateur, id_animal, message, score_compatibilite)
      VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [idUtilisateur, idAnimal, message, score]);
    return result.insertId;
  }

  /**
   * One request with the names of the animal and of the adopter.
   * @returns {Promise<object|null>}
   */
  static async findById(id, db = pool) {
    const sql = `
      SELECT d.id_demande, d.id_utilisateur, d.id_animal, d.message, d.score_compatibilite,
             d.statut, d.date_creation, d.date_maj,
             a.nom AS nom_animal, a.statut AS statut_animal,
             u.prenom, u.nom, u.email
      FROM demande_adoption d
      JOIN animal a      ON a.id_animal = d.id_animal
      JOIN utilisateur u ON u.id_utilisateur = d.id_utilisateur
      WHERE d.id_demande = ?`;
    const [rows] = await db.execute(sql, [id]);
    return rows[0] ?? null;
  }

  /**
   * Reads a request and locks its row until the end of the
   * transaction (see AnimalModel.findForUpdate).
   * @returns {Promise<object|null>}
   */
  static async findForUpdate(id, connection) {
    const sql = `
      SELECT id_demande, id_utilisateur, id_animal, statut
      FROM demande_adoption
      WHERE id_demande = ?
      FOR UPDATE`;
    const [rows] = await connection.execute(sql, [id]);
    return rows[0] ?? null;
  }

  /**
   * Requests of one adopter, most recent first ("Mes demandes").
   */
  static async findByUser(idUtilisateur) {
    const sql = `
      SELECT d.id_demande, d.id_animal, d.score_compatibilite, d.statut, d.date_creation, d.date_maj,
             a.nom AS nom_animal, a.photo, a.statut AS statut_animal
      FROM demande_adoption d
      JOIN animal a ON a.id_animal = d.id_animal
      WHERE d.id_utilisateur = ?
      ORDER BY d.date_creation DESC`;
    const [rows] = await pool.execute(sql, [idUtilisateur]);
    return rows;
  }

  /**
   * All requests for the shelter, optionally filtered by status.
   * Active requests first, then the most recent.
   * @param {{ statut?: string }} [filters]
   */
  static async findAll({ statut } = {}) {
    const params = [];
    let where = '';
    if (statut !== undefined) {
      where = 'WHERE d.statut = ?';
      params.push(statut);
    }

    const sql = `
      SELECT d.id_demande, d.id_animal, d.score_compatibilite, d.statut, d.date_creation, d.date_maj,
             a.nom AS nom_animal, a.statut AS statut_animal,
             u.id_utilisateur, u.prenom, u.nom, u.email
      FROM demande_adoption d
      JOIN animal a      ON a.id_animal = d.id_animal
      JOIN utilisateur u ON u.id_utilisateur = d.id_utilisateur
      ${where}
      ORDER BY d.statut IN ${ACTIVE_STATUSES} DESC, d.date_creation DESC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  /**
   * @param {number} id
   * @param {'en_etude'|'acceptee'|'refusee'|'annulee'} statut
   */
  static async updateStatut(id, statut, db = pool) {
    await db.execute('UPDATE demande_adoption SET statut = ? WHERE id_demande = ?', [statut, id]);
  }

  /**
   * Refuses every other active request for the same animal
   * (used when an adoption is accepted).
   * @returns {Promise<number>} number of refused requests
   */
  static async refuseOtherActive(idAnimal, exceptIdDemande, db = pool) {
    const sql = `
      UPDATE demande_adoption
      SET statut = 'refusee'
      WHERE id_animal = ? AND id_demande <> ? AND statut IN ${ACTIVE_STATUSES}`;
    const [result] = await db.execute(sql, [idAnimal, exceptIdDemande]);
    return result.affectedRows;
  }
}

module.exports = DemandeModel;
