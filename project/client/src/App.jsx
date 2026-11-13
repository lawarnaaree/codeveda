import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import { apiRequest } from './services/api.js'
import { fetchWorkspaceData, mapProduct } from './services/inventoryApi.js'
import AuthPage from './features/auth/AuthPage.jsx'
import Dashboard from './features/dashboard/Dashboard.jsx'
import Orders from './features/orders/Orders.jsx'
import ProductDialog from './features/products/ProductDialog.jsx'
import Products from './features/products/Products.jsx'
import Team from './features/team/Team.jsx'
import './styles/app.css'

const pageTitles = {
  dashboard: 'Overview',
  products: 'Products',
  orders: 'Orders',
  team: 'Team',
}

const emptyWorkspace = {
  products: [],
  orders: [],
  stockMovements: [],
  users: [],
}

function App() {
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [workspace, setWorkspace] = useState(emptyWorkspace)
  const [dataError, setDataError] = useState('')
  const [loadedDataKey, setLoadedDataKey] = useState('')
  const [failedDataKey, setFailedDataKey] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [activePage, setActivePage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const canManageInventory = user?.role === 'admin' || user?.role === 'inventory_manager'
  const canViewTeam = user?.role === 'admin'
  const dataKey = user ? `${user.id}:${user.role}:${refreshVersion}` : ''
  const isLoadingData = Boolean(user) && loadedDataKey !== dataKey && failedDataKey !== dataKey

  useEffect(() => {
    const controller = new AbortController()

    apiRequest('/auth/me', { signal: controller.signal })
      .then((payload) => setUser(payload.data))
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error.status !== 401) setSessionError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCheckingSession(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!user) return undefined

    const controller = new AbortController()

    fetchWorkspaceData(user.role, { signal: controller.signal })
      .then((data) => {
        setWorkspace(data)
        setLoadedDataKey(dataKey)
        setFailedDataKey('')
        setDataError('')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error.status === 401) {
          setUser(null)
          setWorkspace(emptyWorkspace)
          setFailedDataKey(dataKey)
          return
        }
        setDataError(error.message)
        setFailedDataKey(dataKey)
      })

    return () => controller.abort()
  }, [user, dataKey])

  const login = async (credentials) => {
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    })
    setSessionError('')
    setUser(payload.data)
    setActivePage('dashboard')
    setRefreshVersion((version) => version + 1)
  }

  const register = async (details) => {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: details,
    })
  }

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
      setUser(null)
      setWorkspace(emptyWorkspace)
      setActivePage('dashboard')
      setSessionError('')
      setDataError('')
    } catch (error) {
      setDataError(error.message)
    }
  }

  const openProduct = (product) => {
    setSelectedProduct(product)
    setIsCreatingProduct(false)
  }

  const openCreateProduct = () => {
    setSelectedProduct(null)
    setIsCreatingProduct(true)
  }

  const closeProductDialog = () => {
    setSelectedProduct(null)
    setIsCreatingProduct(false)
  }

  const saveProduct = async (product) => {
    const isEditing = Boolean(selectedProduct)
    const { id, ...body } = product
    const payload = await apiRequest(
      isEditing ? `/products/${encodeURIComponent(id)}` : '/products',
      { method: isEditing ? 'PATCH' : 'POST', body },
    )
    const savedProduct = mapProduct(payload.data)

    setWorkspace((current) => ({
      ...current,
      products: isEditing
        ? current.products.map((item) => item.id === savedProduct.id ? savedProduct : item)
        : [savedProduct, ...current.products],
    }))
    setDataError('')
    closeProductDialog()
    setRefreshVersion((version) => version + 1)
  }

  const deleteProduct = async (productId) => {
    const product = workspace.products.find((item) => item.id === productId)
    if (!product || !window.confirm(`Archive ${product.name} from the catalog?`)) return

    await apiRequest(`/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
    setWorkspace((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
    }))
    setDataError('')
    closeProductDialog()
    setRefreshVersion((version) => version + 1)
  }

  const createOrder = async (order) => {
    await apiRequest('/orders', { method: 'POST', body: order })
    setDataError('')
    setRefreshVersion((version) => version + 1)
  }

  const handleSearch = (value) => {
    setSearch(value)
    if (value.trim()) setActivePage('products')
  }

  if (isCheckingSession) {
    return <main className="app-loading" role="status">Connecting to Stockroom…</main>
  }

  if (!user) {
    return <AuthPage initialError={sessionError} onLogin={login} onRegister={register} />
  }

  let page
  if (activePage === 'products') {
    page = (
      <Products
        canManage={canManageInventory}
        onCreate={openCreateProduct}
        onSearch={setSearch}
        onSelectProduct={openProduct}
        products={workspace.products}
        search={search}
      />
    )
  } else if (activePage === 'orders') {
    page = (
      <Orders
        onCreateOrder={createOrder}
        orders={workspace.orders}
        products={workspace.products}
      />
    )
  } else if (activePage === 'team' && canViewTeam) {
    page = <Team members={workspace.users} />
  } else {
    page = (
      <Dashboard
        canViewStock={canManageInventory}
        onNavigate={setActivePage}
        onSelectProduct={openProduct}
        orders={workspace.orders}
        products={workspace.products}
        stockMovements={workspace.stockMovements}
      />
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        orderCount={workspace.orders.filter((order) => order.status !== 'Shipped').length}
        user={user}
      />
      <div className="app-main">
        <Topbar
          pageTitle={pageTitles[activePage]}
          search={search}
          onSearch={handleSearch}
          isNotificationsOpen={isNotificationsOpen}
          onLogout={logout}
          onToggleNotifications={() => setIsNotificationsOpen((open) => !open)}
        />
        <main className="page-content">
          {dataError && (
            <div className="app-alert" role="alert">
              <span>{dataError}</span>
              <button
                className="text-button"
                onClick={() => {
                  setDataError('')
                  setRefreshVersion((version) => version + 1)
                }}
                type="button"
              >
                Retry
              </button>
            </div>
          )}
          {isLoadingData
            ? <div className="app-loading app-loading--inline" role="status">Loading workspace data…</div>
            : page}
        </main>
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
                aria-label="Close notifications"
                className="icon-button"
                onClick={() => setIsNotificationsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="notification-empty">Live notifications are not connected yet.</p>
          </section>
        </div>
      )}

      {(selectedProduct || isCreatingProduct) && (
        <ProductDialog
          key={selectedProduct?.id ?? 'new-product'}
          canManage={canManageInventory}
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
