// Unit tests of services/DemandeService.js
// Fake models + fake transaction: we check the business rules and
// that everything happens INSIDE the transaction.
const DemandeService = require('../../services/DemandeService');
const CompatibiliteService = require('../../services/CompatibiliteService');

const CONNECTION = { name: 'transaction connection' };
const PROFIL = { logement: 'maison_avec_jardin', a_enfants: false, a_chien: false, a_chat: false, temps_disponible: 'eleve' };
const OSLO = { id_animal: 5, nom: 'Oslo', statut: 'disponible', taille: 'moyen', energie: 'calme', ok_enfants: true, ok_chiens: false, ok_chats: true, besoin_jardin: false };

function createService() {
  const demandeModel = {
    create: jest.fn().mockResolvedValue(10),
    findById: jest.fn().mockResolvedValue({ id_demande: 10, id_animal: 5, statut: 'recue' }),
    findForUpdate: jest.fn().mockResolvedValue({ id_demande: 10, id_utilisateur: 6, id_animal: 5, statut: 'recue' }),
    findByUser: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    updateStatut: jest.fn().mockResolvedValue(),
    refuseOtherActive: jest.fn().mockResolvedValue(2),
  };
  const animalModel = {
    findForUpdate: jest.fn().mockResolvedValue({ ...OSLO }),
    updateStatut: jest.fn().mockResolvedValue(),
  };
  const profilModel = { findByUser: jest.fn().mockResolvedValue(PROFIL) };

  // Fake transaction: runs the work with a fake connection and
  // records whether it ended with a commit or a rollback
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

  const service = new DemandeService({
    demandeModel, animalModel, profilModel, compatibiliteService: new CompatibiliteService(), withTransaction,
  });
  return { service, demandeModel, animalModel, profilModel, transaction };
}

describe('create', () => {
  test('creates the request with the score computed by the server', async () => {
    const { service, demandeModel, transaction } = createService();

    await service.create(6, { idAnimal: 5, message: 'Je voudrais adopter Oslo.' });

    expect(demandeModel.create).toHaveBeenCalledWith(
      { idUtilisateur: 6, idAnimal: 5, message: 'Je voudrais adopter Oslo.', score: 100 },
      CONNECTION,
    );
    expect(transaction.committed).toBe(true);
  });

  test('locks the animal during the checks', async () => {
    const { service, animalModel } = createService();
    await service.create(6, { idAnimal: 5, message: 'Je voudrais adopter Oslo.' });
    expect(animalModel.findForUpdate).toHaveBeenCalledWith(5, CONNECTION);
  });

  test('409 without questionnaire (no transaction started)', async () => {
    const { service, profilModel, demandeModel } = createService();
    profilModel.findByUser.mockResolvedValue(null);

    await expect(service.create(6, { idAnimal: 5, message: 'Message assez long.' })).rejects.toMatchObject({ status: 409 });
    expect(demandeModel.create).not.toHaveBeenCalled();
  });

  test('404 for an unknown animal', async () => {
    const { service, animalModel } = createService();
    animalModel.findForUpdate.mockResolvedValue(null);
    await expect(service.create(6, { idAnimal: 999, message: 'Message assez long.' })).rejects.toMatchObject({ status: 404 });
  });

  test.each(['reserve', 'adopte'])('409 when the animal is %s', async (statut) => {
    const { service, animalModel, demandeModel, transaction } = createService();
    animalModel.findForUpdate.mockResolvedValue({ ...OSLO, statut });

    await expect(service.create(6, { idAnimal: 5, message: 'Message assez long.' })).rejects.toMatchObject({ status: 409 });
    expect(demandeModel.create).not.toHaveBeenCalled();
    expect(transaction.rolledBack).toBe(true);
  });

  test('409 when an active request already exists (unique index)', async () => {
    const { service, demandeModel, transaction } = createService();
    demandeModel.create.mockRejectedValue(Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' }));

    await expect(service.create(6, { idAnimal: 5, message: 'Message assez long.' }))
      .rejects.toMatchObject({ status: 409, message: 'Vous avez déjà une demande en cours pour Oslo.' });
    expect(transaction.rolledBack).toBe(true);
  });
});

describe('cancel', () => {
  test('the adopter cancels his active request', async () => {
    const { service, demandeModel } = createService();
    await service.cancel(6, 10);
    expect(demandeModel.updateStatut).toHaveBeenCalledWith(10, 'annulee', CONNECTION);
  });

  test('SECURITY: 404 for the request of someone else', async () => {
    const { service, demandeModel } = createService();
    await expect(service.cancel(3, 10)).rejects.toMatchObject({ status: 404 });
    expect(demandeModel.updateStatut).not.toHaveBeenCalled();
  });

  test.each(['acceptee', 'refusee', 'annulee'])('409 for a request already %s', async (statut) => {
    const { service, demandeModel } = createService();
    demandeModel.findForUpdate.mockResolvedValue({ id_demande: 10, id_utilisateur: 6, id_animal: 5, statut });
    await expect(service.cancel(6, 10)).rejects.toMatchObject({ status: 409 });
  });
});

describe('changeStatus (shelter)', () => {
  test('ACCEPT: request accepted + animal adopted + other requests refused, in one transaction', async () => {
    const { service, demandeModel, animalModel, transaction } = createService();

    const result = await service.changeStatus(10, 'acceptee');

    expect(demandeModel.updateStatut).toHaveBeenCalledWith(10, 'acceptee', CONNECTION);
    expect(animalModel.updateStatut).toHaveBeenCalledWith(5, 'adopte', CONNECTION);
    expect(demandeModel.refuseOtherActive).toHaveBeenCalledWith(5, 10, CONNECTION);
    expect(result.autresDemandesRefusees).toBe(2);
    expect(transaction.committed).toBe(true);
  });

  test('locks the animal BEFORE the request (same order everywhere: no deadlock)', async () => {
    const { service, demandeModel, animalModel } = createService();
    await service.changeStatus(10, 'acceptee');
    const animalLock = animalModel.findForUpdate.mock.invocationCallOrder[0];
    const requestLock = demandeModel.findForUpdate.mock.invocationCallOrder[0];
    expect(animalLock).toBeLessThan(requestLock);
  });

  test('ROLLBACK: if a step fails, the error is passed on and nothing is committed', async () => {
    const { service, demandeModel, transaction } = createService();
    demandeModel.refuseOtherActive.mockRejectedValue(new Error('connection lost'));

    await expect(service.changeStatus(10, 'acceptee')).rejects.toThrow('connection lost');
    expect(transaction.rolledBack).toBe(true);
    expect(transaction.committed).toBe(false);
  });

  test('CONCURRENCY: 409 if the animal was adopted while waiting for the lock', async () => {
    const { service, animalModel, demandeModel } = createService();
    animalModel.findForUpdate.mockResolvedValue({ ...OSLO, statut: 'adopte' });

    await expect(service.changeStatus(10, 'acceptee'))
      .rejects.toMatchObject({ status: 409, message: 'Oslo a déjà trouvé un foyer.' });
    expect(demandeModel.updateStatut).not.toHaveBeenCalled();
  });

  test('en_etude only changes the request', async () => {
    const { service, demandeModel, animalModel } = createService();
    await service.changeStatus(10, 'en_etude');
    expect(demandeModel.updateStatut).toHaveBeenCalledWith(10, 'en_etude', CONNECTION);
    expect(animalModel.updateStatut).not.toHaveBeenCalled();
  });

  test.each([
    ['en_etude', 'en_etude'],
    ['acceptee', 'refusee'],
    ['refusee', 'acceptee'],
    ['annulee', 'en_etude'],
  ])('409 for the forbidden change %s -> %s', async (from, to) => {
    const { service, demandeModel } = createService();
    demandeModel.findForUpdate.mockResolvedValue({ id_demande: 10, id_utilisateur: 6, id_animal: 5, statut: from });
    await expect(service.changeStatus(10, to)).rejects.toMatchObject({ status: 409 });
  });

  test('404 for an unknown request', async () => {
    const { service, demandeModel } = createService();
    demandeModel.findById.mockResolvedValue(null);
    await expect(service.changeStatus(999, 'en_etude')).rejects.toMatchObject({ status: 404 });
  });
});
