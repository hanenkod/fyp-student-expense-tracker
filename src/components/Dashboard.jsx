import { Sidebar } from "./Sidebar";
import { Card } from "./Card";
import { BarChartMock } from "./BarChartMock";
import { SavingsPanel } from "./SavingsPanel";
import { SafeToSpendCard } from "./SafeToSpendCard";
import { MetricCard } from "./MetricCard";

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

export const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />

          <main className="content">
            {/* OVERVIEW */}
            <header className="overview">
              <h1 className="overview-title">Overview</h1>
              <p className="overview-subtitle">
                Here is summary of your finances
              </p>
            </header>

            {/* TOP ROW */}
            <section className="grid-top">
              <SafeToSpendCard
                title="Safe to Spend Today"
                amount="£30"
                actionText="How it’s calculated?"
                onAction={() => console.log("How it's calculated")}
              />

              <MetricCard
                title="Current Balance"
                value="£1230"
                footer={<div className="chip">+20.45%</div>}
              />
            </section>

            {/* MIDDLE ROW */}
            <section className="grid-middle">
              <Card className="transactions">
                <div className="card__content">
                  <div className="card-head">
                    <div className="card-title">Recent Transactions</div>
                    <button className="btn-mini chip" type="button">
                      See all
                    </button>
                  </div>

                  <div className="card__section">
                    <ul className="list">
                      {transactions.map((t) => (
                        <li className="row" key={`${t.name}-${t.amount}`}>
                          <span className="dot" />
                          <span className="row-title">{t.name}</span>
                          <span className="row-amount">{t.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card__footer card__footer--tight" />
              </Card>

              {/* Savings */}
              <Card className="savings">
                <div className="card__content">
                  <div className="card-head">
                    <div>
                      <div className="card-title">Savings</div>
                      <div className="card-muted">Total Savings</div>
                      <div className="card-value">£800</div>
                    </div>

                    <button className="btn-mini chip" type="button">
                      See all
                    </button>
                  </div>

                  <div className="subcards">
                    {savingsPanels.map((p) => (
                      <SavingsPanel key={p.title} {...p} />
                    ))}
                  </div>
                </div>

                <div className="card__footer card__footer--tight" />
              </Card>

              {/* Right column */}
              <div className="right-col">
                <div className="right-metrics">
                  <MetricCard
                    title="Total Income"
                    value="£5230"
                    footer={<div className="chip">+30%</div>}
                  />

                  <MetricCard
                    title="Total Expense"
                    value="£4280"
                    footer={<div className="chip">+15%</div>}
                  />
                </div>

                {/* Scheduled Payments */}
                <Card className="scheduled">
                  <div className="card__content">
                    <div className="card-head">
                      <div className="card-title">Scheduled Payments</div>
                      <button className="btn-mini chip" type="button">
                        See all
                      </button>
                    </div>

                    <div className="card__section">
                      <ul className="list">
                        {scheduledPayments.map((p) => (
                          <li className="row" key={`${p.name}-${p.amount}`}>
                            <span className="dot" />
                            <span className="row-title">{p.name}</span>
                            <span className="row-amount">{p.amount}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="card__footer card__footer--tight" />
                </Card>
              </div>
            </section>

            {/* BOTTOM ROW */}
            <section className="grid-bottom">
              {/* Earning Trends */}
              <Card className="trends">
                <div className="card__content">
                  <div className="card-title">Earning Trends</div>
                  <div className="card-muted">
                    Here is summary of your finances
                  </div>

                  <BarChartMock
                    bars={[46, 90, 60, 117, 93, 46, 73, 113, 86, 102, 61, 80]}
                  />

                  <div className="ylabels">
                    <span>£200</span>
                    <span>£100</span>
                    <span>£50</span>
                    <span>£10</span>
                  </div>
                </div>

                <div className="card__footer card__footer--tight" />
              </Card>

              {/* Budget Pace */}
              <Card className="pace">
                <div className="card__content">
                  <div className="card-title">Budget Pace</div>

                  <div className="pace-pill">
                    <span className="dot tiny" />
                    <span>Slightly over pace</span>
                  </div>

                  <p className="pace-muted">Are you on track this month?</p>
                  <p className="pace-strong">
                    You should have spent ≤ £1,420 by today
                  </p>
                  <p className="pace-strong">You have spent £1,560</p>
                </div>

                <div className="card__footer card__footer--tight" />
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};