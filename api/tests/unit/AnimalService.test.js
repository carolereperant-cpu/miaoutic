// Unit tests of services/AnimalService.js
// The service receives a fake model (dependency injection):
// no database is needed.
const AnimalService = require('../../services/AnimalService');
const HttpError = require('../../utils/HttpError');

const BISCOTTE = { id_animal: 7, nom: 'Biscotte', date_naissance: '2023-03-01', statut: 'disponible' };

function createFakeModel() {
  return {
    findPublic: jest.fn().mockResolvedValue([BISCOTTE]),
    findCoupsDeCoeur: jest.fn().mockResolvedValue([BISCOTTE]),
    findById: jest.fn().mockResolvedValue(BISCOTTE),
    findVaccinations: jest.fn().mockResolvedValue([{ nom_vaccin: 'Typhus-Coryza', date_vaccination: '2026-06-03' }]),
  };
}

describe('AnimalService', () => {
  test('listPublic passes the filters to the model and adds the age', async () => {
    const model = createFakeModel();
    const service = new AnimalService(model);

    const result = await service.listPublic({ idEspece: 2 });

    expect(model.findPublic).toHaveBeenCalledWith({ idEspece: 2 });
    expect(result[0].nom).toBe('Biscotte');
    expect(result[0].age).toHaveProperty('libelle');
  });

  test('listCoupsDeCoeur adds the age to every animal', async () => {
    const service = new AnimalService(createFakeModel());
    const result = await service.listCoupsDeCoeur();
    expect(result[0].age).toHaveProperty('annees');
  });

  test('getById returns the animal with its vaccinations', async () => {
    const model = createFakeModel();
    const service = new AnimalService(model);

    const result = await service.getById(7);

    expect(model.findVaccinations).toHaveBeenCalledWith(7);
    expect(result.vaccinations).toHaveLength(1);
    expect(result.age).toBeDefined();
  });

  test('getById throws a 404 error when the animal does not exist', async () => {
    const model = createFakeModel();
    model.findById.mockResolvedValue(null);
    const service = new AnimalService(model);

    const promise = service.getById(999);

    await expect(promise).rejects.toBeInstanceOf(HttpError);
    await expect(promise).rejects.toMatchObject({ status: 404 });
    // No need to look for vaccinations of a missing animal
    expect(model.findVaccinations).not.toHaveBeenCalled();
  });

  test('does not modify the object returned by the model', async () => {
    const service = new AnimalService(createFakeModel());
    await service.listPublic({});
    expect(BISCOTTE).not.toHaveProperty('age');
  });
});
