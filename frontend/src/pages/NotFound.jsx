// ============================================================
// pages/NotFound.jsx - 404 page, for every unknown address
// ============================================================

import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page introuvable');

  return (
    <div className="not-found">
      <div className="container text-center">
        <div className="not-found__code" aria-hidden="true">404</div>
        <h1 className="h2 mt-3 mb-3">Page introuvable</h1>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: '500px' }}>
          Cette page s'est cachée comme un chat sous un lit… Elle n'existe pas ou a été déplacée.
        </p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Link to="/" className="btn btn-primary btn-lg">Retour à l'accueil</Link>
          <Link to="/animaux" className="btn btn-outline-primary btn-lg">Voir les animaux</Link>
        </div>
      </div>
    </div>
  );
}
