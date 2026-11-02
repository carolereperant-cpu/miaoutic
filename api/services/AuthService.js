// ============================================================
// services/AuthService.js
// Business logic of authentication: sign-up, login, tokens.
//
// - Passwords are hashed with bcrypt (slow on purpose, with a
//   random salt): even if the database leaked, the passwords
//   could not be read back.
// - After login, the user receives a JWT (JSON Web Token) signed
//   with a secret key. The API checks this signature on every
//   protected request: a modified token is refused.
// ============================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

// Cost factor: 2^12 bcrypt rounds (about 0.2 s per hash).
// Fast enough for a user, very slow for an attacker testing
// millions of passwords.
const BCRYPT_ROUNDS = 12;

// Same message whether the email or the password is wrong: an
// attacker must not learn which emails have an account.
const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect.';

// Hash of a random password, compared when the email does not
// exist: the answer then takes the same time in both cases, so the
// response time does not reveal whether an account exists.
const DUMMY_HASH = '$2b$12$vRuumvY.8OitMP9yMLPDRu2tSPIf8Q9QPRpCcZFt6poj3fOYc1Ski';

class AuthService {
  /**
   * @param {object} utilisateurModel - data access component
   * @param {{ secret: string, expiresIn: string }} jwtConfig
   */
  constructor(utilisateurModel, jwtConfig) {
    this.utilisateurModel = utilisateurModel;
    this.jwtConfig = jwtConfig;
  }

  /**
   * Creates an adopter account.
   * @param {{ email: string, motDePasse: string, prenom: string, nom: string }} data
   * @returns {Promise<object>} the new account (without password)
   * @throws {HttpError} 409 if the email is already used
   */
  async register({ email, motDePasse, prenom, nom }) {
    if (await this.utilisateurModel.emailExists(email)) {
      throw new HttpError(409, 'Un compte existe déjà avec cet email.');
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, BCRYPT_ROUNDS);

    let id;
    try {
      id = await this.utilisateurModel.create({ email, motDePasseHash, prenom, nom });
    } catch (error) {
      // Two sign-ups with the same email at the same moment: the
      // UNIQUE constraint of the database refuses the second one.
      if (error.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'Un compte existe déjà avec cet email.');
      }
      throw error;
    }

    return this.utilisateurModel.findById(id);
  }

  /**
   * Checks the credentials and returns a signed token.
   * @param {{ email: string, motDePasse: string }} credentials
   * @returns {Promise<{ token: string, utilisateur: object }>}
   * @throws {HttpError} 401 if the email or the password is wrong
   */
  async login({ email, motDePasse }) {
    const account = await this.utilisateurModel.findByEmailWithHash(email);

    const passwordOk = await bcrypt.compare(motDePasse, account ? account.mot_de_passe_hash : DUMMY_HASH);
    if (!account || !passwordOk) {
      throw new HttpError(401, INVALID_CREDENTIALS);
    }

    // Remove the hash before returning the account
    const { mot_de_passe_hash: _hash, ...utilisateur } = account;

    const token = jwt.sign(
      { role: utilisateur.role },
      this.jwtConfig.secret,
      {
        subject: String(utilisateur.id_utilisateur),
        expiresIn: this.jwtConfig.expiresIn,
        algorithm: 'HS256',
      },
    );

    return { token, utilisateur };
  }

  /**
   * Checks a token and returns what it contains.
   * Only HS256 is accepted: a token claiming another algorithm
   * (for example "none", i.e. unsigned) is refused.
   * @param {string} token
   * @returns {{ id: number, role: string }}
   * @throws {HttpError} 401 if the token is invalid or expired
   */
  verifyToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtConfig.secret, { algorithms: ['HS256'] });
      return { id: Number(payload.sub), role: payload.role };
    } catch {
      throw new HttpError(401, 'Session invalide ou expirée. Veuillez vous reconnecter.');
    }
  }

  /**
   * Account of the logged-in user, read again from the database
   * (the role may have changed since the token was created).
   * @param {number} id
   * @throws {HttpError} 404 if the account no longer exists
   */
  async getAccount(id) {
    const utilisateur = await this.utilisateurModel.findById(id);
    if (!utilisateur) {
      throw new HttpError(404, 'Compte introuvable.');
    }
    return utilisateur;
  }
}

module.exports = AuthService;
