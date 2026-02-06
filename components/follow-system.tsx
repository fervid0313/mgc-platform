"use client"

import { useState, useEffect } from "react"
import { UserPlus, UserCheck } from "lucide-react"

const STORAGE_KEY = "mgc-follows"

function getFollows(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function saveFollows(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useFollows() {
  const [following, setFollowing] = useState<string[]>([])

  useEffect(() => {
    setFollowing(getFollows())
  }, [])

  const toggle = (userId: string) => {
    setFollowing((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
      saveFollows(next)
      return next
    })
  }

  const isFollowing = (userId: string) => following.includes(userId)

  return { following, toggle, isFollowing }
}

export function FollowButton({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const { toggle, isFollowing } = useFollows()
  const followed = isFollowing(userId)

  return (
    <button
      onClick={() => toggle(userId)}
      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
        followed
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-secondary/30 text-muted-foreground border border-border hover:border-primary/50 hover:text-primary"
      }`}
    >
      {followed ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      {!compact && (followed ? "Following" : "Follow")}
    </button>
  )
}
