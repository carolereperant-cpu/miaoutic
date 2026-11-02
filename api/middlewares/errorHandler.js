// ============================================================
// middlewares/errorHandler.js
// Last middlewares of the chain:
//   - notFound: the requested route does not exist (404)
//   - errorHandler: every error thrown in a route ends here
// Security: technical details (SQL errors, stack traces) are
// logged on the server but never sent to the client.
// ============================================================

const HttpError = require('../utils/HttpError');

/** Answers 404 for any route that matched nothing. */
function notFound(req, res) {
  res.status(404).json({ message: 'Route introuvable.' });
}

/**
 * Central error handler. Express recognises it because it takes
 * 4 parameters. Since Express 5, errors thrown in async route
 * handlers are forwarded here automatically.
 * (_next is unused but required: the underscore marks it as such.)
 */
function errorHandler(err, req, res, _next) {
  // Expected errors, thrown on purpose by the services
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Body that is not valid JSON, or too large
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Le corps de la requête n\'est pas un JSON valide.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Requête trop volumineuse.' });
  }

  // Unexpected error: log it for the developer, stay vague for the client
  console.error(err);
  return res.status(500).json({ message: 'Erreur interne du serveur.' });
}

module.exports = { notFound, errorHandler };
