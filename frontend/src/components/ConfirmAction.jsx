// ============================================================
// components/ConfirmAction.jsx
// Button for an action that cannot be undone (delete, accept an
// adoption...). A first click asks for confirmation in the page,
// a second click runs the action. No browser popup (window.confirm
// is not styled and blocks the page).
// The keyboard focus goes to the confirmation button.
// ============================================================

import { useEffect, useRef, useState } from 'react';

/**
 * @param {object} props
 * @param {string} props.label - text of the first button
 * @param {string} [props.hiddenLabel] - end of the label read only by screen
 *   readers, e.g. the animal name ("Supprimer" -> "Supprimer Pépette")
 * @param {string} props.question - question shown before confirming
 * @param {string} [props.confirmLabel]
 * @param {() => Promise<void>} props.onConfirm - the action (handles its own errors)
 * @param {string} [props.buttonClass] - Bootstrap class of the first button
 * @param {string} [props.confirmClass] - Bootstrap class of the confirmation button
 */
export default function ConfirmAction({
  label,
  hiddenLabel,
  question,
  confirmLabel = 'Confirmer',
  onConfirm,
  buttonClass = 'btn-outline-primary',
  confirmClass = 'btn-primary',
}) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const confirmRef = useRef(null);
  const firstButtonRef = useRef(null);
  const cancelled = useRef(false);

  // Focus: on the confirmation button when it appears, and back on
  // the first button after "Non" (once it is shown again)
  useEffect(() => {
    if (confirming) {
      confirmRef.current?.focus();
    } else if (cancelled.current) {
      cancelled.current = false;
      firstButtonRef.current?.focus();
    }
  }, [confirming]);

  const cancel = () => {
    cancelled.current = true;
    setConfirming(false);
  };

  const confirm = async () => {
    setSending(true);
    try {
      await onConfirm();
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button ref={firstButtonRef} type="button" className={`btn btn-sm ${buttonClass}`} onClick={() => setConfirming(true)}>
        {label}
        {hiddenLabel && <>{' '}<span className="visually-hidden">{hiddenLabel}</span></>}
      </button>
    );
  }

  return (
    <span className="d-inline-flex flex-wrap align-items-center gap-2" role="group" aria-label={question}>
      <span className="fw-semibold">{question}</span>
      <button ref={confirmRef} type="button" className={`btn btn-sm ${confirmClass}`} onClick={confirm} disabled={sending}>
        {sending ? 'Patientez…' : confirmLabel}
      </button>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancel} disabled={sending}>
        Non
      </button>
    </span>
  );
}
