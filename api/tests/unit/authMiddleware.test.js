// Unit tests of middlewares/auth.js (authenticate and authorize)
jest.mock('../../config/database', () => ({ execute: jest.fn() }));

const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../middlewares/auth');
const HttpError = require('../../utils/HttpError');

// Minimal fake request: only what the middleware reads
function fakeRequest(authorization) {
  return { get: (name) => (name === 'Authorization' ? authorization : undefined) };
}

describe('authenticate', () => {
  test('stores the user in req.utilisateur when the token is valid', () => {
    const token = jwt.sign({ role: 'adoptant' }, process.env.JWT_SECRET, { subject: '3' });
    const req = fakeRequest(`Bearer ${token}`);
    const next = jest.fn();

    authenticate(req, {}, next);

    expect(req.utilisateur).toEqual({ id: 3, role: 'adoptant' });
    expect(next).toHaveBeenCalled();
  });

  test.each([
    ['no header', undefined],
    ['empty header', ''],
    ['wrong scheme', 'Basic abc123'],
    ['missing token', 'Bearer '],
    ['invalid token', 'Bearer not.a.token'],
  ])('401 with %s', (_label, header) => {
    const next = jest.fn();
    expect(() => authenticate(fakeRequest(header), {}, next)).toThrow(expect.objectContaining({ status: 401 }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorize', () => {
  test('lets a user with the right role through', () => {
    const next = jest.fn();
    authorize('refuge')({ utilisateur: { id: 1, role: 'refuge' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  test('SECURITY: 403 for an adopter on a shelter route', () => {
    const next = jest.fn();
    expect(() => authorize('refuge')({ utilisateur: { id: 3, role: 'adoptant' } }, {}, next))
      .toThrow(HttpError);
    expect(next).not.toHaveBeenCalled();
  });

  test('403 when authenticate was not called before', () => {
    expect(() => authorize('refuge')({}, {}, jest.fn())).toThrow(expect.objectContaining({ status: 403 }));
  });
});
