// ============================================================
// controllers/authController.js
// ============================================================

const { matchedData } = require('express-validator');
const { jwt } = require('../config/env');
const UtilisateurModel = require('../models/UtilisateurModel');
const AuthService = require('../services/AuthService');

const authService = new AuthService(UtilisateurModel, jwt);

/** POST /api/auth/inscription - creates an adopter account */
async function register(req, res) {
  // Only the 4 validated fields are used: a "role" field added to
  // the request is simply ignored.
  const { email, motDePasse, prenom, nom } = matchedData(req, { locations: ['body'] });
  const utilisateur = await authService.register({ email, motDePasse, prenom, nom });
  res.status(201).json({ message: 'Compte créé. Vous pouvez vous connecter.', utilisateur });
}

/** POST /api/auth/connexion - returns a token */
async function login(req, res) {
  const { email, motDePasse } = matchedData(req, { locations: ['body'] });
  const result = await authService.login({ email, motDePasse });
  res.json(result);
}

/** GET /api/auth/moi - account of the logged-in user */
async function me(req, res) {
  const utilisateur = await authService.getAccount(req.utilisateur.id);
  res.json(utilisateur);
}

module.exports = { register, login, me };
