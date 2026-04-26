import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Full-screen loading spinner shown while the AuthProvider is verifying
 * the JWT against the API on first mount.
 */
const AuthLoading = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "var(--bg-app, #0e0d1f)",
      color: "#9391a0",
      fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
      fontSize: 14,
    }}
  >
    Loading…
  </div>
);

/**
 * Routes for unauthenticated users only — registration and login.
 * If the visitor IS logged in, send them to /dashboard or /onboarding
 * depending on whether they've finished setup.
 */
export const AuthOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (user) {
    return <Navigate to={user.onboarded ? "/dashboard" : "/onboarding"} replace />;
  }
  return children;
};

/**
 * Onboarding-only — the visitor must be logged in but have NOT yet
 * completed onboarding. Already-onboarded users go to dashboard;
 * unauthenticated users go to login.
 */
export const ProtectedOnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user.onboarded) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * Main app routes. The visitor must be logged in AND have completed
 * onboarding. Otherwise redirect to /login or /onboarding accordingly.
 */
export const ProtectedDashboardRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};
