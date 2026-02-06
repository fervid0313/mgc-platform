"use client"

import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import type { JournalEntry } from "@/lib/types"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { safeSubstring } from "@/lib/string-safety"
import { JournalEntryCard } from "./journal-entry-card"
import { Search, Bookmark, BookmarkCheck, X, BookOpen } from "lucide-react"

interface SavedFilter {
  name: string
  query: string
  symbol: string
  strategy: string
  timeframe: string
  direction: "" | "long" | "short"
  tradeType: "" | NonNullable<JournalEntry["tradeType"]>
}

const SAVED_FILTERS_KEY = "mgc-saved-filters"

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
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || "[]") } catch { return [] }
  })
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [filterName, setFilterName] = useState("")

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return
    const filter: SavedFilter = { name: filterName.trim(), query, symbol, strategy, timeframe, direction, tradeType }
    const updated = [...savedFilters, filter]
    setSavedFilters(updated)
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated))
    setFilterName("")
    setShowSaveInput(false)
  }

  const loadFilter = (f: SavedFilter) => {
    setQuery(f.query); setSymbol(f.symbol); setStrategy(f.strategy)
    setTimeframe(f.timeframe); setDirection(f.direction); setTradeType(f.tradeType)
  }

  const deleteFilter = (idx: number) => {
    const updated = savedFilters.filter((_, i) => i !== idx)
    setSavedFilters(updated)
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated))
  }

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sym = symbol.trim().toLowerCase()
    const strat = strategy.trim().toLowerCase()
    const tf = timeframe.trim().toLowerCase()

    return [...spaceEntries].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    }).filter((e) => {
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
      <div className="text-center py-20 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
            Silence in {currentSpace?.name || "this space"}
          </p>
          <p className="text-muted-foreground/50 text-sm mt-2">Be the first to log a trade and start your journal</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
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

        <div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveInput(!showSaveInput)}
              className="text-[10px] font-bold px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1"
              title="Save current filter"
            >
              <Bookmark className="h-3 w-3" />
              Save
            </button>
            <span className="text-[10px] font-bold text-muted-foreground">
              {filteredEntries.length} shown
            </span>
          </div>
        </div>

        {showSaveInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveCurrentFilter()}
              placeholder="Filter name..."
              className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50"
              autoFocus
            />
            <button onClick={saveCurrentFilter} className="text-xs font-bold px-3 py-1.5 bg-primary text-primary-foreground rounded-lg">Save</button>
          </div>
        )}

        {savedFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {savedFilters.map((f, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border border-border hover:border-primary/50 transition-all group">
                <button onClick={() => loadFilter(f)} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <BookmarkCheck className="h-3 w-3" />
                  {f.name}
                </button>
                <button onClick={() => deleteFilter(idx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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

      {currentSpaceId && spaceEntries.length > 0 && canLoadMore && (
        <InfiniteScrollSentinel
          onIntersect={() => { if (!isLoadingMore && canLoadMore) loadMoreEntries(currentSpaceId) }}
          isLoading={isLoadingMore}
        />
      )}
      {isLoadingMore && (
        <div className="flex justify-center pt-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
}

function InfiniteScrollSentinel({ onIntersect, isLoading }: { onIntersect: () => void; isLoading: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !isLoading) onIntersect() },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, isLoading])

  return <div ref={ref} className="h-1" />
}
