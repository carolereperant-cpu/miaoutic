// Unit tests of services/CompatibiliteService.js
// The first cases are the test data set of
// docs/conception/score-compatibilite.md (same profiles and animals
// as database/04_jeu_essai.sql).
const CompatibiliteService = require('../../services/CompatibiliteService');

const service = new CompatibiliteService();

const PROFILS = {
  lea: { logement: 'appartement', a_enfants: false, a_chien: false, a_chat: true, temps_disponible: 'moyen' },
  thomas: { logement: 'maison_avec_jardin', a_enfants: true, a_chien: true, a_chat: false, temps_disponible: 'eleve' },
  ines: { logement: 'maison_sans_jardin', a_enfants: true, a_chien: false, a_chat: false, temps_disponible: 'faible' },
};

const ANIMAUX = {
  biscotte: { taille: 'petit', energie: 'calme', ok_enfants: true, ok_chiens: false, ok_chats: true, besoin_jardin: false },
  saphir: { taille: 'petit', energie: 'modere', ok_enfants: true, ok_chiens: true, ok_chats: true, besoin_jardin: false },
  rocket: { taille: 'grand', energie: 'energique', ok_enfants: true, ok_chiens: true, ok_chats: false, besoin_jardin: true },
  pacha: { taille: 'grand', energie: 'calme', ok_enfants: false, ok_chiens: false, ok_chats: false, besoin_jardin: false },
};

describe('Test data set of the compatibility score', () => {
  test.each([
    ['lea', 'biscotte', 100, false],
    ['ines', 'saphir', 85, false],
    ['ines', 'rocket', 50, false],
    ['thomas', 'biscotte', 30, true], // 75 without the safety rule
    ['lea', 'pacha', 30, true], // 60 without the safety rule
  ])('%s + %s = %i %%', (profil, animal, expectedScore, expectedCap) => {
    const result = service.compute(PROFILS[profil], ANIMAUX[animal]);
    expect(result.score).toBe(expectedScore);
    expect(result.plafonne).toBe(expectedCap);
  });
});

describe('Rules of the score', () => {
  test('returns 4 criteria of 25 points maximum', () => {
    const { criteres } = service.compute(PROFILS.lea, ANIMAUX.biscotte);
    expect(criteres.map((c) => c.critere)).toEqual(['enfants', 'autres_animaux', 'logement', 'temps']);
    expect(criteres.every((c) => c.max === 25)).toBe(true);
  });

  test('a big animal in a flat gets 10 points out of 25 for the housing', () => {
    const { criteres } = service.compute(PROFILS.lea, { ...ANIMAUX.saphir, taille: 'grand' });
    expect(criteres.find((c) => c.critere === 'logement').points).toBe(10);
  });

  test('an animal that needs a garden gets 0 without garden', () => {
    const { criteres } = service.compute(PROFILS.ines, ANIMAUX.rocket);
    expect(criteres.find((c) => c.critere === 'logement').points).toBe(0);
  });

  test.each([
    ['calme', 'faible', 25],
    ['modere', 'faible', 10],
    ['modere', 'moyen', 25],
    ['energique', 'faible', 0],
    ['energique', 'moyen', 10],
    ['energique', 'eleve', 25],
  ])('energy %s with %s free time = %i points', (energie, temps, points) => {
    const { criteres } = service.compute({ ...PROFILS.lea, temps_disponible: temps }, { ...ANIMAUX.saphir, energie });
    expect(criteres.find((c) => c.critere === 'temps').points).toBe(points);
  });

  test('the cap does not raise a score already below 30 %', () => {
    // Children conflict + garden needed + no free time: 0 + 25 + 0 + 0 = 25
    const result = service.compute(PROFILS.ines, { ...ANIMAUX.rocket, ok_enfants: false });
    expect(result.score).toBe(25);
    expect(result.plafonne).toBe(false);
  });

  test('an adopter without children or pets is never capped', () => {
    const alone = { logement: 'maison_avec_jardin', a_enfants: false, a_chien: false, a_chat: false, temps_disponible: 'eleve' };
    expect(service.compute(alone, ANIMAUX.pacha).score).toBe(100);
  });
});
