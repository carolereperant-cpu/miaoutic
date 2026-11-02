// Unit tests of reusable components (React Testing Library)
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AnimalCard from './AnimalCard';
import StatusBadge from './StatusBadge';
import PasswordRules from './PasswordRules';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../context/authContext';

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
