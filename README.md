# POCKE — Student Expense Tracker
 
A web application that helps students stay on top of their finances by
showing how much they can safely spend each day. Built as a final-year
BSc project at the University of Roehampton.
 
## Features
 
- **Safe to Spend Today** — daily allowance based on your remaining
  budget, days left in the month, logged transactions and upcoming
  subscriptions
- **Transactions** — log income and expenses with custom categories
  and inline editing
- **Scheduled Payments** — track recurring subscriptions with quick
  presets (Spotify, Netflix, gym, etc.)
- **Savings Goals** — set targets, contribute with one-tap £10/£50/£100
  buttons, withdraw or delete with automatic refunds
- **What-If Planner** — model the impact of cancelling subscriptions,
  changing income, or adjusting category budgets — without touching
  real data
- **Achievements** — gamified progress markers based on actual usage
- **Export** — full JSON backup or transactions-only CSV
- **Multi-currency** — pick GBP, USD or EUR during onboarding (locked
  per account; no live conversion)
- **Light & dark theme**
## Tech Stack
 
**Frontend**
- React 19 + Vite
- React Router 7
**Backend**
- Node.js + Express
- Prisma ORM
- SQLite (dev) — schema is portable to PostgreSQL by changing one
  line in `schema.prisma`
- JWT authentication, bcrypt password hashing (cost factor 12)
- Zod request validation
## Prerequisites
 
You need:
 
- **Node.js** version 18 or higher → [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git** → [git-scm.com](https://git-scm.com)
Check your versions:
 
```bash
node --version    # should be v18.x or higher
npm --version
```
 
## Quick Start
 
```bash
# 1. Clone the repo
git clone <your-repo-url> pocke
cd pocke
 
# 2. Install frontend dependencies
npm install
 
# 3. Install backend dependencies
cd server
npm install
 
# 4. Set up the backend environment
cp .env.example .env
 
# 5. Initialise the database
npx prisma migrate dev --name init
 
# 6. Back to the project root
cd ..
 
# 7. Run frontend + backend together
npm run dev
```
 
The app will be available at:
 
- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:4000
- **API health check** → http://localhost:4000/health
`npm run dev` uses `concurrently` to start both servers in one
terminal. Logs from frontend and server are colour-coded.
 
## Project Structure
 
```
pocke/
├── src/                    # Frontend (React + Vite)
│   ├── components/         # React components
│   ├── styles/             # CSS files
│   ├── utils/              # Shared helpers (api, json, date, migration)
│   ├── assets/             # SVG icons
│   ├── App.jsx
│   └── main.jsx
└── server/                 # Backend (Express + Prisma)
    ├── prisma/
    │   └── schema.prisma   # Database schema
    └── src/
        ├── lib/            # Prisma client, JWT, ownership helper
        ├── middleware/     # Auth + error handling
        ├── routes/         # API routes (auth, users, transactions, scheduled, goals)
        └── index.js        # Express entry point
```
## Troubleshooting
 
**Port 4000 or 5173 already in use**
Either kill the running process (`lsof -i :4000`) or change `PORT`
in `server/.env` and `VITE_API_URL` in the project's root `.env`.
 
**`PrismaClient` errors after pulling new code**
Run `cd server && npx prisma generate` to regenerate the client.
 
**Wiping the database**
```bash
cd server
npm run db:reset
```
 
**Stuck logged in / weird auth state**
Open DevTools → Application → Storage → clear all `pocke*` keys in
LocalStorage, then refresh.
 
**CORS errors**
Make sure `CORS_ORIGIN` in `server/.env` matches the URL your
frontend is running on (default `http://localhost:5173`).
ised results


## Author
**Dmytro Hanenko**  
University of Roehampton — Final Year Project (2025/2026)

