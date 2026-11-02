// ============================================================
// components/FormField.jsx
// Text field with its label and its error message.
// Accessibility: the label is linked to the field (htmlFor/id),
// the error is linked with aria-describedby and the field is
// marked aria-invalid, so screen readers read the error.
// ============================================================

export default function FormField({ id, label, error, help, children, ...inputProps }) {
  const describedBy = [help ? `${id}-aide` : null, error ? `${id}-erreur` : null].filter(Boolean).join(' ');

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-semibold">{label}</label>
      <input
        id={id}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {help && <div id={`${id}-aide`}>{help}</div>}
      {error && <div id={`${id}-erreur`} className="invalid-feedback d-block">{error}</div>}
      {children}
    </div>
  );
}
