// ============================================================
// components/StatusBadge.jsx - "Disponible" / "Réservé" / "Adopté"
// The status is written in words, not only shown by a colour
// (accessibility: colour must never be the only information).
// ============================================================

import { STATUT_ANIMAL_LABELS } from '../utils/format';

export default function StatusBadge({ statut }) {
  return (
    <span className={`status-badge status-badge--${statut}`}>
      {STATUT_ANIMAL_LABELS[statut] ?? statut}
    </span>
  );
}
