import { apiListAll } from './api.js'

const dateTimeFormat = new Intl.DateTimeFormat('en-NP', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const weekdayFormat = new Intl.DateTimeFormat('en-NP', { weekday: 'short' })

function formatDateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date)
}

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function mapProduct(product) {
  return {
    ...product,
    updated: formatDateTime(product.updatedAt),
  }
}

function mapOrder(order) {
  return {
    ...order,
    date: formatDateTime(order.createdAt),
    itemCount: order.items.length,
  }
}

function summarizeStockMovements(movements) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = new Map()

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    days.set(getDateKey(date), {
      day: weekdayFormat.format(date),
      added: 0,
      removed: 0,
    })
  }

  for (const movement of movements) {
    const date = new Date(movement.createdAt)
    const day = days.get(getDateKey(date))
    if (!day) continue

    const change = Number(movement.quantityChange)
    if (change > 0) {
      day.added += change
    } else {
      day.removed += Math.abs(change)
    }
  }

  return [...days.values()]
}

function mapUser(user) {
  const roleLabels = {
    admin: 'Administrator',
    inventory_manager: 'Inventory manager',
    warehouse_staff: 'Warehouse staff',
  }

  return {
    ...user,
    initials: user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
    roleLabel: roleLabels[user.role] || user.role,
    status: user.isActive ? 'Active' : 'Inactive',
  }
}

export async function fetchWorkspaceData(role, { signal } = {}) {
  const canViewStock = role === 'admin' || role === 'inventory_manager'
  const isAdmin = role === 'admin'
  const [products, orders, stockMovements, users] = await Promise.all([
    apiListAll('/products', { signal }),
    apiListAll('/orders', { signal }),
    canViewStock ? apiListAll('/stock-movements', { signal }) : Promise.resolve([]),
    isAdmin ? apiListAll('/users', { signal }) : Promise.resolve([]),
  ])

  return {
    products: products.map(mapProduct),
    orders: orders.map(mapOrder),
    stockMovements: summarizeStockMovements(stockMovements),
    users: users.map(mapUser),
  }
}
