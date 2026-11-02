// ============================================================
// pages/legal/Accessibilite.jsx
// Accessibility statement (based on the RGAA model)
// ============================================================

import LegalPage from './LegalPage';

export default function Accessibilite() {
  return (
    <LegalPage titre="Accessibilité" miseAJour="2 novembre 2026">
      <p>
        Le refuge Les Pattes Unies s'engage à rendre Miaoutic accessible à tous, y compris aux personnes en
        situation de handicap, en s'appuyant sur le Référentiel général d'amélioration de l'accessibilité (RGAA).
      </p>

      <h2>État de conformité</h2>
      <p>
        Miaoutic est <strong>partiellement conforme</strong> au RGAA : le site n'a pas encore fait l'objet d'un
        audit complet par un organisme spécialisé.
      </p>

      <h2>Mesures mises en place</h2>
      <ul>
        <li>Contrastes des couleurs vérifiés (au moins 4,5:1 pour les textes).</li>
        <li>Navigation possible entièrement au clavier, avec un indicateur de focus visible.</li>
        <li>Lien « Aller au contenu » en début de page.</li>
        <li>Structure de titres hiérarchisée et zones de page identifiées (en-tête, navigation, contenu, pied de page).</li>
        <li>Formulaires avec des étiquettes associées à chaque champ et des messages d'erreur annoncés aux lecteurs d'écran.</li>
        <li>Les informations ne sont jamais données par la couleur seule (statuts écrits en toutes lettres).</li>
        <li>Respect du réglage « réduire les animations » du système.</li>
      </ul>

      <h2>Signaler un problème</h2>
      <p>
        Si vous rencontrez une difficulté pour accéder à un contenu ou à un service, écrivez-nous à{' '}
        <a href="mailto:accessibilite@miaoutic.test">accessibilite@miaoutic.test</a> : nous vous proposerons une
        solution ou le contenu sous une autre forme.
      </p>
    </LegalPage>
  );
}
