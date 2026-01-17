"use client"

import { useState, useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { Send, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { UserProfile } from "@/lib/types"

interface DirectMessageChatProps {
  friend: UserProfile
  onClose: () => void
}

export function DirectMessageChat({ friend, onClose }: DirectMessageChatProps) {
  const { user, directMessages, sendDirectMessage, loadDirectMessages } = useAppStore()
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversationKey = [user?.id, friend.id].sort().join('-')
  const messages = directMessages[conversationKey] || []

  useEffect(() => {
    if (user?.id && friend.id) {
      loadDirectMessages(friend.id)
    }
  }, [user?.id, friend.id, loadDirectMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim()) return

    await sendDirectMessage(friend.id, message)
    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 glass-chat rounded-2xl border border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold">
              {friend.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">{friend.username}</p>
            <p className="text-xs text-muted-foreground">Direct Message</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary/50 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                  msg.senderId === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-background/50 border-border"
          />
          <Button onClick={handleSend} size="sm" disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}