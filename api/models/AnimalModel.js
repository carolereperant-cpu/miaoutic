// ============================================================
// models/AnimalModel.js
// Data access component for the animals (tables animal, race,
// espece, vaccination, vaccin).
//
// SECURITY: every value coming from the user is sent to MySQL
// as a parameter (the "?" placeholders of a prepared statement)
// and is never concatenated into the SQL string. MySQL treats it
// as data, never as code: this prevents SQL injection.
// ============================================================

const pool = require('../config/database');

// Columns shown on an animal card (lists)
const CARD_COLUMNS = `
  a.id_animal, a.nom, a.sexe, a.date_naissance, a.taille, a.photo, a.statut,
  r.nom_race, e.id_espece, e.nom_espece`;

// Columns used by the compatibility score (with a.taille, already
// in CARD_COLUMNS)
const CRITERIA_COLUMNS = `
  a.energie, a.ok_enfants, a.ok_chiens, a.ok_chats, a.besoin_jardin`;

// Joins shared by every query on animals
const JOINS = `
  FROM animal a
  JOIN race r   ON r.id_race = a.id_race
  JOIN espece e ON e.id_espece = r.id_espece`;

/**
 * Escapes the LIKE wildcards (% and _) typed by the user, so that
 * searching "a_b" looks for the text "a_b" and not "a" + any char + "b".
 * @param {string} text
 * @returns {string}
 */
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

class AnimalModel {
  /**
   * Animals shown on the public site: available or reserved
   * (adopted animals are hidden), with optional filters.
   * @param {object} [filters]
   * @param {number} [filters.idEspece] - species id
   * @param {string} [filters.taille]   - 'petit' | 'moyen' | 'grand'
   * @param {string} [filters.nom]      - part of the name
   * @returns {Promise<object[]>} available animals first, then by name
   */
  static async findPublic({ idEspece, taille, nom } = {}) {
    const conditions = ["a.statut IN ('disponible', 'reserve')"];
    const params = [];

    if (idEspece !== undefined) {
      conditions.push('e.id_espece = ?');
      params.push(idEspece);
    }
    if (taille !== undefined) {
      conditions.push('a.taille = ?');
      params.push(taille);
    }
    if (nom !== undefined) {
      conditions.push('a.nom LIKE ?');
      params.push(`%${escapeLike(nom)}%`);
    }

    const sql = `
      SELECT ${CARD_COLUMNS}
      ${JOINS}
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.statut, a.nom`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  /**
   * The 3 favourite animals still available, for the home page.
   * @returns {Promise<object[]>}
   */
  static async findCoupsDeCoeur() {
    const sql = `
      SELECT ${CARD_COLUMNS}
      ${JOINS}
      WHERE a.coup_de_coeur = TRUE AND a.statut = 'disponible'
      ORDER BY a.date_arrivee DESC
      LIMIT 3`;

    const [rows] = await pool.execute(sql);
    return rows;
  }

  /**
   * One animal with all its details.
   * @param {number} id - animal id
   * @returns {Promise<object|null>} null when the animal does not exist
   */
  static async findById(id) {
    const sql = `
      SELECT a.*, r.nom_race, e.id_espece, e.nom_espece
      ${JOINS}
      WHERE a.id_animal = ?`;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] ?? null;
  }

  /**
   * Available animals with the criteria used by the compatibility
   * score, for the "Mes matchs" page.
   * @returns {Promise<object[]>}
   */
  static async findDisponiblesWithCriteria() {
    const sql = `
      SELECT ${CARD_COLUMNS}, ${CRITERIA_COLUMNS}
      ${JOINS}
      WHERE a.statut = 'disponible'`;

    const [rows] = await pool.execute(sql);
    return rows;
  }

  /**
   * Reads an animal and LOCKS its row until the end of the
   * transaction (SELECT ... FOR UPDATE). Another transaction that
   * wants the same animal waits: two shelter members cannot accept
   * two adoptions of the same animal at the same time.
   * @param {number} id
   * @param {object} connection - connection of the current transaction
   * @returns {Promise<object|null>}
   */
  static async findForUpdate(id, connection) {
    const sql = `
      SELECT a.id_animal, a.nom, a.statut, a.taille, ${CRITERIA_COLUMNS}
      FROM animal a
      WHERE a.id_animal = ?
      FOR UPDATE`;

    const [rows] = await connection.execute(sql, [id]);
    return rows[0] ?? null;
  }

  /**
   * @param {number} id
   * @param {'disponible'|'reserve'|'adopte'} statut
   * @param {object} [db] - pool or transaction connection
   */
  static async updateStatut(id, statut, db = pool) {
    await db.execute('UPDATE animal SET statut = ? WHERE id_animal = ?', [statut, id]);
  }

  /**
   * Vaccinations of one animal, most recent first.
   * @param {number} idAnimal
   * @returns {Promise<{nom_vaccin: string, date_vaccination: string}[]>}
   */
  static async findVaccinations(idAnimal) {
    const sql = `
      SELECT v.nom_vaccin, vn.date_vaccination
      FROM vaccination vn
      JOIN vaccin v ON v.id_vaccin = vn.id_vaccin
      WHERE vn.id_animal = ?
      ORDER BY vn.date_vaccination DESC, v.nom_vaccin`;

    const [rows] = await pool.execute(sql, [idAnimal]);
    return rows;
  }
}

module.exports = AnimalModel;
