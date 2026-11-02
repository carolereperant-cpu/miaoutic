// ============================================================
// components/ProtectedRoute.jsx
// Shows a page only to a logged-in user with the right role.
//
// Important: this only improves the user experience (no useless
// page). The real protection is in the API, which checks the
// token and the role on every request: hiding a page in the
// browser is never enough, anyone can modify JavaScript.
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from './Feedback';

/**
 * @param {{ role?: 'adoptant'|'refuge', children: React.ReactNode }} props
 */
export default function ProtectedRoute({ role, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return <Loader label="Vérification de votre session…" />;
  }

  if (!user) {
    // After login, the user comes back to the page he wanted
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
