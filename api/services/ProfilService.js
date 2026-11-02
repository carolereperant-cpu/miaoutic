// ============================================================
// services/ProfilService.js
// Adopter questionnaire and everything computed from it:
// "Mes matchs" (animals sorted by compatibility) and the score
// shown on an animal sheet.
// ============================================================

const HttpError = require('../utils/HttpError');
const { computeAge } = require('../utils/age');

const PROFILE_REQUIRED = 'Remplissez d\'abord votre questionnaire pour connaître vos matchs.';

class ProfilService {
  /**
   * @param {{ profilModel: object, animalModel: object, compatibiliteService: object }} deps
   */
  constructor({ profilModel, animalModel, compatibiliteService }) {
    this.profilModel = profilModel;
    this.animalModel = animalModel;
    this.compatibiliteService = compatibiliteService;
  }

  /**
   * @throws {HttpError} 404 if the questionnaire was never filled in
   */
  async get(idUtilisateur) {
    const profil = await this.profilModel.findByUser(idUtilisateur);
    if (!profil) {
      throw new HttpError(404, 'Questionnaire non rempli.');
    }
    return profil;
  }

  /** Creates or updates the questionnaire, then returns it. */
  async save(idUtilisateur, data) {
    await this.profilModel.save(idUtilisateur, data);
    return this.profilModel.findByUser(idUtilisateur);
  }

  /**
   * Available animals with their score, best matches first.
   * @throws {HttpError} 409 if the questionnaire was never filled in
   */
  async listMatchs(idUtilisateur) {
    const profil = await this.#requireProfile(idUtilisateur);
    const animals = await this.animalModel.findDisponiblesWithCriteria();

    return animals
      .map((animal) => {
        const { score, plafonne } = this.compatibiliteService.compute(profil, animal);
        return {
          id_animal: animal.id_animal,
          nom: animal.nom,
          sexe: animal.sexe,
          taille: animal.taille,
          photo: animal.photo,
          statut: animal.statut,
          nom_race: animal.nom_race,
          nom_espece: animal.nom_espece,
          age: computeAge(animal.date_naissance),
          score,
          plafonne,
        };
      })
      .sort((a, b) => b.score - a.score || a.nom.localeCompare(b.nom, 'fr'));
  }

  /**
   * Detailed score between the adopter and one animal.
   * @throws {HttpError} 409 without questionnaire, 404 unknown animal
   */
  async compatibilityWith(idUtilisateur, idAnimal) {
    const profil = await this.#requireProfile(idUtilisateur);
    const animal = await this.animalModel.findById(idAnimal);
    if (!animal) {
      throw new HttpError(404, 'Animal introuvable.');
    }
    return this.compatibiliteService.compute(profil, animal);
  }

  async #requireProfile(idUtilisateur) {
    const profil = await this.profilModel.findByUser(idUtilisateur);
    if (!profil) {
      throw new HttpError(409, PROFILE_REQUIRED);
    }
    return profil;
  }
}

module.exports = ProfilService;
