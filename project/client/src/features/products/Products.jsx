import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatCurrency, getProductStatus } from '../../data/inventory.js'

function Products({ products, search, onSearch, onCreate, onSelectProduct }) {
  const [stockFilter, setStockFilter] = useState('All stock')
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch = !query || [product.name, product.sku, product.category]
        .some((value) => value.toLowerCase().includes(query))
      const matchesStock = stockFilter === 'All stock' || getProductStatus(product) === 'Low stock'
      return matchesSearch && matchesStock
    })
  }, [products, search, stockFilter])

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
          <p className="page-heading__description">Keep your catalog and stock levels in order</p>
        </div>
        <button className="button button--primary" onClick={onCreate} type="button">
          <span className="button__plus">+</span>
          Add product
        </button>
      </section>

      <section className="panel products-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label="Filter products"
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Find a product"
              type="search"
              value={search}
            />
          </label>
          <label className="filter-select">
            <SlidersHorizontal aria-hidden="true" size={15} />
            <span className="visually-hidden">Stock status</span>
            <select onChange={(event) => setStockFilter(event.target.value)} value={stockFilter}>
              <option>All stock</option>
              <option>Low stock</option>
            </select>
          </label>
          <span className="table-toolbar__count">{filteredProducts.length} products</span>
        </div>
        <div className="table-scroll">
          <table className="data-table products-table">
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Category</th><th>Unit price</th><th>On hand</th><th>Status</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getProductStatus(product)
                return (
                  <tr
                    className="clickable-row"
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelectProduct(product)
                      }
                    }}
                    tabIndex={0}
                  >
                    <td>
                      <span className="product-cell">
                        <span className="product-monogram">{product.name.slice(0, 1)}</span>
                        <span className="product-cell__copy"><strong>{product.name}</strong><span>{product.category}</span></span>
                      </span>
                    </td>
                    <td className="table-mono">{product.sku}</td>
                    <td>{product.category}</td>
                    <td className="table-primary">{formatCurrency(Number(product.price))}</td>
                    <td>
                      <span className="stock-level">
                        <strong>{product.quantity}</strong>
                        <span className="stock-level__track">
                          <span
                            className={status === 'Low stock' ? 'stock-level__fill stock-level__fill--low' : 'stock-level__fill'}
                            style={{ width: `${Math.min(100, (product.quantity / Math.max(product.reorderLevel * 2, 1)) * 100)}%` }}
                          />
                          <i
                            aria-hidden="true"
                            className="stock-level__threshold"
                            style={{ left: `${Math.min(100, (product.reorderLevel / Math.max(product.reorderLevel * 2, 1)) * 100)}%` }}
                          />
                        </span>
                      </span>
                    </td>
                    <td><StatusBadge tone={status === 'Low stock' ? 'warning' : 'positive'}>{status}</StatusBadge></td>
                    <td>{product.updated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filteredProducts.length && (
            <div className="empty-state">
              <Search aria-hidden="true" size={22} />
              <h2>No products found</h2>
              <p>Try a different search or stock filter</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Products
