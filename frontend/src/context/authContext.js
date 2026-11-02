// ============================================================
// context/authContext.js
// Shared login state: the logged-in user is available in every
// component through the useAuth() hook (see AuthProvider.jsx).
// ============================================================

import { createContext } from 'react';

export const AuthContext = createContext(null);
