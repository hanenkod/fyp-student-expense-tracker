/**
 * ToastContext — minimal toast notification system.
 *
 * Toasts auto-dismiss after `duration` ms (default 3 seconds) and can
 * also carry an action button — used for "Undo" on destructive ops.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast("Saved", { type: "success" });
 *   showToast("Deleted", {
 *     action: { label: "Undo", onClick: () => restore() },
 *   });
 */
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

/** Map a toast type to its default leading glyph. */
const defaultIcon = (type) => {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "!";
    default:
      return "i";
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Mark a toast as leaving (triggers fade-out animation), then remove
   * it from state once the animation has finished.
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  /**
   * Show a new toast.
   *
   * @param {string} message
   * @param {object} [options]
   * @param {"success"|"error"|"warning"|"info"} [options.type="info"]
   * @param {number} [options.duration=3000]  auto-dismiss after ms; 0 disables
   * @param {string} [options.icon]           override the default icon
   * @param {{label:string,onClick:()=>void}} [options.action]
   */
  const showToast = useCallback(
    (message, options = {}) => {
      const { type = "info", duration = 3000, icon, action } = options;
      const id = ++toastIdCounter;
      const toast = { id, message, type, icon, action, leaving: false };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  const handleActionClick = (e, toast) => {
    e.stopPropagation();
    if (toast.action?.onClick) toast.action.onClick();
    removeToast(toast.id);
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast--${t.type} ${t.leaving ? "toast--leaving" : ""}`}
            onClick={() => !t.action && removeToast(t.id)}
          >
            <span className="toast__icon">{t.icon || defaultIcon(t.type)}</span>
            <span className="toast__message">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="toast__action"
                onClick={(e) => handleActionClick(e, t)}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              className="toast__close"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
