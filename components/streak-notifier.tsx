"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

const MILESTONES = [3, 5, 7, 10, 14, 21, 30, 50, 100]
const STREAK_KEY = "mgc-last-streak-notified"

export function StreakNotifier() {
  const { entries, currentSpaceId, user } = useAppStore()
  const { toast } = useToast()
  const notified = useRef(false)

  useEffect(() => {
    if (!currentSpaceId || !user || notified.current) return
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    if (userEntries.length === 0) return

    const days = new Set(userEntries.map((e) => new Date(e.createdAt).toDateString()))
    const sorted = Array.from(days).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let streak = 1
    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i + 1]).getTime()) / (1000 * 60 * 60 * 24)
      if (Math.round(diff) === 1) streak++
      else break
    }

    const lastNotified = parseInt(localStorage.getItem(STREAK_KEY) || "0")
    const milestone = MILESTONES.find((m) => streak >= m && m > lastNotified)

    if (milestone) {
      notified.current = true
      localStorage.setItem(STREAK_KEY, String(milestone))
      setTimeout(() => {
        toast({ title: `🔥 ${streak}-day streak!`, description: `You've journaled ${streak} days in a row. Keep it up!` })
      }, 2000)
    }
  }, [entries, currentSpaceId, user, toast])

  return null
}
