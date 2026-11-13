# Stockroom client

The Stockroom client is a React/Vite inventory interface connected to the
Express API with cookie-based sessions. Product and order amounts are shown in
Nepalese rupees (NPR).

## Run locally

First configure and start the server by following the
[PostgreSQL backend guide](../../documentation/backend%20and%20PostgreSQL%20implementation%20guide.md).
The Vite development proxy expects the API at `http://127.0.0.1:3000` and the
client origin at `http://localhost:5173`.

In one terminal, start the configured server:

```powershell
cd project/server
pnpm install
pnpm dev
```

In another terminal, start the client:

```powershell
cd project/client
pnpm install
pnpm dev
```

Open the Vite URL shown in the terminal. Apply migrations and create the first
admin only after confirming the configured database is the intended development
database. Public registration creates a `warehouse_staff` account; it cannot
grant administrator access.

The client uses `VITE_API_BASE_URL` when set and otherwise sends requests to
`/api` through the Vite proxy. This variable may contain an API origin, never a
secret. API failures are displayed to the user; the application does not
silently substitute demo records.

## Current interface scope

- Login, public registration, session restore, and logout
- Dashboard metrics and seven-day stock-movement summary
- Product search, creation, editing, and archiving
- Order creation, listing, and status filtering
- Admin-only team listing
- NPR formatting for monetary values

Admins and inventory managers can mark Processing orders as Shipped. The
authenticated notification panel receives stock and order events while
connected; it does not persist or replay missed events. User-role editing is
not available in the interface.

## Validate

```powershell
pnpm lint
pnpm build
```

## Structure

- `src/components/` — shared application shell and status components
- `src/data/` — currency formatting and inventory status helpers
- `src/features/auth/` — login and registration
- `src/features/` — dashboard, products, orders, and team views
- `src/services/` — API transport and backend-to-UI mapping
- `src/styles/` — application layout and responsive styling
- `src/App.jsx` — session, navigation, and shared application state

Read [the implementation and Waterfall record](../../documentation/frontend%20implementation%20and%20waterfall%20plan.md) for the design direction, traceability, verification, and remaining work.
