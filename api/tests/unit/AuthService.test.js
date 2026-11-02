// Unit and SECURITY tests of services/AuthService.js
// The model is a fake object; bcrypt and jsonwebtoken are real.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthService = require('../../services/AuthService');
const HttpError = require('../../utils/HttpError');

const JWT_CONFIG = { secret: 'unit-test-secret-key-with-more-than-32-chars', expiresIn: '2h' };
const PASSWORD = 'Miaoutic#2026';
let LEA; // account with a real bcrypt hash, built once

beforeAll(async () => {
  LEA = {
    id_utilisateur: 3,
    email: 'lea.dubois@miaoutic.test',
    prenom: 'Léa',
    nom: 'Dubois',
    role: 'adoptant',
    mot_de_passe_hash: await bcrypt.hash(PASSWORD, 4), // low cost: fast tests
  };
});

function createFakeModel() {
  const { mot_de_passe_hash: _hash, ...publicLea } = LEA;
  return {
    emailExists: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockResolvedValue(3),
    findById: jest.fn().mockResolvedValue(publicLea),
    findByEmailWithHash: jest.fn().mockResolvedValue(LEA),
  };
}

describe('AuthService.register', () => {
  test('stores a bcrypt hash, never the password itself', async () => {
    const model = createFakeModel();
    const service = new AuthService(model, JWT_CONFIG);

    await service.register({ email: 'a@b.test', motDePasse: PASSWORD, prenom: 'A', nom: 'B' });

    const { motDePasseHash } = model.create.mock.calls[0][0];
    expect(motDePasseHash).not.toBe(PASSWORD);
    expect(motDePasseHash).toMatch(/^\$2b\$12\$/); // bcrypt, cost 12
    expect(await bcrypt.compare(PASSWORD, motDePasseHash)).toBe(true);
  });

  test('two identical passwords give two different hashes (random salt)', async () => {
    const model = createFakeModel();
    const service = new AuthService(model, JWT_CONFIG);
    await service.register({ email: 'a@b.test', motDePasse: PASSWORD, prenom: 'A', nom: 'B' });
    await service.register({ email: 'c@d.test', motDePasse: PASSWORD, prenom: 'C', nom: 'D' });
    const [first, second] = model.create.mock.calls.map((call) => call[0].motDePasseHash);
    expect(first).not.toBe(second);
  });

  test('409 when the email is already used', async () => {
    const model = createFakeModel();
    model.emailExists.mockResolvedValue(true);
    const service = new AuthService(model, JWT_CONFIG);

    await expect(service.register({ email: 'lea.dubois@miaoutic.test', motDePasse: PASSWORD, prenom: 'L', nom: 'D' }))
      .rejects.toMatchObject({ status: 409 });
    expect(model.create).not.toHaveBeenCalled();
  });

  test('409 when two sign-ups arrive at the same time (UNIQUE constraint)', async () => {
    const model = createFakeModel();
    model.create.mockRejectedValue(Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' }));
    const service = new AuthService(model, JWT_CONFIG);

    await expect(service.register({ email: 'a@b.test', motDePasse: PASSWORD, prenom: 'A', nom: 'B' }))
      .rejects.toMatchObject({ status: 409 });
  });

  test('the returned account does not contain the password hash', async () => {
    const service = new AuthService(createFakeModel(), JWT_CONFIG);
    const account = await service.register({ email: 'a@b.test', motDePasse: PASSWORD, prenom: 'A', nom: 'B' });
    expect(account).not.toHaveProperty('mot_de_passe_hash');
  });
});

describe('AuthService.login', () => {
  test('returns a signed token and the account without its hash', async () => {
    const service = new AuthService(createFakeModel(), JWT_CONFIG);

    const { token, utilisateur } = await service.login({ email: LEA.email, motDePasse: PASSWORD });

    expect(utilisateur).not.toHaveProperty('mot_de_passe_hash');
    const payload = jwt.verify(token, JWT_CONFIG.secret);
    expect(payload.sub).toBe('3');
    expect(payload.role).toBe('adoptant');
    expect(payload.exp - payload.iat).toBe(2 * 60 * 60); // valid for 2 hours
  });

  test('401 with a wrong password', async () => {
    const service = new AuthService(createFakeModel(), JWT_CONFIG);
    await expect(service.login({ email: LEA.email, motDePasse: 'Mauvais#2026' }))
      .rejects.toMatchObject({ status: 401, message: 'Email ou mot de passe incorrect.' });
  });

  test('SECURITY: same error for an unknown email (no account guessing)', async () => {
    const model = createFakeModel();
    model.findByEmailWithHash.mockResolvedValue(null);
    const service = new AuthService(model, JWT_CONFIG);

    await expect(service.login({ email: 'inconnu@miaoutic.test', motDePasse: PASSWORD }))
      .rejects.toMatchObject({ status: 401, message: 'Email ou mot de passe incorrect.' });
  });

  test('SECURITY: bcrypt also runs for an unknown email (same response time)', async () => {
    const model = createFakeModel();
    model.findByEmailWithHash.mockResolvedValue(null);
    const service = new AuthService(model, JWT_CONFIG);
    const spy = jest.spyOn(bcrypt, 'compare');

    await expect(service.login({ email: 'inconnu@miaoutic.test', motDePasse: PASSWORD })).rejects.toThrow();

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('AuthService.verifyToken', () => {
  const service = new AuthService({}, JWT_CONFIG);

  test('accepts a valid token', () => {
    const token = jwt.sign({ role: 'refuge' }, JWT_CONFIG.secret, { subject: '1', expiresIn: '1h' });
    expect(service.verifyToken(token)).toEqual({ id: 1, role: 'refuge' });
  });

  test('SECURITY: refuses a token signed with another key', () => {
    const token = jwt.sign({ role: 'refuge' }, 'another-secret-key-of-an-attacker-123456', { subject: '1' });
    expect(() => service.verifyToken(token)).toThrow(HttpError);
  });

  test('SECURITY: refuses a token whose content was modified', () => {
    const token = jwt.sign({ role: 'adoptant' }, JWT_CONFIG.secret, { subject: '3' });
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: '3', role: 'refuge' })).toString('base64url');
    expect(() => service.verifyToken(`${header}.${forgedPayload}.${signature}`)).toThrow(HttpError);
  });

  test('SECURITY: refuses an unsigned token (alg "none")', () => {
    const unsigned = jwt.sign({ role: 'refuge' }, null, { subject: '1', algorithm: 'none' });
    expect(() => service.verifyToken(unsigned)).toThrow(HttpError);
  });

  test('refuses an expired token', () => {
    const expired = jwt.sign({ role: 'adoptant', exp: Math.floor(Date.now() / 1000) - 60 }, JWT_CONFIG.secret, { subject: '3' });
    expect(() => service.verifyToken(expired)).toThrow(HttpError);
  });
});
