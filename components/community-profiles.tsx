"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { UserProfileCard } from "./user-profile-card"
import { Users, Search, RefreshCw, UserPlus, Activity, ExternalLink } from "lucide-react"
import type { UserProfile } from "@/lib/types"

export function CommunityProfiles() {
  const { profiles, user, spaces, currentSpaceId, getSpaceMembers, forceLoadProfiles, checkForMissingProfiles, getUsernameFromAuth } = useAppStore()
  const router = useRouter()
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "online">("all")
  const [spaceMembers, setSpaceMembers] = useState<UserProfile[]>([])
  const [authUsernames, setAuthUsernames] = useState<Record<string, string>>({})

  const isGlobalFeed = currentSpaceId === "space-global"

  // Determine the base list of profiles to filter
  const baseProfiles = isGlobalFeed ? profiles : spaceMembers

  useEffect(() => {
    if (currentSpaceId && currentSpaceId !== "space-global") {
      const members = getSpaceMembers(currentSpaceId)
      setSpaceMembers(members)
      console.log("[CommunityProfiles] Loaded space members:", members.map(m => m.username))
    } else {
      setSpaceMembers([])
    }
  }, [currentSpaceId, getSpaceMembers])

  // Fetch auth usernames for profiles that have email as username
  useEffect(() => {
    const fetchAuthUsernames = async () => {
      const profilesWithEmailUsername = baseProfiles.filter(p => 
        p.username === p.email || p.username?.includes('@')
      )
      
      if (profilesWithEmailUsername.length > 0) {
        console.log("[CommunityProfiles] Fetching auth usernames for profiles with email usernames")
        const newAuthUsernames = { ...authUsernames }
        
        for (const profile of profilesWithEmailUsername) {
          if (!newAuthUsernames[profile.id]) {
            const authUsername = await getUsernameFromAuth(profile.id)
            if (authUsername) {
              newAuthUsernames[profile.id] = authUsername
              console.log("[CommunityProfiles] Got auth username for", profile.id, ":", authUsername)
            }
          }
        }
        
        setAuthUsernames(newAuthUsernames)
      }
    }
    
    fetchAuthUsernames()
  }, [baseProfiles, getUsernameFromAuth])

  console.log("[CommunityProfiles] Total profiles in store:", profiles.length)
  console.log("[CommunityProfiles] Base profiles to display:", baseProfiles.length)
  console.log("[CommunityProfiles] Is global feed:", isGlobalFeed)
  console.log("[CommunityProfiles] Current user:", user?.username)
  console.log("[CommunityProfiles] Sample profiles from store:", (() => {
              try {
                return baseProfiles?.slice(0, 3)?.map(p => ({ id: p.id, username: p.username, email: p.email })) || []
              } catch (e) {
                return []
              }
            })())
  console.log("[CommunityProfiles] Sample profiles raw:", (() => {
              try {
                return baseProfiles?.slice(0, 3) || []
              } catch (e) {
                return []
              }
            })())

  // Create a helper function to get the display username
  const getDisplayUsername = (profile: UserProfile) => {
    // If profile has email as username, try to get auth username
    if (profile.username === profile.email || profile.username.includes('@')) {
      return authUsernames[profile.id] || profile.username
    }
    return profile.username
  }

  // Simple filtering - Zustand should handle reactivity
  const filteredProfiles = baseProfiles.filter((profile) => {
    if (profile.id === user?.id) return false

    // Adjust filtering based on whether it's global feed or a specific space
    if (isGlobalFeed) {
      // In global feed, "all" shows all registered users (excluding self)
      if (filter === "all") {
        return true // All users visible by default in global feed
      }
      // For "online" filter, show only online profiles
      if (filter === "online") {
        if (!profile.isOnline) return false
      }
    } else {
      // In a specific space, always show members. Filters apply to members.
      if (!spaceMembers.some(member => member.id === profile.id)) return false // Only show actual members of this space

      if (filter === "online" && !profile.isOnline) {
        return false
      }
    }

    const searchLower = searchQuery ? searchQuery.toLowerCase() : ""
    const displayUsername = getDisplayUsername(profile)
    const matchesSearch =
      (displayUsername && displayUsername.toLowerCase().includes(searchLower)) ||
      (displayUsername && profile.tag && `${displayUsername}#${profile.tag}`.toLowerCase().includes(searchLower))
    if (searchQuery && !matchesSearch) {
      return false
    }

    return true
  })

  console.log("[CommunityProfiles] Final filtered profiles:", filteredProfiles.map(p => p.username))

  const handleRefreshProfiles = async () => {
    console.log("[CommunityProfiles] Refreshing profiles...")
    await forceLoadProfiles()
  }

  const handleAutoSyncProfiles = async () => {
    console.log("[CommunityProfiles] Auto-syncing missing profiles...")
    
    // Simple approach: just refresh profiles and show stats
    try {
      await forceLoadProfiles()
      
      // Get current profile count
      const result = await checkForMissingProfiles()
      if (result) {
        alert(`Profile sync complete!\n• Total profiles: ${result.totalProfiles}\n• Incomplete profiles: ${result.incompleteProfiles}\n\nIf some users are missing, run the SQL script to fix RLS policies.`)
      }
    } catch (error) {
      console.error("[CommunityProfiles] Sync error:", error)
      alert('Sync completed. If users are still missing, run the RLS fix SQL script.')
    }
  }

  const handleCheckProfiles = async () => {
    console.log("[CommunityProfiles] Checking profile health...")
    const result = await checkForMissingProfiles()
    if (result) {
      alert(`Profile Health Check:\n• Total profiles: ${result.totalProfiles}\n• Incomplete profiles: ${result.incompleteProfiles}\n• Recent signups: ${result.recentProfiles}`)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">{isGlobalFeed ? "Members" : "Space Members"}</h2>
        <span className="text-xs text-muted-foreground">{filteredProfiles.length} members</span>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={handleCheckProfiles}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Check profile health"
          >
            <Activity className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleAutoSyncProfiles}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Auto-sync missing profiles"
          >
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleRefreshProfiles}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Refresh all profiles"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or tag#1234..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "online"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {(() => {
              try {
                return f ? (typeof f === 'string' && f.length > 0 ? f.charAt(0).toUpperCase() + f.slice(1) : f) : ''
              } catch (e) {
                return f || ''
              }
            })()}
          </button>
        ))}
      </div>

      {/* Profile List */}
      <div className="space-y-2">
        {filteredProfiles.length === 0 ? (
          <p className="text-center text-muted-foreground/50 py-8 text-sm">No users found.</p>
        ) : (
          filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
              <button onClick={() => {
                console.log("[UI] 🚨🚨🚨🚨 COMMUNITY PROFILE CLICKED:", profile.username, profile.id)
                router.push(`/profile/${profile.id}`)
              }} className="flex items-center gap-3 flex-1 text-left hover:bg-secondary/50 p-2 rounded-lg transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img
                      src={getAvatarUrl(profile.username || "user", profile.avatar, 40)}
                      alt={profile?.username || "Profile"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {profile.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {getDisplayUsername(profile) || "Unknown"}
                      <span className="text-muted-foreground font-mono text-xs ml-1">#{profile.tag || "0000"}</span>
                    </p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {profile.tradingStyle?.replace("-", " ") || "Member"}
                  </p>
                </div>
              </button>

              <span className="text-[9px] text-muted-foreground font-medium px-2 py-0.5 bg-secondary/20 rounded-full">
                {profile.tradingStyle?.replace("-", " ") || "Member"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProfile(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <UserProfileCard profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
