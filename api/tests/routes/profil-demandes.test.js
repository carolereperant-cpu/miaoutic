// Tests of the /api/profil and /api/demandes routes (supertest):
// access control (401 / 403), validation (400) and normal answers.
// Models and transaction are mocked.
jest.mock('../../config/database', () => ({ execute: jest.fn(), query: jest.fn() }));
jest.mock('../../models/ProfilModel');
jest.mock('../../models/AnimalModel');
jest.mock('../../models/DemandeModel');
jest.mock('../../utils/transaction', () => ({ withTransaction: (work) => work({}) }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const ProfilModel = require('../../models/ProfilModel');
const AnimalModel = require('../../models/AnimalModel');
const DemandeModel = require('../../models/DemandeModel');

const tokenFor = (id, role) => `Bearer ${jwt.sign({ role }, process.env.JWT_SECRET, { subject: String(id) })}`;
const ADOPTANT = tokenFor(6, 'adoptant');
const REFUGE = tokenFor(1, 'refuge');

const PROFIL = { id_utilisateur: 6, logement: 'maison_avec_jardin', a_enfants: false, a_chien: false, a_chat: false, temps_disponible: 'eleve' };
const OSLO = { id_animal: 5, nom: 'Oslo', statut: 'disponible', taille: 'moyen', energie: 'calme', ok_enfants: true, ok_chiens: false, ok_chats: true, besoin_jardin: false };
const VALID_PROFIL = { logement: 'appartement', aEnfants: false, aChien: false, aChat: true, tempsDisponible: 'moyen' };

beforeEach(() => {
  jest.resetAllMocks();
  ProfilModel.findByUser.mockResolvedValue(PROFIL);
  ProfilModel.save.mockResolvedValue();
  AnimalModel.findForUpdate.mockResolvedValue(OSLO);
  AnimalModel.findById.mockResolvedValue(OSLO);
  AnimalModel.findDisponiblesWithCriteria.mockResolvedValue([]);
  DemandeModel.create.mockResolvedValue(10);
  DemandeModel.findById.mockResolvedValue({ id_demande: 10, id_animal: 5, statut: 'recue' });
  DemandeModel.findForUpdate.mockResolvedValue({ id_demande: 10, id_utilisateur: 6, id_animal: 5, statut: 'recue' });
  DemandeModel.findByUser.mockResolvedValue([]);
  DemandeModel.findAll.mockResolvedValue([]);
});

describe('Access control', () => {
  test.each([
    ['get', '/api/profil'],
    ['put', '/api/profil'],
    ['get', '/api/profil/matchs'],
    ['post', '/api/demandes'],
    ['get', '/api/demandes/mes-demandes'],
    ['get', '/api/demandes'],
    ['patch', '/api/demandes/1/statut'],
  ])('401 without token: %s %s', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });

  test.each([
    ['get', '/api/profil'],
    ['post', '/api/demandes'],
    ['get', '/api/demandes/mes-demandes'],
  ])('SECURITY: 403 for the shelter on an adopter route: %s %s', async (method, url) => {
    const res = await request(app)[method](url).set('Authorization', REFUGE);
    expect(res.status).toBe(403);
  });

  test.each([
    ['get', '/api/demandes'],
    ['patch', '/api/demandes/1/statut'],
  ])('SECURITY: 403 for an adopter on a shelter route: %s %s', async (method, url) => {
    const res = await request(app)[method](url).set('Authorization', ADOPTANT).send({ statut: 'acceptee' });
    expect(res.status).toBe(403);
    expect(DemandeModel.updateStatut).not.toHaveBeenCalled();
  });
});

describe('/api/profil', () => {
  test('PUT saves the questionnaire of the logged-in user', async () => {
    const res = await request(app).put('/api/profil').set('Authorization', ADOPTANT).send(VALID_PROFIL);
    expect(res.status).toBe(200);
    expect(ProfilModel.save).toHaveBeenCalledWith(6, VALID_PROFIL);
  });

  test('SECURITY: the user id comes from the token, not from the body', async () => {
    await request(app).put('/api/profil').set('Authorization', ADOPTANT).send({ ...VALID_PROFIL, idUtilisateur: 3 });
    expect(ProfilModel.save.mock.calls[0][0]).toBe(6);
  });

  test.each([
    ['logement', 'chateau'],
    ['aEnfants', 'oui'],
    ['aChien', 1],
    ['tempsDisponible', 'beaucoup'],
  ])('400 when %s = %p', async (field, value) => {
    const res = await request(app).put('/api/profil').set('Authorization', ADOPTANT).send({ ...VALID_PROFIL, [field]: value });
    expect(res.status).toBe(400);
    expect(ProfilModel.save).not.toHaveBeenCalled();
  });

  test('GET /compatibilite/:idAnimal returns the detailed score', async () => {
    const res = await request(app).get('/api/profil/compatibilite/5').set('Authorization', ADOPTANT);
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(100);
  });
});

describe('/api/demandes', () => {
  test('POST 201 and the score sent by the user is ignored', async () => {
    const res = await request(app).post('/api/demandes').set('Authorization', ADOPTANT)
      .send({ idAnimal: 5, message: 'Je voudrais adopter Oslo.', score_compatibilite: 0 });
    expect(res.status).toBe(201);
    expect(DemandeModel.create.mock.calls[0][0].score).toBe(100);
  });

  test.each([
    [{ idAnimal: 'abc', message: 'Message assez long.' }],
    [{ idAnimal: 5, message: 'Court' }],
    [{ idAnimal: 5 }],
    [{ message: 'Message assez long.' }],
  ])('POST 400 with %p', async (body) => {
    const res = await request(app).post('/api/demandes').set('Authorization', ADOPTANT).send(body);
    expect(res.status).toBe(400);
  });

  test('PATCH /:id/annulation cancels the request', async () => {
    const res = await request(app).patch('/api/demandes/10/annulation').set('Authorization', ADOPTANT);
    expect(res.status).toBe(200);
    expect(DemandeModel.updateStatut).toHaveBeenCalledWith(10, 'annulee', {});
  });

  test('GET (shelter) passes the status filter', async () => {
    const res = await request(app).get('/api/demandes?statut=recue').set('Authorization', REFUGE);
    expect(res.status).toBe(200);
    expect(DemandeModel.findAll).toHaveBeenCalledWith({ statut: 'recue' });
  });

  test('GET (shelter) 400 with an unknown status', async () => {
    const res = await request(app).get('/api/demandes?statut=perdue').set('Authorization', REFUGE);
    expect(res.status).toBe(400);
  });

  test('PATCH /:id/statut (shelter) accepts the adoption', async () => {
    const res = await request(app).patch('/api/demandes/10/statut').set('Authorization', REFUGE).send({ statut: 'acceptee' });
    expect(res.status).toBe(200);
    expect(AnimalModel.updateStatut).toHaveBeenCalledWith(5, 'adopte', {});
  });

  test('PATCH /:id/statut 400: the shelter cannot set "annulee" or "recue"', async () => {
    for (const statut of ['annulee', 'recue']) {
      const res = await request(app).patch('/api/demandes/10/statut').set('Authorization', REFUGE).send({ statut });
      expect(res.status).toBe(400);
    }
  });
});
