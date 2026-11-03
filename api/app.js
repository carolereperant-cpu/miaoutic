// ============================================================
// app.js
// Builds the Express application: security middlewares, routes
// and error handling. The server itself is started in server.js,
// so that the tests can use the app without opening a port.
// ============================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const { corsOrigin, trustProxy } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Behind a reverse proxy (Nginx in production): trust the IP it
// sends, so that the rate limits apply to each visitor
app.set('trust proxy', trustProxy);

// ------------------------------------------------------------
// SECURITY 1 - Helmet: adds protective HTTP headers
// (X-Content-Type-Options, Strict-Transport-Security...) and
// removes X-Powered-By, which would reveal that we use Express.
// ------------------------------------------------------------
app.use(helmet());

// ------------------------------------------------------------
// SECURITY 2 - CORS: only our front-end may call the API
// from a browser. Any other website is refused.
// ------------------------------------------------------------
app.use(cors({ origin: corsOrigin }));

// ------------------------------------------------------------
// SECURITY 3 - Rate limiting: at most 300 requests per IP
// address every 15 minutes, against brute force and flooding.
// ------------------------------------------------------------
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de requêtes. Réessayez dans quelques minutes.' },
}));

// ------------------------------------------------------------
// SECURITY 4 - JSON bodies limited to 10 kB
// ------------------------------------------------------------
app.use(express.json({ limit: '10kb' }));

// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------
app.use('/api', routes);

// ------------------------------------------------------------
// ERRORS (always registered last)
// ------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
