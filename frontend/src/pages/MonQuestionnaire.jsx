// ============================================================
// pages/MonQuestionnaire.jsx
// Lifestyle questionnaire of the adopter: used by the API to
// compute the "% de match" with every animal.
// ============================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader, ErrorAlert } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../services/api';
import { LOGEMENT_LABELS, TEMPS_LABELS } from '../utils/format';

const YES_NO_QUESTIONS = [
  { name: 'aEnfants', column: 'a_enfants', label: 'Avez-vous des enfants à la maison ?' },
  { name: 'aChien', column: 'a_chien', label: 'Avez-vous déjà un chien ?' },
  { name: 'aChat', column: 'a_chat', label: 'Avez-vous déjà un chat ?' },
];

/** Answers of the API (snake_case) -> form values */
function toForm(profil) {
  return {
    logement: profil?.logement ?? '',
    aEnfants: profil ? String(profil.a_enfants) : '',
    aChien: profil ? String(profil.a_chien) : '',
    aChat: profil ? String(profil.a_chat) : '',
    tempsDisponible: profil?.temps_disponible ?? '',
  };
}

/** One group of radio buttons (fieldset + legend: read as one question) */
function RadioQuestion({ name, legend, options, value, onChange }) {
  return (
    <fieldset className="question">
      <legend>{legend}</legend>
      {options.map(([optionValue, label]) => (
        <div key={optionValue} className="form-check">
          <input
            className="form-check-input"
            type="radio"
            id={`${name}-${optionValue}`}
            name={name}
            value={optionValue}
            checked={value === optionValue}
            onChange={onChange}
            required
          />
          <label className="form-check-label" htmlFor={`${name}-${optionValue}`}>{label}</label>
        </div>
      ))}
    </fieldset>
  );
}

function QuestionnaireForm({ initial, isNew }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(() => toForm(initial));
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (Object.values(form).some((value) => value === '')) {
      setError(new Error('Merci de répondre à toutes les questions.'));
      return;
    }

    setSending(true);
    try {
      await api.put('/profil', {
        logement: form.logement,
        aEnfants: form.aEnfants === 'true',
        aChien: form.aChien === 'true',
        aChat: form.aChat === 'true',
        tempsDisponible: form.tempsDisponible,
      });
      // Back to the animal sheet the user came from, or to his matches
      if (location.state?.from) {
        navigate(location.state.from);
      } else if (isNew) {
        navigate('/mes-matchs');
      } else {
        setSaved(true);
      }
    } catch (apiError) {
      setError(apiError);
    } finally {
      setSending(false);
    }
  };

  const yesNo = [['true', 'Oui'], ['false', 'Non']];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={error} />
      {saved && (
        <div className="alert alert-success" role="status">
          Questionnaire enregistré. <Link to="/mes-matchs" className="alert-link">Voir mes matchs</Link>
        </div>
      )}

      <RadioQuestion
        name="logement"
        legend="Où habitez-vous ?"
        options={Object.entries(LOGEMENT_LABELS)}
        value={form.logement}
        onChange={handleChange}
      />
      {YES_NO_QUESTIONS.map((question) => (
        <RadioQuestion
          key={question.name}
          name={question.name}
          legend={question.label}
          options={yesNo}
          value={form[question.name]}
          onChange={handleChange}
        />
      ))}
      <RadioQuestion
        name="tempsDisponible"
        legend="Combien de temps pouvez-vous lui consacrer ?"
        options={Object.entries(TEMPS_LABELS)}
        value={form.tempsDisponible}
        onChange={handleChange}
      />

      <button type="submit" className="btn btn-primary btn-lg w-100" disabled={sending}>
        {sending ? 'Enregistrement…' : isNew ? 'Découvrir mes matchs' : 'Enregistrer mes réponses'}
      </button>
    </form>
  );
}

export default function MonQuestionnaire() {
  useDocumentTitle('Mon questionnaire');
  const location = useLocation();
  const { data, loading, error } = useApi('/profil');

  // 404 = never filled in: empty form
  const isNew = error?.status === 404;

  return (
    <div className="container section">
      <div className="form-card" style={{ maxWidth: '640px' }}>
        <h1 className="section-title text-center mb-2">Mon questionnaire</h1>
        <p className="text-center text-muted mb-4">
          Vos réponses permettent de calculer votre compatibilité avec chaque animal du refuge.
        </p>

        {location.state?.welcome && (
          <div className="alert alert-success" role="status">
            Bienvenue sur Miaoutic ! Répondez à ces 5 questions pour découvrir vos matchs.
          </div>
        )}

        {loading && <Loader />}
        {error && !isNew && <ErrorAlert error={error} />}
        {(data || isNew) && <QuestionnaireForm initial={data} isNew={isNew} />}
      </div>
    </div>
  );
}
