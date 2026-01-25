"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { Bell, BellOff, X, Check, Heart, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/lib/types"
import { getAvatarUrl } from "@/lib/avatar-generator"

export function InboxButton() {
  const { notifications, getUnreadCount, markNotificationAsRead } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = getUnreadCount()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.inbox-dropdown')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId)
  }

  return (
    <div className="relative inbox-dropdown">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-secondary/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden shadow-lg">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="p-3 pt-0">
                {notifications.slice(0, 10).map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all duration-200 mb-2 ${
                      notification.read 
                        ? 'bg-background/30 border-white/5 opacity-60' 
                        : 'bg-background/50 border-white/10 hover:bg-background/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        notification.type === 'like' ? 'bg-red-500/20' :
                        notification.type === 'comment' ? 'bg-blue-500/20' :
                        notification.type === 'follow' ? 'bg-green-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {notification.type === 'like' && <Heart className="h-4 w-4 text-red-500" />}
                        {notification.type === 'comment' && <User className="h-4 w-4 text-blue-500" />}
                        {notification.type === 'follow' && <User className="h-4 w-4 text-green-500" />}
                        {notification.type === 'mention' && <Bell className="h-4 w-4 text-purple-500" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <img
                              src={getAvatarUrl(notification.fromUsername, notification.fromAvatar, 24)}
                              alt={notification.fromUsername}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {notification.fromUsername}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Message */}
                        <p className="text-xs text-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {notification.targetEntryContent && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                "{notification.targetEntryContent.substring(0, 50)}..."
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-blue-500/60 hover:text-blue-500 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <div className="text-center pt-2">
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      +{notifications.length - 10} more notifications
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <BellOff className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No notifications
                </p>
                <p className="text-xs text-muted-foreground/50">
                  You'll see likes and comments here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
