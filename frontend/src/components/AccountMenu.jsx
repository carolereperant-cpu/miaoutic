// ============================================================
// components/AccountMenu.jsx
// "Léa ▾" menu of the header, with the links of the user's space.
// Accessible: aria-expanded on the button, closes with the Escape
// key or a click outside, focus goes back to the button.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LINKS = {
  adoptant: [
    { to: '/mes-matchs', label: 'Mes matchs' },
    { to: '/mes-demandes', label: 'Mes demandes' },
    { to: '/mon-questionnaire', label: 'Mon questionnaire' },
  ],
  refuge: [
    { to: '/refuge', label: 'Tableau de bord' },
    { to: '/refuge/demandes', label: 'Demandes d\'adoption' },
    { to: '/refuge/animaux/nouveau', label: 'Ajouter un animal' },
  ],
};

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on a click outside the menu or on the Escape key
  useEffect(() => {
    if (!open) return undefined;

    const onClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-outline-primary dropdown-toggle"
        aria-expanded={open}
        aria-controls="menu-compte"
        onClick={() => setOpen((value) => !value)}
      >
        {user.prenom}
        <span className="visually-hidden"> : menu de mon compte</span>
      </button>

      <ul id="menu-compte" className={`dropdown-menu ${open ? 'show' : ''}`}>
        {(LINKS[user.role] ?? []).map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="dropdown-item" onClick={() => setOpen(false)}>{link.label}</Link>
          </li>
        ))}
        {LINKS[user.role]?.length > 0 && <li><hr className="dropdown-divider" /></li>}
        <li>
          <button type="button" className="dropdown-item" data-close-menu onClick={handleLogout}>Déconnexion</button>
        </li>
      </ul>
    </div>
  );
}
