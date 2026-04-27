/**
 * Profile page — composition root for five focused sub-components.
 *
 * This file's only job is to fetch the user and the transaction list
 * once, derive the current-month aggregates, and pass everything down
 * as props. No state, no side effects — children stay easy to test.
 */
import { Sidebar } from "./Sidebar";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { ProfileAchievements } from "./ProfileAchievements";
import { ProfilePersonalInfo } from "./ProfilePersonalInfo";
import { ProfileBudgetTips } from "./ProfileBudgetTips";
import { ProfileFinancialSummary } from "./ProfileFinancialSummary";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import "../styles/style.css";
import "../styles/profile.css";

export const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: dataLoading } = useData();

  if (authLoading || dataLoading) {
    return (
      <div className="dashboard">
        <div className="app-shell">
          <div className="layout">
            <Sidebar />
            <main
              className="content"
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: "60vh",
                color: "#9391a0",
              }}
            >
              Loading…
            </main>
          </div>
        </div>
      </div>
    );
  }

  const income = Number(user?.income || 0);

  // Current-month aggregates. Computed once here and passed to every
  // child that needs them, so we don't recompute in three places.
  const now = new Date();
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const monthlySpent = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthlyEarned = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const expenses = monthlySpent;
  const balance = income + monthlyEarned - monthlySpent;

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />
          <main className="content">
            <header className="overview card card-soft card-overview">
              <div className="overview-bar">
                <div className="overview-text stack-5">
                  <h1 className="overview-title">Profile</h1>
                  <p className="overview-subtitle">
                    Manage your personal information
                  </p>
                </div>
              </div>
            </header>

            <div className="profile-layout">
              <div className="profile-left-col">
                <ProfileSummaryCard
                  name={user?.name}
                  email={user?.email}
                  createdAt={user?.createdAt}
                  income={income}
                  expenses={expenses}
                  balance={balance}
                />
                <ProfileAchievements
                  transactions={transactions}
                  income={income}
                  expenses={expenses}
                />
              </div>

              <div className="profile-right-col">
                <ProfilePersonalInfo />
                <ProfileBudgetTips
                  income={income}
                  expenses={expenses}
                  transactions={transactions}
                />
                <ProfileFinancialSummary
                  income={income}
                  expenses={expenses}
                  monthlyEarned={monthlyEarned}
                  monthlySpent={monthlySpent}
                  thisMonthCount={thisMonthTx.length}
                  totalTransactions={transactions.length}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
