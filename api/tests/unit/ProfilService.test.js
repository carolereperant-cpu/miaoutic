// Unit tests of services/ProfilService.js (fake models)
const ProfilService = require('../../services/ProfilService');
const CompatibiliteService = require('../../services/CompatibiliteService');

const LEA_PROFIL = { id_utilisateur: 3, logement: 'appartement', a_enfants: false, a_chien: false, a_chat: true, temps_disponible: 'moyen' };

const ANIMALS = [
  { id_animal: 10, nom: 'Pacha', date_naissance: '2020-01-25', taille: 'grand', energie: 'calme', ok_enfants: false, ok_chiens: false, ok_chats: false, besoin_jardin: false },
  { id_animal: 7, nom: 'Biscotte', date_naissance: '2023-03-01', taille: 'petit', energie: 'calme', ok_enfants: true, ok_chiens: false, ok_chats: true, besoin_jardin: false },
];

function createService({ profil = LEA_PROFIL } = {}) {
  const profilModel = {
    findByUser: jest.fn().mockResolvedValue(profil),
    save: jest.fn().mockResolvedValue(),
  };
  const animalModel = {
    findDisponiblesWithCriteria: jest.fn().mockResolvedValue(ANIMALS),
    findById: jest.fn().mockResolvedValue(ANIMALS[1]),
  };
  const service = new ProfilService({ profilModel, animalModel, compatibiliteService: new CompatibiliteService() });
  return { service, profilModel, animalModel };
}

test('get: 404 when the questionnaire was never filled in', async () => {
  const { service } = createService({ profil: null });
  await expect(service.get(6)).rejects.toMatchObject({ status: 404 });
});

test('save: saves then returns the questionnaire', async () => {
  const { service, profilModel } = createService();
  const data = { logement: 'appartement', aEnfants: false, aChien: false, aChat: true, tempsDisponible: 'moyen' };

  const result = await service.save(3, data);

  expect(profilModel.save).toHaveBeenCalledWith(3, data);
  expect(result).toEqual(LEA_PROFIL);
});

test('listMatchs: best score first, with the age', async () => {
  const { service } = createService();

  const matchs = await service.listMatchs(3);

  expect(matchs.map((m) => [m.nom, m.score])).toEqual([['Biscotte', 100], ['Pacha', 30]]);
  expect(matchs[0].age).toHaveProperty('libelle');
  // The criteria columns are not sent back to the client
  expect(matchs[0]).not.toHaveProperty('ok_chiens');
});

test('listMatchs: 409 without questionnaire', async () => {
  const { service, animalModel } = createService({ profil: null });
  await expect(service.listMatchs(6)).rejects.toMatchObject({ status: 409 });
  expect(animalModel.findDisponiblesWithCriteria).not.toHaveBeenCalled();
});

test('compatibilityWith: detailed score for one animal', async () => {
  const { service } = createService();
  const result = await service.compatibilityWith(3, 7);
  expect(result.score).toBe(100);
  expect(result.criteres).toHaveLength(4);
});

test('compatibilityWith: 404 for an unknown animal', async () => {
  const { service, animalModel } = createService();
  animalModel.findById.mockResolvedValue(null);
  await expect(service.compatibilityWith(3, 999)).rejects.toMatchObject({ status: 404 });
});
