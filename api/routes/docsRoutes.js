// ============================================================
// routes/docsRoutes.js
// Interactive documentation of the API (Swagger UI), built from
// docs/openapi.yaml.  Open http://localhost:3000/api/docs
// ============================================================

const fs = require('node:fs');
const path = require('node:path');
const { Router } = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const specification = YAML.parse(
  fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi.yaml'), 'utf8'),
);

const router = Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(specification, {
  customSiteTitle: 'API Miaoutic',
  swaggerOptions: { persistAuthorization: false }, // the token is not kept after closing the page
}));

module.exports = { router, specification };
