// ============================================================
// pages/Connexion.jsx - login form
// ============================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { ErrorAlert } from '../components/Feedback';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fieldErrors } from '../utils/formErrors';

export default function Connexion() {
  useDocumentTitle('Connexion');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Message and email sent by another page (account created, session expired)
  const [form, setForm] = useState({ email: location.state?.email ?? '', motDePasse: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setGlobalError(null);
    setSending(true);

    try {
      const utilisateur = await login(form.email, form.motDePasse);
      // Back to the page the user wanted, otherwise to his space
      const destination = location.state?.from ?? (utilisateur.role === 'refuge' ? '/' : '/mes-matchs');
      navigate(destination, { replace: true });
    } catch (error) {
      setErrors(fieldErrors(error));
      setGlobalError(error.erreurs?.length ? null : error);
      setForm((previous) => ({ ...previous, motDePasse: '' }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container section">
      <div className="form-card">
        <h1 className="section-title text-center mb-4">Connexion</h1>

        {location.state?.message && (
          <div className="alert alert-success" role="status">{location.state.message}</div>
        )}
        <ErrorAlert error={globalError} />

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="email"
            name="email"
            type="email"
            label="Adresse e-mail"
            autoComplete="email"
            required
            value={form.email}
            error={errors.email}
            onChange={handleChange}
          />
          <FormField
            id="motDePasse"
            name="motDePasse"
            type="password"
            label="Mot de passe"
            autoComplete="current-password"
            required
            value={form.motDePasse}
            error={errors.motDePasse}
            onChange={handleChange}
          />

          <button type="submit" className="btn btn-primary w-100" disabled={sending}>
            {sending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center mt-4 mb-0">
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
