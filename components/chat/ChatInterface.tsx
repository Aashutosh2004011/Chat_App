'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import ChannelList from './ChannelList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import OnlineUsers from './OnlineUsers'

export default function ChatInterface() {
  const { data: session } = useSession()
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchChannels()
    const interval = setInterval(fetchChannels, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels?my=true')
      if (res.ok) {
        const data = await res.json()
        setChannels(data.channels)
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    }
  }

  const handleChannelJoin = async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/join`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchChannels()
        setSelectedChannel(channelId)
      }
    } catch (error) {
      console.error('Failed to join channel:', error)
    }
  }

  const handleChannelLeave = async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/leave`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchChannels()
        if (selectedChannel === channelId) {
          setSelectedChannel(null)
        }
      }
    } catch (error) {
      console.error('Failed to leave channel:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-purple-800 text-white transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-purple-700">
          <h2 className="text-xl font-bold">Mini Team Chat</h2>
          <p className="text-sm text-purple-200 truncate">{session?.user?.username}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            onRefresh={fetchChannels}
            onJoinChannel={handleChannelJoin}
            onLeaveChannel={handleChannelLeave}
          />
        </div>

        <div className="p-4 border-t border-purple-700">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded text-sm transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedChannel ? channels.find(c => c.id === selectedChannel)?.name || 'Select a channel' : 'Select a channel'}
            </h1>
          </div>
          {selectedChannel && <OnlineUsers channelId={selectedChannel} />}
        </div>

        {selectedChannel ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <MessageList channelId={selectedChannel} />
            <MessageInput channelId={selectedChannel} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
