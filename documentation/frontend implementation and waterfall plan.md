# Frontend implementation and waterfall plan

## Documentation review

The existing project notes were reviewed before implementation. They describe an inventory and order-management application, but do not yet define the API payloads, authentication response, or final session strategy.

### System architecture

[`system architecture.md`](./system%20architecture.md) describes a React browser client calling a Node.js/Express JSON API. The server owns authentication, authorization, validation, and business logic; PostgreSQL is accessed through the `pg` driver. Socket.IO is the intended channel for real-time updates.

**Implementation consequence:** the client is structured as a Vite/React application and keeps its present data in a clearly named demo-data module. It does not pretend to be connected to an API or live socket server that is not present in the workspace.

### API documentation

[`api  documentation.md`](./api%20%20documentation.md) lists these routes and access expectations:

| Method and route | Purpose and access in the source note | Frontend status |
| --- | --- | --- |
| `POST /api/auth/register` | Public registration, with role restrictions | Not wired: registration fields and response are unspecified |
| `POST /api/auth/login` | Public authentication | Not wired: token/session contract is unspecified |
| `GET /api/products` | Authenticated product list and search | Demonstrated with local sample records |
| `POST /api/products` | Product creation by an administrator or permitted staff | Product form is local-only |
| `PATCH /api/products/:id` | Product updates by an administrator or permitted staff | Edit form is local-only |
| `GET /api/orders` | Authenticated order list | Demonstrated with local sample records |
| `POST /api/orders` | Authenticated order creation | No order-creation flow is specified |
| `GET /api/stock-movements` | Role-controlled stock history | Summary chart is local sample data |

No request or response body shapes, error schema, pagination format, or token/session transport are specified in that note. Those contracts need to be agreed with the server before API wiring.

### Database design

[`database design.md`](./database%20design.md) describes the relational
records, including separate order-item rows:

- **Users:** name, email, hashed password, role, and creation time
- **Products:** name, SKU, category, price, quantity, and reorder level
- **Orders:** items, customer, total, status, creator, and creation time
- **Stock movements:** product, quantity change, reason, actor, and creation time

**Implementation consequence:** sample product details use the documented product fields. Passwords and user authentication data are not represented in the browser demo.

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

The current frontend implements the dashboard, searchable and filterable product catalog, product detail/edit/create dialog, order list/status filter, team and role overview, and a notification panel. Login/registration and server-backed user administration are held until their security and API contracts are defined. Notifications and operational records are sample data; they are not live.

### Initial UI audit and design direction

The starter `App.jsx` rendered only the word `App`; the CSS files only reset margins and padding. There was no existing application screen or visual design to retain, and no slop signs were present in that blank starter. The requested dashboard was therefore designed as a new screen rather than a redesign of an existing one.

- **Product:** Stockroom keeps inventory and order information visible to operations teams.
- **Character:** Steady, practical, exact.
- **World:** A stockroom ledger, with quiet warm-neutral surfaces, ink-like text, and a vivid orange primary accent.
- **Moments:** A stock-movement chart and a short list of products nearing their reorder points.
- **Signature:** A narrow threshold marker showing where each product's reorder point sits.

### Security and design decisions

[`security and design decisions.md`](./security%20and%20design%20decisions.md) identifies password hashing and session/token strategy, server-side authorization, validation and rate limits, CORS and secure headers, secret management, backups, and project risks as decisions to resolve.

**Implementation consequence:** secrets and credentials are not stored in the client. A visual team role overview is not an authorization boundary. Server enforcement, authentication, and production persistence remain server responsibilities.

## Waterfall delivery record

The work follows the sequential Waterfall phases. Each phase has a reviewable output; later integration is gated on the open contracts above.

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
4. Split the client into shared shell, reusable components, sample data, and screen-level feature folders.
5. Kept the first landing view on the operational dashboard; mobile layouts stack the chart and stock list and keep tables scrollable.

**Exit output:** the UI direction, navigation model, and module boundaries implemented in `project/client/src/`.

### Phase 3 — Implementation

1. Built the shared navigation, workspace identity, search, and notification affordances.
2. Built summary metrics, stock movement visualization, reorder alerts, and recent orders.
3. Added product search/filtering, an empty state, a details view, and local create/update/delete flows.
4. Added order status filtering and a role/status team overview.
5. Applied responsive, keyboard-focus, reduced-motion, and form-validation behavior.
6. Moved the misplaced `project/server/sockets/` directory beneath `project/server/src/`.

**Exit output:** the client prototype and a conventional server source layout. Server behavior itself is not implemented by this task.

### Phase 4 — Verification

Run from `project/client/`:

```powershell
pnpm lint
pnpm build
```

Manual smoke-check: open the dashboard, navigate each screen, search and filter products/orders, create, edit, and delete a product, inspect the notification panel, and verify the layout at desktop and mobile widths.

**Exit output:** `pnpm lint` and `pnpm build` pass. Local browser checks cover dashboard rendering, product search, create/edit/delete flows, order/team views, notifications, and a 390px mobile layout. Browser checks use only demo data.

### Phase 5 — Integration, deployment, and maintenance

This phase is intentionally gated. Before production use:

1. Define and document the API request/response and error contracts.
2. Decide the authentication/session mechanism and implement login/registration accordingly.
3. Connect the API, expose configuration through non-secret public client settings, and handle authorization failures.
4. Add server-backed order, team, stock-movement, and notification flows, including Socket.IO lifecycle/error handling.
5. Validate permissions and security on the server, then run end-to-end tests against a development API.
6. Define deployment, backup, recovery, and monitoring procedures.

## Screen and behavior traceability

| Documented requirement | Implemented view/behavior | Current limitation |
| --- | --- | --- |
| Stock summary and low-stock alerts | Overview metrics and reorder list | Demo data, no server sync |
| Recent activity/orders | Recent orders table and orders view | Sample records; no order creation endpoint contract |
| Product search, filter, CRUD | Search, low-stock filter, create/read/edit/delete, empty state | In-memory only; server persistence is not included |
| Product details and stock status | Detail dialog with documented fields | Local sample values |
| User roles and active states | Team view with role/status labels | Read-only sample roster |
| Login and registration | Not implemented | Session strategy and response schema are unresolved |
| Low-stock/order notifications | Notification panel | Static sample notifications; no socket connection |
| Stock history | Summary chart | Sample series; detailed history endpoint is not wired |

## Client module map

```text
project/client/src/
  components/       shared sidebar, top bar, and status badge
  data/             sample inventory, orders, team, and formatting helpers
  features/
    dashboard/      overview metrics and stock movement
    orders/         order listing and status filter
    products/       catalog and product dialog
    team/             workspace roles and member states
  styles/           application layout and responsive styles
  App.jsx           navigation and shared application state
  index.css         global tokens, resets, and focus styles
  main.jsx          React entry point
```

## Server structure review

The supplied server tree contained `config`, `controllers`, `middlewares`, `models`, `routes`, and `services` below `src`, but `sockets` was a sibling of `src`. The Socket.IO code boundary belongs with the application source, so `sockets/` was moved to `src/sockets/` (including its `utils/` child). The server folders contain no implementation files yet; this change corrects placement without inventing server modules.
