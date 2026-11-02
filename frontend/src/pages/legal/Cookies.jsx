// ============================================================
// pages/legal/Cookies.jsx
// ============================================================

import LegalPage from './LegalPage';

export default function Cookies() {
  return (
    <LegalPage titre="Cookies" miseAJour="2 novembre 2026">
      <h2>Aucun cookie de suivi</h2>
      <p>
        Miaoutic n'utilise aucun cookie publicitaire, aucun outil de mesure d'audience et aucun bouton de
        réseau social. C'est pourquoi aucun bandeau ne vous demande votre consentement.
      </p>

      <h2>Le seul élément enregistré dans votre navigateur</h2>
      <p>
        Quand vous vous connectez, un jeton de connexion est enregistré dans le stockage de session de votre
        navigateur (<em>sessionStorage</em>). Il permet de rester connecté d'une page à l'autre.
      </p>
      <ul>
        <li>Il est effacé dès que vous fermez l'onglet, ou quand vous vous déconnectez.</li>
        <li>Il expire automatiquement au bout de 2 heures.</li>
        <li>Il ne sert qu'à vous identifier sur Miaoutic, jamais à vous suivre.</li>
      </ul>
      <p>
        Ce jeton est strictement nécessaire au service que vous demandez (vous connecter) : selon les
        recommandations de la CNIL, il n'a pas besoin de votre consentement.
      </p>

      <h2>Polices de caractères</h2>
      <p>
        Les polices du site sont hébergées avec le site lui-même : aucune requête n'est envoyée à un service
        externe (comme Google Fonts) lorsque vous naviguez.
      </p>
    </LegalPage>
  );
}
