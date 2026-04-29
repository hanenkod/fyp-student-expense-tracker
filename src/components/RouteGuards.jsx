/**
 * Route guards for the React Router tree.
 *
 * Each guard reads from useAuth() and decides whether to render the
 * wrapped page or redirect:
 *
 *   - AuthOnlyRoute            — only for unauthenticated visitors.
 *   - ProtectedOnboardingRoute — for users who are logged in but
 *                                haven't completed onboarding yet.
 *   - ProtectedDashboardRoute  — for users who are logged in AND
 *                                have completed onboarding.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingScreen } from "./LoadingScreen";

/**
 * For pages that should only show to unauthenticated visitors
 * (registration, login). Already-authenticated users are routed to
 * their next logical destination.
 */
export const AuthOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen variant="full" />;
  if (user) {
    return (
      <Navigate to={user.onboarded ? "/dashboard" : "/onboarding"} replace />
    );
  }
  return children;
};

/**
 * Authenticated, but not yet onboarded. Already-onboarded users go
 * straight to the dashboard; unauthenticated users to login.
 */
export const ProtectedOnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen variant="full" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user.onboarded) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * Main app routes — must be authenticated AND onboarded. Otherwise
 * redirect to login or onboarding accordingly.
 */
export const ProtectedDashboardRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen variant="full" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};
