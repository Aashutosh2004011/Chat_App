'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface OnlineUsersProps {
  channelId: string
}

export default function OnlineUsers({ channelId }: OnlineUsersProps) {
  const { data: session } = useSession()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'online', channelId }),
        })
      } catch (error) {
        console.error('Failed to send heartbeat:', error)
      }
    }

    sendHeartbeat()

    const interval = setInterval(sendHeartbeat, 10000)

    return () => {
      clearInterval(interval)
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offline', channelId }),
      }).catch(() => {})
    }
  }, [channelId])

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const res = await fetch(`/api/presence?channelId=${channelId}`)
        if (res.ok) {
          const data = await res.json()
          setOnlineUsers(data.onlineUsers)
        }
      } catch (error) {
        console.error('Failed to fetch online users:', error)
      }
    }

    fetchOnlineUsers()
    const interval = setInterval(fetchOnlineUsers, 5000)

    return () => clearInterval(interval)
  }, [channelId])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/channels/${channelId}/members`)
        if (res.ok) {
          const data = await res.json()
          setMembers(data.members)
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
      }
    }

    fetchMembers()
  }, [channelId])

  const onlineCount = members.filter(m => onlineUsers.includes(m.userId)).length

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>{onlineCount} online</span>
      </div>
      <span className="text-gray-400">•</span>
      <span>{members.length} members</span>
    </div>
  )
}
