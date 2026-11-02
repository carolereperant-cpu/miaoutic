// ============================================================
// components/MatchBadge.jsx - "92 % · Coup de foudre"
// The level is written in words, not only shown by a colour.
// ============================================================

import { matchLevel } from '../utils/format';

/**
 * @param {{ score: number, withScore?: boolean }} props
 *   withScore: false when the score is already written next to it
 */
export default function MatchBadge({ score, withScore = true }) {
  const { niveau, libelle } = matchLevel(score);
  return (
    <span className={`match-badge match-badge--${niveau}`}>
      {withScore ? `${score} % · ${libelle}` : libelle}
    </span>
  );
}
