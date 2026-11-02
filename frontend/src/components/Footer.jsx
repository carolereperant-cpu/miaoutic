// ============================================================
// components/Footer.jsx - footer shown on every page
// ============================================================

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <h2 className="footer__title h5">Miaoutic</h2>
            <p className="footer__text">
              Le site de rencontre entre les animaux du refuge Les Pattes Unies
              et leur future famille.
            </p>
          </div>

          <div className="col-12 col-md-4">
            <h2 className="footer__title h5">Informations légales</h2>
            <nav aria-label="Liens légaux">
              <Link to="/mentions-legales" className="footer__link">Mentions légales</Link>
              <Link to="/donnees-personnelles" className="footer__link">Données personnelles</Link>
              <Link to="/accessibilite" className="footer__link">Accessibilité</Link>
              <Link to="/cookies" className="footer__link">Cookies</Link>
            </nav>
          </div>

          <div className="col-12 col-md-4">
            <h2 className="footer__title h5">Contact</h2>
            <address className="footer__text fst-normal mb-0">
              Refuge Les Pattes Unies<br />
              12 chemin des Tilleuls<br />
              95000 Cergy<br />
              <a href="tel:+33100000000" className="footer__link d-inline">01 00 00 00 00</a><br />
              <a href="mailto:contact@miaoutic.test" className="footer__link d-inline">contact@miaoutic.test</a>
            </address>
          </div>
        </div>

        <hr className="border-light opacity-25 mt-4" />
        <p className="text-center footer__text mb-0 small">
          © {new Date().getFullYear()} Miaoutic - Projet de formation, association fictive
        </p>
      </div>
    </footer>
  );
}
