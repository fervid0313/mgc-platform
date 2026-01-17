"use client"

import { useAppStore } from "@/lib/store"
import type { UserProfile } from "@/lib/types"
import { Twitter, Hash, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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
  const { user } = useAppStore()
  const isOwnProfile = user?.id === profile.id
  const [copied, setCopied] = useState(false)

  const copyTag = () => {
    navigator.clipboard.writeText(`${profile.username}#${profile.tag}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
              <span>{profile.username ? profile.username.charAt(0).toUpperCase() : "?"}</span>
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
                <div className="h-3 w-3 text-green-500">✓</div>
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

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl leading-none"
        >
          &times;
        </button>
      )}
    </div>
  )
}
