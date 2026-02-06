"use client"

import { useState, useEffect } from "react"
import { Eye, Plus, X, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface WatchlistItem {
  symbol: string
  notes: string
  direction: "long" | "short" | "neutral"
  addedAt: string
}

const STORAGE_KEY = "mgc-watchlist"

function loadWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function Watchlist() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [newSymbol, setNewSymbol] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [newDirection, setNewDirection] = useState<"long" | "short" | "neutral">("neutral")

  useEffect(() => {
    setItems(loadWatchlist())
  }, [])

  const addItem = () => {
    if (!newSymbol.trim()) return
    const item: WatchlistItem = {
      symbol: newSymbol.trim().toUpperCase(),
      notes: newNotes.trim(),
      direction: newDirection,
      addedAt: new Date().toISOString(),
    }
    const updated = [item, ...items.filter((i) => i.symbol !== item.symbol)]
    setItems(updated)
    saveWatchlist(updated)
    setNewSymbol("")
    setNewNotes("")
    setNewDirection("neutral")
  }

  const removeItem = (symbol: string) => {
    const updated = items.filter((i) => i.symbol !== symbol)
    setItems(updated)
    saveWatchlist(updated)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn-3d w-full justify-start" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Watchlist {items.length > 0 && `(${items.length})`}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] glass-3d border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Watchlist
          </DialogTitle>
          <DialogDescription>
            Track instruments you're watching.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Add form */}
          <div className="flex gap-2">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Symbol (e.g. ES, NQ)"
              className="bg-background/50 border-border h-9 text-sm flex-1"
            />
            <div className="flex gap-1">
              <button
                onClick={() => setNewDirection(newDirection === "long" ? "neutral" : "long")}
                className={`p-2 rounded-lg border transition-all ${
                  newDirection === "long" ? "border-green-500 bg-green-500/10 text-green-500" : "border-border text-muted-foreground"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setNewDirection(newDirection === "short" ? "neutral" : "short")}
                className={`p-2 rounded-lg border transition-all ${
                  newDirection === "short" ? "border-red-500 bg-red-500/10 text-red-500" : "border-border text-muted-foreground"
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={addItem}
              disabled={!newSymbol.trim()}
              className="btn-3d p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Notes */}
          {newSymbol.trim() && (
            <Input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Notes (optional)"
              className="bg-background/50 border-border h-8 text-xs"
            />
          )}

          {/* List */}
          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Your watchlist is empty.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-background/30 hover:bg-background/50 transition-colors group"
                >
                  <div className={`p-1 rounded ${
                    item.direction === "long" ? "bg-green-500/10" : item.direction === "short" ? "bg-red-500/10" : "bg-secondary/30"
                  }`}>
                    {item.direction === "long" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    ) : item.direction === "short" ? (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold">{item.symbol}</span>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground truncate">{item.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.symbol)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
