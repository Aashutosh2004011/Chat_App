import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const onlineUsers = new Map<string, { lastSeen: number; channels: Set<string> }>()

const HEARTBEAT_TIMEOUT = 30000
setInterval(() => {
  const now = Date.now()
  for (const [userId, data] of onlineUsers.entries()) {
    if (now - data.lastSeen > HEARTBEAT_TIMEOUT) {
      onlineUsers.delete(userId)
    }
  }
}, 10000)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, status } = body

    if (status === 'online') {
      const userData = onlineUsers.get(session.user.id) || {
        lastSeen: Date.now(),
        channels: new Set()
      }

      if (channelId) {
        userData.channels.add(channelId)
      }
      userData.lastSeen = Date.now()

      onlineUsers.set(session.user.id, userData)
    } else if (status === 'offline') {
      if (channelId) {
        const userData = onlineUsers.get(session.user.id)
        if (userData) {
          userData.channels.delete(channelId)
          if (userData.channels.size === 0) {
            onlineUsers.delete(session.user.id)
          }
        }
      } else {
        onlineUsers.delete(session.user.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update presence error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    let onlineUserIds: string[]

    if (channelId) {
      onlineUserIds = Array.from(onlineUsers.entries())
        .filter(([_, data]) => data.channels.has(channelId))
        .map(([userId]) => userId)
    } else {
      onlineUserIds = Array.from(onlineUsers.keys())
    }

    return NextResponse.json({ onlineUsers: onlineUserIds })
  } catch (error) {
    console.error('Get presence error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}