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

// Columns the shelter can write, with the matching field of the
// request body (database: snake_case, JavaScript: camelCase)
const WRITABLE_FIELDS = [
  ['nom', 'nom'],
  ['sexe', 'sexe'],
  ['date_naissance', 'dateNaissance'],
  ['taille', 'taille'],
  ['energie', 'energie'],
  ['ok_enfants', 'okEnfants'],
  ['ok_chiens', 'okChiens'],
  ['ok_chats', 'okChats'],
  ['besoin_jardin', 'besoinJardin'],
  ['description', 'description'],
  ['sterilise', 'sterilise'],
  ['identification', 'identification'],
  ['remarques_sante', 'remarquesSante'],
  ['photo', 'photo'],
  ['coup_de_coeur', 'coupDeCoeur'],
  ['date_arrivee', 'dateArrivee'],
  ['id_race', 'idRace'],
];

/** Values of the body in the order of WRITABLE_FIELDS (missing = NULL) */
function toValues(data) {
  return WRITABLE_FIELDS.map(([, field]) => data[field] ?? null);
}

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

  // ----------------------------------------------------------
  // Shelter management
  // ----------------------------------------------------------

  /**
   * Every animal (adopted ones included) with its number of active
   * requests, for the shelter dashboard.
   * @returns {Promise<object[]>}
   */
  static async findAllForShelter() {
    const sql = `
      SELECT ${CARD_COLUMNS}, a.coup_de_coeur, a.date_arrivee,
             (SELECT COUNT(*) FROM demande_adoption d
              WHERE d.id_animal = a.id_animal AND d.statut IN ('recue', 'en_etude')) AS nb_demandes_actives
      ${JOINS}
      ORDER BY a.statut, a.nom`;

    const [rows] = await pool.execute(sql);
    return rows;
  }

  /**
   * @param {object} data - validated body (camelCase fields)
   * @param {object} [db] - pool or transaction connection
   * @returns {Promise<number>} id of the new animal
   */
  static async create(data, db = pool) {
    const columns = WRITABLE_FIELDS.map(([column]) => column).join(', ');
    const placeholders = WRITABLE_FIELDS.map(() => '?').join(', ');
    const sql = `INSERT INTO animal (${columns}) VALUES (${placeholders})`;

    const [result] = await db.execute(sql, toValues(data));
    return result.insertId;
  }

  /**
   * Replaces every editable column of an animal (not its status).
   * @param {number} id
   * @param {object} data - validated body (camelCase fields)
   */
  static async update(id, data, db = pool) {
    const assignments = WRITABLE_FIELDS.map(([column]) => `${column} = ?`).join(', ');
    const sql = `UPDATE animal SET ${assignments} WHERE id_animal = ?`;

    await db.execute(sql, [...toValues(data), id]);
  }

  /**
   * Deletes an animal (its vaccinations are deleted by the
   * ON DELETE CASCADE of the vaccination table).
   * @returns {Promise<boolean>} false if the animal did not exist
   * @throws ER_ROW_IS_REFERENCED_2 if adoption requests point to it
   */
  static async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM animal WHERE id_animal = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Replaces all the vaccinations of an animal: delete, then insert
   * the new list. Must run inside a transaction, so that a failure
   * never leaves the animal without its vaccinations.
   * @param {number} idAnimal
   * @param {{ idVaccin: number, date: string }[]} vaccinations
   * @param {object} connection - connection of the current transaction
   */
  static async replaceVaccinations(idAnimal, vaccinations, connection) {
    await connection.execute('DELETE FROM vaccination WHERE id_animal = ?', [idAnimal]);

    for (const { idVaccin, date } of vaccinations) {
      await connection.execute(
        'INSERT INTO vaccination (id_animal, id_vaccin, date_vaccination) VALUES (?, ?, ?)',
        [idAnimal, idVaccin, date],
      );
    }
  }

  /**
   * Vaccinations of one animal, most recent first.
   * @param {number} idAnimal
   * @returns {Promise<{id_vaccin: number, nom_vaccin: string, date_vaccination: string}[]>}
   */
  static async findVaccinations(idAnimal) {
    const sql = `
      SELECT v.id_vaccin, v.nom_vaccin, vn.date_vaccination
      FROM vaccination vn
      JOIN vaccin v ON v.id_vaccin = vn.id_vaccin
      WHERE vn.id_animal = ?
      ORDER BY vn.date_vaccination DESC, v.nom_vaccin`;

    const [rows] = await pool.execute(sql, [idAnimal]);
    return rows;
  }
}

module.exports = AnimalModel;
