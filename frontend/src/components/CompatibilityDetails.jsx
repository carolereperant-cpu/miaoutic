// ============================================================
// components/CompatibilityDetails.jsx
// Score of the adopter with one animal, and the detail of the 4
// criteria (computed by the API).
// ============================================================

import MatchBadge from './MatchBadge';
import { CRITERE_LABELS } from '../utils/format';

export default function CompatibilityDetails({ compatibilite }) {
  const { score, plafonne, criteres } = compatibilite;

  return (
    <>
      <div className="match-score">
        <span className="match-score__value">{score} %</span>
        <MatchBadge score={score} withScore={false} />
      </div>

      {plafonne && (
        <div className="alert alert-warning small" role="note">
          Score limité à 30 % : une incompatibilité concerne votre foyer. Parlez-en avec le refuge avant de vous lancer.
        </div>
      )}

      <ul className="criteria" aria-label="Détail du score">
        {criteres.map((critere) => (
          <li key={critere.critere} className="d-flex justify-content-between gap-3">
            <span>
              <strong>{CRITERE_LABELS[critere.critere]}</strong> : {critere.detail}
            </span>
            <span className="criteria__points">
              {critere.points} / {critere.max}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
