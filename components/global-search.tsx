"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Search, X, User, FileText } from "lucide-react"
import { getAvatarUrl } from "@/lib/avatar-generator"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { profiles, entries, currentSpaceId } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape" && open) setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return { users: [], entries: [] }
    const q = query.toLowerCase()

    const users = profiles
      .filter((p) => p.username?.toLowerCase().includes(q) || p.tag?.toLowerCase().includes(q))
      .slice(0, 5)

    const spaceEntries = currentSpaceId ? (entries[currentSpaceId] || []) : []
    const matchedEntries = spaceEntries
      .filter((e) =>
        e.content?.toLowerCase().includes(q) ||
        e.symbol?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 5)

    return { users, entries: matchedEntries }
  }, [query, profiles, entries, currentSpaceId])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
      <div className="glass-3d rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, entries, symbols..."
            className="flex-1 bg-transparent outline-none text-sm"
            autoFocus
          />
          <kbd className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary/50 border border-border rounded text-muted-foreground">ESC</kbd>
        </div>

        {query.trim() && (
          <div className="max-h-80 overflow-y-auto">
            {results.users.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Users</p>
                {results.users.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { router.push(`/profile/${p.id}`); setOpen(false); setQuery("") }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <img src={getAvatarUrl(p.username, p.avatar, 28)} alt="" className="w-7 h-7 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{p.username}</p>
                      <p className="text-[10px] text-muted-foreground">#{p.tag}</p>
                    </div>
                    <User className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {results.entries.length > 0 && (
              <div className="p-2 border-t border-border/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Entries</p>
                {results.entries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setOpen(false)
                      setQuery("")
                      setTimeout(() => {
                        const el = document.querySelector(`[data-entry-id="${e.id}"]`)
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" })
                          el.classList.add("ring-2", "ring-primary/50")
                          setTimeout(() => el.classList.remove("ring-2", "ring-primary/50"), 3000)
                        }
                      }, 100)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs truncate">{e.content?.slice(0, 80)}</p>
                    </div>
                    <div className="flex gap-2 mt-0.5 ml-5">
                      {e.symbol && <span className="text-[9px] text-muted-foreground">{e.symbol}</span>}
                      {e.profitLoss !== undefined && (
                        <span className={`text-[9px] font-bold ${e.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {e.profitLoss >= 0 ? "+" : ""}${e.profitLoss.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.users.length === 0 && results.entries.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-xs text-muted-foreground">No results for "{query}"</p>
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground">Type to search users, entries, and symbols</p>
          </div>
        )}
      </div>
    </div>
  )
}
