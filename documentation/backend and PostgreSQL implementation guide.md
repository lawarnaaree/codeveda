# Backend and PostgreSQL Implementation Guide

This guide documents the implemented Stockroom PostgreSQL backend and explains
local database setup, the Express connection, relational tables, MVC
responsibilities, and the remaining work to connect the React client.

## 1. The selected database approach

Use PostgreSQL with the Node.js `pg` (node-postgres) driver. This guide uses
parameterized SQL directly rather than Mongoose or a second ORM, so you can
learn the relational schema and queries explicitly. SQL migrations are the
source of truth for table changes.

The backend now includes PostgreSQL migrations, authentication, product,
order, stock-movement, and user APIs, plus authenticated Socket.IO events. The
React client still uses local demo data and has not yet been connected to these
endpoints.

The intended request path is:

```text
React client
  -> Express route
  -> authentication and validation middleware
  -> controller
  -> service (business rules)
  -> model/data-access function (parameterized SQL)
  -> PostgreSQL
```

Socket.IO is an additional channel for updates after successful database
transactions; it does not replace HTTP or PostgreSQL.

This guide complements [the database design](./database%20design.md),
[the API documentation](./api%20%20documentation.md),
[the system architecture](./system%20architecture.md), and
[the security decisions](./security%20and%20design%20decisions.md).

## 2. Create a PostgreSQL database

### Local development on Windows

1. Install PostgreSQL using the official Windows installer, including the
   command-line tools, or use a trusted managed PostgreSQL provider.
2. Make sure the PostgreSQL service is running. The default local port is
   `5432`.
3. Open SQL Shell (`psql`) and connect as the local PostgreSQL administrator.
4. Create an application role and database. Set the role's password through
   `\password` so it is prompted rather than written into a shell command:

```sql
CREATE ROLE stockroom_app LOGIN;
\password stockroom_app
CREATE DATABASE stockroom OWNER stockroom_app;
```

Use the application role for the backend. Do not run the application as the
PostgreSQL superuser.

The local connection URL has this shape:

```text
postgresql://stockroom_app:<url_encoded_password>@127.0.0.1:5432/stockroom
```

If a password contains URL-reserved characters such as `@`, `/`, `:`, or `#`,
URL-encode it in the connection URL.

### Hosted PostgreSQL

Create a database and restricted application user with your chosen PostgreSQL
provider. Copy its connection URL into the server's private environment. Limit
network access to the application where possible, and use the provider's
required TLS settings. Never put a database password in frontend code.

## 3. Keep configuration out of source control

Create `project/server/.env` for local secrets. Use `DATABASE_URL` for
PostgreSQL; do not use `MONGODB_URI`. Commit a placeholder-only
`project/server/.env.example`, for example:

```dotenv
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://stockroom_app:replace_me@127.0.0.1:5432/stockroom
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=replace-with-a-long-random-secret
TRUST_PROXY_HOPS=0
```

The real `.env` must contain the actual database URL and a generated session
secret. For example, `project/server/.gitignore` can contain:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
```

Generate a session secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not expose database credentials through a `VITE_` variable. Vite variables
are bundled into browser code. Do not paste the contents of `.env` into
documentation, screenshots, or source control.

## 4. Run the existing server

The server package, dependencies, scripts, and modular source layout are
already set up. From `project/server/`, install the locked dependencies if
needed, then run tests:

```powershell
pnpm install
pnpm test
```

After configuring a confirmed local development database in `.env`, apply
migrations, create the initial admin, and start the API:

```powershell
pnpm db:migrate
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "use-a-long-unique-passphrase"
pnpm admin:create
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
pnpm dev
```

Do not run migrations against a production or unknown database. Confirm the
connection target and take a backup before applying schema changes.

The current layout is:

```text
project/server/
  src/
    app.js
    server.js
    config/
      env.js
      database.js
    controllers/
    middlewares/
    models/
    routes/
    services/
    scripts/
    validators/
    sockets/
      utils/
  migrations/
  tests/
  .env
  .env.example
  .gitignore
  package.json
  pnpm-lock.yaml
```

Create files as you reach each step; do not add empty folders for features
that are not implemented yet.

## 5. What the backend folders do

MVC means **Model–View–Controller**:

- **Model:** represents data and provides database operations. Here, model
  modules contain parameterized PostgreSQL queries; SQL constraints enforce
  important data rules.
- **View:** the user interface. React is the View; Express returns JSON rather
  than rendering HTML pages.
- **Controller:** adapts an HTTP request to application logic and chooses the
  response status and body.

| Folder or file | Responsibility | Example |
| --- | --- | --- |
| `src/config/` | Validate environment settings and configure shared resources | `env.js`, `database.js` |
| `migrations/` | Version changes to the database schema | Create products and orders tables |
| `src/models/` | Run parameterized SQL for one data area | `Product.js` |
| `src/middlewares/` | Check authentication, permissions, and request input | `requireAuth.js`, `validate.js` |
| `src/validators/` | Define request schemas that middleware applies | `product.schemas.js` |
| `src/services/` | Apply business rules and coordinate transactions | Check stock and create an order |
| `src/controllers/` | Translate HTTP input into service calls and responses | `product.controller.js` |
| `src/routes/` | Map HTTP methods and URLs to middleware and controllers | `product.routes.js` |
| `src/sockets/` | Authenticate real-time connections and publish events | Notify clients after a stock update |
| `src/app.js` | Assemble Express middleware and mount routers | `app.use('/api/products', productRoutes)` |
| `src/server.js` | Verify the database and start the HTTP listener | Await a successful database check |
| `tests/` | Verify validation, permissions, API behavior, and business rules | `products.test.js` |

A request flows through these layers in order. Keep SQL out of routes, HTTP
responses out of services, and business rules out of controllers.

## 6. Connect Express to PostgreSQL

### Validate environment variables

Create `src/config/env.js` and fail early if required configuration is
missing. The current module also supports `TRUST_PROXY_HOPS` for deployments
behind a known reverse proxy. Do not log the database URL:

```js
import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(`Invalid server configuration: ${parsed.error.message}`)
}

export const env = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  clientOrigin: parsed.data.CLIENT_ORIGIN,
  sessionSecret: parsed.data.SESSION_SECRET,
  trustProxyHops: parsed.data.TRUST_PROXY_HOPS ?? 0,
}
```

### Create one shared connection pool

Create `src/config/database.js`:

```js
import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error', error)
})

export async function connectDatabase() {
  await pool.query('SELECT 1')
  console.info('Connected to PostgreSQL')
}
```

Use the same pool throughout the application; do not create a new pool for
each request. For a hosted database, configure TLS as directed by its provider
and never disable certificate verification as a workaround.

### Assemble the app and start it

`src/app.js` is kept separate from the listener so tests can import it without
opening a port. The current app also installs the trusted-origin guard,
PostgreSQL session middleware, feature routers, and centralized error handlers.
This abbreviated example shows only the base Express setup:

```js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'

export const app = express()

app.use(helmet())
app.use(cors({
  origin: env.clientOrigin,
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Mount feature routes here; add not-found and error handlers after them.
```

`src/server.js` checks PostgreSQL before listening and initializes Socket.IO
with the same session middleware. The abbreviated example below illustrates
the startup order; see the source file for shutdown handling:

```js
import { app } from './app.js'
import { connectDatabase, pool } from './config/database.js'
import { env } from './config/env.js'

async function start() {
  await connectDatabase()

  const server = app.listen(env.port, () => {
    console.info(`API listening on port ${env.port}`)
  })

  const stop = async () => {
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

start().catch((error) => {
  console.error('Server startup failed', error)
  process.exitCode = 1
})
```

From `project/server/`, run `pnpm dev` and check
`http://localhost:3000/api/health`. The health route should only report success
after the startup database check has passed.

## 7. Design relational tables with SQL

PostgreSQL stores related records in tables. Use foreign keys to represent
relationships, constraints to protect data, and transactions when one user
action changes several tables.

Create `migrations/001_initial_schema.sql`:

```sql
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'inventory_manager', 'warehouse_staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  reorder_level INTEGER NOT NULL CHECK (reorder_level >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name TEXT NOT NULL,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'Processing'
    CHECK (status IN ('Ready to fulfill', 'Processing', 'Shipped')),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_at_sale TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE stock_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),
  reason TEXT NOT NULL,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX order_items_order_id_idx ON order_items (order_id);
CREATE INDEX stock_movements_product_time_idx
  ON stock_movements (product_id, created_at DESC);
```

Run the numbered migrations from `project/server/`:

```powershell
pnpm db:migrate
```

The runner records applied migration names in `schema_migrations`, applies
each file once inside a transaction, and stops on failure. The initial schema
also indexes user creation dates. Add a new numbered SQL file for each schema
change; never edit a migration that has already been applied.

Orders store one customer name. Roles are `admin`, `inventory_manager`, and
`warehouse_staff`; order statuses are `Ready to fulfill`, `Processing`, and
`Shipped`. New orders start as `Processing`. Registration always assigns
`warehouse_staff`, and products are archived to preserve history. Normalize
email addresses in the server before inserting them. Unique constraints still
protect SKU and email when API validation is bypassed.

The `updated_at` default is applied when a product is inserted. Set
`updated_at = now()` in each product update query or add a database trigger.

`NUMERIC` values are returned by `pg` as strings to preserve precision. Keep
money in that form (or use integer minor units with an agreed currency); do
not convert money to JavaScript floating-point values for calculations.

## 8. Build one feature in the right order

For each feature, define the API contract first, then write the migration,
data-access functions, validation, service, controller, route, and tests.
The route can be planned early, but wire it after its handler exists.

The product feature already follows this sequence. Use it for future features
as well:

1. Confirm product fields and API request/response shapes.
2. Add the products table migration and apply it locally.
3. Add SQL data-access functions.
4. Validate request bodies and query parameters.
5. Add product business rules in a service.
6. Add controller and route.
7. Test valid input, invalid input, duplicates, and database failures.
8. Replace the client demo data with API responses.

### Parameterized product query

Create `src/models/Product.js`. Always bind values through query parameters;
never concatenate user input into SQL:

```js
import { pool } from '../config/database.js'

export async function listProducts({ search = '', limit = 50, offset = 0 }) {
  const result = await pool.query(
    `SELECT
       id,
       name,
       sku,
       category,
       price,
       quantity,
       reorder_level AS "reorderLevel"
     FROM products
     WHERE (
       $1 = ''
       OR name ILIKE '%' || $1 || '%'
       OR sku ILIKE '%' || $1 || '%'
       OR category ILIKE '%' || $1 || '%'
     )
     ORDER BY name ASC
     LIMIT $2 OFFSET $3`,
    [search, limit, offset],
  )

  return result.rows
}

export async function createProduct(product) {
  const result = await pool.query(
    `INSERT INTO products
       (name, sku, category, price, quantity, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id, name, sku, category, price, quantity,
       reorder_level AS "reorderLevel"`,
    [
      product.name,
      product.sku,
      product.category,
      product.price,
      product.quantity,
      product.reorderLevel,
    ],
  )

  return result.rows[0]
}
```

The `$1`, `$2`, and `$3` placeholders prevent SQL injection. Validate and cap
`search`, `limit`, and `offset` before calling this module. PostgreSQL's
`ILIKE` performs a case-insensitive match.

### Validation, service, controller, and route

Use Zod at the API boundary, for example in
`src/validators/product.schemas.js`:

```js
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(64),
  category: z.string().trim().min(1).max(80),
  price: z.number().finite().nonnegative(),
  quantity: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
})
```

The `validateBody` middleware should call `schema.safeParse(req.body)`, return
a `422` for invalid input, and attach validated data as `req.validatedBody`.
Create a similar query validator that accepts a bounded search string and
integer pagination values.

The service owns business rules and calls the model; it should not use
`req` or `res`:

```js
import * as productModel from '../models/Product.js'

export function listProducts(input) {
  return productModel.listProducts(input)
}

export function createProduct(input) {
  const normalized = {
    ...input,
    sku: input.sku.trim().toUpperCase(),
  }

  return productModel.createProduct(normalized)
}
```

The controller translates HTTP to the service:

```js
import * as productService from '../services/product.service.js'

export async function postProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.validatedBody)
    res.status(201).json({ data: product })
  } catch (error) {
    next(error)
  }
}
```

The route connects middleware and controller:

```js
import { Router } from 'express'
import * as productController from '../controllers/product.controller.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { validateBody } from '../middlewares/validate.js'
import { createProductSchema } from '../validators/product.schemas.js'

export const productRoutes = Router()

productRoutes.post(
  '/',
  requireAuth,
  validateBody(createProductSchema),
  productController.postProduct,
)
```

Mount it in `src/app.js` with
`app.use('/api/products', productRoutes)`. Add authorization checks to write
routes after the project has defined its roles and permissions.

PostgreSQL reports a unique-constraint violation with SQLSTATE `23505`. The
central error handler translates known database constraint errors into safe
conflict responses and hides unexpected server details.

## 9. Use a transaction for orders and stock

Creating an order affects multiple rows: the order, its item snapshots, product
quantities, and stock-movement history. Make those changes all-or-nothing in a
single PostgreSQL transaction, using one checked-out client:

```js
const client = await pool.connect()

try {
  await client.query('BEGIN')

  // Read each product row with SELECT ... FOR UPDATE.
  // Verify available quantities and compute prices/totals on the server.
  // Insert the order and item snapshots.
  // Update product quantities and insert stock_movements rows.

  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
}
```

All statements inside the transaction must use `client.query`, not
`pool.query`. The order service locks product rows in a consistent ID order
while checking and changing quantities so concurrent orders cannot oversell
stock. It emits Socket.IO events only after `COMMIT` succeeds.

## 10. Authentication and database-backed sessions

Use `bcryptjs` to hash passwords; never store or log plain passwords. Do not
allow public registration to choose an administrator role.

For browser authentication, the backend uses an `HttpOnly` cookie session.
`connect-pg-simple` stores sessions in PostgreSQL instead of Express's
development-only in-memory store. Add session middleware after CORS and before
the API routes:

```js
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { env } from './config/env.js'
import { pool } from './config/database.js'

const PgSessionStore = connectPgSimple(session)

app.use(session({
  name: 'stockroom.sid',
  store: new PgSessionStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}))
```

The current store uses `createTableIfMissing: true`, so `connect-pg-simple`
creates `user_sessions` if it is missing. For production, provision that table
through a migration and disable runtime table creation after confirming the
schema. The session ID is regenerated at login and destroyed at logout.
State-changing requests require the configured exact `Origin`; `trust proxy`
is set only from the explicit `TRUST_PROXY_HOPS` value. Review same-site and
secure cookie settings for the deployed client and API domains.

With cookie sessions, client requests need `credentials: 'include'`. CORS
must allow the exact client origin and `credentials: true`; do not combine
credentialed requests with `Access-Control-Allow-Origin: *`.

Create the initial admin with `pnpm admin:create`. Set
`BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` temporarily in the
server environment, run the script once, then remove those bootstrap values.
The script refuses to create another admin after one exists.

## 11. Connect the React client

The current Vite client runs on port `5173`; the Express example runs on
`3000`. Add a development proxy in `project/client/vite.config.js`:

```js
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
      },
    },
  },
})
```

The client has not yet been wired to the API. When connecting it, create
`project/client/src/services/api.js`:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Request failed (${response.status})`)
  }

  return payload?.data ?? payload
}
```

Add the `/api` and `/socket.io` development proxies to
`project/client/vite.config.js`, then replace demo data one feature at a time:
products first, then orders, then stock movements. Show loading, empty, and
error states explicitly. Do not silently fall back to demo values when a
database request fails.

## 12. Recommended implementation order

Complete and test each step before moving to the next:

| Step | Work | Done when |
| --- | --- | --- |
| Step | Work | Status / done when |
| --- | --- | --- |
| 1. Confirm contracts | Roles, order/customer shape, statuses, response format, and archive behavior | Done and reflected in the API and database documentation |
| 2. Initialize server | ESM package, dependencies, scripts, `.gitignore`, and `.env.example` | Done |
| 3. Connect database | Validate config, shared pool, health check | Implemented; verify with a confirmed local database |
| 4. Create migrations | Users, products, orders, items, and stock movements | Migration is implemented; applying it locally remains |
| 5. Implement product API | Queries, validation, service, controller, routes, and tests | Implemented |
| 6. Implement authentication | Password hashing, sessions, authorization, and rate limits | Implemented |
| 7. Implement stock history | Persist signed changes with actor and reason | Implemented transactionally |
| 8. Implement orders | Compute totals and update order, inventory, and movements atomically | Implemented transactionally |
| 9. Connect React | Replace demo data and show loading/error states | Remaining |
| 10. Add Socket.IO | Authenticate sockets and publish post-commit events | Implemented; connect client listeners as needed |
| 11. Verify and deploy | Run database-backed tests, configure secrets/TLS, backups, and recovery | Remaining |

The next development step is to connect the React product screens to the
implemented API, then add order and stock-movement integration. Before running
migrations or database-backed checks, verify that `DATABASE_URL` points to a
disposable or confirmed development database.

## Further reading

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/)
- [node-postgres documentation](https://node-postgres.com/)
- [connect-pg-simple documentation](https://github.com/voxpelli/node-connect-pg-simple)
