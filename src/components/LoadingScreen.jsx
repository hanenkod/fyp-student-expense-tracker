/**
 * LoadingScreen — full-page placeholder shown while data is in flight.
 *
 * Replaces a 6-line inline-styled `<main>` block that was duplicated in
 * Dashboard, Profile, Transactions, WhatIf and a smaller variant in
 * RouteGuards. The two variants:
 *
 *   <LoadingScreen />            — centred inside the main content area
 *                                  (page-level shell with sidebar).
 *   <LoadingScreen variant="full" /> — fills the whole viewport, used by
 *                                  RouteGuards before the auth context
 *                                  has finished its initial getMe().
 */
import { Sidebar } from "./Sidebar";

export const LoadingScreen = ({ variant = "page" }) => {
  if (variant === "full") {
    return <div className="loading-screen loading-screen--full">Loading…</div>;
  }

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />
          <main className="content loading-screen loading-screen--page">
            Loading…
          </main>
        </div>
      </div>
    </div>
  );
};
