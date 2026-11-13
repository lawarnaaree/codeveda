import { Boxes, CircleAlert, PackageCheck, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatCurrency, getProductStatus } from '../../data/inventory.js'

const chartWidth = 640
const chartHeight = 210
const chartPadding = { top: 18, right: 18, bottom: 30, left: 36 }

function buildLine(values) {
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const max = Math.max(10, ...values) * 1.1
  const points = values.map((value, index) => {
    const x = chartPadding.left + (plotWidth / Math.max(values.length - 1, 1)) * index
    const y = chartPadding.top + plotHeight - (value / max) * plotHeight
    return [x, y]
  })

  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
}

function toCents(amount) {
  const [whole, fraction = ''] = String(amount).split('.')
  const cents = `${fraction}00`.slice(0, 2)
  return BigInt(whole || '0') * 100n + BigInt(cents || '0')
}

function Dashboard({ canViewStock, orders, products, stockMovement, onNavigate, onSelectProduct }) {
  const totals = useMemo(() => {
    const units = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
    const valueCents = products.reduce(
      (sum, product) => sum + toCents(product.price) * BigInt(product.quantity),
      0n,
    )
    const lowStock = products.filter((product) => getProductStatus(product) === 'Low stock').length

    return {
      units,
      value: `${valueCents / 100n}.${String(valueCents % 100n).padStart(2, '0')}`,
      lowStock,
    }
  }, [products])
  const lowStockProducts = products
    .filter((product) => getProductStatus(product) === 'Low stock')
    .slice(0, 3)
  const openOrders = orders.filter((order) => order.status !== 'Shipped').length
  const addedPath = buildLine(stockMovement.map((item) => item.added))
  const removedPath = buildLine(stockMovement.map((item) => item.removed))
  const addedArea = `${addedPath} L ${chartWidth - chartPadding.right} ${chartHeight - chartPadding.bottom} L ${chartPadding.left} ${chartHeight - chartPadding.bottom} Z`
  const currentDate = new Intl.DateTimeFormat('en-NP', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{currentDate}</p>
          <h1>Inventory overview</h1>
          <p className="page-heading__description">A clear view of stock, orders, and the work ahead</p>
        </div>
        <span className="data-note">Live inventory</span>
      </section>

      <section aria-label="Inventory summary" className="metric-grid">
        <article className="metric-card">
          <div className="metric-card__top">
            <span className="metric-card__label">Units on hand</span>
            <Boxes aria-hidden="true" size={17} strokeWidth={1.7} />
          </div>
          <strong className="metric-card__value">{totals.units.toLocaleString('en-NP')}</strong>
          <span className="metric-card__note metric-card__note--quiet">Across {products.length} products</span>
        </article>
        <article className="metric-card">
          <div className="metric-card__top">
            <span className="metric-card__label">Stock value</span>
          </div>
          <strong className="metric-card__value">{formatCurrency(totals.value)}</strong>
          <span className="metric-card__note metric-card__note--quiet">At current catalog prices</span>
        </article>
        <article className="metric-card">
          <div className="metric-card__top">
            <span className="metric-card__label">Below reorder point</span>
            <CircleAlert aria-hidden="true" size={17} strokeWidth={1.7} />
          </div>
          <strong className="metric-card__value">{totals.lowStock}</strong>
          <span className="metric-card__note metric-card__note--quiet">Products need attention</span>
        </article>
        <article className="metric-card">
          <div className="metric-card__top">
            <span className="metric-card__label">Open orders</span>
            <ShoppingCart aria-hidden="true" size={17} strokeWidth={1.7} />
          </div>
          <strong className="metric-card__value">{openOrders}</strong>
          <span className="metric-card__note metric-card__note--quiet">Awaiting fulfillment</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel movement-panel">
          <div className="panel-heading">
            <div>
              <h2>Stock movement</h2>
              <p>Daily units added and removed</p>
            </div>
            <span className="chart-period">Last 7 days</span>
          </div>
          {canViewStock ? (
            <>
              <div className="chart-legend">
                <span><i className="legend-dot legend-dot--added" /> Added</span>
                <span><i className="legend-dot legend-dot--removed" /> Removed</span>
                <span className="chart-legend__period">Units</span>
              </div>
              {stockMovement.some((item) => item.added || item.removed) ? (
                <div className="chart-wrap">
                  <svg
                    aria-label="Daily stock units added and removed during the last seven days"
                    className="movement-chart"
                    preserveAspectRatio="none"
                    role="img"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  >
                    {[0, 1, 2, 3].map((line) => {
                      const y = chartPadding.top + ((chartHeight - chartPadding.top - chartPadding.bottom) / 3) * line
                      return <line className="chart-gridline" key={line} x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} />
                    })}
                    <path className="chart-area" d={addedArea} />
                    <path className="chart-line chart-line--added" d={addedPath} />
                    <path className="chart-line chart-line--removed" d={removedPath} />
                    {stockMovement.map((item, index) => {
                      const x = chartPadding.left + ((chartWidth - chartPadding.left - chartPadding.right) / 6) * index
                      return (
                        <text className="chart-label" key={item.day} textAnchor="middle" x={x} y={chartHeight - 4}>
                          {item.day}
                        </text>
                      )
                    })}
                  </svg>
                </div>
              ) : (
                <div className="empty-note"><p>No stock changes recorded in the last 7 days</p></div>
              )}
            </>
          ) : (
            <div className="empty-note"><p>Stock history is available to inventory managers and admins</p></div>
          )}
        </article>

        <article className="panel low-stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Reorder soon</h2>
              <p>{totals.lowStock} products at or below threshold</p>
            </div>
            <button className="link-button" onClick={() => onNavigate('products')} type="button">
              View products
            </button>
          </div>
          <div className="low-stock-list">
            {lowStockProducts.length ? lowStockProducts.map((product) => (
              <button className="low-stock-item" key={product.id} onClick={() => onSelectProduct(product)} type="button">
                <span className="product-monogram">{product.name.slice(0, 1)}</span>
                <span className="low-stock-item__copy">
                  <strong>{product.name}</strong>
                  <span>{product.quantity} left <i aria-hidden="true">·</i> reorder at {product.reorderLevel}</span>
                </span>
                <span aria-label="Below reorder level" className="threshold-mark" />
              </button>
            )) : (
              <div className="empty-note">
                <PackageCheck aria-hidden="true" size={21} />
                <p>All products are above their reorder point</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel orders-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent orders</h2>
            <p>Latest activity across your workspace</p>
          </div>
          <button className="link-button" onClick={() => onNavigate('orders')} type="button">
            All orders
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 3).map((order) => (
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
          {!orders.length && <div className="empty-state"><p>No orders yet</p></div>}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
