"use client"

import { useAppStore } from "@/lib/store"
import { JournalEntryCard } from "./journal-entry-card"

export function JournalFeed() {
  const { entries, currentSpaceId, spaces } = useAppStore()
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []
  const isGlobalFeed = currentSpaceId === "space-global"

  if (spaceEntries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Silence in {currentSpace?.name || "this space"}
        </p>
        <p className="text-muted-foreground/50 text-sm mt-2">Be the first to log an entry</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {spaceEntries.map((entry, index) => (
        <JournalEntryCard key={entry.id} entry={entry} index={index} isGlobal={isGlobalFeed} />
      ))}
    </div>
  )
}
