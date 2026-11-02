// ============================================================
// pages/Accueil.jsx
// Home page: banner, "Comment adopter ?" in 4 steps and the 3
// favourites of the month (same layout as "Trouve ton artisan").
// ============================================================

import { Link } from 'react-router-dom';
import AnimalCard from '../components/AnimalCard';
import { Loader, ErrorAlert } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ETAPES = [
  { numero: 1, texte: 'Choisissez une espèce dans le menu.' },
  { numero: 2, texte: 'Remplissez votre questionnaire pour découvrir vos matchs.' },
  { numero: 3, texte: 'Craquez pour un animal et envoyez votre demande.' },
  { numero: 4, texte: 'Le refuge vous répond sous 48 h.' },
];

export default function Accueil() {
  useDocumentTitle('Accueil');
  const { data: coupsDeCoeur, loading, error } = useApi('/animaux/coups-de-coeur');

  return (
    <>
      <section className="hero" aria-labelledby="titre-accueil">
        <div className="container text-center">
          <h1 id="titre-accueil" className="hero__title">Miaoutic</h1>
          <p className="hero__subtitle mb-0">
            Le site de rencontre entre les animaux du refuge et leur future famille.
          </p>
        </div>
      </section>

      <section className="how-it-works" aria-labelledby="titre-comment">
        <div className="container">
          <h2 id="titre-comment" className="section-title text-center">Comment adopter ?</h2>
          <ol className="row g-3 justify-content-center list-unstyled mb-0">
            {ETAPES.map((etape) => (
              <li key={etape.numero} className="col-12 col-sm-6 col-lg-3">
                <div className="how-it-works__step">
                  <div className="how-it-works__number" aria-hidden="true">{etape.numero}</div>
                  <p className="how-it-works__title mb-0">{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="titre-coeurs">
        <div className="container">
          <h2 id="titre-coeurs" className="section-title text-center">Les cœurs à prendre du mois</h2>

          {loading && <Loader />}
          <ErrorAlert error={error} />

          {coupsDeCoeur && (
            <div className="row g-4 justify-content-center">
              {coupsDeCoeur.map((animal) => (
                <div key={animal.id_animal} className="col-12 col-md-6 col-lg-4">
                  <AnimalCard animal={animal} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-4">
            <Link to="/animaux" className="btn btn-primary btn-lg">Voir tous les animaux</Link>
          </div>
        </div>
      </section>
    </>
  );
}
