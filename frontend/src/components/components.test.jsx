// Unit tests of reusable components (React Testing Library)
import { describe, test, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AnimalCard from './AnimalCard';
import StatusBadge from './StatusBadge';
import PasswordRules from './PasswordRules';
import ProtectedRoute from './ProtectedRoute';
import { Loader, SLOW_DELAY_MS } from './Feedback';
import { AuthContext } from '../context/authContext';
import { useDocumentTitle, DEFAULT_DESCRIPTION } from '../hooks/useDocumentTitle';

const BISCOTTE = {
  id_animal: 7,
  nom: 'Biscotte',
  nom_race: 'Européen',
  nom_espece: 'Chats',
  sexe: 'femelle',
  statut: 'disponible',
  photo: null,
  age: { libelle: '3 ans' },
};

describe('AnimalCard', () => {
  test('shows the name, breed, age, sex and status, and links to the sheet', () => {
    render(<AnimalCard animal={BISCOTTE} />, { wrapper: MemoryRouter });

    expect(screen.getByRole('heading', { name: 'Biscotte' })).toBeInTheDocument();
    expect(screen.getByText('Européen')).toBeInTheDocument();
    expect(screen.getByText('3 ans · Femelle')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/animal/7');
  });

  test('shows the photo with an alternative text when there is one', () => {
    render(<AnimalCard animal={{ ...BISCOTTE, photo: 'https://images.exemple.fr/biscotte.jpg' }} />, { wrapper: MemoryRouter });
    expect(screen.getByRole('img', { name: 'Photo de Biscotte' })).toHaveAttribute('loading', 'lazy');
  });
});

test('StatusBadge writes the status in words (not only a colour)', () => {
  render(<StatusBadge statut="reserve" />);
  expect(screen.getByText('Réservé')).toHaveClass('status-badge--reserve');
});

test('PasswordRules ticks the respected rules', () => {
  render(<PasswordRules id="regles" value="chaton" />);
  expect(screen.getByText('Une minuscule').closest('li')).toHaveClass('is-ok');
  expect(screen.getByText('Une majuscule').closest('li')).not.toHaveClass('is-ok');
});

describe('ProtectedRoute', () => {
  function renderWithUser(user, role) {
    return render(
      <AuthContext.Provider value={{ user, checking: false }}>
        <MemoryRouter initialEntries={['/prive']}>
          <Routes>
            <Route path="/" element={<p>Accueil</p>} />
            <Route path="/connexion" element={<p>Page de connexion</p>} />
            <Route path="/prive" element={<ProtectedRoute role={role}><p>Page privée</p></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  }

  test('sends a visitor who is not logged in to the login page', () => {
    renderWithUser(null, 'adoptant');
    expect(screen.getByText('Page de connexion')).toBeInTheDocument();
  });

  test('shows the page to a user with the right role', () => {
    renderWithUser({ prenom: 'Léa', role: 'adoptant' }, 'adoptant');
    expect(screen.getByText('Page privée')).toBeInTheDocument();
  });

  test('sends a user with another role back to the home page', () => {
    renderWithUser({ prenom: 'Sophie', role: 'refuge' }, 'adoptant');
    expect(screen.getByText('Accueil')).toBeInTheDocument();
  });
});

describe('useDocumentTitle (SEO)', () => {
  function Page({ title, options }) {
    useDocumentTitle(title, options);
    return null;
  }
  const meta = (name) => document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content');

  test('public page: title and description for search engines, no "noindex"', () => {
    render(<Page title="Nos chiens" options={{ description: 'Les chiens du refuge.' }} />);
    expect(document.title).toBe('Nos chiens - Miaoutic');
    expect(meta('description')).toBe('Les chiens du refuge.');
    expect(meta('robots')).toBeUndefined();
  });

  test('private page: "noindex", then removed on a public page', () => {
    const { rerender } = render(<Page title="Mes matchs" options={{ noindex: true }} />);
    expect(meta('robots')).toBe('noindex, nofollow');
    expect(meta('description')).toBe(DEFAULT_DESCRIPTION);

    rerender(<Page title="Accueil" />);
    expect(meta('robots')).toBeUndefined();
  });
});

describe('Loader', () => {
  test('explains a long wait (server waking up on a free hosting plan)', () => {
    vi.useFakeTimers();
    try {
      render(<Loader />);
      expect(screen.getByRole('status')).toHaveTextContent('Chargement en cours…');
      expect(screen.queryByText(/Le serveur se réveille/)).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(SLOW_DELAY_MS));
      expect(screen.getByRole('status')).toHaveTextContent('Le serveur se réveille, cela peut prendre jusqu\'à une minute.');
    } finally {
      vi.useRealTimers();
    }
  });
});
