import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_API_BASE_URL
  ? new URL(import.meta.env.VITE_API_BASE_URL, window.location.origin).origin
  : undefined

export function connectNotificationSocket() {
  return io(socketUrl, {
    withCredentials: true,
  })
}
