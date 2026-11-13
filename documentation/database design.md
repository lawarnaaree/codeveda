# Database Design

Stockroom uses PostgreSQL. The tables below reflect the current backend
migration in `project/server/migrations/001_initial_schema.sql`.

## Tables

| Table | Main fields and relationships |
| --- | --- |
| `users` | `id`, `name`, unique normalized `email`, `password_hash`, checked `role`, `is_active`, `created_at` |
| `products` | `id`, `name`, unique `sku`, `category`, `price`, `quantity`, `reorder_level`, `archived_at`, timestamps |
| `orders` | `id`, `customer_name`, checked `status`, `total`, `created_by`, `created_at` |
| `order_items` | `order_id`, `product_id`, quantity, unit-price and product-name snapshots |
| `stock_movements` | `product_id`, optional `order_id`, signed `quantity_change`, `reason`, `actor_id`, `created_at` |

Use foreign keys for relationships, `CHECK` constraints for non-negative
prices and quantities, and indexes for frequent lookups. Keep order-item
snapshots so catalog changes do not rewrite order history. Record an order,
its item rows, inventory updates, and stock movements in one transaction.
The migration also creates indexes for recent orders, order items, stock
history, and user creation dates. Application IDs and monetary values are
serialized as strings in API responses so PostgreSQL `BIGINT` and `NUMERIC`
precision is preserved.

## Selected application rules

- Roles: `admin`, `inventory_manager`, and `warehouse_staff`. Registration
  always creates `warehouse_staff`.
- Order statuses: `Ready to fulfill`, `Processing`, and `Shipped`. New orders
  start as `Processing`.
- Orders store one customer name. Products are archived rather than deleted.
- Store monetary values as PostgreSQL `NUMERIC`; keep decimal precision when
  returning them through the API.
