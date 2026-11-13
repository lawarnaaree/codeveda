import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './features/dashboard/Dashboard.jsx'
import Orders from './features/orders/Orders.jsx'
import ProductDialog from './features/products/ProductDialog.jsx'
import Products from './features/products/Products.jsx'
import Team from './features/team/Team.jsx'
import { initialProducts } from './data/inventory.js'
import './styles/app.css'

const pageTitles = {
  dashboard: 'Overview',
  products: 'Products',
  orders: 'Orders',
  team: 'Team',
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)

  const openProduct = (product) => {
    setSelectedProduct(product)
    setIsCreatingProduct(false)
  }

  const openCreateProduct = () => {
    setSelectedProduct(null)
    setIsCreatingProduct(true)
  }

  const saveProduct = (nextProduct) => {
    setProducts((currentProducts) => {
      const exists = currentProducts.some((product) => product.id === nextProduct.id)

      if (exists) {
        return currentProducts.map((product) =>
          product.id === nextProduct.id ? nextProduct : product,
        )
      }

      return [nextProduct, ...currentProducts]
    })
    setSelectedProduct(null)
    setIsCreatingProduct(false)
  }

  const closeProductDialog = () => {
    setSelectedProduct(null)
    setIsCreatingProduct(false)
  }

  const deleteProduct = (productId) => {
    const product = products.find((item) => item.id === productId)
    if (!product || !window.confirm(`Delete ${product.name} from this demo catalog?`)) return

    setProducts((currentProducts) =>
      currentProducts.filter((item) => item.id !== productId),
    )
    closeProductDialog()
  }

  const handleSearch = (value) => {
    setSearch(value)
    if (value.trim()) setActivePage('products')
  }

  let page
  if (activePage === 'products') {
    page = (
      <Products
        products={products}
        search={search}
        onSearch={setSearch}
        onCreate={openCreateProduct}
        onSelectProduct={openProduct}
      />
    )
  } else if (activePage === 'orders') {
    page = <Orders />
  } else if (activePage === 'team') {
    page = <Team />
  } else {
    page = (
      <Dashboard
        products={products}
        onNavigate={setActivePage}
        onSelectProduct={openProduct}
      />
    )
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="app-main">
        <Topbar
          pageTitle={pageTitles[activePage]}
          search={search}
          onSearch={handleSearch}
          isNotificationsOpen={isNotificationsOpen}
          onToggleNotifications={() => setIsNotificationsOpen((open) => !open)}
          hasUnreadNotifications={hasUnreadNotifications}
        />
        <main className="page-content">{page}</main>
      </div>

      {isNotificationsOpen && (
        <div className="notification-backdrop" onClick={() => setIsNotificationsOpen(false)}>
          <section
            aria-label="Notifications"
            className="notification-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notification-panel__header">
              <div>
                <h2>Notifications</h2>
                <p>Stock and order updates</p>
              </div>
              <button
                className="text-button"
                onClick={() => setHasUnreadNotifications(false)}
                type="button"
              >
                Mark all read
              </button>
            </div>
            <div className="notification-list">
              <article className="notification-item">
                <span className="notification-item__icon notification-item__icon--warning">
                  <span className="status-dot" />
                </span>
                <div>
                  <h3>Stock below reorder point</h3>
                  <p>Packing tape · 12 units remaining</p>
                  <time>12 minutes ago</time>
                </div>
              </article>
              <article className="notification-item">
                <span className="notification-item__icon">
                  <span className="status-dot status-dot--green" />
                </span>
                <div>
                  <h3>Order ready to fulfill</h3>
                  <p>Order #SO-1048 · Northwind Supply</p>
                  <time>1 hour ago</time>
                </div>
              </article>
              <article className="notification-item">
                <span className="notification-item__icon">
                  <span className="status-dot status-dot--neutral" />
                </span>
                <div>
                  <h3>Stock count updated</h3>
                  <p>Cedar storage boxes · 18 units</p>
                  <time>Yesterday</time>
                </div>
              </article>
            </div>
          </section>
        </div>
      )}

      {(selectedProduct || isCreatingProduct) && (
        <ProductDialog
          key={selectedProduct?.id ?? 'new-product'}
          product={selectedProduct}
          onClose={closeProductDialog}
          onDelete={deleteProduct}
          onSave={saveProduct}
        />
      )}
    </div>
  )
}

export default App
