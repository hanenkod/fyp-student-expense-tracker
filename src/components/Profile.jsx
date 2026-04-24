import { Sidebar } from "./Sidebar";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { ProfileAchievements } from "./ProfileAchievements";
import { ProfilePersonalInfo } from "./ProfilePersonalInfo";
import { ProfileBudgetTips } from "./ProfileBudgetTips";
import { ProfileFinancialSummary } from "./ProfileFinancialSummary";
import "../styles/style.css";
import "../styles/profile.css";

const getStoredJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Profile page — thin wrapper composing 5 focused sub-components:
 *   1. ProfileSummaryCard     — avatar, name/email, 3 headline stats, Log Out + Delete Account
 *   2. ProfileAchievements    — 8 rule-based achievement cards
 *   3. ProfilePersonalInfo    — editable fields + password change
 *   4. ProfileBudgetTips      — rule-based advice cards
 *   5. ProfileFinancialSummary — tiles, Income vs Spending bar, budget pace marker
 *
 * All data aggregation happens once here and is passed down as props
 * so child components stay stateless and testable.
 */
export const Profile = () => {
  const userData = getStoredJSON("pockeUser");
  const onboardingData = getStoredJSON("pockeOnboarding");
  const transactions = getStoredJSON("pockeTransactions") || [];

  const income = Number(onboardingData?.income || 0);

  // Aggregate current-month numbers — single source of truth for every child.
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlySpent = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const monthlyEarned = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

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
              {/* ── Left column ── */}
              <div className="profile-left-col">
                <ProfileSummaryCard
                  name={userData?.name}
                  email={userData?.email}
                  income={income}
                  expenses={expenses}
                  balance={balance}
                />
                <ProfileAchievements
                  transactions={transactions}
                  onboardingData={onboardingData}
                  income={income}
                  expenses={expenses}
                />
              </div>

              {/* ── Right column ── */}
              <div className="profile-right-col">
                <ProfilePersonalInfo
                  userData={userData}
                  onboardingData={onboardingData}
                  income={income}
                />
                <ProfileBudgetTips
                  income={income}
                  expenses={expenses}
                  transactions={transactions}
                  onboardingData={onboardingData}
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