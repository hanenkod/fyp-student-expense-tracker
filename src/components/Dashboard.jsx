import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Card, CardHeader, CardContent, CardFooter } from "./Card";
import { BarChartMock } from "./BarChartMock";
import { SavingsPanel } from "./SavingsPanel";
import { SafeToSpendCard } from "./SafeToSpendCard";
import { MetricCard } from "./MetricCard";
import { TrendArrow } from "./TrendArrow";
import { useSettings } from "./SettingsContext";

import "../styles/style.css";
import "../styles/dashboard.css";

const getStoredJSON = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const formatPercent = (value) => `${Math.round(value)}%`;

const barColors = ["bar--lilac", "bar--indigo", "bar--accent", "bar--deep"];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { formatMoney, currencyInfo } = useSettings();
  const formatCurrency = formatMoney;
  const formatCurrencyFixed = (v) => formatMoney(v, { minFractionDigits: 2, maxFractionDigits: 2 });

  const onboardingData = getStoredJSON("pockeOnboarding") || {};
  const userData = getStoredJSON("pockeUser") || {};
  const allTransactions = getStoredJSON("pockeTransactions") || [];
  const scheduledPayments = getStoredJSON("pockeScheduledPayments") || [];
  const savingsGoals = getStoredJSON("pockeGoals") || [];

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

  // True current balance = monthly income + extra income this month - expenses this month.
  // Can go negative if user overspent.
  const currentBalance = income + totalIncome - totalExpenses;
  // Remaining budget from the onboarding income only (used for Safe to Spend, capped at 0).
  const remainingBudget = Math.max(income - totalExpenses, 0);
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

            <section className="grid-top">
              <SafeToSpendCard
                title="Safe to Spend Today"
                amount={formatCurrencyFixed(safeToSpend)}
                income={income}
                expenses={totalExpenses}
                currentBalance={currentBalance}
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
          </main>
        </div>
      </div>
    </div>
  );
};