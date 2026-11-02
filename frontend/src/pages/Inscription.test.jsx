// Tests of the sign-up page: browser checks and API errors
import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Inscription from './Inscription';
import { AuthContext } from '../context/authContext';
import { ApiError } from '../services/api';

function renderPage(register, login = vi.fn().mockResolvedValue({ role: 'adoptant' })) {
  render(
    <AuthContext.Provider value={{ register, login }}>
      <MemoryRouter initialEntries={['/inscription']}>
        <Routes>
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/mon-questionnaire" element={<p>Page du questionnaire</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

async function fillForm(user, { confirmation = 'Chaton#Roux2026' } = {}) {
  await user.type(screen.getByLabelText('Prénom'), 'Camille');
  await user.type(screen.getByLabelText('Nom'), 'Petit');
  await user.type(screen.getByLabelText('Adresse e-mail'), 'camille.petit@miaoutic.test');
  await user.type(screen.getByLabelText('Mot de passe'), 'Chaton#Roux2026');
  await user.type(screen.getByLabelText('Confirmation du mot de passe'), confirmation);
}

test('empty form: errors shown, focus on the first field, nothing sent', async () => {
  const user = userEvent.setup();
  const register = vi.fn();
  renderPage(register);

  await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));

  expect(screen.getByText('Le prénom est obligatoire.')).toBeInTheDocument();
  expect(screen.getByLabelText('Prénom')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Prénom')).toHaveFocus();
  expect(register).not.toHaveBeenCalled();
});

test('different confirmation: error, nothing sent', async () => {
  const user = userEvent.setup();
  const register = vi.fn();
  renderPage(register);

  await fillForm(user, { confirmation: 'Autre#Chose2026' });
  await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));

  expect(screen.getByText('Les deux mots de passe sont différents.')).toBeInTheDocument();
  expect(register).not.toHaveBeenCalled();
});

test('valid form: sent without the confirmation, logged in, then questionnaire', async () => {
  const user = userEvent.setup();
  const register = vi.fn().mockResolvedValue({});
  const login = vi.fn().mockResolvedValue({ role: 'adoptant' });
  renderPage(register, login);

  await fillForm(user);
  await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));

  expect(register).toHaveBeenCalledWith({
    prenom: 'Camille', nom: 'Petit', email: 'camille.petit@miaoutic.test', motDePasse: 'Chaton#Roux2026',
  });
  expect(login).toHaveBeenCalledWith('camille.petit@miaoutic.test', 'Chaton#Roux2026');
  expect(await screen.findByText('Page du questionnaire')).toBeInTheDocument();
});

test('email already used: the message of the API is shown', async () => {
  const user = userEvent.setup();
  const register = vi.fn().mockRejectedValue(new ApiError(409, 'Un compte existe déjà avec cet email.'));
  renderPage(register);

  await fillForm(user);
  await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Un compte existe déjà avec cet email.');
});

test('field error returned by the API is shown under its field', async () => {
  const user = userEvent.setup();
  const register = vi.fn().mockRejectedValue(
    new ApiError(400, 'Données invalides.', [{ champ: 'nom', message: 'Le nom contient des caractères non autorisés.' }]),
  );
  renderPage(register);

  await fillForm(user);
  await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));

  expect(await screen.findByText('Le nom contient des caractères non autorisés.')).toBeInTheDocument();
  expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true');
});
