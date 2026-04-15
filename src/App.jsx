import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import { Registration } from "./components/Registration";
import { Login } from "./components/Login";
import { Onboarding } from "./components/Onboarding";
import { Profile } from "./components/Profile";
import {
  AuthOnlyRoute,
  ProtectedDashboardRoute,
  ProtectedOnboardingRoute,
} from "./components/RouteGuards";

const PlaceholderPage = ({ title }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#dddddd",
        fontFamily: "Inter, sans-serif",
        fontSize: "24px",
        fontWeight: 700,
      }}
    >
      {title}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/registration" replace />} />

        <Route
          path="/registration"
          element={
            <AuthOnlyRoute>
              <Registration />
            </AuthOnlyRoute>
          }
        />

        <Route
          path="/login"
          element={
            <AuthOnlyRoute>
              <Login />
            </AuthOnlyRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedOnboardingRoute>
              <Onboarding />
            </ProtectedOnboardingRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedDashboardRoute>
              <Dashboard />
            </ProtectedDashboardRoute>
          }
        />

        <Route
          path="/cards"
          element={
            <ProtectedDashboardRoute>
              <PlaceholderPage title="Cards" />
            </ProtectedDashboardRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedDashboardRoute>
              <PlaceholderPage title="Analytics" />
            </ProtectedDashboardRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedDashboardRoute>
              <PlaceholderPage title="Settings" />
            </ProtectedDashboardRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedDashboardRoute>
              <Profile />
            </ProtectedDashboardRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;