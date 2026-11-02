// ============================================================
// pages/legal/MentionsLegales.jsx
// Mandatory information (French law LCEN, article 6)
// ============================================================

import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';

export default function MentionsLegales() {
  return (
    <LegalPage titre="Mentions légales" miseAJour="2 novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Refuge Les Pattes Unies, association loi 1901<br />
        12 chemin des Tilleuls, 95000 Cergy<br />
        Téléphone : 01 00 00 00 00<br />
        E-mail : <a href="mailto:contact@miaoutic.test">contact@miaoutic.test</a>
      </p>

      <h2>Directrice de la publication</h2>
      <p>Sophie Martin, présidente de l'association.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est actuellement exécuté en environnement de développement. Les coordonnées de l'hébergeur
        (nom, adresse, téléphone) seront indiquées ici lors de la mise en ligne.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, le logo et la charte graphique de Miaoutic appartiennent à l'association. Toute reproduction
        sans autorisation est interdite. Les photos des animaux sont prises par les bénévoles du refuge.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit sur la page{' '}
        <Link to="/donnees-personnelles">Données personnelles</Link>.
      </p>
    </LegalPage>
  );
}
