// ============================================================
// context/AuthProvider.jsx
// Keeps the logged-in user and offers login / register / logout.
//
// On page load, if a token is stored, the API is asked who the
// user is (GET /auth/moi): an expired or modified token is
// refused by the API and removed here.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './authContext';
import { api, tokenStore, setUnauthorizedHandler } from '../services/api';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // true while the stored token is being checked (avoids showing
  // the login page for a split second to a logged-in user)
  const [checking, setChecking] = useState(() => tokenStore.get() !== null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get('/auth/moi')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  // When the API refuses the token (expired after 2 hours)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setUser(null);
      navigate('/connexion', { state: { message: 'Votre session a expiré. Veuillez vous reconnecter.' } });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const login = useCallback(async (email, motDePasse) => {
    const { token, utilisateur } = await api.post('/auth/connexion', { email, motDePasse });
    tokenStore.set(token);
    setUser(utilisateur);
    return utilisateur;
  }, []);

  const register = useCallback((data) => api.post('/auth/inscription', data), []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, checking, login, register, logout }),
    [user, checking, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
