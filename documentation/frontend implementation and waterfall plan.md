# Frontend implementation and waterfall plan

## Documentation review

The project notes were reviewed before implementation. The API and database contracts have since been completed in the PostgreSQL backend and API documentation.

### System architecture

[`system architecture.md`](./system%20architecture.md) describes a React browser client calling a Node.js/Express JSON API. The server owns authentication, authorization, validation, and business logic; PostgreSQL is accessed through the `pg` driver. Socket.IO is the intended channel for real-time updates.

**Implementation consequence:** the Vite/React client uses the Express JSON
API and authenticated Socket.IO for session and operational updates.

### API documentation

[`api  documentation.md`](./api%20%20documentation.md) defines the routes,
validation, response/error shapes, cookie session, and role permissions used by
the client. Login, registration, session restore, products, order listing,
stock history, admin user listing, order creation, and the agreed order-status
change and realtime stock/order notifications are wired. Notifications are
transient; events received while disconnected are not replayed.

### Database design

[`database design.md`](./database%20design.md) describes the relational
records, including separate order-item rows:

- **Users:** name, email, hashed password, role, and creation time
- **Products:** name, SKU, category, price, quantity, and reorder level
- **Orders:** items, customer, total, status, creator, and creation time
- **Stock movements:** product, quantity change, reason, actor, and creation time

**Implementation consequence:** API product fields are mapped into the client
view model. Passwords are never returned to the browser; credentials are sent
only during login and registration over the configured API.

All monetary amounts are stored and returned as decimal strings and are
displayed as Nepalese rupees (NPR) using the `en-NP` locale.

**Database decision update:** PostgreSQL is the selected database instead of MongoDB. The relational tables and implementation sequence are documented in [the PostgreSQL backend guide](./backend%20and%20PostgreSQL%20implementation%20guide.md).

### Frontend screens

[`frontend screens.md`](./frontend%20screens.md) calls for the following views and behaviors:

1. Login and registration with validation, loading, errors, and password visibility
2. Dashboard with stock summary, low-stock alerts, and recent activity
3. Product catalog with search, filters, CRUD, and empty states
4. Product details for SKU, category, price, quantity, and status
5. Orders with status, details, and totals
6. User administration with roles, permissions, and active/inactive states
7. Notifications for low stock, order changes, and real-time updates

The frontend implements login/registration, authenticated dashboard data,
searchable products, product create/edit/archive, order creation and
listing/filtering, admin team listing, and role-aware stock history.
Order status can be changed from `Processing` to `Shipped` by admins and
inventory managers. The notification panel shows the Socket.IO connection and
received stock/order events.

### Initial UI audit and design direction

The starter `App.jsx` rendered only the word `App`; the CSS files only reset margins and padding. There was no existing application screen or visual design to retain, and no slop signs were present in that blank starter. The requested dashboard was therefore designed as a new screen rather than a redesign of an existing one.

- **Product:** Stockroom keeps inventory and order information visible to operations teams.
- **Character:** Steady, practical, exact.
- **World:** A stockroom ledger, with quiet warm-neutral surfaces, ink-like text, and a vivid orange primary accent.
- **Moments:** A stock-movement chart and a short list of products nearing their reorder points.
- **Signature:** A narrow threshold marker showing where each product's reorder point sits.

### Security and design decisions

[`security and design decisions.md`](./security%20and%20design%20decisions.md) records the implemented password hashing, session, authorization, validation, rate-limit, CORS, and secret-management decisions, plus production tasks.

**Implementation consequence:** secrets and credentials are not stored in the
client. UI role gating is only for usability; server authorization remains the
security boundary.

## Waterfall delivery record

The work follows the sequential Waterfall phases. Requirements, design,
implementation, build verification, authenticated API checks, order-status
updates, and live notification connection are complete. Production readiness
remains.

### Phase 1 — Requirements analysis

1. Read all five source documents in `documentation/`.
2. Grouped the requirements into architecture, API, data model, screens, and security.
3. Recorded missing interfaces rather than inventing request/response behavior.
4. Confirmed the product domain as inventory, orders, stock thresholds, and workspace staff.

**Exit output:** the document review and screen traceability above.

### Phase 2 — UX and technical design

1. Chose a practical, measured interface for operations staff.
2. Used warm-tinted neutral surfaces and the requested `hsl(32 99% 50%)` orange primary. Its darker, soft, and wash tints carry emphasis, alert surfaces, and chart area; dark text stays on the bright primary for contrast. Green remains reserved for positive stock/order status.
3. Made stock movement the primary visual moment and reorder thresholds the product-specific signature.
4. Split the client into shared shell, reusable components, API services, and screen-level feature folders.
5. Kept the first landing view on the operational dashboard; mobile layouts stack the chart and stock list and keep tables scrollable.

**Exit output:** the UI direction, navigation model, and module boundaries implemented in `project/client/src/`.

### Phase 3 — Implementation

1. Built the shared navigation, workspace identity, search, and notification affordances.
2. Built summary metrics, stock movement visualization, reorder alerts, and recent orders.
3. Added API-backed product search/filtering, an empty state, a details view, and create/edit/archive flows.
4. Added order creation/status updates, an admin-only team view, and
   authenticated stock/order event listeners.
5. Applied responsive, keyboard-focus, reduced-motion, and form-validation behavior.
6. Moved the misplaced `project/server/sockets/` directory beneath `project/server/src/`.

**Exit output:** the React client and the modular Express/PostgreSQL backend.

### Phase 4 — Verification

Run from `project/client/`:

```powershell
pnpm lint
pnpm build
```

Manual smoke-check: sign in, open dashboard/products/orders/team, and verify
empty states. Product and order write flows need seeded development records
before they can be exercised safely.

**Exit output:** Client `pnpm lint` and `pnpm build` pass. Server tests pass.
The local browser verified admin sign-in, all list views, and an authenticated
Socket.IO connection. The API health check returned HTTP 200. The database has
no products or orders, so live event delivery and write flows were not tested
with real records.

### Phase 5 — Integration, deployment, and maintenance

Remaining integration and deployment work:

1. Define deployment, TLS, backups, recovery, and monitoring procedures.

## Screen and behavior traceability

| Documented requirement | Implemented view/behavior | Current limitation |
| --- | --- | --- |
| Stock summary and low-stock alerts | Overview metrics and reorder list | Verified with an empty database; populated inventory is not yet available |
| Recent activity/orders | Recent orders table, filters, create-order flow, and ship action | Status update is limited to Processing → Shipped |
| Product search, filter, CRUD | API-backed search, low-stock filter, create/edit/archive | Write actions were not run because no catalog products exist yet |
| Product details and stock status | Detail dialog with API values | Role-gated editing is also enforced by the server |
| User roles and active states | Admin-only API-backed team view | Role changes are not in the UI |
| Login and registration | Cookie-session login/registration | Initial admin is bootstrapped from the server CLI |
| Low-stock/order notifications | Authenticated live stock/order event panel | In-memory only; no replay of events missed while offline |
| Stock history | Dashboard chart aggregated from movement API | Restricted to inventory managers and admins |

## Client module map

```text
project/client/src/
  components/       shared sidebar, top bar, and status badge
  data/             NPR formatting and stock-status helpers
  features/
    auth/           login and registration
    dashboard/      overview metrics and stock movement
    orders/         order creation, listing, and status filter
    products/       catalog and product dialog
    team/             workspace roles and member states
  styles/           application layout and responsive styles
  services/         cookie-aware API and response mapping
  App.jsx           session, navigation, and shared workspace state
  index.css         global tokens, resets, and focus styles
  main.jsx          React entry point
```

## Server structure review

The server uses `config`, `controllers`, `middlewares`, `models`, `routes`,
`services`, `scripts`, `validators`, and `sockets` under `src`, with SQL
migrations in `project/server/migrations/`.
