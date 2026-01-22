"use client"

import type React from "react"

import { useAppStore } from "@/lib/store"
import { Brain, Target, Flame, AlertTriangle, Activity } from "lucide-react"
import type { MentalState } from "@/lib/types"

const vibeConfig: Record<MentalState, { icon: React.ReactNode; label: string; color: string; warning?: string }> = {
  calm: {
    icon: <Brain className="h-4 w-4" />,
    label: "Calm",
    color: "text-green-500",
  },
  focused: {
    icon: <Target className="h-4 w-4" />,
    label: "Focused",
    color: "text-blue-500",
  },
  aggressive: {
    icon: <Flame className="h-4 w-4" />,
    label: "Aggressive",
    color: "text-red-500",
    warning: "Beware of revenge trading",
  },
  fearful: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "Fearful",
    color: "text-amber-500",
    warning: "Group may be overly cautious",
  },
}

export function VibeIndicator() {
  const { getCollectiveVibe, currentSpaceId, entries } = useAppStore()
  const vibe = getCollectiveVibe()
  const spaceEntries = entries[currentSpaceId || ""] || []

  // Count recent mental states
  const recentStates = (() => {
    try {
      return spaceEntries?.slice(0, 10)?.filter((e) => e.mentalState) || []
    } catch (e) {
      return []
    }
  })()

  if (!vibe || recentStates.length < 2) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Activity className="h-3 w-3" />
        <span>Vibe: Neutral</span>
      </div>
    )
  }

  const config = vibeConfig[vibe]

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-2 text-[10px] font-bold ${config.color}`}>
        {config.icon}
        <span>Space Vibe: {config.label}</span>
      </div>
      {config.warning && <span className="text-[9px] text-muted-foreground italic">{config.warning}</span>}
    </div>
  )
}
