'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
  user: {
    id: string
    username: string
  }
}

interface MessageListProps {
  channelId: string
}

export default function MessageList({ channelId }: MessageListProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const fetchMessages = async (cursor?: string) => {
    setLoading(true)
    try {
      const url = cursor
        ? `/api/channels/${channelId}/messages?cursor=${cursor}`
        : `/api/channels/${channelId}/messages`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (cursor) {
          setMessages(prev => [...data.messages, ...prev])
        } else {
          setMessages(data.messages)
          setIsAtBottom(true)
        }
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOlderMessages = () => {
    if (messages.length > 0 && !loading) {
      const oldestMessage = messages[0]
      fetchMessages(oldestMessage.createdAt)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(() => {
      if (isAtBottom) {
        fetchMessages()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [channelId])

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (container) {
      const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setIsAtBottom(isBottom)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(msg => msg.id === messageId ? data.message : msg))
        setEditingMessageId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: string) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const groupedMessages = messages.reduce((acc, message) => {
    const date = formatDate(message.createdAt)
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(message)
    return acc
  }, {} as Record<string, Message[]>)

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadOlderMessages}
            disabled={loading}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex items-center justify-center my-4">
            <div className="bg-white border border-gray-300 rounded-full px-4 py-1">
              <span className="text-xs font-medium text-gray-600">{date}</span>
            </div>
          </div>

          {dateMessages.map((message) => {
            const isOwnMessage = message.user.id === session?.user?.id
            const isEditing = editingMessageId === message.id

            return (
              <div key={message.id} className="group hover:bg-gray-100 px-4 py-2 rounded transition">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {message.user.username[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {message.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.isEdited && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-1">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditMessage(message.id)
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null)
                              setEditContent('')
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleEditMessage(message.id)}
                            className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageId(null)
                              setEditContent('')
                            }}
                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 text-sm mt-1 break-words">
                        {message.content}
                      </p>
                    )}
                  </div>

                  {isOwnMessage && !isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingMessageId(message.id)
                          setEditContent(message.content)
                        }}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title="Edit message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-gray-500 hover:text-red-600 p-1"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  )
}
