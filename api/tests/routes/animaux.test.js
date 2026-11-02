// Tests of the HTTP routes (supertest): validation, status codes,
// error format and security headers. The models are mocked.
jest.mock('../../config/database', () => ({ execute: jest.fn(), query: jest.fn() }));
jest.mock('../../models/AnimalModel');
jest.mock('../../models/EspeceModel');

const request = require('supertest');
const app = require('../../app');
const AnimalModel = require('../../models/AnimalModel');
const EspeceModel = require('../../models/EspeceModel');

const PEPETTE = { id_animal: 1, nom: 'Pépette', date_naissance: '2019-05-10', statut: 'disponible' };

beforeEach(() => {
  jest.resetAllMocks();
  AnimalModel.findPublic.mockResolvedValue([PEPETTE]);
  AnimalModel.findCoupsDeCoeur.mockResolvedValue([PEPETTE]);
  AnimalModel.findById.mockResolvedValue(PEPETTE);
  AnimalModel.findVaccinations.mockResolvedValue([]);
  EspeceModel.findAllWithCount.mockResolvedValue([{ id_espece: 1, nom_espece: 'Chiens', nb_disponibles: 4 }]);
});

describe('GET /api/animaux', () => {
  test('200 with the list and converted filters', async () => {
    const res = await request(app).get('/api/animaux?espece=2&taille=petit&nom=bis');
    expect(res.status).toBe(200);
    expect(res.body[0].nom).toBe('Pépette');
    // "2" in the URL becomes the number 2
    expect(AnimalModel.findPublic).toHaveBeenCalledWith({ idEspece: 2, taille: 'petit', nom: 'bis' });
  });

  test('400 when the species is not a number', async () => {
    const res = await request(app).get('/api/animaux?espece=abc');
    expect(res.status).toBe(400);
    expect(res.body.erreurs[0].champ).toBe('espece');
    expect(AnimalModel.findPublic).not.toHaveBeenCalled();
  });

  test('400 when the size is not an allowed value', async () => {
    const res = await request(app).get('/api/animaux?taille=geant');
    expect(res.status).toBe(400);
  });

  test('400 when the searched name is too long', async () => {
    const res = await request(app).get(`/api/animaux?nom=${'a'.repeat(51)}`);
    expect(res.status).toBe(400);
  });

  test('SECURITY: unknown parameters are ignored', async () => {
    await request(app).get('/api/animaux?statut=adopte');
    expect(AnimalModel.findPublic).toHaveBeenCalledWith({ idEspece: undefined, taille: undefined, nom: undefined });
  });
});

describe('GET /api/animaux/:id', () => {
  test('200 with the full sheet', async () => {
    const res = await request(app).get('/api/animaux/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('vaccinations');
    expect(res.body).toHaveProperty('age');
  });

  test('404 when the animal does not exist', async () => {
    AnimalModel.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/animaux/999');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Animal introuvable.');
  });

  test.each(['0', '-1', 'abc', '1 OR 1=1'])('400 for the invalid id "%s"', async (id) => {
    const res = await request(app).get(`/api/animaux/${encodeURIComponent(id)}`);
    expect(res.status).toBe(400);
    expect(AnimalModel.findById).not.toHaveBeenCalled();
  });
});

describe('Other routes and errors', () => {
  test('GET /api/animaux/coups-de-coeur is not read as an id', async () => {
    const res = await request(app).get('/api/animaux/coups-de-coeur');
    expect(res.status).toBe(200);
    expect(AnimalModel.findCoupsDeCoeur).toHaveBeenCalled();
  });

  test('GET /api/especes returns the species', async () => {
    const res = await request(app).get('/api/especes');
    expect(res.status).toBe(200);
    expect(res.body[0].nom_espece).toBe('Chiens');
  });

  test('404 in JSON for an unknown route', async () => {
    const res = await request(app).get('/api/inconnue');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route introuvable.');
  });

  test('SECURITY: a database error returns 500 without technical details', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    AnimalModel.findPublic.mockRejectedValue(new Error("ER_NO_SUCH_TABLE: Table 'miaoutic.animal' doesn't exist"));

    const res = await request(app).get('/api/animaux');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Erreur interne du serveur.' });
    expect(JSON.stringify(res.body)).not.toContain('ER_NO_SUCH_TABLE');
  });

  test('SECURITY: Helmet headers are present and Express is not revealed', async () => {
    const res = await request(app).get('/api/especes');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
