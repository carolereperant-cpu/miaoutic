// ============================================================
// models/UtilisateurModel.js
// Data access component for the user accounts.
// The password hash is only read by findByEmailWithHash (login);
// every other query leaves it out, so it can never be sent back
// to the client by mistake.
// ============================================================

const pool = require('../config/database');

// Public columns of an account (no password hash)
const PUBLIC_COLUMNS = 'id_utilisateur, email, prenom, nom, role, date_creation';

class UtilisateurModel {
  /**
   * Account with its password hash, used ONLY to check a login.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  static async findByEmailWithHash(email) {
    const sql = `SELECT ${PUBLIC_COLUMNS}, mot_de_passe_hash FROM utilisateur WHERE email = ?`;
    const [rows] = await pool.execute(sql, [email]);
    return rows[0] ?? null;
  }

  /**
   * @param {string} email
   * @returns {Promise<boolean>} true if an account already uses this email
   */
  static async emailExists(email) {
    const [rows] = await pool.execute('SELECT 1 FROM utilisateur WHERE email = ?', [email]);
    return rows.length > 0;
  }

  /**
   * Public data of an account.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  static async findById(id) {
    const sql = `SELECT ${PUBLIC_COLUMNS} FROM utilisateur WHERE id_utilisateur = ?`;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0] ?? null;
  }

  /**
   * Creates an adopter account. The role is written here, in the
   * SQL, and never taken from the request: nobody can register
   * as shelter staff by adding "role": "refuge" to the form.
   * @param {{ email: string, motDePasseHash: string, prenom: string, nom: string }} data
   * @returns {Promise<number>} id of the new account
   * @throws the MySQL error ER_DUP_ENTRY if the email is already used
   */
  static async create({ email, motDePasseHash, prenom, nom }) {
    const sql = `
      INSERT INTO utilisateur (email, mot_de_passe_hash, prenom, nom, role)
      VALUES (?, ?, ?, ?, 'adoptant')`;
    const [result] = await pool.execute(sql, [email, motDePasseHash, prenom, nom]);
    return result.insertId;
  }
}

module.exports = UtilisateurModel;
