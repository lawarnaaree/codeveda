# Stockroom

Stockroom is an inventory and order-management project with a React/Vite
client, an Express API, and PostgreSQL storage. Currency values are
denominated in Nepalese rupees (NPR).

## Project areas

- [Client](./project/client/README.md) — React application and local setup
- [Server](./project/server/) — Express API, PostgreSQL migrations, and tests
- [Documentation](./documentation/) — architecture, API, database, security,
  Waterfall delivery, and backend setup guides

## Local development

1. Follow the [PostgreSQL backend guide](./documentation/backend%20and%20PostgreSQL%20implementation%20guide.md) to configure the server's ignored `.env` file.
2. Verify the database target before applying migrations or creating an admin.
3. Start the server from `project/server` with `pnpm dev`.
4. Start the client from `project/client` with `pnpm dev`.
5. Open the Vite URL, normally `http://localhost:5173`.

The Vite proxy forwards API and Socket.IO requests to `http://127.0.0.1:3000`.
Never put database credentials, session secrets, or other private values in a
`VITE_` variable; Vite exposes those values to browser code.
