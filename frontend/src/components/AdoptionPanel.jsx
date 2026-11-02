// ============================================================
// components/AdoptionPanel.jsx
// Right column of the animal sheet: what the visitor can do.
//   - animal not available   -> information message
//   - visitor not logged in  -> log in / create an account
//   - shelter staff          -> links to edit the animal / see the requests
//   - adopter                -> % of match and request (AdopterPanel)
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import AdopterPanel from './AdopterPanel';
import { useAuth } from '../hooks/useAuth';

export default function AdoptionPanel({ animal }) {
  const { user } = useAuth();
  const location = useLocation();

  let content;

  if (animal.statut === 'adopte') {
    content = <p className="mb-0">{animal.nom} a trouvé sa famille ! Découvrez les autres animaux qui attendent leur match.</p>;
  } else if (animal.statut === 'reserve') {
    content = (
      <p className="mb-0">
        {animal.nom} a déjà rencontré une famille : son adoption est en cours.
        Découvrez les autres animaux qui attendent leur match !
      </p>
    );
  } else if (!user) {
    content = (
      <>
        <p>Connectez-vous pour découvrir votre <strong>% de match</strong> avec {animal.nom} et envoyer votre demande.</p>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/connexion" state={{ from: location.pathname }} className="btn btn-primary">Se connecter</Link>
          <Link to="/inscription" className="btn btn-outline-primary">Créer un compte</Link>
        </div>
      </>
    );
  } else if (user.role === 'refuge') {
    content = (
      <>
        <p>Vous êtes connecté avec un compte du refuge.</p>
        <div className="d-flex flex-wrap gap-2">
          <Link to={`/refuge/animaux/${animal.id_animal}/modifier`} className="btn btn-primary">Modifier la fiche</Link>
          <Link to="/refuge/demandes" className="btn btn-outline-primary">Voir les demandes</Link>
        </div>
      </>
    );
  } else {
    content = <AdopterPanel animal={animal} />;
  }

  return (
    <aside className="adoption-panel" aria-labelledby="titre-adoption">
      <h2 id="titre-adoption" className="h4">Vous craquez pour {animal.nom} ?</h2>
      {content}
    </aside>
  );
}
