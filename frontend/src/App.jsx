// ============================================================
// App.jsx - routes of the application
// ============================================================

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
import MonQuestionnaire from './pages/MonQuestionnaire';
import MesMatchs from './pages/MesMatchs';
import MesDemandes from './pages/MesDemandes';
import ProtectedRoute from './components/ProtectedRoute';
import MentionsLegales from './pages/legal/MentionsLegales';
import DonneesPersonnelles from './pages/legal/DonneesPersonnelles';
import Accessibilite from './pages/legal/Accessibilite';
import Cookies from './pages/legal/Cookies';
import NotFound from './pages/NotFound';

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

              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/donnees-personnelles" element={<DonneesPersonnelles />} />
              <Route path="/accessibilite" element={<Accessibilite />} />
              <Route path="/cookies" element={<Cookies />} />

              {/* Every unknown address */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
