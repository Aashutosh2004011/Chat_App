'use client'

import { useState, useEffect } from 'react'

interface Channel {
  id: string
  name: string
  description: string | null
  _count: { members: number }
}

interface ChannelListProps {
  channels: Channel[]
  selectedChannel: string | null
  onSelectChannel: (channelId: string) => void
  onRefresh: () => void
  onJoinChannel: (channelId: string) => void
  onLeaveChannel: (channelId: string) => void
}

export default function ChannelList({
  channels,
  selectedChannel,
  onSelectChannel,
  onRefresh,
  onJoinChannel,
  onLeaveChannel
}: ChannelListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBrowseModal, setShowBrowseModal] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [availableChannels, setAvailableChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName,
          description: newChannelDescription,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowCreateModal(false)
        setNewChannelName('')
        setNewChannelDescription('')
        onRefresh()
        onSelectChannel(data.channel.id)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create channel')
      }
    } catch (error) {
      alert('Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableChannels = async () => {
    try {
      const res = await fetch('/api/channels')
      if (res.ok) {
        const data = await res.json()
        setAvailableChannels(data.channels)
      }
    } catch (error) {
      console.error('Failed to fetch available channels:', error)
    }
  }

  useEffect(() => {
    if (showBrowseModal) {
      fetchAvailableChannels()
    }
  }, [showBrowseModal])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded text-sm transition flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Channel</span>
        </button>

        <button
          onClick={() => setShowBrowseModal(true)}
          className="w-full bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded text-sm transition flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Browse Channels</span>
        </button>
      </div>

      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-purple-200 uppercase">Your Channels</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {channels.length === 0 ? (
          <p className="text-sm text-purple-200 px-2 py-4 text-center">
            No channels yet. Create or join one!
          </p>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`px-3 py-2 rounded mb-1 cursor-pointer transition group flex items-center justify-between ${
                selectedChannel === channel.id
                  ? 'bg-purple-700 text-white'
                  : 'hover:bg-purple-700 text-purple-100'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate"># {channel.name}</p>
                <p className="text-xs text-purple-200">{channel._count.members} members</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. general, random"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  rows={3}
                  placeholder="What's this channel about?"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBrowseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Browse Channels</h2>
            <div className="flex-1 overflow-y-auto space-y-2">
              {availableChannels.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No channels available</p>
              ) : (
                availableChannels.map((channel) => {
                  const isMember = channels.some(c => c.id === channel.id)
                  return (
                    <div
                      key={channel.id}
                      className="border border-gray-200 rounded p-3 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900"># {channel.name}</p>
                        <p className="text-sm text-gray-500">{channel._count.members} members</p>
                      </div>
                      {isMember ? (
                        <span className="text-sm text-green-600 font-medium">Joined</span>
                      ) : (
                        <button
                          onClick={() => {
                            onJoinChannel(channel.id)
                            setShowBrowseModal(false)
                          }}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowBrowseModal(false)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
