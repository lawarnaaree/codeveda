import { Boxes, ClipboardList, Truck, X } from 'lucide-react'

const timeFormat = new Intl.DateTimeFormat('en-NP', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const eventIcons = {
  stock: Boxes,
  order: ClipboardList,
  shipped: Truck,
}

function NotificationPanel({ connectionStatus, notifications, onClose }) {
  const connectionText = {
    connecting: 'Connecting to live updates',
    connected: 'Live updates connected',
    disconnected: 'Live updates disconnected',
  }[connectionStatus]

  return (
    <div className="notification-backdrop" onClick={onClose}>
      <section
        aria-label="Notifications"
        className="notification-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="notification-panel__header">
          <div>
            <h2>Notifications</h2>
            <p>Stock and order updates</p>
            <span className={`notification-connection notification-connection--${connectionStatus}`}>
              <i aria-hidden="true" />
              {connectionText}
            </span>
          </div>
          <button aria-label="Close notifications" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={17} />
          </button>
        </div>
        {notifications.length ? (
          <ul aria-live="polite" className="notification-list">
            {notifications.map((notification) => {
              const Icon = eventIcons[notification.type]
              return (
                <li className="notification-item" key={notification.id}>
                  <span className="notification-item__icon">
                    <Icon aria-hidden="true" size={15} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <time dateTime={notification.createdAt}>
                      {timeFormat.format(new Date(notification.createdAt))}
                    </time>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="notification-empty">
            {connectionStatus === 'connected'
              ? 'No notifications yet'
              : 'No live notifications while disconnected'}
          </p>
        )}
        <p className="notification-footnote">Only events received while connected are shown</p>
      </section>
    </div>
  )
}

export default NotificationPanel
