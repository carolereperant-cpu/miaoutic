// ============================================================
// utils/HttpError.js
// Error that carries an HTTP status code.
// Services throw it (e.g. 404 when an animal does not exist);
// the error handler middleware turns it into a JSON response.
// ============================================================

class HttpError extends Error {
  /**
   * @param {number} status - HTTP status code (400, 404...)
   * @param {string} message - Message shown to the user (French)
   */
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = HttpError;
