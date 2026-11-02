// ============================================================
// services/AnimalService.js
// Business logic for the animals: adds the computed age and
// decides what happens when an animal does not exist.
//
// The model is received in the constructor (dependency
// injection): the real application gives the real model, the
// unit tests give a fake one, without any database.
// ============================================================

const HttpError = require('../utils/HttpError');
const { computeAge } = require('../utils/age');

class AnimalService {
  /**
   * @param {object} animalModel - data access component (AnimalModel)
   */
  constructor(animalModel) {
    this.animalModel = animalModel;
  }

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

  /**
   * Private method (the # makes it usable only inside this class):
   * returns a copy of the animal with an "age" property.
   */
  #addAge(animal) {
    return { ...animal, age: computeAge(animal.date_naissance) };
  }
}

module.exports = AnimalService;
