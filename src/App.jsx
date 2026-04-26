import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
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

          <Route
            path="/analytics"
            element={<Navigate to="/whatif" replace />}
          />

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
    </AuthProvider>
  );
}

export default App;
