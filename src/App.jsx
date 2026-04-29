/**
 * Application shell.
 *
 * Wraps the React Router tree in the three app-wide context providers
 * in dependency order: Auth first (everyone depends on it), Settings
 * next (it now reads currency from user.settingsJson), then Data
 * (depends on Auth). Defines every route, each gated by the
 * appropriate RouteGuard.
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { SettingsProvider } from "./components/SettingsContext";
import { DataProvider } from "./components/DataContext";
import { Dashboard } from "./components/Dashboard";
import { Registration } from "./components/Registration";
import { Login } from "./components/Login";
import { Onboarding } from "./components/Onboarding";
import { Profile } from "./components/Profile";
import { Transactions } from "./components/Transactions";
import { Settings } from "./components/Settings";
import { WhatIf } from "./components/WhatIf";
import {
  AuthOnlyRoute,
  ProtectedDashboardRoute,
  ProtectedOnboardingRoute,
} from "./components/RouteGuards";

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DataProvider>
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
                path="/transactions"
                element={
                  <ProtectedDashboardRoute>
                    <Transactions />
                  </ProtectedDashboardRoute>
                }
              />

              <Route
                path="/whatif"
                element={
                  <ProtectedDashboardRoute>
                    <WhatIf />
                  </ProtectedDashboardRoute>
                }
              />

              {/* Legacy redirect — analytics page was renamed to whatif. */}
              <Route path="/analytics" element={<Navigate to="/whatif" replace />} />

              <Route
                path="/settings"
                element={
                  <ProtectedDashboardRoute>
                    <Settings />
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
        </DataProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;