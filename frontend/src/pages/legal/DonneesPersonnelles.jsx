// ============================================================
// pages/legal/DonneesPersonnelles.jsx
// Privacy policy (GDPR articles 13 and 14: information of the
// people whose data is collected)
// ============================================================

import LegalPage from './LegalPage';

export default function DonneesPersonnelles() {
  return (
    <LegalPage titre="Données personnelles" miseAJour="2 novembre 2026">
      <p>
        Le refuge Les Pattes Unies attache une grande importance à la protection de vos données. Cette page explique
        quelles données sont collectées sur Miaoutic, pourquoi, et comment exercer vos droits, conformément au
        Règlement général sur la protection des données (RGPD).
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        Refuge Les Pattes Unies, 12 chemin des Tilleuls, 95000 Cergy.
        Contact : <a href="mailto:donnees@miaoutic.test">donnees@miaoutic.test</a>
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>À la création du compte : prénom, nom, adresse e-mail et mot de passe.</li>
        <li>Questionnaire de l'adoptant : type de logement, présence d'enfants, d'un chien ou d'un chat, temps disponible.</li>
        <li>Demandes d'adoption : animal concerné, message, date et statut de la demande.</li>
      </ul>
      <p>
        Nous ne demandons que les données nécessaires à l'adoption (principe de minimisation) : ni adresse postale,
        ni numéro de téléphone, ni date de naissance.
      </p>

      <h2>Pourquoi ces données ?</h2>
      <ul>
        <li>Gérer votre compte et vous permettre de vous connecter.</li>
        <li>Calculer votre compatibilité avec les animaux du refuge.</li>
        <li>Étudier vos demandes d'adoption et vous répondre.</li>
      </ul>
      <p>
        Base légale : ces traitements sont nécessaires aux démarches d'adoption que vous engagez à votre demande
        (article 6.1.b du RGPD).
      </p>

      <h2>Qui peut les consulter ?</h2>
      <p>
        Uniquement les membres et bénévoles du refuge habilités à traiter les adoptions. Vos données ne sont jamais
        vendues ni transmises à des tiers à des fins commerciales.
      </p>

      <h2>Combien de temps sont-elles conservées ?</h2>
      <ul>
        <li>Compte et questionnaire : jusqu'à la suppression du compte, ou 3 ans après votre dernière connexion.</li>
        <li>Demandes d'adoption : 5 ans, pour assurer le suivi des animaux adoptés.</li>
      </ul>

      <h2>Sécurité</h2>
      <p>
        Votre mot de passe n'est jamais enregistré en clair : seule une empreinte chiffrée (bcrypt) est conservée.
        L'accès aux données est limité selon le rôle de chaque utilisateur, et les échanges avec le site sont
        chiffrés (HTTPS) une fois le site en ligne.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez à tout moment accéder à vos données, les rectifier, demander leur effacement ou leur
        portabilité, et vous opposer à leur traitement ou en demander la limitation. Écrivez à{' '}
        <a href="mailto:donnees@miaoutic.test">donnees@miaoutic.test</a> : nous vous répondons sous un mois.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL
        (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr<span className="visually-hidden"> (nouvelle fenêtre)</span></a>).
      </p>
    </LegalPage>
  );
}
