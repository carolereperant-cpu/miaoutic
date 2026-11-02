// ============================================================
// services/DemandeService.js
// Business rules of the adoption requests.
//
//  1. A request needs a filled-in questionnaire.
//  2. Only an AVAILABLE animal can receive requests
//     (not reserved, not adopted).
//  3. One active request per adopter and per animal.
//  4. The score is computed here, on the server: the adopter
//     cannot send a fake score.
//  5. Status changes follow a fixed path:
//       recue -> en_etude -> acceptee / refusee
//       recue / en_etude -> annulee (by the adopter)
//  6. Accepting a request, in ONE transaction:
//       request "acceptee" + animal "adopte" + other active
//       requests for this animal "refusee".
//
// Concurrency: rows are locked in the same order everywhere
// (animal first, then request) so that two transactions never
// wait for each other forever (deadlock).
// ============================================================

const HttpError = require('../utils/HttpError');

// Allowed status changes for the shelter
const SHELTER_TRANSITIONS = {
  recue: ['en_etude', 'acceptee', 'refusee'],
  en_etude: ['acceptee', 'refusee'],
};

const ACTIVE_STATUSES = ['recue', 'en_etude'];

// Readable labels for the error messages
const LABELS = {
  recue: 'reçue',
  en_etude: 'en étude',
  acceptee: 'acceptée',
  refusee: 'refusée',
  annulee: 'annulée',
};

class DemandeService {
  /**
   * @param {object} deps
   * @param {object} deps.demandeModel
   * @param {object} deps.animalModel
   * @param {object} deps.profilModel
   * @param {object} deps.compatibiliteService
   * @param {Function} deps.withTransaction - runs a function in a transaction
   */
  constructor({ demandeModel, animalModel, profilModel, compatibiliteService, withTransaction }) {
    this.demandeModel = demandeModel;
    this.animalModel = animalModel;
    this.profilModel = profilModel;
    this.compatibiliteService = compatibiliteService;
    this.withTransaction = withTransaction;
  }

  /**
   * An adopter asks to adopt an animal.
   * @param {number} idUtilisateur - from the token
   * @param {{ idAnimal: number, message: string }} data
   * @throws {HttpError} 409 (no questionnaire, animal not available,
   *   request already in progress), 404 (unknown animal)
   */
  async create(idUtilisateur, { idAnimal, message }) {
    const profil = await this.profilModel.findByUser(idUtilisateur);
    if (!profil) {
      throw new HttpError(409, 'Remplissez d\'abord votre questionnaire avant de faire une demande.');
    }

    return this.withTransaction(async (connection) => {
      // Locks the animal: its status cannot change during the checks
      const animal = await this.animalModel.findForUpdate(idAnimal, connection);
      if (!animal) {
        throw new HttpError(404, 'Animal introuvable.');
      }
      if (animal.statut !== 'disponible') {
        throw new HttpError(409, `${animal.nom} n'est plus disponible à l'adoption.`);
      }

      const { score } = this.compatibiliteService.compute(profil, animal);

      let idDemande;
      try {
        idDemande = await this.demandeModel.create({ idUtilisateur, idAnimal, message, score }, connection);
      } catch (error) {
        // Unique index of the database: one active request per adopter and animal
        if (error.code === 'ER_DUP_ENTRY') {
          throw new HttpError(409, `Vous avez déjà une demande en cours pour ${animal.nom}.`);
        }
        throw error;
      }

      return this.demandeModel.findById(idDemande, connection);
    });
  }

  /** Requests of the logged-in adopter. */
  async listForAdopter(idUtilisateur) {
    return this.demandeModel.findByUser(idUtilisateur);
  }

  /** Requests for the shelter, optionally filtered by status. */
  async listForShelter(filters) {
    return this.demandeModel.findAll(filters);
  }

  /**
   * The adopter cancels one of HIS requests.
   * Someone else's request answers 404, like a missing one: we do
   * not reveal that it exists.
   * @throws {HttpError} 404, 409 (request already closed)
   */
  async cancel(idUtilisateur, idDemande) {
    return this.withTransaction(async (connection) => {
      const demande = await this.demandeModel.findForUpdate(idDemande, connection);
      if (!demande || demande.id_utilisateur !== idUtilisateur) {
        throw new HttpError(404, 'Demande introuvable.');
      }
      if (!ACTIVE_STATUSES.includes(demande.statut)) {
        throw new HttpError(409, 'Cette demande est déjà traitée et ne peut plus être annulée.');
      }

      await this.demandeModel.updateStatut(idDemande, 'annulee', connection);
      return this.demandeModel.findById(idDemande, connection);
    });
  }

  /**
   * The shelter changes the status of a request.
   * @param {number} idDemande
   * @param {'en_etude'|'acceptee'|'refusee'} nouveauStatut
   * @returns {Promise<{ demande: object, autresDemandesRefusees: number }>}
   * @throws {HttpError} 404, 409 (forbidden change, animal already adopted)
   */
  async changeStatus(idDemande, nouveauStatut) {
    // Read without lock, only to know which animal to lock first
    const existing = await this.demandeModel.findById(idDemande);
    if (!existing) {
      throw new HttpError(404, 'Demande introuvable.');
    }

    return this.withTransaction(async (connection) => {
      // Lock order: animal, then request (same order as create)
      const animal = await this.animalModel.findForUpdate(existing.id_animal, connection);
      const demande = await this.demandeModel.findForUpdate(idDemande, connection);
      if (!demande) {
        throw new HttpError(404, 'Demande introuvable.'); // deleted in the meantime
      }

      // Checked after the lock: another staff member may have adopted
      // the animal while we were waiting
      if (nouveauStatut === 'acceptee' && animal.statut === 'adopte') {
        throw new HttpError(409, `${animal.nom} a déjà trouvé un foyer.`);
      }

      // The status may also have changed while we were waiting
      const allowed = SHELTER_TRANSITIONS[demande.statut] ?? [];
      if (!allowed.includes(nouveauStatut)) {
        throw new HttpError(
          409,
          `Une demande ${LABELS[demande.statut]} ne peut pas passer au statut « ${LABELS[nouveauStatut]} ».`,
        );
      }

      let autresDemandesRefusees = 0;

      if (nouveauStatut === 'acceptee') {
        await this.demandeModel.updateStatut(idDemande, 'acceptee', connection);
        await this.animalModel.updateStatut(animal.id_animal, 'adopte', connection);
        autresDemandesRefusees = await this.demandeModel.refuseOtherActive(animal.id_animal, idDemande, connection);
      } else {
        await this.demandeModel.updateStatut(idDemande, nouveauStatut, connection);
      }

      const updated = await this.demandeModel.findById(idDemande, connection);
      return { demande: updated, autresDemandesRefusees };
    });
  }
}

module.exports = DemandeService;
