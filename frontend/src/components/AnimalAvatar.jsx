// ============================================================
// components/AnimalAvatar.jsx
// Round photo of an animal, or the emoji of its species when the
// shelter has not added a photo yet.
// ============================================================

import { speciesEmoji } from '../utils/format';

export default function AnimalAvatar({ animal, large = false }) {
  const className = `avatar ${large ? 'avatar--large' : ''}`;

  if (animal.photo) {
    return (
      <img
        src={animal.photo}
        alt={`Photo de ${animal.nom}`}
        className={className}
        loading="lazy" // eco-design: loaded only when visible
        width={large ? 120 : 80}
        height={large ? 120 : 80}
      />
    );
  }

  // Decorative: the name of the animal is already written next to it
  return (
    <div className={className} aria-hidden="true">
      {speciesEmoji(animal.nom_espece)}
    </div>
  );
}
