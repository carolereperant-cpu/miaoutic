// ============================================================
// components/Feedback.jsx
// Loading indicator and error message, shared by every page.
// role="status" / role="alert" make screen readers announce them.
// ============================================================

export function Loader({ label = 'Chargement en cours…' }) {
  return (
    <div className="text-center py-5" role="status" aria-live="polite">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <p className="mt-2 mb-0">{label}</p>
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
