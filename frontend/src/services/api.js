// ============================================================
// services/api.js
// Every call to the API goes through this file (fetch).
//   - adds the base URL and the JSON headers
//   - adds the login token when the user is logged in
//   - turns error answers into an ApiError with a clear message
// ============================================================

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'miaoutic_token';

/**
 * Error returned by the API (or network error, status 0).
 * "erreurs" lists the invalid fields of a form (status 400).
 */
export class ApiError extends Error {
  constructor(status, message, erreurs = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.erreurs = erreurs;
  }
}

/**
 * Login token storage.
 * sessionStorage is cleared when the tab is closed, so the token
 * does not stay on the computer (shared computer of a family...).
 * Access is wrapped in try/catch: storage can be blocked by the
 * browser (private mode, strict settings).
 */
export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable: the user stays logged in until the page is reloaded
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // nothing to clear
    }
  },
};

// Called when the API refuses the token (expired session)
let unauthorizedHandler = null;

/** @param {Function|null} handler */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/**
 * @param {string} path - e.g. '/animaux?espece=2'
 * @param {{ method?: string, body?: object, signal?: AbortSignal }} [options]
 * @returns {Promise<any>} the JSON answer (null for 204)
 * @throws {ApiError}
 */
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error; // request cancelled on purpose
    throw new ApiError(0, 'Le serveur ne répond pas. Vérifiez votre connexion ou réessayez plus tard.');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // A token was sent but refused: the session has expired
    if (response.status === 401 && token && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiError(response.status, data?.message ?? 'Une erreur est survenue.', data?.erreurs ?? []);
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, options),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

// The species rarely change: they are loaded once and shared by
// the header and the list page (one request instead of two).
let especesPromise = null;

/** @returns {Promise<{id_espece: number, nom_espece: string}[]>} */
export function getEspeces() {
  if (!especesPromise) {
    especesPromise = api.get('/especes').catch((error) => {
      especesPromise = null; // try again next time
      throw error;
    });
  }
  return especesPromise;
}
