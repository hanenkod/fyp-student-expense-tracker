# POCKE Backend

REST API for the POCKE Student Expense Tracker. Built with Node.js, Express, Prisma and SQLite.

## Quick start

```bash
cd server
npm install              # installs deps + auto-runs prisma generate
cp .env.example .env     # default values are fine for development
npx prisma migrate dev   # creates prisma/dev.db and applies migrations
npm run dev              # starts http://localhost:4000
```

The frontend (`cd ..` → `npm run dev`) talks to this server via `VITE_API_URL` (defaults to `http://localhost:4000`).

## Environment variables

| Name             | Purpose                              | Example                             |
|------------------|--------------------------------------|-------------------------------------|
| `DATABASE_URL`   | SQLite file location                 | `file:./dev.db`                     |
| `JWT_SECRET`     | Token signing key — change in prod   | long random string                  |
| `JWT_EXPIRES_IN` | Token lifetime                       | `168h`                              |
| `PORT`           | API port                             | `4000`                              |
| `CORS_ORIGIN`    | Allowed frontend origin              | `http://localhost:5173`             |

## API surface

All endpoints under `/api/*` except auth require `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth/register` — `{email, password, name?}` → `{token, user}`
- `POST /api/auth/login` — `{email, password}` → `{token, user}`

### User
- `GET    /api/users/me` — current profile (no password)
- `PATCH  /api/users/me` — partial profile update (name, email, income, expenses, settings, categories)
- `POST   /api/users/me/password` — `{current, new}`
- `DELETE /api/users/me` — wipe account + all data
- `POST   /api/users/me/migrate` — one-shot import from LocalStorage

### Transactions
- `GET    /api/transactions`
- `POST   /api/transactions` — `{type, name, category, amount, date, source?, goalId?}`
- `PATCH  /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Scheduled Payments
- `GET    /api/scheduled`
- `POST   /api/scheduled` — `{name, amount, frequency, startDate}`
- `DELETE /api/scheduled/:id`

### Goals
- `GET    /api/goals`
- `POST   /api/goals` — `{title, icon?, target, saved?, color?}`
- `PATCH  /api/goals/:id`
- `DELETE /api/goals/:id` — refunds saved amount as an income transaction
- `POST   /api/goals/:id/add` — `{amount}` → updates goal + creates expense tx
- `POST   /api/goals/:id/withdraw` — `{amount}` → updates goal + creates income tx

## Useful commands

```bash
npm run dev           # Hot-reload server (Node --watch)
npm run prisma:studio # Open Prisma Studio at http://localhost:5555
npm run db:reset      # Drop and recreate the DB (dev only)
```

## Production notes

- Switch `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma` and re-run `prisma migrate dev` against the new DB URL.
- Replace `JWT_SECRET` with a long random string (e.g. `openssl rand -hex 64`).
- Set `CORS_ORIGIN` to your deployed frontend URL.
- bcrypt cost factor 12 is intentional — slow on purpose to resist brute force.
