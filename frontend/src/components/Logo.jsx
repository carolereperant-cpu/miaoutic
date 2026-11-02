// ============================================================
// components/Logo.jsx
// Text logo (like "Trouve ton artisan") with a small cat-heart
// icon. Real text instead of an image: readable by screen
// readers and search engines, sharp at every size, lighter.
// ============================================================

import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    // The name read by screen readers starts with the visible text
    // (WCAG 2.5.3 "label in name"), then says where the link goes
    <Link to="/" className="logo">
      <svg className="logo__icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#B5502F" d="M9 19 11 4l10 9zM39 19 37 4 27 13z" />
        <path
          fill="#B5502F"
          d="M24 43C11 34 4 27 4 19 4 12 9 8 15 8c4 0 7 2 9 5 2-3 5-5 9-5 6 0 11 4 11 11 0 8-7 15-20 24z"
        />
        <circle cx="17.5" cy="20" r="2.5" fill="#FBF6EF" />
        <circle cx="30.5" cy="20" r="2.5" fill="#FBF6EF" />
        <path fill="#FBF6EF" d="M22 26h4l-2 2.5z" />
      </svg>
      <span>
        <span className="logo__name">Miaoutic</span>
        <span className="logo__tagline">Rencontres entre pattes et cœurs</span>
      </span>
      <span className="visually-hidden"> - retour à l'accueil</span>
    </Link>
  );
}
