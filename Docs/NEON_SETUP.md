# Neon database setup

Linked project: `dark-silence-89394818`, organization `org-red-band-49571297`,
branch `production`. Only Postgres is configured. Existing JWT authentication,
Cloudinary storage and Razorpay payments remain in use.

`neon.ts` declares the Neon policy. `neon deploy` applies it and refreshes the
ignored root `.env.local` (or `.env` when present). Never commit database URLs.

The Express backend keeps Prisma 6 and its native TCP driver. It loads environment
variables in this order: existing process variables, root `.env.local`, root `.env`,
then `Backend/.env`. The pooled `DATABASE_URL` serves application traffic;
`Backend/prisma.config.ts` selects `DATABASE_URL_UNPOOLED` for migrations and
falls back to `DATABASE_URL` for local PostgreSQL. Neon runtime connections get
a default 15-second connection timeout for compute wake-up.

From the repository root:

```sh
neon deploy
npm run db:deploy
npm run build
node scripts/verify-neon.cjs
npm run dev
```

Install Backend and Frontend dependencies in their respective folders first if
needed. Backend JWT/payment/image settings still come from Backend/.env locally
or the hosting environment. Docker includes the Prisma config for migrations.

The verification command starts the built frontend and Express on temporary
local ports, checks frontend-to-API proxying and database readiness, reads the
catalog, registers a temporary account, logs in, updates the profile and reads it
back. It removes its test account and closes both servers afterward. It requires
network access to Neon and a completed frontend build.

The new database starts without catalog data. This setup does not copy the old
database or publish the frontend/API to a hosting provider. It provisions and
connects the database; application hosting and any catalog migration are separate.

## Verification — 2026-11-20

- `neon init` and `neon deploy`: succeeded for the requested production branch.
- `npm run db:deploy`: all 10 migrations successfully applied through the direct endpoint.
- `npm run build`: passed; Prisma Client 6.19.3 generated and Vite built 1930 modules.
- `node scripts/verify-neon.cjs`: passed built storefront, frontend/API proxy,
  Neon readiness, catalog read, registration persistence, login and profile update/readback.
  Its temporary test account was removed and both local servers stopped.
- Full backend `npm test` with network access: 88 passed, 18 failed, 2 skipped.
  Failures include hosted-database transaction/test timeouts, an admin assertion,
  fresh-schema migration and fixture cleanup failures. These remain unresolved.
- Two test accounts and one product/category left by failed cleanup were identified
  and removed by exact IDs/names/emails. Final users/products/categories/orders: all zero.
- Initial sandbox installation/build/network errors were resolved with approved access.
  Initial migration command/configuration errors were corrected. An initial readiness
  timeout was followed by two successful runs; a 15-second connection timeout was added.
