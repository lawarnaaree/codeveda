export const initialProducts = [
  {
    id: 'p-1001',
    name: 'Cedar storage boxes',
    sku: 'CED-BOX-01',
    category: 'Storage',
    price: 12.5,
    quantity: 18,
    reorderLevel: 24,
    updated: 'Today, 9:42 am',
  },
  {
    id: 'p-1002',
    name: 'Glass jars, 750 ml',
    sku: 'GLS-JAR-75',
    category: 'Packaging',
    price: 3.2,
    quantity: 42,
    reorderLevel: 30,
    updated: 'Today, 8:16 am',
  },
  {
    id: 'p-1003',
    name: 'Packing tape, kraft',
    sku: 'PKG-TAP-02',
    category: 'Packaging',
    price: 4.5,
    quantity: 12,
    reorderLevel: 20,
    updated: 'Yesterday',
  },
  {
    id: 'p-1004',
    name: 'Kraft mailers, medium',
    sku: 'KRF-MAI-MD',
    category: 'Shipping',
    price: 0.65,
    quantity: 86,
    reorderLevel: 40,
    updated: 'Yesterday',
  },
  {
    id: 'p-1005',
    name: 'Thermal shipping labels',
    sku: 'THM-LBL-4X6',
    category: 'Shipping',
    price: 8.9,
    quantity: 64,
    reorderLevel: 50,
    updated: 'Nov 11, 2026',
  },
  {
    id: 'p-1006',
    name: 'Cotton twine, 100 m',
    sku: 'COT-TWI-100',
    category: 'Supplies',
    price: 2.8,
    quantity: 9,
    reorderLevel: 12,
    updated: 'Nov 11, 2026',
  },
]

export const recentOrders = [
  {
    id: 'SO-1048',
    customer: 'Northwind Supply',
    date: 'Nov 13, 2026',
    items: 6,
    total: 486.2,
    status: 'Ready to fulfill',
  },
  {
    id: 'SO-1047',
    customer: 'Field & Form',
    date: 'Nov 13, 2026',
    items: 3,
    total: 218.5,
    status: 'Processing',
  },
  {
    id: 'SO-1046',
    customer: 'Juniper Market',
    date: 'Nov 12, 2026',
    items: 8,
    total: 734.8,
    status: 'Shipped',
  },
  {
    id: 'SO-1045',
    customer: 'Common Ground Co.',
    date: 'Nov 12, 2026',
    items: 2,
    total: 96.4,
    status: 'Processing',
  },
]

export const stockMovement = [
  { day: 'Mon', received: 38, shipped: 27 },
  { day: 'Tue', received: 52, shipped: 34 },
  { day: 'Wed', received: 43, shipped: 39 },
  { day: 'Thu', received: 68, shipped: 42 },
  { day: 'Fri', received: 57, shipped: 36 },
  { day: 'Sat', received: 76, shipped: 48 },
  { day: 'Sun', received: 61, shipped: 31 },
]

export const teamMembers = [
  { initials: 'AM', name: 'Alex Morgan', email: 'alex@northwind.goods', role: 'Administrator', status: 'Active' },
  { initials: 'JL', name: 'Jamie Lee', email: 'jamie@northwind.goods', role: 'Inventory manager', status: 'Active' },
  { initials: 'RK', name: 'Riley Kim', email: 'riley@northwind.goods', role: 'Warehouse staff', status: 'Active' },
  { initials: 'SC', name: 'Sam Carter', email: 'sam@northwind.goods', role: 'Warehouse staff', status: 'Invited' },
]

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)

export const getProductStatus = (product) =>
  product.quantity <= product.reorderLevel ? 'Low stock' : 'In stock'
