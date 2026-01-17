"use client"

import { useAppStore } from "@/lib/store"
import { Trophy } from "lucide-react"

export function MilestoneProgress() {
  const { getSpaceStats, getCurrentLevel, getNextLevel, spaces, currentSpaceId } = useAppStore()
  const stats = getSpaceStats()
  const currentLevel = getCurrentLevel()
  const nextLevel = getNextLevel()
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  const progressToNext = nextLevel
    ? ((stats.totalWins - currentLevel.requiredWins) / (nextLevel.requiredWins - currentLevel.requiredWins)) * 100
    : 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Lv.{currentLevel.level} {currentLevel.name}
        </span>
        <span className="text-xs font-bold text-foreground">{stats.totalWins} wins</span>
        {nextLevel && (
          <span className="text-xs text-muted-foreground/60">
            · {nextLevel.requiredWins - stats.totalWins} to {nextLevel.name}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {nextLevel && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-muted-foreground/50 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(progressToNext, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
