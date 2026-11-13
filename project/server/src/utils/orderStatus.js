const allowedTransitions = Object.freeze({
  'Ready to fulfill': [],
  Processing: ['Shipped'],
  Shipped: [],
})

export function canTransitionOrderStatus(currentStatus, nextStatus) {
  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false
}
