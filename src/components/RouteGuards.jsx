import { Navigate } from "react-router-dom";

const getStoredJSON = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const isUserLoggedIn = () => {
  const session = getStoredJSON("pockeSession");
  return Boolean(session?.isLoggedIn);
};

const isOnboardingCompleted = () => {
  const onboarding = getStoredJSON("pockeOnboarding");
  return Boolean(onboarding?.completed);
};

const hasRegisteredUser = () => {
  const user = getStoredJSON("pockeUser");
  return Boolean(user?.email);
};

export const ProtectedDashboardRoute = ({ children }) => {
  if (isUserLoggedIn()) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export const ProtectedOnboardingRoute = ({ children }) => {
  if (!hasRegisteredUser()) {
    return <Navigate to="/registration" replace />;
  }

  if (isOnboardingCompleted()) {
    if (isUserLoggedIn()) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AuthOnlyRoute = ({ children }) => {
  if (isUserLoggedIn()) {
    if (isOnboardingCompleted()) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};
