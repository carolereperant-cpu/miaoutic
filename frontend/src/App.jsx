// ============================================================
// App.jsx - routes of the application
// ============================================================

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import PageChange from './components/PageChange';
import SkipLink from './components/SkipLink';
import Accueil from './pages/Accueil';
import ListeAnimaux from './pages/ListeAnimaux';
import FicheAnimal from './pages/FicheAnimal';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader } from './components/Feedback';
import MentionsLegales from './pages/legal/MentionsLegales';
import DonneesPersonnelles from './pages/legal/DonneesPersonnelles';
import Accessibilite from './pages/legal/Accessibilite';
import Cookies from './pages/legal/Cookies';
import NotFound from './pages/NotFound';

// Eco-design: the pages of the adopter and shelter spaces are
// downloaded only when a logged-in user opens them (code splitting).
// A visitor who only looks at the animals never loads their code.
const MonQuestionnaire = lazy(() => import('./pages/MonQuestionnaire'));
const MesMatchs = lazy(() => import('./pages/MesMatchs'));
const MesDemandes = lazy(() => import('./pages/MesDemandes'));
const TableauDeBord = lazy(() => import('./pages/refuge/TableauDeBord'));
const FormulaireAnimal = lazy(() => import('./pages/refuge/FormulaireAnimal'));
const DemandesRefuge = lazy(() => import('./pages/refuge/DemandesRefuge'));

export default function App() {
  return (
    <BrowserRouter>
      {/* Inside the router: AuthProvider needs useNavigate */}
      <AuthProvider>
        <PageChange />
        <div className="d-flex flex-column min-vh-100">
          <SkipLink />

          <Header />

          <main id="contenu" className="flex-grow-1" tabIndex={-1}>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/animaux" element={<ListeAnimaux />} />
                <Route path="/animaux/:espece" element={<ListeAnimaux />} />
                <Route path="/animal/:id" element={<FicheAnimal />} />

                <Route path="/connexion" element={<Connexion />} />
                <Route path="/inscription" element={<Inscription />} />

                {/* Adopter space (the API checks the role again on every request) */}
                <Route path="/mon-questionnaire" element={<ProtectedRoute role="adoptant"><MonQuestionnaire /></ProtectedRoute>} />
                <Route path="/mes-matchs" element={<ProtectedRoute role="adoptant"><MesMatchs /></ProtectedRoute>} />
                <Route path="/mes-demandes" element={<ProtectedRoute role="adoptant"><MesDemandes /></ProtectedRoute>} />

                {/* Shelter space */}
                <Route path="/refuge" element={<ProtectedRoute role="refuge"><TableauDeBord /></ProtectedRoute>} />
                <Route path="/refuge/animaux/nouveau" element={<ProtectedRoute role="refuge"><FormulaireAnimal /></ProtectedRoute>} />
                <Route path="/refuge/animaux/:id/modifier" element={<ProtectedRoute role="refuge"><FormulaireAnimal /></ProtectedRoute>} />
                <Route path="/refuge/demandes" element={<ProtectedRoute role="refuge"><DemandesRefuge /></ProtectedRoute>} />

                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/donnees-personnelles" element={<DonneesPersonnelles />} />
                <Route path="/accessibilite" element={<Accessibilite />} />
                <Route path="/cookies" element={<Cookies />} />

                {/* Every unknown address */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
