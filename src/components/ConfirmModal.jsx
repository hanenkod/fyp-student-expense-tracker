import { useEffect } from "react";

/**
 * Accessible modal dialog for confirming destructive actions.
 * Replaces the default window.confirm() with a branded version.
 *
 * Props:
 *   open           — boolean
 *   title          — string (main question, e.g. "Delete goal?")
 *   message        — string (details, optional)
 *   confirmLabel   — label for confirm button (default "Delete")
 *   cancelLabel    — label for cancel button (default "Cancel")
 *   confirmKind    — "danger" | "primary" (color of confirm button)
 *   onConfirm      — called when user confirms
 *   onCancel       — called when user cancels / closes
 */
export const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmKind = "danger",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal__icon confirm-modal__icon--danger" aria-hidden="true">
          {confirmKind === "danger" ? "⚠" : "?"}
        </div>
        <h3 id="confirm-modal-title" className="confirm-modal__title">{title}</h3>
        {message && <p className="confirm-modal__message">{message}</p>}
        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__btn confirm-modal__btn--cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal__btn confirm-modal__btn--${confirmKind}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};