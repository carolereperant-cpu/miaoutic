// ============================================================
// utils/format.js
// Turns the values of the API into text for the user.
// ============================================================

/**
 * URL-friendly version of a text: "Chats" -> "chats", "Épagneul" -> "epagneul"
 * @param {string} text
 */
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Emoji shown when an animal has no photo */
const SPECIES_EMOJI = { chiens: '🐶', chats: '🐱', lapins: '🐰', rongeurs: '🐹' };

export function speciesEmoji(nomEspece = '') {
  return SPECIES_EMOJI[slugify(nomEspece)] ?? '🐾';
}

export const SEXE_LABELS = { male: 'Mâle', femelle: 'Femelle' };
export const TAILLE_LABELS = { petit: 'Petit', moyen: 'Moyen', grand: 'Grand' };
export const ENERGIE_LABELS = { calme: 'Calme', modere: 'Énergie modérée', energique: 'Très énergique' };
export const STATUT_ANIMAL_LABELS = { disponible: 'Disponible', reserve: 'Réservé', adopte: 'Adopté' };
export const IDENTIFICATION_LABELS = { puce: 'Puce électronique', tatouage: 'Tatouage', aucune: 'Aucune' };

/**
 * '2026-06-03' -> '3 juin 2026'
 * The date is read as a local date, so it never shifts by one day.
 */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(year, month - 1, day));
}

/** "1 animal trouvé" / "3 animaux trouvés" */
export function countAnimals(count) {
  return count > 1 ? `${count} animaux trouvés` : `${count} animal trouvé`;
}

export const LOGEMENT_LABELS = {
  appartement: 'Appartement',
  maison_sans_jardin: 'Maison sans jardin',
  maison_avec_jardin: 'Maison avec jardin',
};

export const TEMPS_LABELS = {
  faible: 'Peu de temps (moins d\'1 h par jour)',
  moyen: 'Un peu de temps (1 à 2 h par jour)',
  eleve: 'Beaucoup de temps (plus de 2 h par jour)',
};

export const STATUT_DEMANDE_LABELS = {
  recue: 'Reçue',
  en_etude: 'En cours d\'étude',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  annulee: 'Annulée',
};

export const CRITERE_LABELS = {
  enfants: 'Enfants',
  autres_animaux: 'Vos animaux',
  logement: 'Logement',
  temps: 'Temps disponible',
};

/**
 * Level of a compatibility score, for its colour and its text.
 * @param {number} score - 0 to 100
 * @returns {{ niveau: 'high'|'medium'|'low', libelle: string }}
 */
export function matchLevel(score) {
  if (score >= 80) return { niveau: 'high', libelle: 'Coup de foudre' };
  if (score >= 50) return { niveau: 'medium', libelle: 'Belle affinité' };
  return { niveau: 'low', libelle: 'Peu compatible' };
}
