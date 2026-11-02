// ============================================================
// hooks/useApi.js
// Loads data from the API for a page, and gives its state:
//   const { data, loading, error, reload } = useApi('/animaux');
// The request is cancelled if the user leaves the page before
// the answer (AbortController): no update of a page that is gone.
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

/**
 * @param {string|null} path - API path, or null to wait (nothing loaded)
 */
export function useApi(path) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  // Identifies the current request: a new path or a reload makes a new key
  const key = path === null ? null : `${path}#${reloadCount}`;

  useEffect(() => {
    if (key === null) return undefined;

    const controller = new AbortController();
    api.get(path, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key, data: null, error });
      });

    return () => controller.abort();
  }, [key, path]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  // Loading as long as the answer of the current request has not arrived
  const loading = key !== null && result.key !== key;

  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
  };
}
