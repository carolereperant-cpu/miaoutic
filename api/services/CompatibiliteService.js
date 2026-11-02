// ============================================================
// services/CompatibiliteService.js
// Compatibility score ("% de match") between an adopter and an
// animal. Rules described in docs/conception/score-compatibilite.md
//
// 4 criteria of 25 points each = 100 points.
// Safety rule: an incompatibility with the children or with the
// other pets caps the score at 30 %, whatever the other criteria.
// ============================================================

const SAFETY_CAP = 30;

// Points for the free time of the adopter, by energy of the animal
const TIME_POINTS = {
  calme: { faible: 25, moyen: 25, eleve: 25 },
  modere: { faible: 10, moyen: 25, eleve: 25 },
  energique: { faible: 0, moyen: 10, eleve: 25 },
};

class CompatibiliteService {
  /**
   * @param {object} profil - row of profil_adoptant
   * @param {object} animal - row of animal (criteria columns)
   * @returns {{ score: number, plafonne: boolean, criteres: object[] }}
   *   criteres explains each criterion (shown to the adopter)
   */
  compute(profil, animal) {
    const conflitEnfants = profil.a_enfants && !animal.ok_enfants;
    const conflitAnimaux = (profil.a_chien && !animal.ok_chiens) || (profil.a_chat && !animal.ok_chats);

    const criteres = [
      {
        critere: 'enfants',
        points: conflitEnfants ? 0 : 25,
        max: 25,
        detail: conflitEnfants ? 'Cet animal n\'est pas à l\'aise avec les enfants.' : 'Pas de souci avec votre foyer.',
      },
      {
        critere: 'autres_animaux',
        points: conflitAnimaux ? 0 : 25,
        max: 25,
        detail: conflitAnimaux ? 'Cet animal ne s\'entend pas avec vos animaux.' : 'Bonne entente prévue avec vos animaux.',
      },
      this.#housingCriterion(profil, animal),
      {
        critere: 'temps',
        points: TIME_POINTS[animal.energie][profil.temps_disponible],
        max: 25,
        detail: 'Adéquation entre son énergie et votre temps disponible.',
      },
    ];

    const total = criteres.reduce((sum, criterion) => sum + criterion.points, 0);
    const plafonne = (conflitEnfants || conflitAnimaux) && total > SAFETY_CAP;

    return { score: plafonne ? SAFETY_CAP : total, plafonne, criteres };
  }

  /** Housing: garden needed? big animal in a flat? */
  #housingCriterion(profil, animal) {
    if (animal.besoin_jardin && profil.logement !== 'maison_avec_jardin') {
      return { critere: 'logement', points: 0, max: 25, detail: 'Cet animal a besoin d\'un jardin.' };
    }
    if (animal.taille === 'grand' && profil.logement === 'appartement') {
      return { critere: 'logement', points: 10, max: 25, detail: 'Un grand animal sera à l\'étroit en appartement.' };
    }
    return { critere: 'logement', points: 25, max: 25, detail: 'Votre logement lui convient.' };
  }
}

module.exports = CompatibiliteService;
