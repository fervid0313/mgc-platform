"use client"

import { useAppStore } from "@/lib/store"
import { JournalEntryCard } from "./journal-entry-card"

export function JournalFeed() {
  const { entries, currentSpaceId, spaces, loadMoreEntries, hasMoreEntries, isLoadingMoreEntries } = useAppStore()
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []
  const isGlobalFeed = currentSpaceId === "space-global"

  console.log("[FEED] 📊 Current state:", {
    currentSpaceId,
    spaceEntriesCount: spaceEntries.length,
    entriesKeys: Object.keys(entries),
    currentSpaceName: currentSpace?.name,
    isGlobalFeed
  })

  const canLoadMore = currentSpaceId ? hasMoreEntries[currentSpaceId] !== false : false
  const isLoadingMore = currentSpaceId ? isLoadingMoreEntries[currentSpaceId] === true : false

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

      {currentSpaceId && spaceEntries.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => void loadMoreEntries(currentSpaceId)}
            disabled={!canLoadMore || isLoadingMore}
            className="text-xs font-bold px-4 py-2 rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? "Loading..." : canLoadMore ? "Load more" : "No more posts"}
          </button>
        </div>
      )}
    </div>
  )
}
