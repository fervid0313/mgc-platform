"use client"

import { useAppStore } from "@/lib/store"
import { BookOpen, Users } from "lucide-react"

interface ViewToggleProps {
  showCommunity: boolean
  onToggleCommunity: () => void
}

export function ViewToggle({ showCommunity, onToggleCommunity }: ViewToggleProps) {
  const currentSpace = useAppStore(state => state.spaces.find((s) => s.id === state.currentSpaceId))
  const isPrivate = currentSpace?.isPrivate

  const isJournalActive = !showCommunity

  return (
    <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1 mb-6">
      <button
        onClick={() => {
          if (showCommunity) onToggleCommunity()
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isJournalActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BookOpen className="h-4 w-4" />
        Journal
      </button>

      <button
        onClick={() => {
          if (!showCommunity) onToggleCommunity()
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          showCommunity ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-4 w-4" />
        Community
      </button>
    </div>
  )
}
