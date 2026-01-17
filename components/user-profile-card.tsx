"use client"

import { useAppStore } from "@/lib/store"
import type { UserProfile } from "@/lib/types"
import { UserPlus, UserMinus, Check, MessageCircle, Twitter, Hash, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { DirectMessageChat } from "./direct-message-chat"

interface UserProfileCardProps {
  profile: UserProfile
  onClose?: () => void
}

const tradingStyleLabels = {
  "day-trader": "Day Trader",
  "swing-trader": "Swing Trader",
  investor: "Investor",
  ecommerce: "E-Commerce",
}

export function UserProfileCard({ profile, onClose }: UserProfileCardProps) {
  const { connections, sendFriendRequest, removeFriend, user } = useAppStore()

  // Debug: Check if functions are available
  console.log("[UI] UserProfileCard rendered for:", profile.username, {
    isConnected: connections.includes(profile.id),
    hasRemoveFriend: typeof removeFriend === 'function',
    removeFriendRef: removeFriend,
    userId: user?.id,
    profileId: profile.id
  })

  const isConnected = connections.includes(profile.id)
  const isOwnProfile = user?.id === profile.id
  const [copied, setCopied] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [showDMChat, setShowDMChat] = useState(false)

  const copyTag = () => {
    navigator.clipboard.writeText(`${profile.username}#${profile.tag}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendRequest = async () => {
    const result = await sendFriendRequest(`${profile.username}#${profile.tag}`)
    if (result.success) {
      setRequestSent(true)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 max-w-sm w-full relative">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold">
            {profile.avatar ? (
              <img
                src={profile.avatar || "/placeholder.svg"}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          {profile.isOnline && (
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{profile.username}</h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono">#{profile.tag}</span>
            <button onClick={copyTag} className="p-0.5 rounded hover:bg-secondary transition-colors" title="Copy tag">
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
          {profile.tradingStyle && (
            <span className="text-xs text-primary font-medium">{tradingStyleLabels[profile.tradingStyle]}</span>
          )}
          <p className="text-xs text-muted-foreground mt-1">{profile.isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{profile.bio}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {profile.winRate !== undefined && profile.winRate > 0 && (
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-400">{profile.winRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Win Rate</p>
          </div>
        )}
        {profile.totalTrades !== undefined && profile.totalTrades > 0 && (
          <div className="bg-secondary/30 rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{profile.totalTrades.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Trades</p>
          </div>
        )}
      </div>

      {/* Social Links */}
      {profile.socialLinks && Object.values(profile.socialLinks).some((v) => v) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.socialLinks.twitter && (
            <a
              href={`https://twitter.com/${profile.socialLinks.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/30 px-3 py-1.5 rounded-full"
            >
              <Twitter className="h-3 w-3" />@{profile.socialLinks.twitter}
            </a>
          )}
          {profile.socialLinks.discord && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
              <Hash className="h-3 w-3" />
              {profile.socialLinks.discord}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {!isOwnProfile && (
        <div className="flex flex-col sm:flex-row gap-2">
          {isConnected ? (
            <>
              <Button variant="secondary" className="flex-1 min-h-[44px]" disabled>
                <Check className="h-4 w-4 mr-2" />
                Connected
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => {
                  console.log("[UI] 🚨🚨🚨🚨 REMOVE FRIEND BUTTON CLICKED for user:", profile.username, profile.id)
                  const confirmed = confirm(`Remove ${profile.username} from friends?`)
                  console.log("[UI] Confirm dialog result:", confirmed)

                  if (confirmed) {
                    console.log("[UI] ✅ User confirmed removal, about to call removeFriend()")
                    console.log("[UI] removeFriend function:", removeFriend)
                    console.log("[UI] profile.id:", profile.id)
                    try {
                      console.log("[UI] 🚨🚨🚨 CALLING removeFriend NOW 🚨🚨🚨")
                      const result = removeFriend(profile.id)
                      console.log("[UI] removeFriend returned:", result)
                      console.log("[UI] ✅ removeFriend() called successfully, scheduling modal close")
                      // Delay closing to allow state update to propagate
                      setTimeout(() => {
                        console.log("[UI] Closing modal now")
                        onClose?.()
                      }, 100)
                    } catch (uiError) {
                      console.error("[UI] 🚨🚨🚨🚨🚨 CRITICAL ERROR in UI removeFriend call:", uiError)
                      console.error("[UI] 🚨🚨🚨🚨🚨 Error stack:", uiError.stack)
                      console.error("[UI] 🚨🚨🚨🚨🚨 This might cause the red error text you see!")
                    }
                  } else {
                    console.log("[UI] ❌ User cancelled removal")
                  }
                }}
                title="Remove friend"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => setShowDMChat(true)}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </>
          ) : requestSent ? (
            <Button variant="secondary" className="flex-1 min-h-[44px]" disabled>
              <Check className="h-4 w-4 mr-2" />
              Request Sent
            </Button>
          ) : (
            <Button onClick={handleSendRequest} className="flex-1 min-h-[44px]">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          )}
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl leading-none"
        >
          &times;
        </button>
      )}

      {/* DM Chat */}
      {showDMChat && (
        <DirectMessageChat
          friend={profile}
          onClose={() => setShowDMChat(false)}
        />
      )}
    </div>
  )
}
