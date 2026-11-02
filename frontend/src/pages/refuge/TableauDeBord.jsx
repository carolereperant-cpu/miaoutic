// ============================================================
// pages/refuge/TableauDeBord.jsx
// Shelter dashboard: every animal (adopted ones included), with
// its status and its requests in progress.
// Actions: edit, reserve / make available again, delete.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import ConfirmAction from '../../components/ConfirmAction';
import { Loader, ErrorAlert } from '../../components/Feedback';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { api } from '../../services/api';
import { STATUT_ANIMAL_LABELS, countAnimals } from '../../utils/format';

export default function TableauDeBord() {
  useDocumentTitle('Espace refuge');
  const location = useLocation();
  const { data: animaux, loading, error, reload } = useApi('/animaux/gestion');

  const [statut, setStatut] = useState('');
  const [recherche, setRecherche] = useState('');
  // Message after an action (or sent by the form page)
  const [message, setMessage] = useState(location.state?.message ?? null);
  const [actionError, setActionError] = useState(null);
  const messageRef = useRef(null);

  // The table is reloaded after an action: the focus goes to the message
  // (the message sent by the form page is focused too)
  useEffect(() => {
    if (message || actionError) messageRef.current?.focus();
  }, [message, actionError]);

  const run = async (action, successMessage) => {
    setActionError(null);
    setMessage(null);
    try {
      await action();
      setMessage(successMessage);
      reload();
    } catch (apiError) {
      setActionError(apiError);
    }
  };

  const visibles = (animaux ?? []).filter((animal) => (
    (!statut || animal.statut === statut)
    && animal.nom.toLowerCase().includes(recherche.trim().toLowerCase())
  ));

  return (
    <div className="container section">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="section-title mb-0">Les animaux du refuge</h1>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/refuge/demandes" className="btn btn-outline-primary">Demandes d'adoption</Link>
          <Link to="/refuge/animaux/nouveau" className="btn btn-primary">Ajouter un animal</Link>
        </div>
      </div>

      <div ref={messageRef} tabIndex={-1} className="focus-target">
        {message && <div className="alert alert-success" role="status">{message}</div>}
        <ErrorAlert error={actionError} />
      </div>

      <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
        <div>
          <label htmlFor="filtre-statut" className="form-label fw-semibold mb-1">Statut</label>
          <select id="filtre-statut" className="form-select" value={statut} onChange={(event) => setStatut(event.target.value)}>
            <option value="">Tous</option>
            {Object.entries(STATUT_ANIMAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtre-nom" className="form-label fw-semibold mb-1">Filtrer par nom</label>
          <input id="filtre-nom" type="search" className="form-control" value={recherche}
            onChange={(event) => setRecherche(event.target.value)} maxLength={50} />
        </div>
        {animaux && <p className="text-muted mb-2" aria-live="polite">{countAnimals(visibles.length)}</p>}
      </div>

      {loading && <Loader />}
      <ErrorAlert error={error} />

      {animaux && (
        // On a phone the table scrolls sideways: the box can receive the
        // focus so that it can also be scrolled with the keyboard arrows
        <div className="table-responsive" role="region" aria-labelledby="titre-tableau" tabIndex={0}>
          <table className="table align-middle refuge-table">
            <caption id="titre-tableau" className="visually-hidden">Animaux du refuge, avec leur statut et les actions possibles</caption>
            <thead>
              <tr>
                <th scope="col">Animal</th>
                <th scope="col">Âge</th>
                <th scope="col">Statut</th>
                <th scope="col">Demandes en cours</th>
                <th scope="col">Coup de cœur</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((animal) => (
                <tr key={animal.id_animal}>
                  <td>
                    <Link to={`/animal/${animal.id_animal}`} className="fw-bold">{animal.nom}</Link>
                    <div className="small text-muted">{animal.nom_espece} · {animal.nom_race}</div>
                  </td>
                  <td className="text-nowrap">{animal.age.libelle}</td>
                  <td><StatusBadge statut={animal.statut} /></td>
                  <td>
                    {animal.nb_demandes_actives > 0
                      ? <Link to="/refuge/demandes">{animal.nb_demandes_actives}</Link>
                      : 0}
                  </td>
                  <td>{animal.coup_de_coeur ? 'Oui' : 'Non'}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <Link to={`/refuge/animaux/${animal.id_animal}/modifier`} className="btn btn-sm btn-outline-primary">
                        Modifier{' '}<span className="visually-hidden">{animal.nom}</span>
                      </Link>

                      {animal.statut === 'disponible' && (
                        <button type="button" className="btn btn-sm btn-outline-secondary"
                          onClick={() => run(() => api.patch(`/animaux/${animal.id_animal}/statut`, { statut: 'reserve' }), `${animal.nom} est réservé.`)}>
                          Réserver{' '}<span className="visually-hidden">{animal.nom}</span>
                        </button>
                      )}
                      {animal.statut === 'reserve' && (
                        <button type="button" className="btn btn-sm btn-outline-secondary"
                          onClick={() => run(() => api.patch(`/animaux/${animal.id_animal}/statut`, { statut: 'disponible' }), `${animal.nom} est de nouveau disponible.`)}>
                          Rendre disponible{' '}<span className="visually-hidden">{animal.nom}</span>
                        </button>
                      )}

                      <ConfirmAction
                        label="Supprimer"
                        hiddenLabel={animal.nom}
                        question={`Supprimer ${animal.nom} ?`}
                        confirmLabel="Oui, supprimer"
                        buttonClass="btn-outline-danger"
                        confirmClass="btn-danger"
                        onConfirm={() => run(() => api.delete(`/animaux/${animal.id_animal}`), `${animal.nom} a été supprimé.`)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
