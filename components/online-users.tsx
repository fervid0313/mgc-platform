"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { Users, Wifi, WifiOff, Clock, ChevronDown, ChevronUp } from "lucide-react"
import type { UserProfile } from "@/lib/types"

export function OnlineUsers() {
  const { profiles, onlineUsers, simulateOnlineUsers, user } = useAppStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Update online status when component mounts
    simulateOnlineUsers()
    
    // Update every 2 minutes to check for recent activity
    const interval = setInterval(simulateOnlineUsers, 120000)

    return () => clearInterval(interval)
  }, [simulateOnlineUsers])

  // Always include current user in online users
  const currentUserOnline = user ? {
    ...user,
    isOnline: true,
    username: user.username,
    tag: user.tag,
    avatar: user.avatar
  } as UserProfile : null

  // Combine current user with other online users, avoiding duplicates
  const allOnlineUsers = currentUserOnline 
    ? [currentUserOnline, ...(onlineUsers || []).filter(u => u.id !== currentUserOnline.id)]
    : (onlineUsers || [])

  const onlineCount = allOnlineUsers.length
  const totalUsers = profiles.length

  return (
    <div>
      <div className="glass-3d rounded-xl overflow-hidden transition-all duration-300">
        {/* Header - Always Visible */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Users className="h-4 w-4 text-primary" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Recently Active
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-muted-foreground">
                {onlineCount}/{totalUsers}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            {isCollapsed ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-96'} overflow-hidden`}>
          <div className="p-3 pt-0">
            {allOnlineUsers.length > 0 ? (
              <div className="space-y-2">
                {/* Show first 6 online users, with current user first */}
                {allOnlineUsers.slice(0, 6).map((onlineUser) => (
                  <div
                    key={onlineUser.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      onlineUser.id === user?.id 
                        ? 'bg-primary/20 border border-primary/30' 
                        : 'bg-background/50 hover:bg-background/70'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <img
                          src={getAvatarUrl(onlineUser.username, onlineUser.avatar, 24)}
                          alt={onlineUser.username}
                          width={24}
                          height={24}
                          className="object-cover"
                          onError={(e) => {
                            console.log("[ONLINE] Image load error for", onlineUser.username, ":", {
                              src: getAvatarUrl(onlineUser.username, onlineUser.avatar, 24),
                              error: e,
                              avatarLength: onlineUser.avatar?.length || 0
                            })
                          }}
                          onLoad={() => {
                            console.log("[ONLINE] Image loaded successfully for", onlineUser.username)
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {onlineUser.username}
                        {onlineUser.id === user?.id && (
                          <span className="ml-1 text-primary">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{onlineUser.tag}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                      {onlineUser.id === user?.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Current User" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Show more users link if there are more than 6 */}
                {allOnlineUsers.length > 6 && (
                  <div className="text-center pt-1">
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      +{allOnlineUsers.length - 6} more active
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <WifiOff className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  No recent activity
                </p>
              </div>
            )}

            {/* Status indicator */}
            <div className="mt-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Based on last hour activity</span>
                </div>
                <div className="flex items-center gap-1 text-green-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
