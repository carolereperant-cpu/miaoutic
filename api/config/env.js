// ============================================================
// config/env.js
// Loads the environment variables (.env file) once, checks that
// the required ones exist, and exposes a typed configuration.
// Secrets (database password, JWT key) never appear in the code.
// ============================================================

const fs = require('node:fs');

require('dotenv').config({ quiet: true });

const REQUIRED_VARIABLES = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

// Fail fast: better to stop at startup with a clear message than
// to crash later on the first request.
const missing = REQUIRED_VARIABLES.filter((name) => process.env[name] === undefined);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')} (see .env.example)`);
}

// A short key could be found by brute force, and anyone who knows
// it can create valid tokens: refuse to start with a weak key.
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters (see .env.example)');
}

/**
 * Encrypted connection (TLS) to the database, required by hosted
 * databases such as Aiven. DB_SSL_CA_FILE is the certificate of the
 * authority that signed the database certificate: the API checks it,
 * so it cannot be fooled by a fake server (man in the middle).
 * Without DB_SSL_CA_FILE (XAMPP on the computer): no encryption.
 */
function sslConfig() {
  const caFile = process.env.DB_SSL_CA_FILE;
  if (!caFile) return undefined;
  try {
    return { ca: fs.readFileSync(caFile, 'utf8'), rejectUnauthorized: true };
  } catch (error) {
    throw new Error(`DB_SSL_CA_FILE: cannot read the certificate ${caFile} (${error.code})`, { cause: error });
  }
}

module.exports = {
  port: Number(process.env.PORT) || 3000,

  // Network interface of the API. In production: 127.0.0.1, so that
  // only Nginx, on the same server, can reach it. Empty in
  // development: every interface (default of Node.js).
  host: process.env.HOST || undefined,

  // Only the front-end at this address may call the API from a browser
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig(),
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    // Lifetime of a token: after that, the user logs in again
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },

  // Failed login / sign-up attempts allowed per IP every 15 minutes
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 10,

  // Number of reverse proxies in front of the API in production
  // (Nginx: 1). Express then reads the real IP of the visitor in the
  // X-Forwarded-For header; without it, every visitor would have the
  // IP of the proxy and share the same rate limit. 0 in development.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
};
