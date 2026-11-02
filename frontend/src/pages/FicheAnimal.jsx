// ============================================================
// pages/FicheAnimal.jsx
// Sheet of one animal (same layout as the craftsman sheet of
// "Trouve ton artisan"): banner, then 2 columns
//   left:  story, personality, health
//   right: adoption panel
// ============================================================

import { Link, useParams } from 'react-router-dom';
import AnimalAvatar from '../components/AnimalAvatar';
import StatusBadge from '../components/StatusBadge';
import AdoptionPanel from '../components/AdoptionPanel';
import { Loader, ErrorAlert } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  SEXE_LABELS, TAILLE_LABELS, ENERGIE_LABELS, IDENTIFICATION_LABELS, formatDate,
} from '../utils/format';

/** "Oui" / "Non" written in words and coloured */
function YesNo({ value, yes = 'Oui', no = 'Non' }) {
  return <span className={value ? 'trait-yes' : 'trait-no'}>{value ? yes : no}</span>;
}

export default function FicheAnimal() {
  const { id } = useParams();
  const { data: animal, loading, error } = useApi(`/animaux/${encodeURIComponent(id)}`);
  useDocumentTitle(animal ? `${animal.nom}, ${animal.nom_race.toLowerCase()}` : 'Fiche animal');

  if (loading) {
    return <div className="container section"><Loader /></div>;
  }

  if (error) {
    const notFound = error.status === 404 || error.status === 400;
    return (
      <div className="container section">
        <h1 className="section-title">{notFound ? 'Animal introuvable' : 'Fiche indisponible'}</h1>
        <ErrorAlert>{notFound ? 'Cet animal n\'existe pas ou n\'est plus présenté sur Miaoutic.' : error.message}</ErrorAlert>
        <Link to="/animaux" className="btn btn-primary">Voir tous les animaux</Link>
      </div>
    );
  }

  return (
    <>
      <section className="hero" aria-labelledby="titre-fiche">
        <div className="container">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <AnimalAvatar animal={animal} large />
            <div>
              <h1 id="titre-fiche" className="hero__title mb-1">{animal.nom}</h1>
              <p className="hero__subtitle mb-2">
                {animal.nom_race} · {animal.nom_espece} · {SEXE_LABELS[animal.sexe]} · {animal.age.libelle}
              </p>
              <StatusBadge statut={animal.statut} />
            </div>
          </div>
        </div>
      </section>

      <div className="container pb-5">
        {/* Wide gaps only on large screens: on a phone they would overflow */}
        <div className="row g-4 g-lg-5">
          <div className="col-12 col-lg-7">
            <section className="sheet-block" aria-labelledby="titre-histoire">
              <h2 id="titre-histoire" className="h4">Son histoire</h2>
              <p className="mb-0 lh-lg">{animal.description}</p>
            </section>

            <section className="sheet-block" aria-labelledby="titre-caractere">
              <h2 id="titre-caractere" className="h4">Son caractère</h2>
              <ul className="trait-list">
                <li>Énergie : <strong>{ENERGIE_LABELS[animal.energie]}</strong></li>
                <li>Taille : <strong>{TAILLE_LABELS[animal.taille]}</strong></li>
                <li>S'entend avec les enfants : <YesNo value={animal.ok_enfants} /></li>
                <li>S'entend avec les chiens : <YesNo value={animal.ok_chiens} /></li>
                <li>S'entend avec les chats : <YesNo value={animal.ok_chats} /></li>
                <li>
                  A besoin d'un jardin :{' '}
                  <strong>{animal.besoin_jardin ? 'Oui' : 'Non'}</strong>
                </li>
              </ul>
            </section>

            <section className="sheet-block" aria-labelledby="titre-sante">
              <h2 id="titre-sante" className="h4">Sa santé</h2>
              <ul className="trait-list">
                <li>Stérilisé : <strong>{animal.sterilise ? 'Oui' : 'Non'}</strong></li>
                <li>Identification : <strong>{IDENTIFICATION_LABELS[animal.identification]}</strong></li>
                <li>
                  Vaccinations :{' '}
                  {animal.vaccinations.length === 0 ? (
                    <strong>aucune</strong>
                  ) : (
                    <ul className="mt-1 mb-0">
                      {animal.vaccinations.map((vaccination) => (
                        <li key={`${vaccination.nom_vaccin}-${vaccination.date_vaccination}`} className="border-0 py-0">
                          {vaccination.nom_vaccin} le {formatDate(vaccination.date_vaccination)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                {animal.remarques_sante && <li>À savoir : {animal.remarques_sante}</li>}
              </ul>
              <p className="small text-muted mt-3 mb-0">Au refuge depuis le {formatDate(animal.date_arrivee)}.</p>
            </section>
          </div>

          <div className="col-12 col-lg-5">
            <AdoptionPanel animal={animal} />
          </div>
        </div>
      </div>
    </>
  );
}
