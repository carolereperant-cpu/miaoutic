// ============================================================
// components/Header.jsx
// Header shown on every page: logo, menu by species (loaded from
// the API), search by name, and the account area.
// ============================================================

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import AccountMenu from './AccountMenu';
import { getEspeces } from '../services/api';
import { slugify } from '../utils/format';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [especes, setEspeces] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Species of the menu, loaded once from the API
  useEffect(() => {
    getEspeces()
      .then(setEspeces)
      .catch(() => setEspeces([])); // the menu stays usable without species
  }, []);

  const handleSearch = (event) => {
    event.preventDefault(); // no page reload
    const nom = recherche.trim();
    if (nom) {
      navigate(`/animaux?nom=${encodeURIComponent(nom)}`);
      setRecherche('');
      setMenuOpen(false);
    }
  };

  // Close the mobile menu when a link (or the logout button) inside it is clicked
  const closeOnLinkClick = (event) => {
    if (event.target.closest('a, [data-close-menu]')) setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar navbar-expand-lg p-0" aria-label="Navigation principale">
          <Logo />

          {/* Mobile menu button: aria-expanded tells screen readers if it is open */}
          <button
            type="button"
            className="header__toggler navbar-toggler"
            aria-controls="menu-principal"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Fermer' : 'Menu'}
          </button>

          <div
            id="menu-principal"
            className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}
            onClick={closeOnLinkClick}
          >
            <ul className="navbar-nav mx-auto gap-1 py-3 py-lg-0">
              <li className="nav-item">
                <NavLink to="/animaux" end className="header__nav-link">Tous</NavLink>
              </li>
              {especes.map((espece) => (
                <li key={espece.id_espece} className="nav-item">
                  <NavLink to={`/animaux/${slugify(espece.nom_espece)}`} className="header__nav-link">
                    {espece.nom_espece}
                  </NavLink>
                </li>
              ))}
            </ul>

            <form onSubmit={handleSearch} className="d-flex align-items-center gap-2 mb-3 mb-lg-0" role="search">
              <label htmlFor="recherche" className="visually-hidden">Rechercher un animal par son nom</label>
              <input
                id="recherche"
                type="search"
                className="header__search form-control"
                placeholder="Rechercher un animal…"
                value={recherche}
                maxLength={50}
                onChange={(event) => setRecherche(event.target.value)}
              />
              <button type="submit" className="btn btn-primary">Chercher</button>
            </form>

            <div className="ms-lg-3 d-flex align-items-center gap-2 flex-wrap">
              {user ? (
                <AccountMenu />
              ) : (
                <Link to="/connexion" className="btn btn-outline-primary">Connexion</Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
