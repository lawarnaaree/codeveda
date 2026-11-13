import { Bell, LogOut, Search } from 'lucide-react'

function Topbar({
  pageTitle,
  search,
  onSearch,
  isNotificationsOpen,
  onToggleNotifications,
  onLogout,
}) {
  return (
    <header className="topbar">
      <div aria-label="Breadcrumb" className="topbar__breadcrumb">
        <span>Stockroom</span>
        <span aria-hidden="true" className="topbar__separator">/</span>
        <strong>{pageTitle}</strong>
      </div>
      <div className="topbar__actions">
        <label className="global-search">
          <Search aria-hidden="true" size={17} strokeWidth={1.8} />
          <input
            aria-label="Search products"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search products"
            type="search"
            value={search}
          />
        </label>
        <button
          aria-expanded={isNotificationsOpen}
          aria-label={isNotificationsOpen ? 'Close notifications' : 'Open notifications'}
          className="icon-button notification-button"
          onClick={onToggleNotifications}
          type="button"
        >
          <Bell aria-hidden="true" size={18} strokeWidth={1.7} />
        </button>
        <button className="button button--secondary topbar__logout" onClick={onLogout} type="button">
          <LogOut aria-hidden="true" size={15} />
          Sign out
        </button>
      </div>
    </header>
  )
}

export default Topbar
