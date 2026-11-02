// ============================================================
// services/ReferentielService.js
// Reference lists for the shelter forms (breeds, vaccines).
// ============================================================

class ReferentielService {
  /** @param {object} referentielModel */
  constructor(referentielModel) {
    this.referentielModel = referentielModel;
  }

  async listRaces() {
    return this.referentielModel.findRaces();
  }

  async listVaccins() {
    return this.referentielModel.findVaccins();
  }
}

module.exports = ReferentielService;
