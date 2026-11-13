# Stockroom client

Responsive React/Vite prototype for the inventory dashboard described in the workspace documentation.

## Run locally

From this directory:

```powershell
pnpm install
pnpm dev
```

The current screens use local demo data from `src/data/inventory.js`. Product create/edit changes are held in browser memory and reset on refresh. No authentication, API, persistence, or Socket.IO connection is configured yet.

## Validate

```powershell
pnpm lint
pnpm build
```

## Structure

- `src/components/` — shared application shell and status components
- `src/data/` — sample records and inventory formatting helpers
- `src/features/` — dashboard, products, orders, and team views
- `src/styles/` — application layout and responsive styling
- `src/App.jsx` — page state and feature composition

Read [the implementation and Waterfall record](../../documentation/frontend%20implementation%20and%20waterfall%20plan.md) for the documentation review, design direction, traceability, open integration contracts, and server structure change.
