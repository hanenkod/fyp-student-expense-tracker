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
    return (
      <div className="dashboard">
        <div className="app-shell">
          <div className="layout">
            <Sidebar />
            <main className="content" style={{ display: "grid", placeItems: "center", minHeight: "60vh", color: "#9391a0" }}>
              Loading…
            </main>
          </div>
        </div>
      </div>
    );
  }

  const income = Number(onboardingData.income || 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth + 1;

  // Real totals from transactions
  const thisMonthTx = allTransactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

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

  // True once the user has logged anything at all. Drives whether
  // the Welcome block (no data) or the lower grid sections (data
  // present) show below the headline strip.
  const hasAnyData =
    allTransactions.length > 0 ||
    scheduledPayments.length > 0 ||
    savingsGoals.length > 0;

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

  // Daily spending chart — last 7 days, oldest on the left, today on
  // the right. Each bar carries a date label so the chart has an
  // explicit time axis. Used to be a 12-day rolling window without
  // labels, which made it hard to read; usability testing flagged
  // both issues.
  const dailySpending = {};
  thisMonthTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const day = new Date(t.date).getDate();
      dailySpending[day] = (dailySpending[day] || 0) + Number(t.amount || 0);
    });

  const TREND_WINDOW = 7;
  const trendDates = [];
  for (let offset = TREND_WINDOW - 1; offset >= 0; offset--) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    trendDates.push(d);
  }

  const trendValues = trendDates.map((d) => dailySpending[d.getDate()] || 0);
  // Bar heights scale against the max spend in the window. We keep
  // an unrounded numeric maxSpend for the height calculation, then
  // expose the same number to the y-axis labels so the top label
  // reads the actual peak rather than a rounded-up value.
  const maxSpend = Math.max(...trendValues, 1);

  const trendBars = trendDates.map((d, idx) => {
    const value = trendValues[idx];
    // Compose tooltip strings here so the chart component stays
    // formatting-agnostic. Empty days show "No spending" instead of
    // "£0.00" — the latter looks like a logged zero-pound transaction.
    const dateLabel = d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const tooltip = {
      amount: value > 0 ? formatCurrencyFixed(value) : "No spending",
      date: dateLabel,
      aria:
        value > 0
          ? `${formatCurrencyFixed(value)} spent on ${dateLabel}`
          : `No spending on ${dateLabel}`,
    };
    return {
      // Bars with a value get proportional height (max ~95px so they
      // fit inside the 100px bars area); empty bars get a thin
      // baseline tick so the axis still reads as continuous.
      height: value > 0 ? Math.max((value / maxSpend) * 95, 6) : 3,
      className: barColors[idx % barColors.length],
      label: d.getDate(),
      tooltip,
    };
  });

  // Aggregates over the same 7-day window — shown alongside the chart
  // so users see both the shape (bars) and the headline numbers
  // (total, average, peak day) without doing the maths in their head.
  const trendTotal = trendValues.reduce((s, v) => s + v, 0);
  const trendAverage = trendTotal / TREND_WINDOW;
  const trendPeakIndex = trendValues.reduce(
    (best, v, i) => (v > trendValues[best] ? i : best),
    0
  );
  const trendPeakValue = trendValues[trendPeakIndex] || 0;
  const trendPeakDate = trendDates[trendPeakIndex];

  // Format the peak day as e.g. "Mon 6". When there's no spending in
  // the window at all we render a dash instead of a misleading date.
  const trendPeakLabel =
    trendPeakValue > 0
      ? trendPeakDate.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
        })
      : "—";

  // Active days — how many of the 7 days had any spending at all. A
  // proxy for engagement / habit-streak that doesn't require us to
  // judge whether a given amount counts as "good" or "bad".
  const trendActiveDays = trendValues.filter((v) => v > 0).length;

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

            {/*
             * The headline strip (Safe to Spend, Current Balance,
             * Total Income/Expense, Scheduled Payments) is always
             * rendered, even on a brand-new account. Usability
             * testing showed users decode the Safe-to-Spend value in
             * seconds; surfacing it on the very first visit means we
             * don't hide the app's most distinctive feature behind
             * an onboarding screen. When there's no data yet, the
             * Welcome block appears below this strip with hints and
             * shortcuts.
             */}
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

            {!hasAnyData && (
              <section className="dashboard-empty">
                <div className="dashboard-empty__illus" aria-hidden="true">💸</div>
                <h2 className="dashboard-empty__title">Welcome to POCKE, {userData.name || "there"}!</h2>
                <p className="dashboard-empty__text">
                  Your Safe-to-Spend above is the figure to watch — it
                  updates the moment you start logging real spending.
                  Add your first transaction to see the rest of the
                  dashboard come to life.
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
            )}

            {hasAnyData && (
              <>
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
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)", textAlign: "center", padding: "20px 0" }}>
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
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)", textAlign: "center", padding: "20px 0" }}>
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
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)", textAlign: "center", padding: "12px 0" }}>
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
                  subtitle="Daily spending — last 7 days"
                />
                <CardContent className="card-content--chart">
                  <div className="chart-layout">
                    <div className="chart-ylabels">
                      {/*
                       * Y-axis ticks at exact values rather than rounded
                       * intervals so the top label always matches the
                       * tallest bar. Previously we rounded up to the
                       * nearest 10 which made e.g. £325 spending show
                       * "£330" at the top — confusingly above the bar.
                       */}
                      <span>{formatCurrencyFixed(maxSpend)}</span>
                      <span>{formatCurrencyFixed(maxSpend * 0.66)}</span>
                      <span>{formatCurrencyFixed(maxSpend * 0.33)}</span>
                      <span>{formatCurrencyFixed(0)}</span>
                    </div>
                    <BarChartMock bars={trendBars} />
                  </div>

                  <div className="chart-stats">
                    <div className="chart-stat">
                      <span className="chart-stat__label">Total spent</span>
                      <span className="chart-stat__value">
                        {formatCurrencyFixed(trendTotal)}
                      </span>
                      <span className="chart-stat__sub">over 7 days</span>
                    </div>

                    <div className="chart-stat">
                      <span className="chart-stat__label">Daily average</span>
                      <span className="chart-stat__value">
                        {formatCurrencyFixed(trendAverage)}
                      </span>
                      <span className="chart-stat__sub">per day</span>
                    </div>

                    <div className="chart-stat">
                      <span className="chart-stat__label">Highest day</span>
                      <span className="chart-stat__value">
                        {formatCurrencyFixed(trendPeakValue)}
                      </span>
                      <span className="chart-stat__sub">{trendPeakLabel}</span>
                    </div>

                    <div className="chart-stat">
                      <span className="chart-stat__label">Active days</span>
                      <span className="chart-stat__value">
                        {trendActiveDays} / {TREND_WINDOW}
                      </span>
                      <span className="chart-stat__sub">days with spend</span>
                    </div>
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