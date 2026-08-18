# Checkout Flow

A product checkout / payment-onboarding app: browse a single store product, pay with a
credit card through a sandbox payment gateway, and see stock update live. Built as a
technical assessment covering both a NestJS API (hexagonal architecture, Railway Oriented
Programming) and a React + Redux SPA.

> This repository intentionally avoids naming the payment provider in its name/commit
> history per the test's confidentiality note; the integration itself is documented below
> and in code as "the payment gateway".

## Table of contents

- [Architecture](#architecture)
- [Data model](#data-model)
- [API docs (Swagger / Postman)](#api-docs)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Testing & coverage](#testing--coverage)
- [Security](#security)
- [Deployment](#deployment)
- [Rubric self-check](#rubric-self-check)

## Architecture

```
checkout-flow-test/
├── backend/    NestJS API — hexagonal architecture, Railway Oriented Programming
├── frontend/   React + Redux Toolkit SPA — mobile-first, 5-step checkout
├── infra/      Terraform scaffold for AWS
└── docs/       Postman collection, deployment guide
```

### Backend: hexagonal architecture + ROP

Each business module (`products`, `customers`, `deliveries`, `transactions`) is split into
three layers:

```
modules/<name>/
├── domain/            Framework-agnostic entities + repository "ports" (interfaces)
├── application/        Use cases — the only place business rules live
└── infrastructure/
    ├── persistence/    TypeORM adapters implementing the domain ports
    ├── http/            Controllers + DTOs (the only Nest-aware layer besides modules)
    └── payment/         The payment-gateway adapter (transactions module only)
```

Controllers never contain business logic — they call a use case and translate its
[`Result`](backend/src/shared/domain/result.ts) into an HTTP response. Every use case
returns `Result<T, DomainError>` instead of throwing for expected failures (validation, not
found, out of stock, gateway errors), which is what "Railway Oriented Programming" means
here: each step of a flow either continues on the success track or short-circuits on the
failure track, composably, without `try/catch` scattered through the business logic. See
[`pay-transaction.use-case.ts`](backend/src/modules/transactions/application/pay-transaction.use-case.ts)
for the clearest example — it chains gateway call → poll-until-final → persist → stock
update, any of which can fail without the others running.

Swapping the database (e.g. TypeORM/Postgres → DynamoDB) or the payment gateway means
writing a new adapter behind the existing port; no use case or controller changes.

### Frontend: 5-step flow as Redux state, not routes

Per the brief, the app is a single page that walks through 5 steps:

1. **Product** — stock/price, quantity picker.
2. **Card + delivery info** — a modal (`PaymentInfoModal`) validates the card (Luhn +
   Visa/Mastercard detection) and delivery fields, tokenizes the card *directly with the
   payment gateway* using the public key (see [Security](#security)), then creates the
   customer/delivery/transaction(`PENDING`) in the backend.
3. **Summary** — a Material "backdrop"-style sheet showing product amount + base fee +
   delivery fee, with the pay button.
4. **Final status** — approved/declined/error, with the transaction reference.
5. **Back to Product** — re-fetches the catalog so the updated stock is visible.

State lives in Redux (`checkoutSlice` + `productsSlice`), and only `checkoutSlice` is
persisted to `localStorage` via `redux-persist`. That's what satisfies "the app must
recover progress on refresh": mid-flow, the customer/delivery/transaction/card-token/step
survive a reload; `products` is always re-fetched fresh so stock is never shown stale.

## Data model

```
products                    customers                  deliveries
─────────────────           ─────────────────           ──────────────────────
id            uuid PK       id             uuid PK       id                uuid PK
name          varchar       full_name      varchar       customer_id       uuid FK → customers
description   text          email          varchar UQ     address_line     varchar
price_in_cents int          phone_number   varchar       city              varchar
image_url     varchar       document_type  varchar       region            varchar
sku           varchar UQ    document_number varchar      postal_code       varchar
stock_quantity int                                       country           varchar
                                                          delivery_fee_in_cents int

transactions
──────────────────────────────
id                     uuid PK
reference              varchar UQ   -- our own checkout reference, sent to the gateway
product_id             uuid FK → products
customer_id            uuid FK → customers
delivery_id            uuid FK → deliveries
quantity               int
product_amount_in_cents int
base_fee_in_cents      int
delivery_fee_in_cents  int
amount_in_cents        int          -- product + base fee + delivery fee
status                 enum(PENDING, APPROVED, DECLINED, ERROR, VOIDED)
gateway_transaction_id varchar null -- id assigned by the payment gateway once charged
created_at / updated_at timestamp
```

Full DDL: [`backend/src/migrations/1728500000000-InitSchema.ts`](backend/src/migrations/1728500000000-InitSchema.ts).
ORM entity definitions (source of truth for column types): `backend/src/modules/*/infrastructure/persistence/*.orm-entity.ts`.

**Why this shape:** `transactions` carries a frozen snapshot of the three amounts
(`product_amount_in_cents`, `base_fee_in_cents`, `delivery_fee_in_cents`) rather than just
`amount_in_cents`, so the summary screen and any later audit can show the breakdown even if
the product's price changes afterwards. `reference` is unique and generated before any call
to the payment gateway, so the `PENDING` row always exists first — the gateway is only ever
told about a transaction that's already durable on our side.

## API docs

- **Swagger UI**: `GET /docs` once the backend is running (e.g. `http://localhost:3000/docs`).
- **Postman collection**: [`docs/postman_collection.json`](docs/postman_collection.json) —
  import it into Postman; it uses a `{{baseUrl}}` variable (defaults to
  `http://localhost:3000`).

| Method | Path                       | Purpose                                              |
| ------ | -------------------------- | ----------------------------------------------------- |
| GET    | `/products`                | List products with current stock                      |
| GET    | `/products/:id`             | Get one product                                       |
| POST   | `/customers`                | Create a customer (idempotent by email)                |
| POST   | `/deliveries`                | Create delivery info, computes the delivery fee        |
| POST   | `/transactions`              | Create a `PENDING` transaction, computes the total     |
| POST   | `/transactions/:id/pay`       | Charge through the gateway, settle status + stock      |
| GET    | `/transactions/:id`           | Read current transaction status                        |
| GET    | `/health`                    | Liveness check                                          |

## Getting started

### Prerequisites

- Node.js 22+, npm
- Docker (for Postgres locally, or run the whole stack with `docker compose up`)

### Backend

```bash
cd backend
cp .env.example .env         # sandbox gateway keys already filled in from the test brief
docker compose -f ../docker-compose.yml up -d postgres   # or point DB_* at your own Postgres
npm install
npm run migration:run
npm run seed                 # seeds 4 dummy products
npm run start:dev            # http://localhost:3000, docs at /docs
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

### Whole stack with Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
# backend  -> http://localhost:3000
# frontend -> http://localhost:5173
```

## Environment variables

See [`backend/.env.example`](backend/.env.example) and
[`frontend/.env.example`](frontend/.env.example). Notably:

- The sandbox keys in `backend/.env.example` are the ones provided in the test brief
  (`pub_stagtest_...` / `prv_stagtest_...`), sandbox-only, never production keys.
- **Card data never reaches the backend.** The frontend tokenizes the card directly against
  the payment gateway using the *public* key (`VITE_WOMPI_PUBLIC_KEY`); only the resulting
  token is sent to our API. The backend's `WOMPI_PRIVATE_KEY` is used server-side only, to
  actually create/query the charge.

### Sandbox test cards

Despite accepting only "fake" data by design, the gateway's sandbox does **not** accept
arbitrary Luhn-valid numbers — only specific numbers from its own test suite (this tripped
us up during testing: a made-up-but-Luhn-valid number gets a `422` with
`"El número de tarjeta usado no es aceptado en el ambiente de pruebas."`). Use one of:

- `4242 4242 4242 4242` (Visa)
- `5555 5555 5555 4444` (Mastercard)

with any future expiry date, any CVC, and a card-holder name of **at least 5 characters**
(also gateway-enforced — this repo's client-side validation matches it). The
`PaymentInfoModal` shows this same hint inline.

Transaction creation additionally requires an integrity signature: `SHA-256(reference +
amount_in_cents + currency + integrity_secret)`, sent as `signature`. Implemented in
[`wompi-payment.adapter.ts`](backend/src/modules/transactions/infrastructure/payment/wompi-payment.adapter.ts) —
easy to miss since the gateway's docs describe it mainly for the hosted widget checkout, but
the direct transaction-creation endpoint rejects requests without it too.

## Testing & coverage

Both projects use **Jest**, run against real business logic (use cases, reducers, card
validation) with dependencies mocked at the port boundary (repositories, the payment
gateway adapter, HTTP clients) — no network or database needed to run the suite.

### Backend — `cd backend && npm run test:cov`

```
Test Suites: 18 passed, 18 total
Tests:       82 passed, 82 total

All files       | 99.22% Stmts | 91.37% Branch | 97.50% Funcs | 99.43% Lines
```

Persistence adapters (`*.typeorm.repository.ts`) and the migration file are excluded from
the threshold — they're thin TypeORM pass-throughs / raw SQL, better exercised with an
integration test against a real database than mocked unit tests. Everything with actual
business logic (use cases, domain entities, controllers, the payment-gateway adapter) is
covered.

### Frontend — `cd frontend && npm run test:cov`

```
Test Suites: 13 passed, 13 total
Tests:       72 passed, 72 total

All files       | 99.31% Stmts | 93.85% Branch | 98.38% Funcs | 99.60% Lines
```

Covers: card validation (Luhn + brand detection), money formatting, both Redux slices
(including the async thunks that tokenize the card and drive the checkout), the API
clients (including translating the gateway's field-level validation errors into readable
messages), and every component (`ProductPage`, `PaymentInfoModal`, `SummaryBackdrop`,
`FinalStatusPage`, `CardBrandIcon`, `App`).

## Security

- **PCI-friendly card handling**: raw card data (PAN/CVC) is sent directly from the browser
  to the payment gateway's sandbox using the public key; it never transits through our
  backend or gets logged. Only the resulting token does.
- **Secrets**: the private key / integrity key live in backend env vars only, never in the
  frontend bundle or in git (`.env` is gitignored; `.env.example` documents the *sandbox*
  values already shared in the test brief, not production secrets).
- **Transaction integrity**: every charge request is signed with a SHA-256 signature
  derived from the reference/amount/currency/integrity-secret, so a tampered request (e.g. a
  modified amount) is rejected by the gateway before any money moves — see "Sandbox test
  cards" above.
- **Security headers** (OWASP alignment, bonus rubric item): `helmet()` on the NestJS app,
  plus explicit `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and
  `Permissions-Policy` headers on the frontend's Nginx config
  ([`frontend/nginx.conf`](frontend/nginx.conf)).
- **Input validation**: every controller uses `class-validator` DTOs with a global
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — unexpected fields are
  rejected, not silently dropped.
- **CORS**: locked to `FRONTEND_ORIGIN`, not `*`.

## Deployment

**Live now**, on a single EC2 `t3.micro` running this repo's own `docker-compose.yml`
(Postgres + backend + frontend), provisioned with Terraform and reachable on its Elastic IP:

- Frontend: http://32.196.234.16
- Backend API: http://32.196.234.16:3000
- Swagger: http://32.196.234.16:3000/docs

Chosen over a "textbook" ECS Fargate + ALB + RDS split because this app is reviewed by a
couple of people, not run in production — an ALB bills hourly regardless of traffic
(~$16-20/mo) while the `t3.micro` is free-tier eligible. See
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full guide (IAM setup, applying,
redeploying after a change, teardown) and the ECS/ALB/RDS alternative if this ever needs to
handle real traffic. IaC lives in [`infra/terraform`](infra/terraform).

**Known gap**: served over plain HTTP (no custom domain to issue a TLS certificate for) —
see "Known gap: no HTTPS" in `docs/DEPLOYMENT.md`.

## Rubric self-check

| Item                                                          | Status |
| --------------------------------------------------------------- | ------ |
| README completed (this file)                                    | ✅ |
| Fast-rendering, in-boundary UI                                   | ✅ mobile-first, flexbox/grid, verified at a 375px viewport with no overflow |
| Full credit-card checkout onboarding flow                        | ✅ verified live end-to-end: tokenize → PENDING → gateway charge → APPROVED → stock decremented |
| API working correctly (stock, transactions, customers, deliveries) | ✅ verified live against the deployed instance |
| >80% unit test coverage, backend and frontend                     | ✅ 99.2%+ / 99.3%+ (see above) |
| Deployed to a cloud provider                                       | ✅ live on AWS EC2, see [Deployment](#deployment) |
| OWASP alignment, HTTPS, security headers                          | ⚠️ security headers (`helmet` + nginx headers) are in place; **HTTPS is not** — no custom domain to issue a certificate for, see the deployment guide's "Known gap" |
| Responsive across browsers                                        | ⚠️ responsive layout verified at mobile width; only tested in a Chromium-based browser, not manually cross-checked in Firefox/Safari |
| CSS quality                                                       | ✅ flexbox/grid, CSS custom properties, no framework bloat |
| Clean code                                                        | ✅ hexagonal boundaries, no business logic in controllers |
| Hexagonal architecture / Ports & Adapters                        | ✅ see [Architecture](#architecture) |
| Railway Oriented Programming                                     | ✅ `Result<T, DomainError>` throughout the application layer |
