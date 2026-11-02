// ============================================================
// pages/refuge/FormulaireAnimal.jsx
// Add (/refuge/animaux/nouveau) or edit (/refuge/animaux/:id/modifier)
// an animal and its vaccinations.
// The form checks the rules in the browser to help the user; the
// API checks them again and stays the only real protection.
// ============================================================

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader, ErrorAlert } from '../../components/Feedback';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { api } from '../../services/api';
import { fieldErrors } from '../../utils/formErrors';
import {
  SEXE_LABELS, TAILLE_LABELS, ENERGIE_LABELS, IDENTIFICATION_LABELS, todayIso,
} from '../../utils/format';

const CHECKBOXES = {
  compatibilites: [
    ['okEnfants', 'S\'entend avec les enfants'],
    ['okChiens', 'S\'entend avec les chiens'],
    ['okChats', 'S\'entend avec les chats'],
    ['besoinJardin', 'A besoin d\'un jardin'],
  ],
  sante: [['sterilise', 'Stérilisé']],
};

// Unique key of each vaccination row (React needs a stable key to
// add and remove rows without mixing up their values)
let lastKey = 0;
function nextKey() {
  lastKey += 1;
  return lastKey;
}

const EMPTY_FORM = {
  nom: '',
  sexe: '',
  dateNaissance: '',
  idRace: '',
  taille: '',
  energie: '',
  okEnfants: false,
  okChiens: false,
  okChats: false,
  besoinJardin: false,
  description: '',
  sterilise: false,
  identification: 'aucune',
  remarquesSante: '',
  photo: '',
  coupDeCoeur: false,
  dateArrivee: '',
  vaccinations: [],
};

/** Animal sent by the API (snake_case) -> form values (camelCase) */
function fromAnimal(animal) {
  return {
    nom: animal.nom,
    sexe: animal.sexe,
    dateNaissance: animal.date_naissance,
    idRace: String(animal.id_race),
    taille: animal.taille,
    energie: animal.energie,
    okEnfants: animal.ok_enfants,
    okChiens: animal.ok_chiens,
    okChats: animal.ok_chats,
    besoinJardin: animal.besoin_jardin,
    description: animal.description,
    sterilise: animal.sterilise,
    identification: animal.identification,
    remarquesSante: animal.remarques_sante ?? '',
    photo: animal.photo ?? '',
    coupDeCoeur: animal.coup_de_coeur,
    dateArrivee: animal.date_arrivee,
    vaccinations: animal.vaccinations.map((v) => ({
      key: nextKey(), idVaccin: String(v.id_vaccin), date: v.date_vaccination,
    })),
  };
}

/** Form values -> body expected by the API */
function toPayload(form) {
  return {
    ...form,
    nom: form.nom.trim(),
    description: form.description.trim(),
    idRace: Number(form.idRace),
    remarquesSante: form.remarquesSante.trim() || null,
    photo: form.photo.trim() || null,
    vaccinations: form.vaccinations.map(({ idVaccin, date }) => ({ idVaccin: Number(idVaccin), date })),
  };
}

/** Same rules as the API, checked before sending */
function validate(form) {
  const errors = {};
  const today = todayIso();
  if (!form.nom.trim()) errors.nom = 'Le nom est obligatoire.';
  if (!form.sexe) errors.sexe = 'Choisissez le sexe.';
  if (!form.idRace) errors.idRace = 'Choisissez la race.';
  if (!form.taille) errors.taille = 'Choisissez la taille.';
  if (!form.energie) errors.energie = 'Choisissez le niveau d\'énergie.';
  if (!form.dateNaissance) errors.dateNaissance = 'La date de naissance est obligatoire.';
  else if (form.dateNaissance > today) errors.dateNaissance = 'La date de naissance ne peut pas être dans le futur.';
  if (!form.dateArrivee) errors.dateArrivee = 'La date d\'arrivée est obligatoire.';
  else if (form.dateArrivee > today) errors.dateArrivee = 'La date d\'arrivée ne peut pas être dans le futur.';
  else if (form.dateNaissance && form.dateArrivee < form.dateNaissance) {
    errors.dateArrivee = 'La date d\'arrivée ne peut pas précéder la naissance.';
  }
  if (form.description.trim().length < 10) errors.description = 'La description doit contenir au moins 10 caractères.';
  if (form.photo.trim() && !/^https:\/\/\S+$/.test(form.photo.trim())) errors.photo = 'La photo doit être une adresse https.';

  const seen = new Set();
  form.vaccinations.forEach((vaccination, index) => {
    if (!vaccination.idVaccin) errors[`vaccinations[${index}].idVaccin`] = 'Choisissez le vaccin.';
    if (!vaccination.date) errors[`vaccinations[${index}].date`] = 'Indiquez la date.';
    else if (vaccination.date > today) errors[`vaccinations[${index}].date`] = 'La date ne peut pas être dans le futur.';
    else if (form.dateNaissance && vaccination.date < form.dateNaissance) {
      errors[`vaccinations[${index}].date`] = 'Une vaccination ne peut pas précéder la naissance.';
    }
    const key = `${vaccination.idVaccin}|${vaccination.date}`;
    if (vaccination.idVaccin && vaccination.date && seen.has(key)) errors.vaccinations = 'La même vaccination est indiquée deux fois.';
    seen.add(key);
  });
  return errors;
}

/** Select with its label and error */
function SelectField({ id, label, value, onChange, error, children }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-semibold">{label}</label>
      <select id={id} name={id} className={`form-select ${error ? 'is-invalid' : ''}`} value={value} onChange={onChange}
        aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-erreur` : undefined} required>
        {children}
      </select>
      {error && <div id={`${id}-erreur`} className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

function AnimalForm({ initial, races, vaccins, idAnimal }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => (
    initial ? fromAnimal(initial) : { ...EMPTY_FORM, dateArrivee: todayIso() }
  ));
  const [errors, setErrors] = useState({});
  // Error sent by the API (the browser errors are in "errors")
  const [apiError, setApiError] = useState(null);
  const [sending, setSending] = useState(false);
  const today = todayIso();

  // A corrected field loses its error message
  const clearErrors = (test) => {
    setApiError(null);
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([name]) => !test(name))));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    clearErrors((field) => field === name);
  };

  const changeVaccination = (key, index, field, value) => {
    setForm((previous) => ({
      ...previous,
      vaccinations: previous.vaccinations.map((v) => (v.key === key ? { ...v, [field]: value } : v)),
    }));
    clearErrors((name) => name === 'vaccinations' || name.startsWith(`vaccinations[${index}]`));
  };

  const addVaccination = () => {
    const key = nextKey();
    setForm((previous) => ({ ...previous, vaccinations: [...previous.vaccinations, { key, idVaccin: '', date: '' }] }));
    // Focus the new vaccine select once it is displayed
    setTimeout(() => document.getElementById(`vaccin-${key}`)?.focus(), 0);
  };

  const removeVaccination = (key) => {
    setForm((previous) => ({ ...previous, vaccinations: previous.vaccinations.filter((v) => v.key !== key) }));
    // The rows after it change number: their messages are removed too
    clearErrors((name) => name.startsWith('vaccinations'));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError(null);

    const browserErrors = validate(form);
    setErrors(browserErrors);
    if (Object.keys(browserErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    setSending(true);
    try {
      const payload = toPayload(form);
      if (idAnimal) {
        await api.put(`/animaux/${idAnimal}`, payload);
      } else {
        await api.post('/animaux', payload);
      }
      navigate('/refuge', {
        state: { message: idAnimal ? `La fiche de ${payload.nom} est mise à jour.` : `${payload.nom} a été ajouté au refuge.` },
      });
    } catch (error) {
      setErrors(fieldErrors(error));
      setApiError(error);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } finally {
      setSending(false);
    }
  };

  // Breeds grouped by species, for the <optgroup> of the select
  const especes = [...new Set(races.map((race) => race.nom_espece))];

  const fieldError = (name) => errors[name];
  const describedBy = (name) => (errors[name] ? `${name}-erreur` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={apiError}>
        {!apiError && Object.keys(errors).length > 0
          ? 'Le formulaire contient des erreurs : elles sont indiquées sous les champs concernés.'
          : undefined}
      </ErrorAlert>

      <h2 className="h4 mt-2 mb-3">Identité</h2>
      <div className="row">
        <div className="col-12 col-md-6 mb-3">
          <label htmlFor="nom" className="form-label fw-semibold">Nom</label>
          <input id="nom" name="nom" className={`form-control ${fieldError('nom') ? 'is-invalid' : ''}`} value={form.nom}
            onChange={handleChange} maxLength={50} required aria-invalid={fieldError('nom') ? 'true' : undefined}
            aria-describedby={describedBy('nom')} />
          {fieldError('nom') && <div id="nom-erreur" className="invalid-feedback d-block">{fieldError('nom')}</div>}
        </div>
        <div className="col-12 col-md-6">
          <SelectField id="sexe" label="Sexe" value={form.sexe} onChange={handleChange} error={fieldError('sexe')}>
            <option value="">Choisir…</option>
            {Object.entries(SEXE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
        <div className="col-12 col-md-6">
          <SelectField id="idRace" label="Race" value={form.idRace} onChange={handleChange} error={fieldError('idRace')}>
            <option value="">Choisir…</option>
            {especes.map((espece) => (
              <optgroup key={espece} label={espece}>
                {races.filter((race) => race.nom_espece === espece).map((race) => (
                  <option key={race.id_race} value={race.id_race}>{race.nom_race}</option>
                ))}
              </optgroup>
            ))}
          </SelectField>
        </div>
        <div className="col-12 col-md-6 mb-3">
          <label htmlFor="dateNaissance" className="form-label fw-semibold">Date de naissance (même estimée)</label>
          <input id="dateNaissance" name="dateNaissance" type="date" max={today} required value={form.dateNaissance}
            onChange={handleChange} className={`form-control ${fieldError('dateNaissance') ? 'is-invalid' : ''}`}
            aria-invalid={fieldError('dateNaissance') ? 'true' : undefined} aria-describedby={describedBy('dateNaissance')} />
          {fieldError('dateNaissance') && <div id="dateNaissance-erreur" className="invalid-feedback d-block">{fieldError('dateNaissance')}</div>}
        </div>
        <div className="col-12 col-md-6 mb-3">
          <label htmlFor="dateArrivee" className="form-label fw-semibold">Date d'arrivée au refuge</label>
          <input id="dateArrivee" name="dateArrivee" type="date" max={today} required value={form.dateArrivee}
            onChange={handleChange} className={`form-control ${fieldError('dateArrivee') ? 'is-invalid' : ''}`}
            aria-invalid={fieldError('dateArrivee') ? 'true' : undefined} aria-describedby={describedBy('dateArrivee')} />
          {fieldError('dateArrivee') && <div id="dateArrivee-erreur" className="invalid-feedback d-block">{fieldError('dateArrivee')}</div>}
        </div>
        <div className="col-12 col-md-6 mb-3">
          <label htmlFor="photo" className="form-label fw-semibold">Adresse de la photo (facultatif)</label>
          <input id="photo" name="photo" type="url" inputMode="url" placeholder="https://…" value={form.photo}
            onChange={handleChange} maxLength={255} className={`form-control ${fieldError('photo') ? 'is-invalid' : ''}`}
            aria-invalid={fieldError('photo') ? 'true' : undefined} aria-describedby={describedBy('photo')} />
          {fieldError('photo') && <div id="photo-erreur" className="invalid-feedback d-block">{fieldError('photo')}</div>}
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label fw-semibold">Son histoire</label>
        <textarea id="description" name="description" rows={4} maxLength={2000} required value={form.description}
          onChange={handleChange} className={`form-control ${fieldError('description') ? 'is-invalid' : ''}`}
          aria-invalid={fieldError('description') ? 'true' : undefined} aria-describedby={describedBy('description')} />
        {fieldError('description') && <div id="description-erreur" className="invalid-feedback d-block">{fieldError('description')}</div>}
      </div>

      <h2 className="h4 mt-4 mb-3">Caractère</h2>
      <div className="row">
        <div className="col-12 col-md-6">
          <SelectField id="taille" label="Taille" value={form.taille} onChange={handleChange} error={fieldError('taille')}>
            <option value="">Choisir…</option>
            {Object.entries(TAILLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
        <div className="col-12 col-md-6">
          <SelectField id="energie" label="Énergie" value={form.energie} onChange={handleChange} error={fieldError('energie')}>
            <option value="">Choisir…</option>
            {Object.entries(ENERGIE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
      </div>
      <fieldset className="mb-3">
        <legend className="form-label fw-semibold fs-6">Compatibilités</legend>
        {CHECKBOXES.compatibilites.map(([name, label]) => (
          <div key={name} className="form-check">
            <input className="form-check-input" type="checkbox" id={name} name={name} checked={form[name]} onChange={handleChange} />
            <label className="form-check-label" htmlFor={name}>{label}</label>
          </div>
        ))}
      </fieldset>

      <h2 className="h4 mt-4 mb-3">Santé</h2>
      <div className="row">
        <div className="col-12 col-md-6">
          <SelectField id="identification" label="Identification" value={form.identification} onChange={handleChange} error={fieldError('identification')}>
            {Object.entries(IDENTIFICATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
        <div className="col-12 col-md-6 d-flex align-items-center">
          {CHECKBOXES.sante.map(([name, label]) => (
            <div key={name} className="form-check">
              <input className="form-check-input" type="checkbox" id={name} name={name} checked={form[name]} onChange={handleChange} />
              <label className="form-check-label" htmlFor={name}>{label}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="remarquesSante" className="form-label fw-semibold">Remarques de santé (facultatif)</label>
        <textarea id="remarquesSante" name="remarquesSante" rows={2} maxLength={1000} value={form.remarquesSante}
          onChange={handleChange} className="form-control" />
      </div>

      <fieldset className="mb-3">
        <legend className="form-label fw-semibold fs-6">Vaccinations</legend>
        {errors.vaccinations && <div className="invalid-feedback d-block mb-2" role="alert">{errors.vaccinations}</div>}
        {form.vaccinations.length === 0 && <p className="text-muted small">Aucune vaccination enregistrée.</p>}
        {form.vaccinations.map((vaccination, index) => {
          const vaccinError = errors[`vaccinations[${index}].idVaccin`];
          const dateError = errors[`vaccinations[${index}].date`];
          return (
            <div key={vaccination.key} className="row g-2 align-items-start mb-2">
              <div className="col-12 col-sm-5">
                <label htmlFor={`vaccin-${vaccination.key}`} className="visually-hidden">Vaccin n° {index + 1}</label>
                <select id={`vaccin-${vaccination.key}`} className={`form-select ${vaccinError ? 'is-invalid' : ''}`}
                  value={vaccination.idVaccin} onChange={(event) => changeVaccination(vaccination.key, index, 'idVaccin', event.target.value)}
                  aria-invalid={vaccinError ? 'true' : undefined}>
                  <option value="">Choisir le vaccin…</option>
                  {vaccins.map((vaccin) => <option key={vaccin.id_vaccin} value={vaccin.id_vaccin}>{vaccin.nom_vaccin}</option>)}
                </select>
                {vaccinError && <div className="invalid-feedback d-block">{vaccinError}</div>}
              </div>
              <div className="col-8 col-sm-4">
                <label htmlFor={`date-vaccin-${vaccination.key}`} className="visually-hidden">Date de la vaccination n° {index + 1}</label>
                <input id={`date-vaccin-${vaccination.key}`} type="date" max={today} value={vaccination.date}
                  className={`form-control ${dateError ? 'is-invalid' : ''}`} aria-invalid={dateError ? 'true' : undefined}
                  onChange={(event) => changeVaccination(vaccination.key, index, 'date', event.target.value)} />
                {dateError && <div className="invalid-feedback d-block">{dateError}</div>}
              </div>
              <div className="col-4 col-sm-3">
                <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeVaccination(vaccination.key)}>
                  Retirer{' '}<span className="visually-hidden">la vaccination n° {index + 1}</span>
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={addVaccination}>Ajouter une vaccination</button>
      </fieldset>

      <h2 className="h4 mt-4 mb-3">Mise en avant</h2>
      <div className="form-check mb-4">
        <input className="form-check-input" type="checkbox" id="coupDeCoeur" name="coupDeCoeur" checked={form.coupDeCoeur} onChange={handleChange} />
        <label className="form-check-label" htmlFor="coupDeCoeur">Coup de cœur (affiché sur la page d'accueil s'il est disponible)</label>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
          {sending ? 'Enregistrement…' : idAnimal ? 'Enregistrer les modifications' : 'Ajouter l\'animal'}
        </button>
        <Link to="/refuge" className="btn btn-outline-secondary btn-lg">Annuler</Link>
      </div>
    </form>
  );
}

export default function FormulaireAnimal() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const races = useApi('/races');
  const vaccins = useApi('/vaccins');
  const animal = useApi(isEdit ? `/animaux/${encodeURIComponent(id)}` : null);

  const titre = isEdit ? `Modifier ${animal.data?.nom ?? 'un animal'}` : 'Ajouter un animal';
  useDocumentTitle(titre);

  const loading = races.loading || vaccins.loading || animal.loading;
  const error = races.error ?? vaccins.error ?? animal.error;

  return (
    <div className="container section">
      <div className="form-card" style={{ maxWidth: '820px' }}>
        <p className="mb-2"><Link to="/refuge">← Retour aux animaux du refuge</Link></p>
        <h1 className="section-title mb-4">{titre}</h1>

        {loading && <Loader />}
        <ErrorAlert error={error} />
        {!loading && !error && (
          <AnimalForm
            initial={isEdit ? animal.data : null}
            races={races.data}
            vaccins={vaccins.data}
            idAnimal={isEdit ? animal.data.id_animal : null}
          />
        )}
      </div>
    </div>
  );
}
