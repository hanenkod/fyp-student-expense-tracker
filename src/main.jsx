import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/settings.css";
import "./styles/animations.css";
import App from "./App.jsx";
import { ToastProvider } from "./components/ToastContext.jsx";

// SettingsProvider used to live here, but it now depends on AuthContext
// (to read the user's locked currency from settingsJson). It's been
// moved into App.jsx, inside AuthProvider, where the auth context is
// available. ToastProvider stays here because it has no dependencies
// and can wrap anything.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);