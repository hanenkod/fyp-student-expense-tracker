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

export const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />

          <main className="content">
            <header className="overview stack-5 card card-soft card-overview">
              <h1 className="overview-title">Overview</h1>
              <p className="overview-subtitle">
                Here is summary of your finances
              </p>
            </header>

            <section className="grid-top">
              <SafeToSpendCard
                title="Safe to Spend Today"
                amount="£30"
                actionText="How it’s calculated?"
                onAction={() => console.log("How it's calculated")}
              />

              <MetricCard
                className="card--sm metric-accent"
                title="Current Balance"
                value="£1230"
                footer={
                  <div className="chip chip-positive">
                    <span>+15%</span>
                    <TrendArrow direction="up" />
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
                <CardHeader
                  action={
                    <button className="btn-mini chip chip-seeall" type="button">
                      See all
                    </button>
                  }
                >
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
                    value="£5230"
                    footer={
                      <div className="chip chip-negative">
                        <span>-15%</span>
                        <TrendArrow direction="down" />
                      </div>
                    }
                  />

                  <MetricCard
                    className="card--sm card-soft"
                    title="Total Expense"
                    value="£4280"
                    footer={
                      <div className="chip chip-positive">
                        <span>+15%</span>
                        <TrendArrow direction="up" />
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
                <CardHeader title="Budget Pace" />

                <CardContent className="card-content--pace">
                  <div className="pace-pill">
                    <span className="dot tiny dot-warning" />
                    <span>Slightly over pace</span>
                  </div>

                  <p className="pace-muted">Are you on track this month?</p>
                  <p className="pace-strong">
                    You should have spent ≤ £1,420 by today
                  </p>
                  <p className="pace-strong">You have spent £1,560</p>
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