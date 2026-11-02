// Tests of the authentication routes (supertest).
// The user model is mocked; bcrypt and JWT are real.
jest.mock('../../config/database', () => ({ execute: jest.fn(), query: jest.fn() }));
jest.mock('../../models/UtilisateurModel');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const UtilisateurModel = require('../../models/UtilisateurModel');

const PASSWORD = 'Miaoutic#2026';
const LEA = { id_utilisateur: 3, email: 'lea.dubois@miaoutic.test', prenom: 'Léa', nom: 'Dubois', role: 'adoptant' };
let leaHash;

const VALID_SIGNUP = { email: 'camille.petit@miaoutic.test', motDePasse: 'Chaton#Roux2026', prenom: 'Camille', nom: 'Petit-Durand' };

beforeAll(async () => {
  leaHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  jest.resetAllMocks();
  UtilisateurModel.emailExists.mockResolvedValue(false);
  UtilisateurModel.create.mockResolvedValue(7);
  UtilisateurModel.findById.mockResolvedValue(LEA);
  UtilisateurModel.findByEmailWithHash.mockResolvedValue({ ...LEA, mot_de_passe_hash: leaHash });
});

describe('POST /api/auth/inscription', () => {
  test('201 and the account is created', async () => {
    const res = await request(app).post('/api/auth/inscription').send(VALID_SIGNUP);
    expect(res.status).toBe(201);
    expect(res.body.utilisateur).not.toHaveProperty('mot_de_passe_hash');
  });

  test('the email is cleaned (spaces removed, lower case)', async () => {
    await request(app).post('/api/auth/inscription').send({ ...VALID_SIGNUP, email: '  Camille.Petit@Miaoutic.TEST ' });
    expect(UtilisateurModel.create.mock.calls[0][0].email).toBe('camille.petit@miaoutic.test');
  });

  test('SECURITY: a "role" field sent by the user is ignored', async () => {
    await request(app).post('/api/auth/inscription').send({ ...VALID_SIGNUP, role: 'refuge' });
    expect(UtilisateurModel.create.mock.calls[0][0]).not.toHaveProperty('role');
  });

  test.each([
    ['too short', 'Court#1a'],
    ['no upper case', 'chaton#roux2026'],
    ['no lower case', 'CHATON#ROUX2026'],
    ['no digit', 'Chaton#RouxRoux'],
    ['no special character', 'ChatonRoux2026'],
    ['more than 72 bytes', `Aa1#${'é'.repeat(40)}`],
  ])('400 with a password %s', async (_label, motDePasse) => {
    const res = await request(app).post('/api/auth/inscription').send({ ...VALID_SIGNUP, motDePasse });
    expect(res.status).toBe(400);
    expect(UtilisateurModel.create).not.toHaveBeenCalled();
  });

  test('400 with an invalid email', async () => {
    const res = await request(app).post('/api/auth/inscription').send({ ...VALID_SIGNUP, email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });

  test('SECURITY: 400 when a name contains HTML', async () => {
    const res = await request(app).post('/api/auth/inscription').send({ ...VALID_SIGNUP, prenom: '<script>' });
    expect(res.status).toBe(400);
  });

  test('accepts accents, hyphens and apostrophes in names', async () => {
    const res = await request(app).post('/api/auth/inscription').send({ ...VALID_SIGNUP, prenom: 'Zoé-Anaïs', nom: "D'Arcy" });
    expect(res.status).toBe(201);
  });

  test('409 when the email is already used', async () => {
    UtilisateurModel.emailExists.mockResolvedValue(true);
    const res = await request(app).post('/api/auth/inscription').send(VALID_SIGNUP);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/connexion', () => {
  test('200 with a token', async () => {
    const res = await request(app).post('/api/auth/connexion').send({ email: LEA.email, motDePasse: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token.split('.')).toHaveLength(3); // header.payload.signature
    expect(res.body.utilisateur).not.toHaveProperty('mot_de_passe_hash');
  });

  test('401 with a wrong password', async () => {
    const res = await request(app).post('/api/auth/connexion').send({ email: LEA.email, motDePasse: 'Mauvais#2026' });
    expect(res.status).toBe(401);
  });

  test('400 when the password is missing', async () => {
    const res = await request(app).post('/api/auth/connexion').send({ email: LEA.email });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/moi', () => {
  test('200 with a valid token', async () => {
    const login = await request(app).post('/api/auth/connexion').send({ email: LEA.email, motDePasse: PASSWORD });

    const res = await request(app).get('/api/auth/moi').set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(LEA.email);
    expect(UtilisateurModel.findById).toHaveBeenCalledWith(3);
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/auth/moi');
    expect(res.status).toBe(401);
  });

  test('404 when the account was deleted after login', async () => {
    const login = await request(app).post('/api/auth/connexion').send({ email: LEA.email, motDePasse: PASSWORD });
    UtilisateurModel.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/auth/moi').set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(404);
  });
});
