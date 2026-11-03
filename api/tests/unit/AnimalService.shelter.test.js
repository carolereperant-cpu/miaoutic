// Unit tests of the shelter part of services/AnimalService.js
// Fake model + fake transaction (records commit / rollback).
const AnimalService = require('../../services/AnimalService');

const CONNECTION = { name: 'transaction connection' };
const DATA = { nom: 'Câlinou', dateNaissance: '2025-02-14', idRace: 7, vaccinations: [{ idVaccin: 3, date: '2026-10-31' }] };

function createService() {
  const animalModel = {
    create: jest.fn().mockResolvedValue(17),
    update: jest.fn().mockResolvedValue(),
    replaceVaccinations: jest.fn().mockResolvedValue(),
    findForUpdate: jest.fn().mockResolvedValue({ id_animal: 17, nom: 'Câlinou', statut: 'disponible' }),
    updateStatut: jest.fn().mockResolvedValue(),
    deleteById: jest.fn().mockResolvedValue(true),
    findById: jest.fn().mockResolvedValue({ id_animal: 17, nom: 'Câlinou', date_naissance: '2025-02-14' }),
    findVaccinations: jest.fn().mockResolvedValue([]),
    findAllForShelter: jest.fn().mockResolvedValue([{ id_animal: 17, nom: 'Câlinou', date_naissance: '2025-02-14' }]),
  };
  const transaction = { committed: false, rolledBack: false };
  const withTransaction = jest.fn(async (work) => {
    try {
      const result = await work(CONNECTION);
      transaction.committed = true;
      return result;
    } catch (error) {
      transaction.rolledBack = true;
      throw error;
    }
  });
  return { service: new AnimalService(animalModel, withTransaction), animalModel, transaction };
}

const dbError = (code) => Object.assign(new Error(code), { code });

describe('create', () => {
  test('creates the animal and its vaccinations in the same transaction', async () => {
    const { service, animalModel, transaction } = createService();

    const animal = await service.create(DATA);

    expect(animalModel.create).toHaveBeenCalledWith(DATA, CONNECTION);
    expect(animalModel.replaceVaccinations).toHaveBeenCalledWith(17, DATA.vaccinations, CONNECTION);
    expect(transaction.committed).toBe(true);
    expect(animal.age).toBeDefined();
  });

  test('without vaccinations, an empty list is saved', async () => {
    const { service, animalModel } = createService();
    await service.create({ nom: 'Câlinou' });
    expect(animalModel.replaceVaccinations).toHaveBeenCalledWith(17, [], CONNECTION);
  });

  test.each([
    ['ER_NO_REFERENCED_ROW_2', 'MariaDB'],
    ['ER_NO_REFERENCED_ROW', 'MySQL 8, account with limited rights'],
  ])('ROLLBACK + 400 when a vaccine does not exist (foreign key, %s: %s)', async (code) => {
    const { service, animalModel, transaction } = createService();
    animalModel.replaceVaccinations.mockRejectedValue(dbError(code));

    await expect(service.create(DATA)).rejects.toMatchObject({ status: 400 });
    expect(transaction.rolledBack).toBe(true);
    expect(transaction.committed).toBe(false);
  });

  test.each(['ER_CHECK_CONSTRAINT_VIOLATED', 'ER_CONSTRAINT_FAILED'])('400 for the CHECK error %s (MySQL / MariaDB)', async (code) => {
    const { service, animalModel } = createService();
    animalModel.create.mockRejectedValue(dbError(code));
    await expect(service.create(DATA)).rejects.toMatchObject({ status: 400, message: 'Les dates sont incohérentes.' });
  });

  test('an unexpected error is passed on unchanged', async () => {
    const { service, animalModel } = createService();
    animalModel.create.mockRejectedValue(new Error('connection lost'));
    await expect(service.create(DATA)).rejects.toThrow('connection lost');
  });
});

describe('update', () => {
  test('replaces the vaccinations when the list is given', async () => {
    const { service, animalModel } = createService();
    await service.update(17, DATA);
    expect(animalModel.update).toHaveBeenCalledWith(17, DATA, CONNECTION);
    expect(animalModel.replaceVaccinations).toHaveBeenCalledWith(17, DATA.vaccinations, CONNECTION);
  });

  test('keeps the vaccinations when the list is absent', async () => {
    const { service, animalModel } = createService();
    await service.update(17, { nom: 'Câlinou' });
    expect(animalModel.replaceVaccinations).not.toHaveBeenCalled();
  });

  test('404 for an unknown animal (nothing written)', async () => {
    const { service, animalModel } = createService();
    animalModel.findForUpdate.mockResolvedValue(null);
    await expect(service.update(999, DATA)).rejects.toMatchObject({ status: 404 });
    expect(animalModel.update).not.toHaveBeenCalled();
  });
});

describe('changeStatus', () => {
  test('reserves an available animal', async () => {
    const { service, animalModel } = createService();
    await service.changeStatus(17, 'reserve');
    expect(animalModel.updateStatut).toHaveBeenCalledWith(17, 'reserve', CONNECTION);
  });

  test('409: an adopted animal keeps its status', async () => {
    const { service, animalModel } = createService();
    animalModel.findForUpdate.mockResolvedValue({ id_animal: 6, nom: 'Filou', statut: 'adopte' });
    await expect(service.changeStatus(6, 'disponible')).rejects.toMatchObject({ status: 409 });
    expect(animalModel.updateStatut).not.toHaveBeenCalled();
  });

  test('404 for an unknown animal', async () => {
    const { service, animalModel } = createService();
    animalModel.findForUpdate.mockResolvedValue(null);
    await expect(service.changeStatus(999, 'reserve')).rejects.toMatchObject({ status: 404 });
  });
});

describe('remove', () => {
  test('deletes an animal without requests', async () => {
    const { service, animalModel } = createService();
    await service.remove(17);
    expect(animalModel.deleteById).toHaveBeenCalledWith(17);
  });

  test.each([
    ['ER_ROW_IS_REFERENCED_2', 'MariaDB'],
    ['ER_ROW_IS_REFERENCED', 'MySQL 8, account with limited rights'],
  ])('409 when adoption requests point to the animal (%s: %s)', async (code) => {
    const { service, animalModel } = createService();
    animalModel.deleteById.mockRejectedValue(dbError(code));
    await expect(service.remove(1)).rejects.toMatchObject({ status: 409 });
  });

  test('404 when nothing was deleted', async () => {
    const { service, animalModel } = createService();
    animalModel.deleteById.mockResolvedValue(false);
    await expect(service.remove(999)).rejects.toMatchObject({ status: 404 });
  });
});

test('listForShelter adds the age', async () => {
  const { service } = createService();
  const [animal] = await service.listForShelter();
  expect(animal.age).toHaveProperty('libelle');
});
