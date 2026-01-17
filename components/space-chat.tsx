"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SpaceChat() {
  const { chatMessages, currentSpaceId, sendMessage, user } = useAppStore()
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = currentSpaceId ? chatMessages[currentSpaceId] || [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!message.trim()) return
    sendMessage(message)
    setMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground/50 py-12">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === user?.id
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary/50 border border-border/50 rounded-bl-sm"
                  }`}
                >
                  {!isOwn && <p className="text-[10px] font-semibold text-primary mb-1">{msg.username}</p>}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 min-h-[48px] max-h-[120px]"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!message.trim()} size="icon" className="h-12 w-12 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
