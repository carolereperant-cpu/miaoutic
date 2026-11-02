// Tests of the API documentation (Swagger / OpenAPI):
//  - the openapi.yaml file follows the OpenAPI standard
//  - every documented route really exists in the API
//  - the documentation page is served
jest.mock('../../config/database', () => ({ execute: jest.fn(), query: jest.fn() }));
jest.mock('../../models/AnimalModel');
jest.mock('../../models/EspeceModel');
jest.mock('../../models/ReferentielModel');
jest.mock('../../models/UtilisateurModel');
jest.mock('../../models/ProfilModel');
jest.mock('../../models/DemandeModel');

const request = require('supertest');
const SwaggerParser = require('@apidevtools/swagger-parser');
const app = require('../../app');
const { specification } = require('../../routes/docsRoutes');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// Every documented operation, with example values in the path
const operations = Object.entries(specification.paths).flatMap(([path, item]) => HTTP_METHODS
  .filter((method) => item[method])
  .map((method) => [method.toUpperCase(), path, `/api${path.replace(/\{[^}]+\}/g, '1')}`]));

test('openapi.yaml is a valid OpenAPI document', async () => {
  // validate() modifies the object it receives: give it a copy
  await expect(SwaggerParser.validate(structuredClone(specification))).resolves.toBeDefined();
});

test('the documentation describes the 24 operations of the API', () => {
  expect(operations).toHaveLength(24);
});

test.each(operations)('%s %s exists in the API', async (method, _path, url) => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const res = await request(app)[method.toLowerCase()](url).send({});
  // Without token or data, the answer may be 400, 401, 500...
  // but never the "route not found" of the 404 handler
  expect(res.body.message).not.toBe('Route introuvable.');
});

test('GET /api/docs/ serves the Swagger page', async () => {
  const res = await request(app).get('/api/docs/');
  expect(res.status).toBe(200);
  expect(res.text).toContain('swagger-ui');
});
