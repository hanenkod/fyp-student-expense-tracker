# Student Expense Tracker (Final Year Project)

A student-focused expense tracking web application designed to help university students manage their monthly budget and reduce financial stress through a clear and actionable daily spending limit.

---

##  Project Overview
Many university students experience financial pressure due to rising living costs and irregular income. Existing budgeting tools can feel too complex, time-consuming, or overwhelming to maintain consistently. This project aims to provide a lightweight, student-centred alternative that prioritises clarity, speed, and usability.

The key idea of the application is to show one high-impact insight on the Dashboard:

**“Safe-to-spend today”** — how much money the student can spend today without exceeding their monthly budget.

---

##  Unique Selling Proposition (USP)
**Instant daily spending clarity:** the application prioritises one actionable number (“You can spend today”) that students can understand within seconds, supported by transaction history, scheduled payments, and simple category insights.

---

##  Target Users
- Full-time undergraduate students (18–25) living on a tight monthly budget  
- Students with irregular income (part-time work, international students, mixed support sources)  
- Users who want a simple budgeting tool without spreadsheet-level complexity

---

##  What is an MVP and why is it used here?
**MVP (Minimum Viable Product)** means the smallest version of the application that still delivers the core value to users and can be tested and evaluated.

This project uses an **MVP-first strategy** to keep the scope realistic and deliverable within the available timeframe. The MVP focuses on the main user goal:

**A student can quickly see how much they can safely spend today (≤20 seconds).**

Once the MVP is complete and evaluated, additional features can be added in later iterations.

---

##  Key Features

### MVP (Must-have)
- Dashboard showing **Safe-to-spend today**
- Monthly budget setup (income + planned fixed payments)
- Expense logging (quick add)
- Transactions list
- Scheduled payments (fixed upcoming costs)
- Basic category breakdown

### Future improvements (After MVP)
- Authentication (sign up / log in)
- Database + backend API for persistent storage
- Advanced analytics (monthly trends, deeper breakdowns)
- Simple insights / warnings based on spending patterns


---

##  Safe-to-spend today (calculation logic)
The daily spending amount is calculated using a simple baseline formula:

1. **Monthly budget**  
   `MonthlyBudget = IncomeThisMonth − PlannedFixedPaymentsThisMonth`

2. **Remaining monthly budget**  
   `RemainingBudget = MonthlyBudget − SpentSoFarThisMonth`

3. **Days left in month**  
   `DaysLeft = TotalDaysInMonth − TodayDayNumber + 1`

4. **Safe-to-spend today**  
   `SafeToSpendToday = RemainingBudget / DaysLeft`

This keeps the calculation transparent and easy to explain in the final report.

---

##  Planned Architecture 
- **Frontend:** React (Vite)
- **Data layer (MVP):** Mock data → local storage (early prototype)
- **Future extension:** Backend API + database for authentication and persistent storage

---

##  Evaluation Plan 
The primary usability task is:

**Task 1:** “Find how much I can safely spend today.”

Success will be measured using:
- **Efficiency:** ≥80% of users find the value within **20 seconds**
- **Errors:** ≤1 wrong action/misclick per task (average)
- **Perceived ease:** average rating ≥4/5 (Likert scale)
- *(Optional)* competitor benchmark comparison if time allows

---

##  Project Management (Kanban)
A GitHub Projects Kanban board is used to track progress weekly:
- Backlog
- To do
- In progress
- Review/Test
- Done

Issues are linked to commits using issue references (e.g., `#12`).

---

##  Getting Started (Local Development)

### Requirements
- Node.js (LTS recommended)
- npm

### Run the project
```bash
npm install
npm run dev
```

Then open:
http://localhost:5173/

## Repository Structure
```text
src/
  pages/          # Main pages (Dashboard, Transactions, etc.)
  components/     # Reusable UI components
  utils/          # Calculation logic (SafeToSpendToday)
  data/           # Mock data for early prototyping
docs/
  erd/            # ERD diagram (draw.io + PNG)
  risk-register.md
  evaluation-plan.md


```
## Legal / Ethical Notes
This project follows GDPR-aware principles:
- Minimal data collection
- Clear user control over stored financial data
- No automated financial decision-making or predictive modelling in MVP
- User testing will be conducted with informed consent and anonymised results


## Author
**Dmytro Hanenko**  
University of Roehampton — Final Year Project (2025/2026)

