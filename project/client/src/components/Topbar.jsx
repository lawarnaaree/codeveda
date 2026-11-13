import { Bell, Search } from 'lucide-react'

function Topbar({
  pageTitle,
  search,
  onSearch,
  isNotificationsOpen,
  onToggleNotifications,
  hasUnreadNotifications,
}) {
  return (
    <header className="topbar">
      <div aria-label="Breadcrumb" className="topbar__breadcrumb">
        <span>Northwind Goods</span>
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
          {hasUnreadNotifications && <span className="notification-button__dot" />}
        </button>
      </div>
    </header>
  )
}

export default Topbar
