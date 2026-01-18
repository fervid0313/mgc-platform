"use client"

import { useAppStore } from "@/lib/store"
import type { UserProfile } from "@/lib/types"
import { getAvatarUrl } from "@/lib/avatar-generator"
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
  const isOwnProfile = user?.id === profile?.id
  const [copied, setCopied] = useState(false)

  const copyTag = () => {
    if (profile?.username && profile?.tag) {
      navigator.clipboard.writeText(`${profile.username}#${profile.tag}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 max-w-2xl w-full relative">
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl font-bold">
            <img
              src={getAvatarUrl(profile.username || "user", profile.avatar, 128)}
              alt={profile?.username || "Profile"}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {profile.isOnline && (
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-2xl">{profile?.username || "Unknown"}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-mono">#{profile?.tag || "0000"}</span>
            <button onClick={copyTag} className="p-1 rounded hover:bg-secondary transition-colors" title="Copy tag">
              {copied ? (
                <div className="h-4 w-4 text-green-500">✓</div>
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {profile.tradingStyle && (
            <span className="text-sm text-primary font-medium">{tradingStyleLabels[profile.tradingStyle]}</span>
          )}
          <p className="text-sm text-muted-foreground mt-2">{profile.isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && <p className="text-base text-muted-foreground mb-6 leading-relaxed">{profile.bio}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {profile.winRate !== undefined && profile.winRate > 0 && (
          <div className="bg-secondary/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{profile.winRate}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
          </div>
        )}
        {profile.totalTrades !== undefined && profile.totalTrades > 0 && (
          <div className="bg-secondary/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{profile.totalTrades.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Trades</p>
          </div>
        )}
      </div>

      {/* Connections Section */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-4">Connections</h4>
        {profile.connections && profile.connections.length > 0 ? (
          <div className="space-y-3">
            {profile.connections.map((connectionId, index) => (
              <div key={connectionId} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-sm font-bold">
                    <img
                      src={getAvatarUrl(`connection-${connectionId}`, "", 40)}
                      alt="Connection"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Connection {index + 1}</p>
                    <p className="text-xs text-muted-foreground">ID: {connectionId.substring(0, 8)}...</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No connections yet</p>
            <p className="text-xs text-muted-foreground/50 mt-2">Connect with others to build your network</p>
          </div>
        )}
        <div className="text-center mt-4">
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">
            {profile.connections && profile.connections.length > 0 ? "Manage connections →" : "Find connections →"}
          </button>
        </div>
      </div>

      {/* Social Links */}
      {profile.socialLinks && Object.values(profile.socialLinks).some((v) => v) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {profile.socialLinks.twitter && (
            <a
              href={`https://twitter.com/${profile.socialLinks.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/30 px-4 py-2 rounded-full"
            >
              <Twitter className="h-4 w-4" />@{profile.socialLinks.twitter}
            </a>
          )}
          {profile.socialLinks.discord && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full">
              <Hash className="h-4 w-4" />
              {profile.socialLinks.discord}
            </span>
          )}
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground text-2xl leading-none"
        >
          &times;
        </button>
      )}
    </div>
  )
}
