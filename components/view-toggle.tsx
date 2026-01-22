"use client"

import { useAppStore } from "@/lib/store"
import { BookOpen, Users, MessageCircleQuestion } from "lucide-react"

interface ViewToggleProps {
  showCommunity: boolean
  showFAQ: boolean
  onToggleCommunity: () => void
  onToggleFAQ: () => void
}

export function ViewToggle({ showCommunity, showFAQ, onToggleCommunity, onToggleFAQ }: ViewToggleProps) {
  const currentSpace = useAppStore(state => state.spaces.find((s) => s.id === state.currentSpaceId))
  const isPrivate = currentSpace?.isPrivate

  const isJournalActive = !showCommunity && !showFAQ
  const isCommunityActive = showCommunity && !showFAQ
  const isFAQActive = showFAQ

  return (
    <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1 mb-6">
      <button
        onClick={() => {
          if (showCommunity || showFAQ) {
            onToggleCommunity()
            if (showFAQ) onToggleFAQ()
          }
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
          if (!showCommunity || showFAQ) {
            onToggleCommunity()
            if (showFAQ) onToggleFAQ()
          }
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isFAQActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MessageCircleQuestion className="h-4 w-4" />
        FAQ
      </button>
    </div>
  )
}
