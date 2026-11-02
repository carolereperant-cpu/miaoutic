// ============================================================
// components/AdopterPanel.jsx
// Adoption panel for a logged-in adopter, on an available animal:
//   1. no questionnaire yet      -> invitation to fill it in
//   2. request already in progress -> its status
//   3. otherwise                  -> % of match + "Je craque !" form
// ============================================================

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CompatibilityDetails from './CompatibilityDetails';
import { Loader, ErrorAlert } from './Feedback';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { fieldErrors } from '../utils/formErrors';
import { STATUT_DEMANDE_LABELS } from '../utils/format';

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;
const ACTIVE_STATUSES = ['recue', 'en_etude'];

export default function AdopterPanel({ animal }) {
  const location = useLocation();
  const compatibilite = useApi(`/profil/compatibilite/${animal.id_animal}`);
  const demandes = useApi('/demandes/mes-demandes');

  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);

  if (compatibilite.loading || demandes.loading) {
    return <Loader label="Calcul de votre compatibilité…" />;
  }

  // 409 = the questionnaire was never filled in
  if (compatibilite.error?.status === 409) {
    return (
      <>
        <p>Remplissez votre questionnaire pour découvrir votre <strong>% de match</strong> avec {animal.nom}.</p>
        <Link to="/mon-questionnaire" state={{ from: location.pathname }} className="btn btn-primary">
          Remplir mon questionnaire
        </Link>
      </>
    );
  }

  if (compatibilite.error || demandes.error) {
    return <ErrorAlert error={compatibilite.error ?? demandes.error} />;
  }

  const demandeEnCours = demandes.data.find(
    (demande) => demande.id_animal === animal.id_animal && ACTIVE_STATUSES.includes(demande.statut),
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSendError(null);

    const texte = message.trim();
    if (texte.length < MESSAGE_MIN) {
      setMessageError(`Votre message doit contenir au moins ${MESSAGE_MIN} caractères.`);
      document.getElementById('message-demande')?.focus();
      return;
    }
    setMessageError(null);

    setSending(true);
    try {
      await api.post('/demandes', { idAnimal: animal.id_animal, message: texte });
      setMessage('');
      demandes.reload(); // the panel now shows the request in progress
    } catch (error) {
      setMessageError(fieldErrors(error).message ?? null);
      setSendError(error.erreurs?.length ? null : error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <CompatibilityDetails compatibilite={compatibilite.data} />

      {demandeEnCours ? (
        <div className="alert alert-success mb-0" role="status">
          <p className="mb-2">
            Votre demande pour {animal.nom} est envoyée : <strong>{STATUT_DEMANDE_LABELS[demandeEnCours.statut]}</strong>.
            Le refuge vous répond sous 48 h.
          </p>
          <Link to="/mes-demandes" className="alert-link">Suivre mes demandes</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <ErrorAlert error={sendError} />
          <label htmlFor="message-demande" className="form-label fw-semibold">
            Votre message au refuge
          </label>
          <textarea
            id="message-demande"
            className={`form-control ${messageError ? 'is-invalid' : ''}`}
            rows={5}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={`Présentez-vous et dites pourquoi ${animal.nom} serait bien chez vous.`}
            aria-invalid={messageError ? 'true' : undefined}
            aria-describedby={`compteur-message${messageError ? ' erreur-message' : ''}`}
            required
          />
          <div id="compteur-message" className="form-text">
            {message.length} / {MESSAGE_MAX} caractères (minimum {MESSAGE_MIN})
          </div>
          {messageError && <div id="erreur-message" className="invalid-feedback d-block">{messageError}</div>}

          <button type="submit" className="btn btn-primary btn-lg w-100 mt-3" disabled={sending}>
            {sending ? 'Envoi…' : 'Je craque !'}
          </button>
        </form>
      )}
    </>
  );
}
