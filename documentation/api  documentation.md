# API Documentation

The API is implemented in `project/server`. Unless noted, successful resource
responses use `{ "data": ... }`; list responses also include a `pagination`
object. Errors use `{ "error": { "code": "...", "message": "..." } }`.

## Endpoints

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Check API and PostgreSQL availability | Public |
| `POST` | `/api/auth/register` | Register an account as warehouse staff | Public |
| `POST` | `/api/auth/login` | Authenticate and start a session | Public |
| `POST` | `/api/auth/logout` | End the current session | Authenticated |
| `GET` | `/api/auth/me` | Return the current user | Authenticated |
| `GET` | `/api/products` | List and search active products | Authenticated |
| `POST` | `/api/products` | Create a product | Admin or inventory manager |
| `PATCH` | `/api/products/:id` | Update product fields and optionally adjust stock | Admin or inventory manager |
| `DELETE` | `/api/products/:id` | Archive a product while retaining history | Admin or inventory manager |
| `GET` | `/api/orders` | List orders | Authenticated |
| `POST` | `/api/orders` | Create an order and deduct stock atomically | Authenticated |
| `GET` | `/api/stock-movements` | View stock history | Admin or inventory manager |
| `POST` | `/api/stock-movements` | Record a stock adjustment | Admin or inventory manager |
| `GET` | `/api/users` | List users | Admin |
| `PATCH` | `/api/users/:id/role` | Change a user's role | Admin |

Order statuses are `Ready to fulfill`, `Processing`, and `Shipped`. New orders
start as `Processing`. This API currently has no endpoint for changing an
order's status.

## Request examples

Register with `{ "name": "Riley Kim", "email": "riley@example.com",
"password": "a long passphrase" }`. Registration always assigns
`warehouse_staff`; clients cannot choose a role. Login accepts `email` and
`password`.

Create a product with:

```json
{
  "name": "Shipping tape",
  "sku": "TAPE-001",
  "category": "Packing",
  "price": 4.25,
  "quantity": 30,
  "reorderLevel": 8
}
```

For `PATCH /api/products/:id`, send one or more product fields. When changing
`quantity`, include a non-empty `stockReason`; the stock change is recorded in
the movement history. Product deletion is archival, not a hard delete.

Create an order with:

```json
{
  "customerName": "Northwind Supply",
  "items": [
    { "productId": "12", "quantity": 3 }
  ]
}
```

The server reads current product prices, saves order-item snapshots, calculates
the total, deducts inventory, and records stock movements in one transaction.
Clients must not send trusted prices or totals.

Create a manual stock movement with
`{ "productId": "12", "quantityChange": -2, "reason": "Cycle count" }`.
Changes cannot reduce stock below zero.

## Listing and pagination

List routes accept `page` (default `1`) and `pageSize` (default `25`, maximum
`100`). Product listing also accepts a `search` string. Stock movement listing
uses a default `pageSize` of `50` and can be filtered with `productId`.
Paginated responses have this shape:

```json
{
  "data": [],
  "pagination": { "page": 1, "pageSize": 25, "total": "0" }
}
```

Database `BIGINT` identifiers and `NUMERIC` prices/totals are returned as
strings to preserve precision. All prices and totals are denominated in
Nepalese rupees (NPR); the client formats them with the `en-NP` locale.

## Sessions and browser requests

Login creates the `HttpOnly` `stockroom.sid` cookie; logout destroys the
server-side session. Browser requests must send cookies (for `fetch`, use
`credentials: "include"`). CORS allows only the configured `CLIENT_ORIGIN`.
All `POST`, `PUT`, `PATCH`, and `DELETE` requests must include an exact matching
`Origin` header.

Validation errors return `422`, unauthenticated requests return `401`, and
insufficient stock or other business conflicts return `409`. Authentication
and registration requests are rate limited.
