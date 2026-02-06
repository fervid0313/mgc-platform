"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Flame, AlertTriangle } from "lucide-react"
import { isToday, isYesterday, differenceInHours } from "date-fns"

export function StreakAlert() {
  const { entries, currentSpaceId, user } = useAppStore()

  const alert = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    if (userEntries.length < 2) return null

    const sorted = [...userEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const hasPostedToday = sorted.some((e) => isToday(new Date(e.createdAt)))
    if (hasPostedToday) return null

    // Calculate current streak
    let streak = 0
    const dates = new Set<string>()
    sorted.forEach((e) => {
      dates.add(new Date(e.createdAt).toISOString().split("T")[0])
    })

    const sortedDates = Array.from(dates).sort().reverse()
    for (let i = 0; i < sortedDates.length; i++) {
      const d = new Date(sortedDates[i])
      const expected = new Date()
      expected.setDate(expected.getDate() - (i + 1))
      if (d.toISOString().split("T")[0] === expected.toISOString().split("T")[0]) {
        streak++
      } else {
        break
      }
    }

    if (streak < 2) return null

    const lastEntry = sorted[0]
    const hoursSince = differenceInHours(new Date(), new Date(lastEntry.createdAt))

    return { streak, hoursSince }
  }, [entries, currentSpaceId, user])

  if (!alert) return null

  return (
    <div className="glass-3d rounded-2xl p-4 mb-6 border border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Flame className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {alert.streak}-day streak at risk!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You haven't journaled today. Post an entry to keep your streak alive.
          </p>
        </div>
      </div>
    </div>
  )
}
