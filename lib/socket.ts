import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

export type SocketServer = SocketIOServer

let io: SocketIOServer | undefined

export const initSocketServer = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-channel', (channelId: string) => {
      socket.join(`channel:${channelId}`)
      console.log(`Socket ${socket.id} joined channel:${channelId}`)
    })

    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`)
      console.log(`Socket ${socket.id} left channel:${channelId}`)
    })

    socket.on('user-online', (userId: string) => {
      socket.join(`user:${userId}`)
      socket.broadcast.emit('user-status-change', { userId, status: 'online' })
      console.log(`User ${userId} is online`)
    })

    socket.on('user-offline', (userId: string) => {
      socket.leave(`user:${userId}`)
      socket.broadcast.emit('user-status-change', { userId, status: 'offline' })
      console.log(`User ${userId} is offline`)
    })

    socket.on('typing-start', ({ channelId, userId, username }) => {
      socket.to(`channel:${channelId}`).emit('user-typing', { userId, username, channelId })
    })

    socket.on('typing-stop', ({ channelId, userId }) => {
      socket.to(`channel:${channelId}`).emit('user-stop-typing', { userId, channelId })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export const getSocketServer = (): SocketIOServer | undefined => {
  return io
}