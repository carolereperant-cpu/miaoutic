// ============================================================
// services/EspeceService.js
// Business logic for the species. Simple for now, but every
// route goes through a service so that all layers stay the same
// (route -> controller -> service -> model).
// ============================================================

class EspeceService {
  /**
   * @param {object} especeModel - data access component (EspeceModel)
   */
  constructor(especeModel) {
    this.especeModel = especeModel;
  }

  /** Species of the menu, with the number of available animals. */
  async list() {
    return this.especeModel.findAllWithCount();
  }
}

module.exports = EspeceService;
