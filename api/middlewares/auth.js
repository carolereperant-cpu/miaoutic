// ============================================================
// middlewares/auth.js
// Protection of the private routes.
//   authenticate      -> the request must carry a valid token
//   authorize(roles)  -> the logged-in user must have one of the roles
//
// Usage in a route file:
//   router.get('/demandes', authenticate, authorize('refuge'), controller)
// ============================================================

const { jwt } = require('../config/env');
const UtilisateurModel = require('../models/UtilisateurModel');
const AuthService = require('../services/AuthService');
const HttpError = require('../utils/HttpError');

const authService = new AuthService(UtilisateurModel, jwt);

/**
 * Reads the header "Authorization: Bearer <token>", checks the
 * token and stores the user in req.utilisateur for the next steps.
 */
function authenticate(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentification requise.');
  }

  req.utilisateur = authService.verifyToken(token); // throws 401 if invalid
  next();
}

/**
 * Lets the request through only for the given roles.
 * Must be placed after authenticate.
 * @param {...string} roles - e.g. 'refuge'
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.utilisateur || !roles.includes(req.utilisateur.role)) {
      throw new HttpError(403, 'Accès refusé : vous n\'avez pas les droits nécessaires.');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
