// ============================================================
// pages/Inscription.jsx - sign-up form (adopter account)
// The rules are checked in the browser to help the user, then
// checked again by the API, which is the only real protection.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import PasswordRules from '../components/PasswordRules';
import { ErrorAlert } from '../components/Feedback';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fieldErrors } from '../utils/formErrors';
import { isPasswordValid } from '../utils/password';

const EMPTY_FORM = { prenom: '', nom: '', email: '', motDePasse: '', confirmation: '' };

/** Checks done in the browser before sending */
function validate(form) {
  const errors = {};
  if (!form.prenom.trim()) errors.prenom = 'Le prénom est obligatoire.';
  if (!form.nom.trim()) errors.nom = 'Le nom est obligatoire.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'L\'adresse e-mail est invalide.';
  if (!isPasswordValid(form.motDePasse)) errors.motDePasse = 'Le mot de passe ne respecte pas toutes les règles.';
  if (form.confirmation !== form.motDePasse) errors.confirmation = 'Les deux mots de passe sont différents.';
  return errors;
}

export default function Inscription() {
  useDocumentTitle('Créer un compte');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGlobalError(null);

    const browserErrors = validate(form);
    setErrors(browserErrors);
    if (Object.keys(browserErrors).length > 0) {
      // Move the keyboard focus to the first invalid field
      document.getElementById(Object.keys(browserErrors)[0])?.focus();
      return;
    }

    setSending(true);
    try {
      const { prenom, nom, email, motDePasse } = form; // the confirmation is not sent
      await register({ prenom, nom, email, motDePasse });
      navigate('/connexion', {
        state: { message: 'Votre compte est créé ! Vous pouvez vous connecter.', email: email.trim().toLowerCase() },
      });
    } catch (error) {
      setErrors(fieldErrors(error));
      setGlobalError(error.erreurs?.length ? null : error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container section">
      <div className="form-card">
        <h1 className="section-title text-center mb-2">Créer un compte</h1>
        <p className="text-center text-muted mb-4">Pour découvrir vos matchs et envoyer vos demandes d'adoption.</p>

        <ErrorAlert error={globalError} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-12 col-sm-6">
              <FormField id="prenom" name="prenom" label="Prénom" autoComplete="given-name" required maxLength={100}
                value={form.prenom} error={errors.prenom} onChange={handleChange} />
            </div>
            <div className="col-12 col-sm-6">
              <FormField id="nom" name="nom" label="Nom" autoComplete="family-name" required maxLength={100}
                value={form.nom} error={errors.nom} onChange={handleChange} />
            </div>
          </div>

          <FormField id="email" name="email" type="email" label="Adresse e-mail" autoComplete="email" required
            maxLength={255} value={form.email} error={errors.email} onChange={handleChange} />

          <FormField
            id="motDePasse"
            name="motDePasse"
            type="password"
            label="Mot de passe"
            autoComplete="new-password"
            required
            value={form.motDePasse}
            error={errors.motDePasse}
            onChange={handleChange}
            help={<PasswordRules id="regles-mot-de-passe" value={form.motDePasse} />}
          />

          <FormField id="confirmation" name="confirmation" type="password" label="Confirmation du mot de passe"
            autoComplete="new-password" required value={form.confirmation} error={errors.confirmation}
            onChange={handleChange} />

          <p className="small text-muted">
            Vos données servent uniquement à traiter vos demandes d'adoption.{' '}
            <Link to="/donnees-personnelles">En savoir plus sur vos données</Link>
          </p>

          <button type="submit" className="btn btn-primary w-100" disabled={sending}>
            {sending ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center mt-4 mb-0">
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
