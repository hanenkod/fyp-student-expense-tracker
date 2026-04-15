import { Sidebar } from "./Sidebar";
import { Card, CardHeader, CardContent, CardFooter } from "./Card";
import { BarChartMock } from "./BarChartMock";
import { SavingsPanel } from "./SavingsPanel";
import { SafeToSpendCard } from "./SafeToSpendCard";
import { MetricCard } from "./MetricCard";
import { TrendArrow } from "./TrendArrow";

import "../styles/style.css";

const transactions = [
  { name: "Tesco", amount: "-£80" },
  { name: "Vodafone", amount: "-£20" },
  { name: "Mom", amount: "+£300" },
  { name: "Transport For London", amount: "-£10.45" },
  { name: "Student Finance", amount: "+£4280" },
  { name: "McDonald’s", amount: "-£15" },
];

const scheduledPayments = [
  { name: "Spotify", amount: "£7.99" },
  { name: "Youtube Premium", amount: "£16.99" },
  { name: "Pure Gym", amount: "£32.99" },
];

const savingsPanels = [
  {
    title: "Emergency",
    leftAmount: "£800",
    percent: 80,
    target: "£1000",
    progressValue: 80,
  },
  {
    title: "Vacation",
    leftAmount: "£0",
    target: "£2000",
    progressValue: 0,
  },
];

const trendBars = [
  { height: 42, className: "bar--lilac" },
  { height: 90, className: "bar--indigo" },
  { height: 60, className: "bar--accent" },
  { height: 117, className: "bar--deep" },
  { height: 93, className: "bar--indigo" },
  { height: 46, className: "bar--lilac" },
  { height: 73, className: "bar--accent" },
  { height: 113, className: "bar--deep" },
  { height: 86, className: "bar--indigo" },
  { height: 102, className: "bar--deep" },
  { height: 61, className: "bar--accent" },
  { height: 80, className: "bar--indigo" },
];

const getStoredJSON = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const formatCurrency = (value) => {
  return `£${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatCurrencyFixed = (value) => {
  return `£${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value) => {
  return `${Math.round(value)}%`;
};

const getMonthMeta = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth + 1;

  return {
    dayOfMonth,
    daysInMonth,
    remainingDays,
  };
};

export const Dashboard = () => {
  const onboardingData = getStoredJSON("pockeOnboarding");
  const userData = getStoredJSON("pockeUser");

  const income = Number(onboardingData.income || 0);
  const expenses = Number(onboardingData.expenses || 0);

  const { remainingDays } = getMonthMeta();

  const remainingBudget = Math.max(income - expenses, 0);
  const safeToSpend = remainingDays > 0 ? remainingBudget / remainingDays : 0;

  const remainingPercent = income > 0 ? (remainingBudget / income) * 100 : 0;
  const incomeCoveragePercent =
    expenses > 0 ? (income / expenses) * 100 : income > 0 ? 100 : 0;
  const expensePercent = income > 0 ? (expenses / income) * 100 : 0;

  const incomeCoveragePositive = income >= expenses;
  const expensePositive = expenses <= income;
  const balancePositive = remainingBudget > 0;

  let paceStatus = "warning";
  let paceText = "Moderate plan";

  if (expensePercent <= 50) {
    paceStatus = "positive";
    paceText = "Healthy plan";
  } else if (expensePercent <= 80) {
    paceStatus = "warning";
    paceText = "Moderate plan";
  } else {
    paceStatus = "danger";
    paceText = "Heavy plan";
  }

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
                actionText="How it’s calculated?"
                onAction={() =>
                  console.log("Safe to Spend:", {
                    income,
                    expenses,
                    remainingBudget,
                    remainingDays,
                    safeToSpend,
                  })
                }
              />

              <MetricCard
                className="card--sm metric-accent"
                title="Current Balance"
                value={formatCurrency(remainingBudget)}
                footer={
                  <div
                    className={`chip ${
                      balancePositive ? "chip-positive" : "chip-negative"
                    }`}
                  >
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
                    <button className="btn-mini chip chip-seeall" type="button">
                      See all
                    </button>
                  }
                />

                <CardContent className="card-content--section">
                  <ul className="list">
                    {transactions.map((t) => (
                      <li className="row" key={`${t.name}-${t.amount}`}>
                        <span className="dot" />
                        <span className="row-title">{t.name}</span>
                        <span className="row-amount">{t.amount}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="card-footer--tight" />
              </Card>

              <Card className="savings card--xl card-soft">
                <CardHeader>
                  <div className="stack-8">
                    <div className="card-title">Savings</div>

                    <div className="stack-5">
                      <div className="card-muted">Total Savings</div>
                      <div className="card-value">£800</div>
                    </div>
                  </div>

                  <div className="card-header__action">
                    <button className="btn-mini chip chip-seeall" type="button">
                      See all
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="card-content--sectionless">
                  <div className="subcards">
                    {savingsPanels.map((p) => (
                      <SavingsPanel key={p.title} {...p} />
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="card-footer--tight" />
              </Card>

              <div className="right-col">
                <div className="right-metrics">
                  <MetricCard
                    className="card--sm card-soft"
                    title="Total Income"
                    value={formatCurrency(income)}
                    footer={
                      <div
                        className={`chip ${
                          incomeCoveragePositive
                            ? "chip-positive"
                            : "chip-negative"
                        }`}
                      >
                        <span>{formatPercent(incomeCoveragePercent)} cover</span>
                        <TrendArrow
                          direction={incomeCoveragePositive ? "up" : "down"}
                        />
                      </div>
                    }
                  />

                  <MetricCard
                    className="card--sm card-soft"
                    title="Total Expense"
                    value={formatCurrency(expenses)}
                    footer={
                      <div
                        className={`chip ${
                          expensePositive ? "chip-positive" : "chip-negative"
                        }`}
                      >
                        <span>{formatPercent(expensePercent)} of income</span>
                        <TrendArrow direction={expensePositive ? "up" : "down"} />
                      </div>
                    }
                  />
                </div>

                <Card className="scheduled card--md card-soft">
                  <CardHeader
                    title="Scheduled Payments"
                    action={
                      <button className="btn-mini chip chip-seeall" type="button">
                        See all
                      </button>
                    }
                  />

                  <CardContent className="card-content--section">
                    <ul className="list">
                      {scheduledPayments.map((p) => (
                        <li className="row" key={`${p.name}-${p.amount}`}>
                          <span className="dot" />
                          <span className="row-title">{p.name}</span>
                          <span className="row-amount">{p.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="card-footer--tight" />
                </Card>
              </div>
            </section>

            <section className="grid-bottom">
              <Card className="trends card--lg card-soft">
                <CardHeader
                  className="card-header--stack"
                  title="Earning Trends"
                  subtitle="Here is summary of your finances"
                />

                <CardContent className="card-content--chart">
                  <div className="chart-layout">
                    <div className="chart-ylabels">
                      <span>£200</span>
                      <span>£100</span>
                      <span>£50</span>
                      <span>£10</span>
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
                    Planned monthly expenses: {formatCurrencyFixed(expenses)}
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