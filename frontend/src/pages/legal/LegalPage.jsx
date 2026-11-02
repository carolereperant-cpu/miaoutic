// ============================================================
// pages/legal/LegalPage.jsx - common layout of the legal pages
// ============================================================

import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function LegalPage({ titre, miseAJour, children }) {
  useDocumentTitle(titre);

  return (
    <div className="container section">
      <article className="legal">
        <h1 className="section-title mb-2">{titre}</h1>
        <p className="text-muted small">Dernière mise à jour : {miseAJour}</p>
        <div className="alert alert-warning small" role="note">
          Miaoutic est un projet réalisé dans le cadre d'une formation : l'association et ses coordonnées sont fictives.
        </div>
        {children}
      </article>
    </div>
  );
}
