// Tests of the shelter routes for the animals, and of the
// reference lists (supertest). Models and transaction are mocked.
jest.mock('../../config/database', () => ({ execute: jest.fn(), query: jest.fn() }));
jest.mock('../../models/AnimalModel');
jest.mock('../../models/ReferentielModel');
jest.mock('../../utils/transaction', () => ({ withTransaction: (work) => work({}) }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const AnimalModel = require('../../models/AnimalModel');
const ReferentielModel = require('../../models/ReferentielModel');

const tokenFor = (id, role) => `Bearer ${jwt.sign({ role }, process.env.JWT_SECRET, { subject: String(id) })}`;
const REFUGE = tokenFor(1, 'refuge');
const ADOPTANT = tokenFor(3, 'adoptant');

const VALID = {
  nom: 'Câlinou',
  sexe: 'male',
  dateNaissance: '2025-02-14',
  taille: 'petit',
  energie: 'modere',
  okEnfants: true,
  okChiens: false,
  okChats: true,
  besoinJardin: false,
  description: 'Câlinou est un jeune chat joueur.',
  sterilise: true,
  identification: 'puce',
  remarquesSante: null,
  photo: null,
  coupDeCoeur: false,
  dateArrivee: '2026-10-30',
  idRace: 7,
  vaccinations: [{ idVaccin: 3, date: '2026-10-31' }],
};

const CALINOU = { id_animal: 17, nom: 'Câlinou', date_naissance: '2025-02-14', statut: 'disponible' };

beforeEach(() => {
  jest.resetAllMocks();
  AnimalModel.create.mockResolvedValue(17);
  AnimalModel.findById.mockResolvedValue(CALINOU);
  AnimalModel.findVaccinations.mockResolvedValue([]);
  AnimalModel.findForUpdate.mockResolvedValue(CALINOU);
  AnimalModel.deleteById.mockResolvedValue(true);
  AnimalModel.findAllForShelter.mockResolvedValue([CALINOU]);
  ReferentielModel.findRaces.mockResolvedValue([{ id_race: 7, nom_race: 'Européen' }]);
  ReferentielModel.findVaccins.mockResolvedValue([{ id_vaccin: 3, nom_vaccin: 'Typhus-Coryza' }]);
});

const post = (body, token = REFUGE) => request(app).post('/api/animaux').set('Authorization', token).send(body);

describe('Access control', () => {
  test.each([
    ['get', '/api/animaux/gestion'],
    ['post', '/api/animaux'],
    ['put', '/api/animaux/17'],
    ['patch', '/api/animaux/17/statut'],
    ['delete', '/api/animaux/17'],
  ])('401 without token, 403 for an adopter: %s %s', async (method, url) => {
    expect((await request(app)[method](url)).status).toBe(401);
    expect((await request(app)[method](url).set('Authorization', ADOPTANT).send(VALID)).status).toBe(403);
    expect(AnimalModel.create).not.toHaveBeenCalled();
    expect(AnimalModel.deleteById).not.toHaveBeenCalled();
  });
});

describe('POST /api/animaux', () => {
  test('201 with converted values', async () => {
    const res = await post(VALID);
    expect(res.status).toBe(201);
    const data = AnimalModel.create.mock.calls[0][0];
    expect(data.idRace).toBe(7);
    expect(data.vaccinations).toEqual([{ idVaccin: 3, date: '2026-10-31' }]);
  });

  test('SECURITY: "statut" and "id_animal" sent in the body are ignored', async () => {
    await post({ ...VALID, statut: 'adopte', id_animal: 1 });
    const data = AnimalModel.create.mock.calls[0][0];
    expect(data).not.toHaveProperty('statut');
    expect(data).not.toHaveProperty('id_animal');
  });

  test.each([
    ['nom', ''],
    ['nom', '<b>Rex</b>'],
    ['sexe', 'inconnu'],
    ['dateNaissance', '14/02/2025'],
    ['dateNaissance', '2999-01-01'],
    ['dateArrivee', '2024-01-01'],
    ['taille', 'geant'],
    ['energie', 'turbo'],
    ['okEnfants', 'oui'],
    ['description', 'Court'],
    ['identification', 'collier'],
    ['photo', 'http://exemple.fr/photo.jpg'],
    ['photo', 'javascript:alert(1)'],
    ['idRace', 'abc'],
    ['vaccinations', 'pas une liste'],
  ])('400 when %s = %p', async (field, value) => {
    const res = await post({ ...VALID, [field]: value });
    expect(res.status).toBe(400);
    expect(res.body.erreurs.some((e) => e.champ === field)).toBe(true);
    expect(AnimalModel.create).not.toHaveBeenCalled();
  });

  test('400 when the same vaccination is listed twice', async () => {
    const vaccination = { idVaccin: 3, date: '2026-10-31' };
    const res = await post({ ...VALID, vaccinations: [vaccination, vaccination] });
    expect(res.status).toBe(400);
  });

  test('400 when a vaccination is before the birth', async () => {
    const res = await post({ ...VALID, vaccinations: [{ idVaccin: 3, date: '2024-01-01' }] });
    expect(res.status).toBe(400);
  });

  test('accepts a https photo and health notes', async () => {
    const res = await post({ ...VALID, photo: 'https://images.exemple.fr/calinou.jpg', remarquesSante: 'Vermifugé.' });
    expect(res.status).toBe(201);
  });
});

describe('Other shelter routes', () => {
  test('GET /gestion is not read as an id', async () => {
    const res = await request(app).get('/api/animaux/gestion').set('Authorization', REFUGE);
    expect(res.status).toBe(200);
    expect(AnimalModel.findAllForShelter).toHaveBeenCalled();
  });

  test('PUT /:id updates the animal', async () => {
    const res = await request(app).put('/api/animaux/17').set('Authorization', REFUGE).send(VALID);
    expect(res.status).toBe(200);
    expect(AnimalModel.update.mock.calls[0][0]).toBe(17);
  });

  test('PATCH /:id/statut reserves the animal', async () => {
    const res = await request(app).patch('/api/animaux/17/statut').set('Authorization', REFUGE).send({ statut: 'reserve' });
    expect(res.status).toBe(200);
    expect(AnimalModel.updateStatut).toHaveBeenCalledWith(17, 'reserve', {});
  });

  test('PATCH /:id/statut 400: "adopte" only through an accepted request', async () => {
    const res = await request(app).patch('/api/animaux/17/statut').set('Authorization', REFUGE).send({ statut: 'adopte' });
    expect(res.status).toBe(400);
  });

  test('DELETE /:id answers 204 without body', async () => {
    const res = await request(app).delete('/api/animaux/17').set('Authorization', REFUGE);
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });
});

describe('Reference lists (public)', () => {
  test('GET /api/races', async () => {
    const res = await request(app).get('/api/races');
    expect(res.status).toBe(200);
    expect(res.body[0].nom_race).toBe('Européen');
  });

  test('GET /api/vaccins', async () => {
    const res = await request(app).get('/api/vaccins');
    expect(res.status).toBe(200);
    expect(res.body[0].nom_vaccin).toBe('Typhus-Coryza');
  });
});
