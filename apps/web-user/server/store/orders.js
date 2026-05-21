const orders = new Map()

export function saveOrder(order) {
  orders.set(order.orderNo, order)
  return order
}

export function getOrder(orderNo) {
  return orders.get(orderNo) || null
}

export function updateOrder(orderNo, patch) {
  const current = getOrder(orderNo)
  if (!current)
    return null

  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  orders.set(orderNo, next)
  return next
}

function getOrderTime(order) {
  return Date.parse(order.paidAt || order.updatedAt || order.createdAt || 0) || 0
}

export function listOrders(options = {}) {
  const { userId, limit } = options
  const normalizedUserId = userId == null ? '' : String(userId)
  const normalizedLimit = Number.parseInt(limit, 10)

  const result = Array.from(orders.values())
    .filter(order => !normalizedUserId || String(order.userId || '') === normalizedUserId)
    .sort((prev, next) => getOrderTime(next) - getOrderTime(prev))

  if (Number.isFinite(normalizedLimit) && normalizedLimit > 0)
    return result.slice(0, normalizedLimit)

  return result
}
