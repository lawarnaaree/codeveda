# Security and Design Decisions

## Implemented

- Passwords are hashed with `bcryptjs`; registration requires at least 12
  characters and rejects passwords over bcrypt's 72-byte input limit.
- Authentication uses a server-side PostgreSQL session and an `HttpOnly`
  `stockroom.sid` cookie. The session ID is regenerated on login and destroyed
  on logout. The cookie is `Secure` in production and has an eight-hour expiry.
- Public registration always creates a `warehouse_staff` account.
- Admins and inventory managers manage products and stock; only admins manage
  user roles. Authenticated users can list and create orders.
- Zod validates request bodies, parameters, and queries. SQL queries use bound
  parameters; database constraints enforce key data rules.
- Orders, item snapshots, inventory deductions, and stock movements are
  committed in one transaction with product row locks.
- CORS allows only `CLIENT_ORIGIN`. State-changing requests require an exact
  matching `Origin`. Helmet headers, bounded JSON bodies, and registration /
  login rate limits are enabled.
- `.env` files are ignored by `project/server/.gitignore`; `.env.example`
  contains placeholders only. Never expose database credentials in frontend
  `VITE_` variables.
- Socket.IO connections require a valid authenticated session.

## Before production deployment

- Use a least-privilege PostgreSQL application role and the provider's required
  TLS configuration. Keep secrets in the deployment platform's secret store.
- Set `TRUST_PROXY_HOPS` only to the number of trusted reverse proxies in front
  of the server.
- Confirm production cookie and client/API domain settings. The current cookie
  uses `SameSite=Lax`; cross-site deployments may need a deliberate cookie and
  CSRF design change.
- Configure automated database backups and verify a restore procedure.
- The default rate limiter uses in-process memory. Use a shared rate-limit
  store if deploying multiple server instances.
- Confirm PostgreSQL privileges for migrations and the `connect-pg-simple`
  session table before deployment.
