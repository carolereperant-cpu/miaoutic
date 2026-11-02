// ============================================================
// pages/MesMatchs.jsx
// Available animals sorted by compatibility with the adopter
// (best match first, computed by the API).
// ============================================================

import { Link } from 'react-router-dom';
import AnimalCard from '../components/AnimalCard';
import { Loader, ErrorAlert } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { countAnimals } from '../utils/format';

export default function MesMatchs() {
  useDocumentTitle('Mes matchs');
  const { data: matchs, loading, error } = useApi('/profil/matchs');

  return (
    <>
      <section className="hero" aria-labelledby="titre-matchs">
        <div className="container">
          <h1 id="titre-matchs" className="hero__title">Mes matchs</h1>
          <p className="hero__subtitle mb-0">Les animaux les plus compatibles avec votre foyer apparaissent en premier.</p>
        </div>
      </section>

      <section className="section pt-0" aria-label="Animaux classés par compatibilité">
        <div className="container">
          {loading && <Loader label="Calcul de vos matchs…" />}

          {error?.status === 409 && (
            <div className="text-center py-5">
              <p className="fs-5">Remplissez d'abord votre questionnaire pour découvrir vos matchs.</p>
              <Link to="/mon-questionnaire" className="btn btn-primary btn-lg">Remplir mon questionnaire</Link>
            </div>
          )}
          {error && error.status !== 409 && <ErrorAlert error={error} />}

          {matchs && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                <p className="text-muted mb-0">{countAnimals(matchs.length)}</p>
                <Link to="/mon-questionnaire">Modifier mon questionnaire</Link>
              </div>
              <div className="row g-4">
                {matchs.map((animal) => (
                  <div key={animal.id_animal} className="col-12 col-md-6 col-lg-4">
                    <AnimalCard animal={animal} score={animal.score} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
