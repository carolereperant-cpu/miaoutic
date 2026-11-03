// ============================================================
// pages/refuge/DemandesRefuge.jsx
// Adoption requests received by the shelter.
// The shelter studies a request, then accepts or refuses it.
// Accepting = the animal is adopted and the other requests for
// this animal are refused (the API does it in one transaction).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MatchBadge from '../../components/MatchBadge';
import ConfirmAction from '../../components/ConfirmAction';
import { Loader, ErrorAlert } from '../../components/Feedback';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { api } from '../../services/api';
import { STATUT_DEMANDE_LABELS, formatDate } from '../../utils/format';

const ACTIVE_STATUSES = ['recue', 'en_etude'];

/** Message shown after a change of status */
function successMessage(demande, statut, autresDemandesRefusees) {
  if (statut === 'en_etude') return `La demande de ${demande.prenom} ${demande.nom} est passée en étude.`;
  if (statut === 'refusee') return `La demande de ${demande.prenom} ${demande.nom} est refusée.`;
  const autres = autresDemandesRefusees === 0
    ? ''
    : ` ${autresDemandesRefusees} autre${autresDemandesRefusees > 1 ? 's demandes refusées' : ' demande refusée'} automatiquement.`;
  return `Adoption de ${demande.nom_animal} validée : c'est un match avec ${demande.prenom} !${autres}`;
}

function DemandeCard({ demande, onChange }) {
  const changeStatut = (statut) => onChange(demande, statut);
  const isActive = ACTIVE_STATUSES.includes(demande.statut);
  const adoptant = `${demande.prenom} ${demande.nom}`;

  return (
    <li className="request-card mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 className="h5 mb-1">
            {adoptant} <span className="fw-normal">pour</span>{' '}
            <Link to={`/animal/${demande.id_animal}`}>{demande.nom_animal}</Link>
          </h2>
          <p className="small text-muted mb-2">
            Reçue le {formatDate(demande.date_creation)} ·{' '}
            <a href={`mailto:${demande.email}`}>{demande.email}</a>
          </p>
          <MatchBadge score={demande.score_compatibilite} />
        </div>
        <span className={`request-badge request-badge--${demande.statut}`}>
          {STATUT_DEMANDE_LABELS[demande.statut]}
        </span>
      </div>

      {demande.message && (
        <blockquote className="request-message mt-3 mb-0">
          <p className="visually-hidden">Message de {adoptant} :</p>
          {demande.message}
        </blockquote>
      )}

      {isActive && (
        <div className="d-flex flex-wrap gap-2 mt-3">
          {demande.statut === 'recue' && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => changeStatut('en_etude')}>
              Passer en étude{' '}<span className="visually-hidden">la demande de {adoptant}</span>
            </button>
          )}
          <ConfirmAction
            label="Accepter"
            hiddenLabel={`la demande de ${adoptant}`}
            question={`Confier ${demande.nom_animal} à ${demande.prenom} ? Les autres demandes pour ${demande.nom_animal} seront refusées.`}
            confirmLabel="Oui, accepter"
            buttonClass="btn-primary"
            confirmClass="btn-primary"
            onConfirm={() => changeStatut('acceptee')}
          />
          <ConfirmAction
            label="Refuser"
            hiddenLabel={`la demande de ${adoptant}`}
            question={`Refuser la demande de ${adoptant} ?`}
            confirmLabel="Oui, refuser"
            buttonClass="btn-outline-danger"
            confirmClass="btn-danger"
            onConfirm={() => changeStatut('refusee')}
          />
        </div>
      )}
    </li>
  );
}

export default function DemandesRefuge() {
  useDocumentTitle('Demandes d\'adoption', { noindex: true });
  const [statut, setStatut] = useState('');
  const { data: demandes, loading, error, reload } = useApi(statut ? `/demandes?statut=${statut}` : '/demandes');

  const [message, setMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const messageRef = useRef(null);

  // The list is reloaded after an action: the focus goes to the message
  useEffect(() => {
    if (message || actionError) messageRef.current?.focus();
  }, [message, actionError]);

  const handleChange = async (demande, nouveauStatut) => {
    setMessage(null);
    setActionError(null);
    try {
      const result = await api.patch(`/demandes/${demande.id_demande}/statut`, { statut: nouveauStatut });
      setMessage(successMessage(demande, nouveauStatut, result.autresDemandesRefusees));
      reload();
    } catch (apiError) {
      setActionError(apiError);
      reload();
    }
  };

  return (
    <div className="container section">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="section-title mb-0">Demandes d'adoption</h1>
        <Link to="/refuge" className="btn btn-outline-primary">Les animaux du refuge</Link>
      </div>

      <div ref={messageRef} tabIndex={-1} className="focus-target">
        {message && <div className="alert alert-success" role="status">{message}</div>}
        <ErrorAlert error={actionError} />
      </div>

      <div className="mb-3" style={{ maxWidth: '280px' }}>
        <label htmlFor="filtre-statut-demande" className="form-label fw-semibold mb-1">Statut</label>
        <select id="filtre-statut-demande" className="form-select" value={statut} onChange={(event) => setStatut(event.target.value)}>
          <option value="">Toutes les demandes</option>
          {Object.entries(STATUT_DEMANDE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading && <Loader />}
      <ErrorAlert error={error} />

      {demandes && (
        <p className="text-muted" aria-live="polite">
          {demandes.length === 0 ? 'Aucune demande.' : `${demandes.length} demande${demandes.length > 1 ? 's' : ''}`}
        </p>
      )}

      {demandes && demandes.length > 0 && (
        <ul className="list-unstyled" style={{ maxWidth: '820px' }}>
          {demandes.map((demande) => (
            <DemandeCard key={demande.id_demande} demande={demande} onChange={handleChange} />
          ))}
        </ul>
      )}
    </div>
  );
}
