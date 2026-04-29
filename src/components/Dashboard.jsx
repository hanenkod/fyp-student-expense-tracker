/**
 * Dashboard — the main landing page after login.
 *
 * Composes the headline "Safe to spend today" card, monthly budget
 * progress, recent transactions list, savings goals snapshot, and a
 * 7-day spending bar chart. All data comes from useData() (transactions,
 * scheduled payments, goals) and useAuth() (income, name).
 *
 * Safe-to-spend is computed here using the same Method 2 formula that
 * SafeToSpendCard documents in its tooltip, so the headline figure
 * and the breakdown shown when the user clicks "How it's calculated?"
 * always agree to the penny.
 */
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Card, CardHeader, CardContent, CardFooter } from "./Card";
import { BarChartMock } from "./BarChartMock";
import { SavingsPanel } from "./SavingsPanel";
import { SafeToSpendCard } from "./SafeToSpendCard";
import { MetricCard } from "./MetricCard";
import { TrendArrow } from "./TrendArrow";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { LoadingScreen } from "./LoadingScreen";
import { isInCurrentMonth, getDaysLeftInMonth } from "../utils/date";

import "../styles/style.css";
import "../styles/dashboard.css";

const formatPercent = (value) => `${Math.round(value)}%`;

const barColors = ["bar--lilac", "bar--indigo", "bar--accent", "bar--deep"];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { formatMoney, currencyInfo } = useSettings();
  const formatCurrency = formatMoney;
  const formatCurrencyFixed = (v) => formatMoney(v, { minFractionDigits: 2, maxFractionDigits: 2 });

  const { user } = useAuth();
  const { transactions: allTransactions, scheduled: scheduledPayments, goals: savingsGoals, loading } = useData();

  // Onboarding/user fields are now part of the user record on the server.
  const onboardingData = { income: user?.income || 0, expenses: user?.expenses || 0 };
  const userData = { name: user?.name, email: user?.email };

  if (loading) {
    return <LoadingScreen />;
  }

  const income = Number(onboardingData.income || 0);

  const now = new Date();
  const remainingDays = getDaysLeftInMonth(now);

  // Real totals from transactions
  const thisMonthTx = allTransactions.filter((t) => isInCurrentMonth(t.date, now));

  const totalExpenses = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalIncome = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // Sum of all active subscriptions counted as monthly debits.
  const upcomingSubscriptions = scheduledPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  // True current balance = monthly income + extra income this month - expenses this month.
  // Can go negative if user overspent.
  const currentBalance = income + totalIncome - totalExpenses;

  // Safe to Spend Today uses the same formula the card itself documents
  // (Method 2 — Extended), so the headline figure and the breakdown
  // shown when the user clicks "How it's calculated?" always match.
  // The fixed-expenses term comes from onboardingData; logged income
  // increases the pool, logged expenses and upcoming subscriptions
  // shrink it.
  const fixedExpenses = Number(onboardingData.expenses || 0);
  const remainingBudget = Math.max(
    0,
    income - fixedExpenses - totalExpenses + totalIncome - upcomingSubscriptions
  );
  const safeToSpend = remainingDays > 0 ? remainingBudget / remainingDays : 0;

  const remainingPercent = income > 0 ? Math.max(0, (currentBalance / income) * 100) : 0;
  const displayIncome = totalIncome > 0 ? totalIncome : income;
  const expensePercent = income > 0 ? (totalExpenses / income) * 100 : 0;
  const expensePercentDisplay = Math.min(999, expensePercent);

  // Savings rate — what % of all available money is not spent (capped 0-100)
  const availableIncome = income + totalIncome;
  const savingsRate = availableIncome > 0
    ? Math.max(0, Math.min(100, ((availableIncome - totalExpenses) / availableIncome) * 100))
    : 0;

  const balancePositive = currentBalance > 0;
  const savingsPositive = savingsRate >= 20;
  const expensePositive = expensePercent <= 100;

  let paceStatus = "positive";
  let paceText = "Healthy plan";
  if (expensePercent > 80) {
    paceStatus = "danger";
    paceText = "Heavy spending";
  } else if (expensePercent > 50) {
    paceStatus = "warning";
    paceText = "Moderate spending";
  }

  // Recent transactions
  const recentTx = [...allTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  // Savings
  const totalSaved = savingsGoals.reduce((s, g) => s + (g.saved || 0), 0);
  const savingsPanelData = savingsGoals.slice(0, 2).map((g) => ({
    title: g.title,
    leftAmount: formatCurrency(g.saved || 0),
    percent: g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
    target: formatCurrency(g.target),
    progressValue: g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
  }));

  // Daily spending chart (last 12 days, left=oldest → right=newest)
  const dailySpending = {};
  thisMonthTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const day = new Date(t.date).getDate();
      dailySpending[day] = (dailySpending[day] || 0) + Number(t.amount || 0);
    });

  const trendDays = [];
  const dayOfMonth = now.getDate();
  for (let i = Math.max(1, dayOfMonth - 11); i <= dayOfMonth; i++) {
    trendDays.push(i);
  }

  const maxSpend = Math.max(...trendDays.map((d) => dailySpending[d] || 0), 1);
  const trendBars = trendDays.map((d, idx) => ({
    height: Math.max(((dailySpending[d] || 0) / maxSpend) * 130, 4),
    className: barColors[idx % barColors.length],
  }));

  const maxLabel = Math.ceil(maxSpend / 10) * 10 || 10;

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />

          <main className="content">
            <header className="overview card card-soft card-overview">
              <div className="overview-bar">
                <div className="overview-text stack-5">
                  <h1 className="overview-title">Overview</h1>
                  <p className="overview-subtitle">
                    Here is summary of your finances
                    {userData.name ? `, ${userData.name}` : ""}
                  </p>
                </div>
              </div>
            </header>

            {allTransactions.length === 0 && scheduledPayments.length === 0 && savingsGoals.length === 0 ? (
              <section className="dashboard-empty">
                <div className="dashboard-empty__illus" aria-hidden="true">💸</div>
                <h2 className="dashboard-empty__title">Welcome to POCKE, {userData.name || "there"}!</h2>
                <p className="dashboard-empty__text">
                  You're all set up. Start tracking your money by adding your first transaction —
                  everything on this dashboard will come to life as you go.
                </p>
                <div className="dashboard-empty__actions">
                  <button
                    type="button"
                    className="dashboard-empty__btn dashboard-empty__btn--primary"
                    onClick={() => navigate("/transactions")}
                  >
                    Add your first transaction
                  </button>
                  <button
                    type="button"
                    className="dashboard-empty__btn"
                    onClick={() => navigate("/whatif")}
                  >
                    Try the What-If Planner
                  </button>
                </div>

                <div className="dashboard-empty__hints">
                  <div className="dashboard-empty__hint">
                    <strong>Track spending</strong>
                    <span>Log expenses and income to see daily and monthly summaries</span>
                  </div>
                  <div className="dashboard-empty__hint">
                    <strong>Set goals</strong>
                    <span>Save towards trips, gadgets or an emergency fund</span>
                  </div>
                  <div className="dashboard-empty__hint">
                    <strong>Plan ahead</strong>
                    <span>Simulate big purchases before you commit</span>
                  </div>
                </div>
              </section>
            ) : (
            <>
            <section className="grid-top">
              <SafeToSpendCard
                title="Safe to Spend Today"
                amount={formatCurrencyFixed(safeToSpend)}
                income={income}
                fixedExpenses={fixedExpenses}
                loggedExpenses={totalExpenses}
                loggedIncome={totalIncome}
                upcomingSubscriptions={upcomingSubscriptions}
                daysLeft={remainingDays}
                currencySymbol={currencyInfo.symbol}
              />
              <MetricCard
                className="card--sm metric-accent"
                title="Current Balance"
                value={formatCurrency(currentBalance)}
                footer={
                  <div className={`chip ${balancePositive ? "chip-positive" : "chip-negative"}`}>
                    <span>{formatPercent(remainingPercent)} left</span>
                    <TrendArrow direction={balancePositive ? "up" : "down"} />
                  </div>
                }
              />
            </section>

            <section className="grid-middle">
              <Card className="transactions card--xl card-soft">
                <CardHeader
                  title="Recent Transactions"
                  action={
                    <button className="btn-mini chip chip-seeall" type="button" onClick={() => navigate("/transactions")}>
                      See all
                    </button>
                  }
                />
                <CardContent className="card-content--section">
                  {recentTx.length === 0 ? (
                    <p className="empty-message">
                      No transactions yet
                    </p>
                  ) : (
                    <ul className="list">
                      {recentTx.map((t) => (
                        <li className="row" key={t.id}>
                          <span className={`dot dot--${(t.category || "other").toLowerCase().replace(/\s+/g, "-")}`} />
                          <span className="row-title">{t.name}</span>
                          <span className={`row-amount row-amount--${t.type}`}>
                            {t.type === "expense" ? "-" : "+"}{formatCurrencyFixed(t.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="card-footer--tight" />
              </Card>

              <Card className="savings card--xl card-soft">
                <CardHeader>
                  <div className="stack-8">
                    <div className="card-title">Savings</div>
                    <div className="stack-5">
                      <div className="card-muted">Total Savings</div>
                      <div className="card-value">{formatCurrency(totalSaved)}</div>
                    </div>
                  </div>
                  <div className="card-header__action">
                    <button className="btn-mini chip chip-seeall" type="button" onClick={() => navigate("/transactions")}>Manage</button>
                  </div>
                </CardHeader>
                <CardContent className="card-content--sectionless">
                  <div className="subcards">
                    {savingsPanelData.length === 0 ? (
                      <p className="empty-message">
                        No savings goals yet
                      </p>
                    ) : (
                      savingsPanelData.map((p) => <SavingsPanel key={p.title} {...p} />)
                    )}
                  </div>
                </CardContent>
                <CardFooter className="card-footer--tight" />
              </Card>

              <div className="right-col">
                <div className="right-metrics">
                  <MetricCard
                    className="card--sm card-soft"
                    title="Total Income"
                    value={formatCurrency(displayIncome)}
                    footer={
                      <div className={`chip ${savingsPositive ? "chip-positive" : "chip-negative"}`}>
                        <span>{formatPercent(savingsRate)} saved</span>
                        <TrendArrow direction={savingsPositive ? "up" : "down"} />
                      </div>
                    }
                  />
                  <MetricCard
                    className="card--sm card-soft"
                    title="Total Expense"
                    value={formatCurrency(totalExpenses)}
                    footer={
                      <div className={`chip ${expensePositive ? "chip-positive" : "chip-negative"}`}>
                        <span>{formatPercent(expensePercentDisplay)} of income</span>
                        <TrendArrow direction={expensePositive ? "up" : "down"} />
                      </div>
                    }
                  />
                </div>

                <Card className="scheduled card--md card-soft">
                  <CardHeader
                    title="Scheduled Payments"
                    action={
                      <button className="btn-mini chip chip-seeall" type="button" onClick={() => navigate("/transactions")}>See all</button>
                    }
                  />
                  <CardContent className="card-content--section">
                    {scheduledPayments.length === 0 ? (
                      <p className="empty-message empty-message--compact">
                        No scheduled payments
                      </p>
                    ) : (
                      <ul className="list">
                        {scheduledPayments.slice(0, 3).map((p) => (
                          <li className="row" key={p.id || p.name}>
                            <span className="dot dot--subscriptions" />
                            <span className="row-title">{p.name}</span>
                            <span className="row-amount">{formatCurrencyFixed(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                  <CardFooter className="card-footer--tight" />
                </Card>
              </div>
            </section>

            <section className="grid-bottom">
              <Card className="trends card--lg card-soft">
                <CardHeader
                  className="card-header--stack"
                  title="Spending Trends"
                  subtitle="Daily spending this month"
                />
                <CardContent className="card-content--chart">
                  <div className="chart-layout">
                    <div className="chart-ylabels">
                      <span>{currencyInfo.symbol}{maxLabel}</span>
                      <span>{currencyInfo.symbol}{Math.round(maxLabel * 0.66)}</span>
                      <span>{currencyInfo.symbol}{Math.round(maxLabel * 0.33)}</span>
                      <span>{currencyInfo.symbol}0</span>
                    </div>
                    <BarChartMock bars={trendBars} />
                  </div>
                </CardContent>
                <CardFooter className="card-footer--tight" />
              </Card>

              <Card className="pace card--lg card-soft">
                <CardHeader title="Monthly Expense Plan" />
                <CardContent className="card-content--pace">
                  <div className={`pace-pill pace-pill--${paceStatus}`}>
                    <span className={`dot tiny dot-${paceStatus}`} />
                    <span>{paceText}</span>
                  </div>
                  <p className="pace-muted">How healthy is your monthly plan?</p>
                  <p className="pace-strong">
                    Spent this month: {formatCurrencyFixed(totalExpenses)} of {formatCurrencyFixed(income)} income
                  </p>
                  <p className="pace-strong">
                    This equals {formatPercent(expensePercent)} of your income
                  </p>
                </CardContent>
                <CardFooter className="card-footer--tight" />
              </Card>
            </section>
            </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};