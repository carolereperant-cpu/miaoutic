// ============================================================
// config/env.js
// Loads the environment variables (.env file) once, checks that
// the required ones exist, and exposes a typed configuration.
// Secrets (database password...) never appear in the code.
// ============================================================

require('dotenv').config({ quiet: true });

const REQUIRED_VARIABLES = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

// Fail fast: better to stop at startup with a clear message than
// to crash later on the first request.
const missing = REQUIRED_VARIABLES.filter((name) => process.env[name] === undefined);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')} (see .env.example)`);
}

module.exports = {
  port: Number(process.env.PORT) || 3000,

  // Only the front-end at this address may call the API from a browser
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
