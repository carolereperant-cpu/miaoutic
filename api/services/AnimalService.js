// ============================================================
// services/AnimalService.js
// Business logic for the animals:
//   - public side: lists and sheets, with the computed age
//   - shelter side: create, update, change status, delete
//
// The model and the transaction function are received in the
// constructor (dependency injection): the real application gives
// the real ones, the unit tests give fake ones, without database.
// ============================================================

const HttpError = require('../utils/HttpError');
const { computeAge } = require('../utils/age');

// Foreign key errors have two codes: MariaDB (and MySQL for an
// administrator) sends the "_2" version, with the details of the
// constraint; MySQL 8 sends the short version to an account with
// limited rights (miaoutic_app), to hide the structure of the tables.
const FK_PARENT_MISSING = ['ER_NO_REFERENCED_ROW_2', 'ER_NO_REFERENCED_ROW'];
const FK_ROW_REFERENCED = ['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED'];

/**
 * Turns a database error into a clear message for the user.
 * Most cases are already stopped by the validation rules; this is
 * the last safety net.
 */
function translateDatabaseError(error) {
  if (FK_PARENT_MISSING.includes(error.code)) {
    return new HttpError(400, 'La race ou un vaccin indiqué n\'existe pas.');
  }
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return new HttpError(400, 'La même vaccination est indiquée deux fois.');
    case 'ER_CHECK_CONSTRAINT_VIOLATED': // MySQL
    case 'ER_CONSTRAINT_FAILED': // MariaDB
      return new HttpError(400, 'Les dates sont incohérentes.');
    default:
      return error;
  }
}

class AnimalService {
  /**
   * @param {object} animalModel - data access component (AnimalModel)
   * @param {Function} [withTransaction] - runs a function in a transaction
   */
  constructor(animalModel, withTransaction) {
    this.animalModel = animalModel;
    this.withTransaction = withTransaction;
  }

  // ----------------------------------------------------------
  // Public side
  // ----------------------------------------------------------

  /**
   * Animals for the public list, with their age.
   * @param {{ idEspece?: number, taille?: string, nom?: string }} filters
   */
  async listPublic(filters) {
    const animals = await this.animalModel.findPublic(filters);
    return animals.map((animal) => this.#addAge(animal));
  }

  /** The favourite animals of the home page, with their age. */
  async listCoupsDeCoeur() {
    const animals = await this.animalModel.findCoupsDeCoeur();
    return animals.map((animal) => this.#addAge(animal));
  }

  /**
   * Full sheet of one animal: details, age and vaccinations.
   * @param {number} id
   * @throws {HttpError} 404 when the animal does not exist
   */
  async getById(id) {
    const animal = await this.animalModel.findById(id);
    if (!animal) {
      throw new HttpError(404, 'Animal introuvable.');
    }

    const vaccinations = await this.animalModel.findVaccinations(id);
    return { ...this.#addAge(animal), vaccinations };
  }

  // ----------------------------------------------------------
  // Shelter side
  // ----------------------------------------------------------

  /** Every animal, adopted ones included, with its active requests. */
  async listForShelter() {
    const animals = await this.animalModel.findAllForShelter();
    return animals.map((animal) => this.#addAge(animal));
  }

  /**
   * Creates an animal and its vaccinations in ONE transaction.
   * @param {object} data - validated body
   * @returns {Promise<object>} the full sheet of the new animal
   */
  async create(data) {
    let id;
    try {
      id = await this.withTransaction(async (connection) => {
        const newId = await this.animalModel.create(data, connection);
        await this.animalModel.replaceVaccinations(newId, data.vaccinations ?? [], connection);
        return newId;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
    return this.getById(id);
  }

  /**
   * Updates an animal. Its vaccinations are replaced only when the
   * request contains a "vaccinations" list; otherwise they are kept.
   * @throws {HttpError} 404 when the animal does not exist
   */
  async update(id, data) {
    try {
      await this.withTransaction(async (connection) => {
        const animal = await this.animalModel.findForUpdate(id, connection);
        if (!animal) {
          throw new HttpError(404, 'Animal introuvable.');
        }
        await this.animalModel.update(id, data, connection);
        if (data.vaccinations !== undefined) {
          await this.animalModel.replaceVaccinations(id, data.vaccinations, connection);
        }
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
    return this.getById(id);
  }

  /**
   * Puts an animal back on the site or reserves it.
   * An adopted animal keeps its status: adoption is final and goes
   * through the acceptance of a request.
   * @param {number} id
   * @param {'disponible'|'reserve'} statut
   * @throws {HttpError} 404, 409 (animal already adopted)
   */
  async changeStatus(id, statut) {
    await this.withTransaction(async (connection) => {
      const animal = await this.animalModel.findForUpdate(id, connection);
      if (!animal) {
        throw new HttpError(404, 'Animal introuvable.');
      }
      if (animal.statut === 'adopte') {
        throw new HttpError(409, `${animal.nom} a été adopté : son statut ne peut plus changer.`);
      }
      await this.animalModel.updateStatut(id, statut, connection);
    });
    return this.getById(id);
  }

  /**
   * Deletes an animal that never received an adoption request.
   * The requests are part of the history of the shelter: the
   * database refuses to delete an animal they point to.
   * @throws {HttpError} 404, 409 (requests exist)
   */
  async remove(id) {
    let deleted;
    try {
      deleted = await this.animalModel.deleteById(id);
    } catch (error) {
      if (FK_ROW_REFERENCED.includes(error.code)) {
        throw new HttpError(409, 'Cet animal a déjà reçu des demandes d\'adoption : il ne peut pas être supprimé. Changez plutôt son statut.');
      }
      throw error;
    }
    if (!deleted) {
      throw new HttpError(404, 'Animal introuvable.');
    }
  }

  /**
   * Private method (the # makes it usable only inside this class):
   * returns a copy of the animal with an "age" property.
   */
  #addAge(animal) {
    return { ...animal, age: computeAge(animal.date_naissance) };
  }
}

module.exports = AnimalService;
