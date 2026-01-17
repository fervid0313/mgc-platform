"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { UserProfileCard } from "./user-profile-card"
import { Users, Search, Shield } from "lucide-react"
import type { UserProfile } from "@/lib/types"

const SPECIALTY_OPTIONS = [
  { value: "day-trader", label: "Day Trader" },
  { value: "swing-trader", label: "Swing Trader" },
  { value: "investor", label: "Investor" },
  { value: "ecommerce", label: "E-Commerce" },
] as const

export function CommunityProfiles() {
  const { profiles, user, isAdmin, adminUpdateUserProfile, spaces, currentSpaceId, getSpaceMembers } = useAppStore()
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "online">("all")
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [spaceMembers, setSpaceMembers] = useState<UserProfile[]>([])
  const userIsAdmin = isAdmin()

  useEffect(() => {
    if (currentSpaceId && currentSpaceId !== "space-global") {
      const members = getSpaceMembers(currentSpaceId)
      setSpaceMembers(members)
      console.log("[CommunityProfiles] Loaded space members:", members.map(m => m.username))
    } else {
      setSpaceMembers([])
    }
  }, [currentSpaceId, getSpaceMembers])

  const isGlobalFeed = currentSpaceId === "space-global"

  // Determine the base list of profiles to filter
  const baseProfiles = isGlobalFeed ? profiles : spaceMembers

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

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      (profile.username && profile.username.toLowerCase().includes(searchLower)) ||
      (profile.username && profile.tag && `${profile.username}#${profile.tag}`.toLowerCase().includes(searchLower))
    if (searchQuery && !matchesSearch) {
      return false
    }

    return true
  })

  console.log("[CommunityProfiles] Final filtered profiles:", filteredProfiles.map(p => p.username))

  const handleAssignSpecialty = (userId: string, specialty: UserProfile["tradingStyle"]) => {
    adminUpdateUserProfile(userId, { tradingStyle: specialty })
    setEditingRole(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">{isGlobalFeed ? "Members" : "Space Members"}</h2>
        <span className="text-xs text-muted-foreground">{filteredProfiles.length} members</span>
        {userIsAdmin && (
          <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold ml-auto">
            <Shield className="h-3 w-3" />
            ADMIN MODE
          </span>
        )}
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
            {f ? f.charAt(0).toUpperCase() + f.slice(1) : f}
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
                setSelectedProfile(profile)
              }} className="flex items-center gap-3 flex-1 text-left">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold">
                    {profile.username ? profile.username.charAt(0).toUpperCase() : "?"}
                  </div>
                  {profile.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {profile.username}
                    <span className="text-muted-foreground font-mono text-xs ml-1">#{profile.tag}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {profile.tradingStyle ? profile.tradingStyle.replace("-", " ") : "Member"}
                  </p>
                </div>
              </button>

              {userIsAdmin ? (
                <div className="relative">
                  {editingRole === profile.id ? (
                    <select
                      value={profile.tradingStyle || ""}
                      onChange={(e) => handleAssignSpecialty(profile.id, e.target.value as UserProfile["tradingStyle"])}
                      onBlur={() => setEditingRole(null)}
                      autoFocus
                      className="text-[9px] bg-secondary border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                    >
                      <option value="">No Specialty</option>
                      {SPECIALTY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingRole(profile.id)}
                      className="text-[9px] text-amber-500 font-medium px-2 py-0.5 bg-amber-500/10 rounded-full hover:bg-amber-500/20 transition-colors"
                    >
                      Assign Role
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[9px] text-muted-foreground font-medium px-2 py-0.5 bg-secondary/20 rounded-full">
                  {profile.tradingStyle ? profile.tradingStyle.replace("-", " ") : "Member"}
                </span>
              )}
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
