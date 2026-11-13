import { Boxes, LayoutDashboard, Package, ShoppingCart, Users } from 'lucide-react'

const navigation = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'team', label: 'Team', icon: Users },
]

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <button aria-label="Stockroom home" className="brand" onClick={() => onNavigate('dashboard')} type="button">
        <span className="brand__mark">
          <Boxes aria-hidden="true" size={19} strokeWidth={1.7} />
        </span>
        <span className="brand__name">Stockroom</span>
      </button>

      <div className="sidebar__section">
        <p className="sidebar__label">Workspace</p>
        <nav aria-label="Main navigation" className="nav-list">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={activePage === id ? 'page' : undefined}
              className={`nav-item${activePage === id ? ' nav-item--active' : ''}`}
              key={id}
              onClick={() => onNavigate(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {id === 'orders' && <span className="nav-item__count">4</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar__bottom">
        <div className="workspace-card">
          <span aria-hidden="true" className="workspace-card__avatar">N</span>
          <span className="workspace-card__copy">
            <strong>Northwind Goods</strong>
            <span>Operations workspace</span>
          </span>
          <span aria-hidden="true" className="workspace-card__status" />
        </div>
        <div className="profile-button">
          <span aria-hidden="true" className="profile-button__avatar">AM</span>
          <span className="profile-button__copy">
            <strong>Alex Morgan</strong>
            <span>Administrator</span>
          </span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
