// SECURITY test: brute force protection of the login route.
// A low limit is set BEFORE the application is loaded.
process.env.AUTH_RATE_LIMIT = '3';

jest.mock('../../config/database', () => ({ execute: jest.fn(), query: jest.fn() }));
jest.mock('../../models/UtilisateurModel');

const request = require('supertest');
const app = require('../../app');
const UtilisateurModel = require('../../models/UtilisateurModel');

test('the IP is blocked (429) after too many failed logins, even with the right password', async () => {
  UtilisateurModel.findByEmailWithHash.mockResolvedValue(null);
  const attempt = (motDePasse) => request(app)
    .post('/api/auth/connexion')
    .send({ email: 'lea.dubois@miaoutic.test', motDePasse });

  // 3 failed attempts are allowed...
  for (let i = 1; i <= 3; i += 1) {
    expect((await attempt(`Essai#${i}`)).status).toBe(401);
  }

  // ...then every request is refused, without even checking the password
  const blocked = await attempt('Miaoutic#2026');
  expect(blocked.status).toBe(429);
  expect(blocked.body.message).toMatch(/Trop de tentatives/);
});

test('mistakes in the sign-up form do not block the login', async () => {
  // Separate counter: the sign-up route has its own limit
  for (let i = 1; i <= 3; i += 1) {
    await request(app).post('/api/auth/inscription').send({ email: 'invalide' });
  }
  const signupBlocked = await request(app).post('/api/auth/inscription').send({ email: 'invalide' });
  expect(signupBlocked.status).toBe(429);
});
