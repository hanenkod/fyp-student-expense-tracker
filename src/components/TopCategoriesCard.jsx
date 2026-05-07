/**
 * TopCategoriesCard — compact card listing the user's three biggest
 * spending categories for the current month.
 *
 * Shown in the left column of the Transactions page above the
 * AddTransactionForm. Each row carries a coloured rank badge (1/2/3),
 * the category name, the amount spent, a thin progress bar showing
 * its share of total monthly expenses, and that share as a percentage
 * label underneath. When the user has no expense transactions for
 * the current month the card collapses to a friendly empty state.
 */
import { Card, CardHeader, CardContent } from "./Card";
import { useSettings } from "./SettingsContext";

const MAX_ROWS = 3;

/**
 * Aggregate expenses by category and return the top N rows sorted
 * descending by amount. Categories with zero or missing names fall
 * back to "Other" so the badge always has a target.
 */
const buildTopCategories = (transactions, totalExpenses) => {
  const totals = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "Other";
      totals[cat] = (totals[cat] || 0) + Number(t.amount || 0);
    });

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ROWS)
    .map(([name, amount]) => ({
      name,
      amount,
      share: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }));
};

export const TopCategoriesCard = ({ thisMonthTx, totalExpenses }) => {
  const { formatMoneyFixed } = useSettings();
  const rows = buildTopCategories(thisMonthTx, totalExpenses);

  return (
    <Card className="top-categories card-soft">
      <CardHeader
        className="card-header--stack"
        title="Top Spending Categories"
        subtitle="Where your money went this month"
      />
      <CardContent className="card-content--top-categories">
        {rows.length === 0 ? (
          <p className="empty-message">
            No expenses logged yet this month.
          </p>
        ) : (
          <ul className="top-categories__list">
            {rows.map((row, index) => (
              <li key={row.name} className="top-categories__row">
                <span
                  className={`top-categories__rank top-categories__rank--${index + 1}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="top-categories__body">
                  <div className="top-categories__head">
                    <span className="top-categories__name">{row.name}</span>
                    <span className="top-categories__amount">
                      {formatMoneyFixed(row.amount)}
                    </span>
                  </div>
                  <div className="top-categories__bar">
                    <div
                      className="top-categories__bar-fill"
                      style={{ width: `${row.share}%` }}
                    />
                  </div>
                  <span className="top-categories__share">
                    {Math.round(row.share)}% of monthly spending
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};