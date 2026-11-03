// ============================================================
// components/Feedback.jsx
// Loading indicator and error message, shared by every page.
// role="status" / role="alert" make screen readers announce them.
// ============================================================

import { useEffect, useState } from 'react';

// On a free hosting plan the API goes to sleep when nobody uses it,
// and needs up to a minute to wake up: after this delay the user is
// told why it is long, instead of thinking the site is broken.
export const SLOW_DELAY_MS = 5000;

export function Loader({ label = 'Chargement en cours…' }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center py-5" role="status" aria-live="polite">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <p className="mt-2 mb-0">{label}</p>
      {slow && (
        <p className="small text-muted mt-1 mb-0">
          Le serveur se réveille, cela peut prendre jusqu'à une minute.
        </p>
      )}
    </div>
  );
}

export function ErrorAlert({ error, children }) {
  if (!error && !children) return null;
  return (
    <div className="alert alert-danger" role="alert">
      {children ?? error.message}
    </div>
  );
}
