export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 2,
  }).format(amount)

export const getProductStatus = (product) =>
  product.quantity <= product.reorderLevel ? 'Low stock' : 'In stock'
