let socketServer

export function setSocketServer(server) {
  socketServer = server
}

function getSocketServer() {
  if (!socketServer) {
    throw new Error('Socket.IO server has not been initialized')
  }

  return socketServer
}

export function publishStockChanged(stock) {
  getSocketServer().emit('stock:changed', stock)
}

export function publishOrderCreated(order) {
  getSocketServer().emit('order:created', order)
}

export function publishOrderStatusChanged(order) {
  getSocketServer().emit('order:status-changed', order)
}
