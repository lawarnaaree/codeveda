import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatCurrency } from '../../data/inventory.js'
import OrderDialog from './OrderDialog.jsx'

function Orders({ orders, products, onCreateOrder }) {
  const [statusFilter, setStatusFilter] = useState('All orders')
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const availableStock = products.some((product) => product.quantity > 0)
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === 'All orders' || order.status === statusFilter
    const matchesQuery = `${order.id} ${order.customerName}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesStatus && matchesQuery
  }), [orders, query, statusFilter])

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Fulfillment</p>
          <h1>Orders</h1>
          <p className="page-heading__description">Track customer orders from processing to delivery</p>
        </div>
        <button
          className="button button--primary"
          disabled={!availableStock}
          onClick={() => setIsCreating(true)}
          title={availableStock ? undefined : 'Add a product with available stock before creating an order'}
          type="button"
        >
          Create order
        </button>
      </section>
      {!availableStock && (
        <p className="data-note">Add a product with available stock before creating an order</p>
      )}
      <section className="panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search aria-hidden="true" size={16} />
            <input aria-label="Search orders" onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" value={query} />
          </label>
          <label className="filter-select">
            <span className="visually-hidden">Order status</span>
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option>All orders</option>
              <option>Ready to fulfill</option>
              <option>Processing</option>
              <option>Shipped</option>
            </select>
          </label>
          <span className="table-toolbar__count">{filteredOrders.length} orders</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Created</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="table-primary">#{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.date}</td>
                  <td>{order.itemCount}</td>
                  <td className="table-primary">{formatCurrency(order.total)}</td>
                  <td><StatusBadge tone={order.status === 'Shipped' ? 'positive' : order.status === 'Processing' ? 'info' : 'neutral'}>{order.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredOrders.length && <div className="empty-state"><Search aria-hidden="true" size={22} /><h2>No orders found</h2><p>Try a different search or status</p></div>}
        </div>
      </section>
      {isCreating && (
        <OrderDialog
          onClose={() => setIsCreating(false)}
          onCreate={async (order) => {
            await onCreateOrder(order)
            setIsCreating(false)
          }}
          products={products}
        />
      )}
    </div>
  )
}

export default Orders
