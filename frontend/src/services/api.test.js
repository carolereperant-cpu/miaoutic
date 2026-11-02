// Unit tests of services/api.js: fetch is replaced by a fake.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, api, ApiError, tokenStore, setUnauthorizedHandler } from './api';

function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  };
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
  tokenStore.clear();
});

afterEach(() => {
  setUnauthorizedHandler(null);
});

describe('apiRequest', () => {
  test('GET: base URL, JSON answer, no token when logged out', async () => {
    fetch.mockResolvedValue(fakeResponse(200, [{ id_animal: 1 }]));

    const data = await apiRequest('/animaux');

    expect(data).toEqual([{ id_animal: 1 }]);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/animaux');
    expect(options.headers.Authorization).toBeUndefined();
  });

  test('adds the token in the Authorization header when logged in', async () => {
    tokenStore.set('abc.def.ghi');
    fetch.mockResolvedValue(fakeResponse(200, {}));

    await api.get('/auth/moi');

    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('POST sends the body as JSON', async () => {
    fetch.mockResolvedValue(fakeResponse(201, { id: 1 }));

    await api.post('/demandes', { idAnimal: 5 });

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"idAnimal":5}');
  });

  test('204 returns null', async () => {
    fetch.mockResolvedValue(fakeResponse(204));
    await expect(api.delete('/animaux/17')).resolves.toBeNull();
  });

  test('an error answer becomes an ApiError with the message and the fields', async () => {
    const erreurs = [{ champ: 'email', message: 'Invalide.' }];
    fetch.mockResolvedValue(fakeResponse(400, { message: 'Données invalides.', erreurs }));

    const error = await apiRequest('/auth/inscription').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Données invalides.');
    expect(error.erreurs).toEqual(erreurs);
  });

  test('server down: ApiError with status 0 and a clear message', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await apiRequest('/animaux').catch((e) => e);

    expect(error.status).toBe(0);
    expect(error.message).toMatch(/serveur ne répond pas/);
  });

  test('401 with a token: the "session expired" handler is called', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    tokenStore.set('expired.token.value');
    fetch.mockResolvedValue(fakeResponse(401, { message: 'Session invalide ou expirée.' }));

    await expect(api.get('/profil')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('401 without token (wrong password): the handler is NOT called', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetch.mockResolvedValue(fakeResponse(401, { message: 'Email ou mot de passe incorrect.' }));

    await expect(api.post('/auth/connexion', {})).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });
});
