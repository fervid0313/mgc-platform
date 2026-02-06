"use client"

import { useAppStore } from "@/lib/store"
import { BookOpen, Users, MessageCircleQuestion, BarChart3 } from "lucide-react"

interface ViewToggleProps {
  showCommunity: boolean
  showFAQ: boolean
  showStatus: boolean
  onToggleCommunity: () => void
  onToggleFAQ: () => void
  onToggleStatus: () => void
}

export function ViewToggle({ showCommunity, showFAQ, showStatus, onToggleCommunity, onToggleFAQ, onToggleStatus }: ViewToggleProps) {
  const currentSpace = useAppStore(state => state.spaces.find((s) => s.id === state.currentSpaceId))
  const isPrivate = currentSpace?.isPrivate

  const isJournalActive = !showCommunity && !showFAQ && !showStatus
  const isStatusActive = showStatus
  const isCommunityActive = showCommunity && !showFAQ && !showStatus
  const isFAQActive = showFAQ

  return (
    <div className="flex items-center gap-1 glass-3d rounded-xl p-1 mb-6">
      <button
        onClick={() => {
          if (showCommunity) onToggleCommunity()
          if (showFAQ) onToggleFAQ()
          if (showStatus) onToggleStatus()
        }}
        className={`btn-3d flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isJournalActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BookOpen className="h-4 w-4" />
        Journal
      </button>

      <button
        onClick={onToggleStatus}
        className={`btn-3d flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isStatusActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BarChart3 className="h-4 w-4" />
        Statistics
      </button>

      <button
        onClick={() => {
          if (!showCommunity || showFAQ || showStatus) {
            onToggleCommunity()
            if (showFAQ) onToggleFAQ()
          }
        }}
        className={`btn-3d flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isCommunityActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-4 w-4" />
        Community
      </button>

      <button
        onClick={() => {
          if (!showFAQ) {
            onToggleFAQ()
            if (showCommunity) onToggleCommunity()
          }
        }}
        className={`btn-3d flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isFAQActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MessageCircleQuestion className="h-4 w-4" />
        FAQ
      </button>
    </div>
  )
}
