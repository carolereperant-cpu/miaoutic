// ============================================================
// pages/MesDemandes.jsx
// Adoption requests of the adopter, with their status.
// A request in progress can be cancelled (after confirmation).
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import MatchBadge from '../components/MatchBadge';
import { Loader, ErrorAlert } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../services/api';
import { STATUT_DEMANDE_LABELS, formatDate } from '../utils/format';

const ACTIVE_STATUSES = ['recue', 'en_etude'];

function DemandeItem({ demande, onCancelled }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const cancel = async () => {
    setSending(true);
    setError(null);
    try {
      await api.patch(`/demandes/${demande.id_demande}/annulation`);
      onCancelled();
    } catch (apiError) {
      setError(apiError);
      setSending(false);
    }
  };

  return (
    <li className="request-card mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 className="h5 mb-1">
            <Link to={`/animal/${demande.id_animal}`}>{demande.nom_animal}</Link>
          </h2>
          <p className="small text-muted mb-2">Envoyée le {formatDate(demande.date_creation)}</p>
          <MatchBadge score={demande.score_compatibilite} />
        </div>
        <span className={`request-badge request-badge--${demande.statut}`}>
          {STATUT_DEMANDE_LABELS[demande.statut]}
        </span>
      </div>

      {demande.statut === 'acceptee' && (
        <p className="mt-3 mb-0 trait-yes">C'est un match ! Le refuge va vous contacter pour organiser l'arrivée de {demande.nom_animal}.</p>
      )}

      <ErrorAlert error={error} />

      {ACTIVE_STATUSES.includes(demande.statut) && (
        <div className="mt-3">
          {confirming ? (
            <div className="d-flex flex-wrap align-items-center gap-2" role="group" aria-label="Confirmer l'annulation">
              <span>Annuler votre demande pour {demande.nom_animal} ?</span>
              <button type="button" className="btn btn-sm btn-danger" onClick={cancel} disabled={sending}>
                Oui, annuler
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirming(false)} disabled={sending}>
                Non
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setConfirming(true)}>
              Annuler la demande
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function MesDemandes() {
  useDocumentTitle('Mes demandes');
  const { data: demandes, loading, error, reload } = useApi('/demandes/mes-demandes');

  return (
    <div className="container section">
      <h1 className="section-title">Mes demandes d'adoption</h1>

      {loading && <Loader />}
      <ErrorAlert error={error} />

      {demandes && demandes.length === 0 && (
        <div className="text-center py-5">
          <p className="fs-5">Vous n'avez pas encore craqué pour un animal.</p>
          <Link to="/mes-matchs" className="btn btn-primary btn-lg">Voir mes matchs</Link>
        </div>
      )}

      {demandes && demandes.length > 0 && (
        <ul className="list-unstyled" style={{ maxWidth: '820px' }}>
          {demandes.map((demande) => (
            <DemandeItem key={demande.id_demande} demande={demande} onCancelled={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}
