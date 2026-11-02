// ============================================================
// middlewares/validate.js
// Runs after the express-validator rules of a route.
// If at least one rule failed, the request is stopped here with
// a 400 error: invalid data never reaches the services or the
// database.
// ============================================================

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      message: 'Données invalides.',
      erreurs: result.array().map((error) => ({
        champ: error.path,
        message: error.msg,
      })),
    });
  }

  return next();
}

module.exports = validate;
