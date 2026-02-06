"use client"

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import type { JournalEntry } from "@/lib/types"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { safeSubstring } from "@/lib/string-safety"
import { JournalEntryCard } from "./journal-entry-card"
import { Search } from "lucide-react"

export function JournalFeed() {
  const { entries, currentSpaceId, spaces, loadMoreEntries, hasMoreEntries, isLoadingMoreEntries, forceLoadEntries } = useAppStore()
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []
  const isGlobalFeed = currentSpaceId === "space-global"

  const [query, setQuery] = useState("")
  const [symbol, setSymbol] = useState("")
  const [strategy, setStrategy] = useState("")
  const [timeframe, setTimeframe] = useState("")
  const [direction, setDirection] = useState<"" | "long" | "short">("")
  const [tradeType, setTradeType] = useState<"" | NonNullable<JournalEntry["tradeType"]>>("")

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sym = symbol.trim().toLowerCase()
    const strat = strategy.trim().toLowerCase()
    const tf = timeframe.trim().toLowerCase()

    return spaceEntries.filter((e) => {
      if (tradeType && (e.tradeType || "general") !== tradeType) return false
      if (direction && (e.direction || "") !== direction) return false

      if (sym) {
        const v = (e.symbol || "").toLowerCase()
        if (!v.includes(sym)) return false
      }

      if (strat) {
        const v = (e.strategy || "").toLowerCase()
        if (!v.includes(strat)) return false
      }

      if (tf) {
        const v = (e.timeframe || "").toLowerCase()
        if (!v.includes(tf)) return false
      }

      if (q) {
        const haystack = [
          e.content || "",
          e.username || "",
          (e.tags || []).join(" "),
          e.symbol || "",
          e.strategy || "",
        ]
          .join("\n")
          .toLowerCase()

        if (!haystack.includes(q)) return false
      }

      return true
    })
  }, [spaceEntries, query, symbol, strategy, timeframe, direction, tradeType])

  console.log("[FEED] 📊 Current state:", {
    currentSpaceId,
    spaceEntriesCount: spaceEntries.length,
    entriesKeys: Object.keys(entries),
    currentSpaceName: currentSpace?.name,
    isGlobalFeed,
    sampleEntry: spaceEntries?.[0] ? {
      id: spaceEntries[0]?.id,
      hasPnl: spaceEntries[0]?.profitLoss !== undefined,
      pnlValue: spaceEntries[0]?.profitLoss,
      hasImage: !!spaceEntries[0]?.image,
      content: (() => {
              try {
                return spaceEntries[0]?.content && typeof spaceEntries[0].content === 'string' 
                  ? safeSubstring(spaceEntries[0].content, 0, 30) + "..." 
                  : "No content"
              } catch (e) {
                return "No content"
              }
            })()
    } : 'No entries'
  })

  const canLoadMore = currentSpaceId ? hasMoreEntries[currentSpaceId] !== false : false
  const isLoadingMore = currentSpaceId ? isLoadingMoreEntries[currentSpaceId] === true : false

  // Add a debug button for testing
  const handleForceRefresh = () => {
    console.log("[FEED] 🔄 Force refreshing entries...")
    if (currentSpaceId) {
      forceLoadEntries(currentSpaceId)
    }
  }

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
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entries (content, tags, user, symbol, strategy)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
          <input
            type="text"
            placeholder="Strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
          <input
            type="text"
            placeholder="Timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
          <select
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value as any)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="">All types</option>
            <option value="general">General</option>
            <option value="day-trade">Day Trade</option>
            <option value="swing">Swing</option>
            <option value="investment">Investment</option>
            <option value="ecommerce">E-commerce</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection(direction === "long" ? "" : "long")}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                direction === "long" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => setDirection(direction === "short" ? "" : "short")}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                direction === "short" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Short
            </button>
          </div>

          <div className="text-[10px] font-bold text-muted-foreground">
            {filteredEntries.length} shown
          </div>
        </div>
      </div>

      {/* Debug button for testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-center">
          <button
            onClick={handleForceRefresh}
            className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-600 rounded-full hover:bg-yellow-500/30 transition-colors"
          >
            🔄 Force Refresh (Debug)
          </button>
        </div>
      )}
      
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No matches</p>
          <p className="text-muted-foreground/50 text-sm mt-2">Try clearing filters</p>
        </div>
      ) : (
        filteredEntries.map((entry, index) => (
          <JournalEntryCard key={entry.id} entry={entry} index={index} isGlobal={isGlobalFeed} />
        ))
      )}

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
