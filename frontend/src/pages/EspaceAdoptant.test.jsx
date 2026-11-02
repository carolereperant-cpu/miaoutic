// Tests of the adopter pages. The API service is replaced by a
// fake: we check what the pages send and how they react.
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MonQuestionnaire from './MonQuestionnaire';
import MesDemandes from './MesDemandes';
import MesMatchs from './MesMatchs';
import MatchBadge from '../components/MatchBadge';
import { matchLevel } from '../utils/format';
import { api, ApiError } from '../services/api';

vi.mock('../services/api', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, api: { get: vi.fn(), put: vi.fn(), patch: vi.fn(), post: vi.fn() } };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function renderAt(path, element, extraRoutes = null) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        {extraRoutes}
      </Routes>
    </MemoryRouter>,
  );
}

describe('Match level', () => {
  test.each([
    [100, 'high', 'Coup de foudre'],
    [80, 'high', 'Coup de foudre'],
    [79, 'medium', 'Belle affinité'],
    [50, 'medium', 'Belle affinité'],
    [30, 'low', 'Peu compatible'],
  ])('%i %% -> %s', (score, niveau, libelle) => {
    expect(matchLevel(score)).toEqual({ niveau, libelle });
  });

  test('MatchBadge writes the score and the level in words', () => {
    render(<MatchBadge score={85} />);
    expect(screen.getByText('85 % · Coup de foudre')).toHaveClass('match-badge--high');
  });
});

describe('MonQuestionnaire', () => {
  test('first time (404): empty form, answers sent as booleans, then "Mes matchs"', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValue(new ApiError(404, 'Questionnaire non rempli.'));
    api.put.mockResolvedValue({});
    renderAt('/mon-questionnaire', <MonQuestionnaire />, <Route path="/mes-matchs" element={<p>Page des matchs</p>} />);

    await user.click(await screen.findByLabelText('Maison avec jardin'));
    await user.click(screen.getByRole('group', { name: 'Avez-vous des enfants à la maison ?' }).querySelector('input[value="true"]'));
    await user.click(screen.getByRole('group', { name: 'Avez-vous déjà un chien ?' }).querySelector('input[value="false"]'));
    await user.click(screen.getByRole('group', { name: 'Avez-vous déjà un chat ?' }).querySelector('input[value="true"]'));
    await user.click(screen.getByLabelText(/Beaucoup de temps/));
    await user.click(screen.getByRole('button', { name: 'Découvrir mes matchs' }));

    expect(api.put).toHaveBeenCalledWith('/profil', {
      logement: 'maison_avec_jardin', aEnfants: true, aChien: false, aChat: true, tempsDisponible: 'eleve',
    });
    expect(await screen.findByText('Page des matchs')).toBeInTheDocument();
  });

  test('incomplete answers: message, nothing sent', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValue(new ApiError(404, 'Questionnaire non rempli.'));
    renderAt('/mon-questionnaire', <MonQuestionnaire />);

    await user.click(await screen.findByRole('button', { name: 'Découvrir mes matchs' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Merci de répondre à toutes les questions.');
    expect(api.put).not.toHaveBeenCalled();
  });

  test('existing questionnaire: answers pre-checked', async () => {
    api.get.mockResolvedValue({ logement: 'appartement', a_enfants: false, a_chien: false, a_chat: true, temps_disponible: 'moyen' });
    renderAt('/mon-questionnaire', <MonQuestionnaire />);

    expect(await screen.findByLabelText('Appartement')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Enregistrer mes réponses' })).toBeInTheDocument();
  });
});

describe('MesMatchs', () => {
  test('without questionnaire (409): invitation to fill it in', async () => {
    api.get.mockRejectedValue(new ApiError(409, 'Remplissez d\'abord votre questionnaire.'));
    renderAt('/mes-matchs', <MesMatchs />);
    expect(await screen.findByRole('link', { name: 'Remplir mon questionnaire' })).toHaveAttribute('href', '/mon-questionnaire');
  });

  test('shows the score of each animal', async () => {
    api.get.mockResolvedValue([
      { id_animal: 7, nom: 'Biscotte', nom_race: 'Européen', nom_espece: 'Chats', sexe: 'femelle', age: { libelle: '3 ans' }, score: 100 },
    ]);
    renderAt('/mes-matchs', <MesMatchs />);
    expect(await screen.findByText('100 % · Coup de foudre')).toBeInTheDocument();
  });
});

describe('MesDemandes', () => {
  const DEMANDE = {
    id_demande: 2, id_animal: 1, nom_animal: 'Pépette', statut: 'en_etude', score_compatibilite: 100, date_creation: '2026-10-12 08:15:00',
  };

  test('cancels a request only after confirmation, then reloads the list', async () => {
    const user = userEvent.setup();
    api.get
      .mockResolvedValueOnce([DEMANDE])
      .mockResolvedValueOnce([{ ...DEMANDE, statut: 'annulee' }]);
    api.patch.mockResolvedValue({});
    renderAt('/mes-demandes', <MesDemandes />);

    await user.click(await screen.findByRole('button', { name: 'Annuler la demande' }));
    expect(api.patch).not.toHaveBeenCalled(); // asks for confirmation first

    await user.click(screen.getByRole('button', { name: 'Oui, annuler' }));

    expect(api.patch).toHaveBeenCalledWith('/demandes/2/annulation');
    expect(await screen.findByText('Annulée')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler la demande' })).not.toBeInTheDocument();
  });

  test('a closed request cannot be cancelled', async () => {
    api.get.mockResolvedValue([{ ...DEMANDE, statut: 'refusee' }]);
    renderAt('/mes-demandes', <MesDemandes />);
    expect(await screen.findByText('Refusée')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler la demande' })).not.toBeInTheDocument();
  });

  test('no request yet: link to the matches', async () => {
    api.get.mockResolvedValue([]);
    renderAt('/mes-demandes', <MesDemandes />);
    expect(await screen.findByRole('link', { name: 'Voir mes matchs' })).toBeInTheDocument();
  });
});
