// Tests of the shelter pages. The API service is replaced by a
// fake: we check what the pages send and how they react.
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import FormulaireAnimal from './FormulaireAnimal';
import TableauDeBord from './TableauDeBord';
import DemandesRefuge from './DemandesRefuge';
import { api, ApiError } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  };
});

const RACES = [
  { id_race: 1, nom_race: 'Européen', id_espece: 1, nom_espece: 'Chat' },
  { id_race: 2, nom_race: 'Labrador', id_espece: 2, nom_espece: 'Chien' },
];
const VACCINS = [
  { id_vaccin: 1, nom_vaccin: 'Rage' },
  { id_vaccin: 2, nom_vaccin: 'Typhus' },
];

/** Fake GET: answers according to the path */
function mockGet(answers) {
  api.get.mockImplementation((path) => {
    if (path in answers) {
      const answer = answers[path];
      return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
    }
    return Promise.reject(new ApiError(404, `Chemin non prévu : ${path}`));
  });
}

/** Page shown after a redirection, with the message it received */
function Destination() {
  const location = useLocation();
  return <p>Tableau de bord : {location.state?.message}</p>;
}

function renderRoutes(path, routes) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        {routes}
        <Route path="/refuge" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FormulaireAnimal - add', () => {
  const renderForm = () => renderRoutes('/refuge/animaux/nouveau', (
    <Route path="/refuge/animaux/nouveau" element={<FormulaireAnimal />} />
  ));

  test('sends the right body (numbers, null fields, vaccinations) and goes back to the dashboard', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS });
    api.post.mockResolvedValue({ id_animal: 17 });
    renderForm();

    await user.type(await screen.findByLabelText('Nom'), 'Caramel');
    await user.selectOptions(screen.getByLabelText('Sexe'), 'male');
    await user.selectOptions(screen.getByLabelText('Race'), '1');
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: '2022-03-10' } });
    fireEvent.change(screen.getByLabelText("Date d'arrivée au refuge"), { target: { value: '2025-01-15' } });
    await user.type(screen.getByLabelText('Son histoire'), 'Un chat très doux qui adore les câlins.');
    await user.selectOptions(screen.getByLabelText('Taille'), 'moyen');
    await user.selectOptions(screen.getByLabelText('Énergie'), 'calme');
    await user.click(screen.getByLabelText("S'entend avec les enfants"));
    await user.click(screen.getByLabelText('Stérilisé'));

    await user.click(screen.getByRole('button', { name: 'Ajouter une vaccination' }));
    // The new row receives the focus
    expect(screen.getByLabelText('Vaccin n° 1')).toHaveFocus();
    await user.selectOptions(screen.getByLabelText('Vaccin n° 1'), '2');
    fireEvent.change(screen.getByLabelText('Date de la vaccination n° 1'), { target: { value: '2025-02-01' } });

    await user.click(screen.getByRole('button', { name: "Ajouter l'animal" }));

    expect(api.post).toHaveBeenCalledWith('/animaux', {
      nom: 'Caramel',
      sexe: 'male',
      dateNaissance: '2022-03-10',
      idRace: 1,
      taille: 'moyen',
      energie: 'calme',
      okEnfants: true,
      okChiens: false,
      okChats: false,
      besoinJardin: false,
      description: 'Un chat très doux qui adore les câlins.',
      sterilise: true,
      identification: 'aucune',
      remarquesSante: null,
      photo: null,
      coupDeCoeur: false,
      dateArrivee: '2025-01-15',
      vaccinations: [{ idVaccin: 2, date: '2025-02-01' }],
    });
    expect(await screen.findByText('Tableau de bord : Caramel a été ajouté au refuge.')).toBeInTheDocument();
  });

  test('empty form: messages under the fields, nothing sent', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS });
    renderForm();

    await user.click(await screen.findByRole('button', { name: "Ajouter l'animal" }));

    expect(screen.getByRole('alert')).toHaveTextContent('Le formulaire contient des erreurs');
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nom')).toHaveAccessibleDescription('Le nom est obligatoire.');
    expect(screen.getByText('Choisissez la race.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    // A corrected field loses its message, the others keep theirs
    await user.type(screen.getByLabelText('Nom'), 'Moka');
    expect(screen.getByLabelText('Nom')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Le nom est obligatoire.')).not.toBeInTheDocument();
    expect(screen.getByText('Choisissez la race.')).toBeInTheDocument();
  });

  test('dates out of order are refused before sending', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS });
    renderForm();

    fireEvent.change(await screen.findByLabelText(/Date de naissance/), { target: { value: '2023-05-01' } });
    fireEvent.change(screen.getByLabelText("Date d'arrivée au refuge"), { target: { value: '2023-04-01' } });
    await user.click(screen.getByRole('button', { name: 'Ajouter une vaccination' }));
    await user.selectOptions(screen.getByLabelText('Vaccin n° 1'), '1');
    fireEvent.change(screen.getByLabelText('Date de la vaccination n° 1'), { target: { value: '2023-01-01' } });
    await user.click(screen.getByRole('button', { name: "Ajouter l'animal" }));

    expect(screen.getByText("La date d'arrivée ne peut pas précéder la naissance.")).toBeInTheDocument();
    expect(screen.getByText('Une vaccination ne peut pas précéder la naissance.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test('SECURITY: a "javascript:" address is refused for the photo', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS });
    renderForm();

    await user.type(await screen.findByLabelText('Adresse de la photo (facultatif)'), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: "Ajouter l'animal" }));

    expect(screen.getByText('La photo doit être une adresse https.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test('a vaccination row can be removed', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS });
    renderForm();

    await user.click(await screen.findByRole('button', { name: 'Ajouter une vaccination' }));
    await user.click(screen.getByRole('button', { name: 'Retirer la vaccination n° 1' }));

    expect(screen.queryByLabelText('Vaccin n° 1')).not.toBeInTheDocument();
    expect(screen.getByText('Aucune vaccination enregistrée.')).toBeInTheDocument();
  });
});

describe('FormulaireAnimal - edit', () => {
  const PEPETTE = {
    id_animal: 3,
    nom: 'Pépette',
    sexe: 'femelle',
    date_naissance: '2020-04-02',
    id_race: 1,
    taille: 'petit',
    energie: 'calme',
    ok_enfants: true,
    ok_chiens: false,
    ok_chats: true,
    besoin_jardin: false,
    description: 'Une chatte tranquille qui aime le soleil.',
    sterilise: true,
    identification: 'puce',
    remarques_sante: null,
    photo: null,
    coup_de_coeur: true,
    date_arrivee: '2024-09-12',
    statut: 'disponible',
    vaccinations: [{ id_vaccin: 2, nom_vaccin: 'Typhus', date_vaccination: '2024-09-20' }],
  };

  const renderEdit = () => renderRoutes('/refuge/animaux/3/modifier', (
    <Route path="/refuge/animaux/:id/modifier" element={<FormulaireAnimal />} />
  ));

  test('the form is filled with the animal, and PUT is sent to its address', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS, '/animaux/3': PEPETTE });
    api.put.mockResolvedValue(PEPETTE);
    renderEdit();

    expect(await screen.findByRole('heading', { level: 1, name: 'Modifier Pépette' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toHaveValue('Pépette');
    expect(screen.getByLabelText('Race')).toHaveValue('1');
    expect(screen.getByLabelText("S'entend avec les chats")).toBeChecked();
    expect(screen.getByLabelText('Vaccin n° 1')).toHaveValue('2');
    expect(screen.getByLabelText('Date de la vaccination n° 1')).toHaveValue('2024-09-20');

    await user.clear(screen.getByLabelText('Nom'));
    await user.type(screen.getByLabelText('Nom'), 'Pépette la douce');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(api.put).toHaveBeenCalledWith('/animaux/3', expect.objectContaining({
      nom: 'Pépette la douce',
      idRace: 1,
      identification: 'puce',
      coupDeCoeur: true,
      vaccinations: [{ idVaccin: 2, date: '2024-09-20' }],
    }));
    expect(await screen.findByText('Tableau de bord : La fiche de Pépette la douce est mise à jour.')).toBeInTheDocument();
  });

  test('the errors sent by the API are shown under their field, even in a vaccination row', async () => {
    const user = userEvent.setup();
    mockGet({ '/races': RACES, '/vaccins': VACCINS, '/animaux/3': PEPETTE });
    api.put.mockRejectedValue(new ApiError(400, 'Données invalides.', [
      { champ: 'vaccinations[0].date', message: 'Date de vaccination invalide.' },
    ]));
    renderEdit();

    await user.click(await screen.findByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByText('Date de vaccination invalide.')).toBeInTheDocument();
    expect(screen.getByLabelText('Date de la vaccination n° 1')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Données invalides.');
  });

  test('unknown animal: error message, no form', async () => {
    mockGet({ '/races': RACES, '/vaccins': VACCINS, '/animaux/3': new ApiError(404, 'Animal introuvable.') });
    renderEdit();

    expect(await screen.findByText('Animal introuvable.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nom')).not.toBeInTheDocument();
  });
});

describe('TableauDeBord', () => {
  const ANIMAUX = [
    {
      id_animal: 1, nom: 'Rocket', nom_espece: 'Chien', nom_race: 'Labrador', statut: 'disponible',
      age: { libelle: '3 ans' }, nb_demandes_actives: 2, coup_de_coeur: true,
    },
    {
      id_animal: 2, nom: 'Mimi', nom_espece: 'Chat', nom_race: 'Européen', statut: 'reserve',
      age: { libelle: '1 an' }, nb_demandes_actives: 0, coup_de_coeur: false,
    },
  ];

  const renderDashboard = () => render(<MemoryRouter><TableauDeBord /></MemoryRouter>);

  test('shows every animal and filters by status', async () => {
    const user = userEvent.setup();
    mockGet({ '/animaux/gestion': ANIMAUX });
    renderDashboard();

    expect(await screen.findByRole('link', { name: 'Rocket' })).toBeInTheDocument();
    expect(screen.getByText('2 animaux trouvés')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Statut'), 'reserve');
    expect(screen.queryByRole('link', { name: 'Rocket' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mimi' })).toBeInTheDocument();
  });

  test('reserve an animal: PATCH of its status, then a message', async () => {
    const user = userEvent.setup();
    mockGet({ '/animaux/gestion': ANIMAUX });
    api.patch.mockResolvedValue({});
    renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Réserver Rocket' }));

    expect(api.patch).toHaveBeenCalledWith('/animaux/1/statut', { statut: 'reserve' });
    expect(await screen.findByRole('status')).toHaveTextContent('Rocket est réservé.');
  });

  test('delete asks for a confirmation first, and shows the refusal of the API', async () => {
    const user = userEvent.setup();
    mockGet({ '/animaux/gestion': ANIMAUX });
    api.delete.mockRejectedValue(new ApiError(409, 'Rocket a des demandes d\'adoption : il ne peut pas être supprimé.'));
    renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Supprimer Rocket' }));
    expect(api.delete).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('group', { name: 'Supprimer Rocket ?' });
    expect(within(confirmation).getByRole('button', { name: 'Oui, supprimer' })).toHaveFocus();

    await user.click(within(confirmation).getByRole('button', { name: 'Oui, supprimer' }));

    expect(api.delete).toHaveBeenCalledWith('/animaux/1');
    expect(await screen.findByRole('alert')).toHaveTextContent('il ne peut pas être supprimé');
  });

  test('"Non" cancels the deletion', async () => {
    const user = userEvent.setup();
    mockGet({ '/animaux/gestion': ANIMAUX });
    renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Supprimer Mimi' }));
    await user.click(screen.getByRole('button', { name: 'Non' }));

    expect(api.delete).not.toHaveBeenCalled();
    // The keyboard focus goes back to the button
    expect(screen.getByRole('button', { name: 'Supprimer Mimi' })).toHaveFocus();
  });
});

describe('DemandesRefuge', () => {
  const DEMANDES = [
    {
      id_demande: 7, id_animal: 1, nom_animal: 'Rocket', statut: 'recue', score_compatibilite: 92,
      date_creation: '2026-10-20 10:00:00', prenom: 'Léa', nom: 'Dubois', email: 'lea.dubois@miaoutic.test',
      message: 'Bonjour,\nnous avons un grand jardin.',
    },
    {
      id_demande: 8, id_animal: 2, nom_animal: 'Mimi', statut: 'acceptee', score_compatibilite: 70,
      date_creation: '2026-10-01 09:00:00', prenom: 'Hugo', nom: 'Lefèvre', email: 'hugo.lefevre@miaoutic.test',
      message: null,
    },
  ];

  const renderRequests = () => render(<MemoryRouter><DemandesRefuge /></MemoryRouter>);

  test('shows the request, its message, and actions only for active requests', async () => {
    mockGet({ '/demandes': DEMANDES });
    renderRequests();

    expect(await screen.findByText(/nous avons un grand jardin/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'lea.dubois@miaoutic.test' })).toHaveAttribute('href', 'mailto:lea.dubois@miaoutic.test');
    expect(screen.getByRole('button', { name: 'Accepter la demande de Léa Dubois' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accepter la demande de Hugo Lefèvre' })).not.toBeInTheDocument();
  });

  test('accepting needs a confirmation, then says how many other requests were refused', async () => {
    const user = userEvent.setup();
    mockGet({ '/demandes': DEMANDES });
    api.patch.mockResolvedValue({ demande: { ...DEMANDES[0], statut: 'acceptee' }, autresDemandesRefusees: 1 });
    renderRequests();

    await user.click(await screen.findByRole('button', { name: 'Accepter la demande de Léa Dubois' }));
    expect(api.patch).not.toHaveBeenCalled();
    expect(screen.getByText(/Les autres demandes pour Rocket seront refusées/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Oui, accepter' }));

    expect(api.patch).toHaveBeenCalledWith('/demandes/7/statut', { statut: 'acceptee' });
    expect(await screen.findByRole('status')).toHaveTextContent(
      "Adoption de Rocket validée : c'est un match avec Léa ! 1 autre demande refusée automatiquement.",
    );
  });

  test('"Passer en étude" is sent without confirmation (it can be followed by a decision)', async () => {
    const user = userEvent.setup();
    mockGet({ '/demandes': DEMANDES });
    api.patch.mockResolvedValue({ demande: { ...DEMANDES[0], statut: 'en_etude' }, autresDemandesRefusees: 0 });
    renderRequests();

    await user.click(await screen.findByRole('button', { name: 'Passer en étude la demande de Léa Dubois' }));

    expect(api.patch).toHaveBeenCalledWith('/demandes/7/statut', { statut: 'en_etude' });
  });

  test('the status filter is sent to the API', async () => {
    const user = userEvent.setup();
    mockGet({ '/demandes': DEMANDES, '/demandes?statut=acceptee': [DEMANDES[1]] });
    renderRequests();

    await user.selectOptions(await screen.findByLabelText('Statut'), 'acceptee');

    expect(api.get).toHaveBeenLastCalledWith('/demandes?statut=acceptee', expect.anything());
    expect(await screen.findByText('1 demande')).toBeInTheDocument();
  });

  test('SECURITY (XSS): HTML written in a message is shown as text, never run', async () => {
    const attack = '<img src="x" onerror="window.piege = true"> Bonjour';
    mockGet({ '/demandes': [{ ...DEMANDES[0], message: attack }] });
    const { container } = render(<MemoryRouter><DemandesRefuge /></MemoryRouter>);

    expect(await screen.findByText(attack)).toBeInTheDocument();
    expect(container.querySelector('.request-message img')).toBeNull();
    expect(window.piege).toBeUndefined();
  });

  test('a conflict (request already handled elsewhere) is shown', async () => {
    const user = userEvent.setup();
    mockGet({ '/demandes': DEMANDES });
    api.patch.mockRejectedValue(new ApiError(409, 'Rocket a déjà trouvé un foyer.'));
    renderRequests();

    await user.click(await screen.findByRole('button', { name: 'Refuser la demande de Léa Dubois' }));
    await user.click(screen.getByRole('button', { name: 'Oui, refuser' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Rocket a déjà trouvé un foyer.');
  });
});
