// ============================================================
// components/AnimalCard.jsx
// Reusable animal card, used on the home page, on the list and
// on "Mes matchs" (same layout as the craftsman card of
// "Trouve ton artisan").
// ============================================================

import { Link } from 'react-router-dom';
import AnimalAvatar from './AnimalAvatar';
import StatusBadge from './StatusBadge';
import MatchBadge from './MatchBadge';
import { SEXE_LABELS } from '../utils/format';

/**
 * @param {{ animal: object, score?: number }} props
 *   score: when given ("Mes matchs"), shown instead of the status
 */
export default function AnimalCard({ animal, score }) {
  return (
    <Link to={`/animal/${animal.id_animal}`} className="animal-card p-3">
      <div className="d-flex align-items-center gap-3 mb-3">
        <AnimalAvatar animal={animal} />
        <div>
          <h3 className="animal-card__name mb-1">{animal.nom}</h3>
          <p className="animal-card__race mb-0">{animal.nom_race}</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <span className="animal-card__meta">
          {animal.age?.libelle} · {SEXE_LABELS[animal.sexe] ?? animal.sexe}
        </span>
        {score === undefined ? <StatusBadge statut={animal.statut} /> : <MatchBadge score={score} />}
      </div>
    </Link>
  );
}
