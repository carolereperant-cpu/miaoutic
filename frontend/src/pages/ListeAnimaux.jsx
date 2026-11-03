// ============================================================
// pages/ListeAnimaux.jsx
// List of the animals:
//   /animaux                 every animal
//   /animaux/chats           one species (the slug of its name)
//   /animaux?nom=bis         search by name (from the header)
//   ...&taille=petit         size filter
// ============================================================

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import AnimalCard from '../components/AnimalCard';
import { Loader, ErrorAlert } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getEspeces } from '../services/api';
import { slugify, countAnimals, TAILLE_LABELS } from '../utils/format';

export default function ListeAnimaux() {
  const { espece: especeSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const nom = searchParams.get('nom') ?? '';
  const taille = searchParams.get('taille') ?? '';

  // Species list, to find the id behind the slug of the URL
  const [especes, setEspeces] = useState(null);
  const [especesError, setEspecesError] = useState(null);
  useEffect(() => {
    getEspeces().then(setEspeces).catch(setEspecesError);
  }, []);

  const espece = especeSlug && especes
    ? especes.find((item) => slugify(item.nom_espece) === especeSlug) ?? null
    : null;
  const unknownSpecies = Boolean(especeSlug && especes && !espece);

  // Query sent to the API (null = wait for the species list)
  let path = null;
  if (!especeSlug || espece) {
    const params = new URLSearchParams();
    if (espece) params.set('espece', espece.id_espece);
    if (nom) params.set('nom', nom);
    if (taille) params.set('taille', taille);
    const query = params.toString();
    path = `/animaux${query ? `?${query}` : ''}`;
  }
  const { data: animaux, loading, error } = useApi(unknownSpecies ? null : path);

  let titre = 'Tous nos animaux';
  if (nom) titre = `Résultats pour « ${nom} »`;
  else if (espece) titre = `Nos ${espece.nom_espece.toLowerCase()}`;
  else if (unknownSpecies) titre = 'Espèce introuvable';
  useDocumentTitle(titre, {
    description: espece
      ? `Les ${espece.nom_espece.toLowerCase()} du refuge Les Pattes Unies attendent leur famille : âge, caractère, `
        + 'santé et % de match avec votre mode de vie.'
      : 'Tous les animaux du refuge Les Pattes Unies à adopter : chiens, chats, lapins et rongeurs, '
        + 'avec leur caractère et leur santé.',
    // Search results and unknown species: nothing useful to index
    noindex: Boolean(nom) || unknownSpecies,
  });

  const changeTaille = (event) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set('taille', event.target.value);
    else next.delete('taille');
    setSearchParams(next);
  };

  return (
    <>
      <section className="hero" aria-labelledby="titre-liste">
        <div className="container">
          <h1 id="titre-liste" className="hero__title">{titre}</h1>
          {!nom && (
            <p className="hero__subtitle mb-0">Ils n'attendent qu'une chose : rencontrer leur famille.</p>
          )}
        </div>
      </section>

      <section className="section pt-0" aria-label="Liste des animaux">
        <div className="container">
          {unknownSpecies && (
            <div className="text-center py-5">
              <p className="fs-5">Cette espèce n'existe pas sur Miaoutic.</p>
              <Link to="/animaux" className="btn btn-primary">Voir tous les animaux</Link>
            </div>
          )}

          {!unknownSpecies && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <p className="text-muted mb-0" aria-live="polite">
                  {animaux ? countAnimals(animaux.length) : ' '}
                </p>
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="filtre-taille" className="form-label mb-0 fw-semibold">Taille</label>
                  <select id="filtre-taille" className="form-select" value={taille} onChange={changeTaille}>
                    <option value="">Toutes</option>
                    {Object.entries(TAILLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(loading || (!especes && especeSlug && !especesError)) && <Loader />}
              <ErrorAlert error={error ?? especesError} />

              {animaux && animaux.length === 0 && (
                <p className="text-center fs-5 text-muted py-5">
                  Aucun animal ne correspond à votre recherche pour le moment.
                </p>
              )}

              {animaux && animaux.length > 0 && (
                <div className="row g-4">
                  {animaux.map((animal) => (
                    <div key={animal.id_animal} className="col-12 col-md-6 col-lg-4">
                      <AnimalCard animal={animal} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
