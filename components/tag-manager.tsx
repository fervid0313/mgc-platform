"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Tag, Pencil, Merge, X, Check } from "lucide-react"

export function TagManager() {
  const { entries, currentSpaceId, user, updateEntry } = useAppStore()
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [mergeTarget, setMergeTarget] = useState<string | null>(null)

  const userEntries = useMemo(() => {
    if (!currentSpaceId || !user) return []
    return (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
  }, [entries, currentSpaceId, user])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    userEntries.forEach((e) => e.tags?.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [userEntries])

  const handleRename = (oldTag: string) => {
    if (!newName.trim() || newName.trim() === oldTag) { setEditingTag(null); return }
    const target = newName.trim()
    userEntries.forEach((e) => {
      if (e.tags?.includes(oldTag)) {
        const updatedTags = e.tags.map((t) => t === oldTag ? target : t)
        const uniqueTags = [...new Set(updatedTags)]
        updateEntry(e.id, e.content, uniqueTags, e.tradeType, e.profitLoss, e.image, e.mentalState)
      }
    })
    setEditingTag(null)
    setNewName("")
  }

  const handleMerge = (sourceTag: string, targetTag: string) => {
    userEntries.forEach((e) => {
      if (e.tags?.includes(sourceTag)) {
        const updatedTags = e.tags.filter((t) => t !== sourceTag)
        if (!updatedTags.includes(targetTag)) updatedTags.push(targetTag)
        updateEntry(e.id, e.content, updatedTags, e.tradeType, e.profitLoss, e.image, e.mentalState)
      }
    })
    setMergeTarget(null)
  }

  if (tagCounts.length === 0) return null

  return (
    <div className="glass-3d rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Tag Management</h3>
        <span className="text-xs text-muted-foreground ml-auto">{tagCounts.length} tags</span>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {tagCounts.map(([tag, count]) => (
          <div key={tag} className="flex items-center gap-2 text-sm group">
            {editingTag === tag ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(tag)}
                  className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary/50"
                  autoFocus
                />
                <button onClick={() => handleRename(tag)} className="text-green-500 hover:text-green-400">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingTag(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : mergeTarget === tag ? (
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Merge into:</span>
                <select
                  onChange={(e) => { if (e.target.value) handleMerge(tag, e.target.value) }}
                  className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-2 py-1 text-xs"
                  autoFocus
                >
                  <option value="">Select tag...</option>
                  {tagCounts.filter(([t]) => t !== tag).map(([t]) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button onClick={() => setMergeTarget(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 font-medium truncate">#{tag}</span>
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                <button
                  onClick={() => { setEditingTag(tag); setNewName(tag) }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setMergeTarget(tag)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                  title="Merge into another tag"
                >
                  <Merge className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
