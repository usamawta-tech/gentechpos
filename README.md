# GenTech POS

A point-of-sale (POS) web application for small retail stores and cafés. Built with
Next.js (App Router), Prisma, and SQLite. It supports sales checkout, product and
inventory management, customer records, staff accounts with role-based access,
reporting, and emailed receipts.

## Features

- **POS checkout** — barcode/name lookup, cart, discounts, tax, and multiple payment methods (Cash / Card / Other).
- **Products & inventory** — CRUD for products with categories, pricing, barcodes, and stock levels.
- **Customers** — maintain a customer directory and link sales to customers.
- **Sales history** — browse past sales and re-send receipts.
- **Emailed receipts** — send receipts over SMTP (falls back to an Ethereal test inbox when SMTP is not configured).
- **Reports & dashboard** — sales totals, trends, and low-stock insights.
- **Staff & roles** — user accounts with `ADMIN` and `CASHIER` roles, JWT session auth.
- **Store settings** — configurable store name, address, phone, and receipt footer.

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Database:** SQLite via [Prisma](https://www.prisma.io/) ORM
- **Auth:** JWT sessions signed with [`jose`](https://github.com/panva/jose); passwords hashed with `bcryptjs`
- **Email:** [Nodemailer](https://nodemailer.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4

## Getting started

### Prerequisites

- Node.js 18+ and npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLite connection string. Default: `file:./dev.db` |
| `AUTH_SECRET` | Secret used to sign session JWTs. Use a random string of at least 32 characters. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional SMTP settings for emailing receipts. If left blank, a temporary Ethereal test inbox is used and a preview link is returned instead of real delivery. |

### 3. Set up the database

```bash
npx prisma migrate dev
npm run seed
```

This creates the SQLite database, applies migrations, and seeds sample products,
customers, and two demo users.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo credentials

The seed script creates two accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@pos.com` | `admin123` |
| Cashier | `cashier@pos.com` | `cashier123` |

> Change or remove these before deploying to production.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run the linter |
| `npm run seed` | Seed the database with sample data |

## Project structure

```
app/
  (app)/        Authenticated pages: POS, products, customers, sales, reports, staff, settings
  api/          Route handlers for auth, products, customers, sales, reports, settings, users
  login/        Login page
components/      Shared UI (Sidebar, Receipt, BarChart, ThemeToggle)
lib/            Auth, session, Prisma client, mailer, formatting helpers
prisma/         Schema, migrations, and seed script
```

## License

Private / unlicensed. All rights reserved.
