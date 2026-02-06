"use client"

import { useState, useMemo, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { X } from "lucide-react"

interface TagAutocompleteProps {
  selectedTags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
}

export function TagAutocomplete({ selectedTags, onAdd, onRemove }: TagAutocompleteProps) {
  const { entries, currentSpaceId, user } = useAppStore()
  const [input, setInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const allUsedTags = useMemo(() => {
    if (!currentSpaceId || !user) return []
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    const tagSet = new Set<string>()
    userEntries.forEach((e) => e.tags?.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [entries, currentSpaceId, user])

  const suggestions = useMemo(() => {
    if (!input.trim()) return allUsedTags.filter((t) => !selectedTags.includes(t)).slice(0, 8)
    const q = input.trim().toLowerCase()
    return allUsedTags
      .filter((t) => t.toLowerCase().includes(q) && !selectedTags.includes(t))
      .slice(0, 8)
  }, [input, allUsedTags, selectedTags])

  const handleAdd = (tag: string) => {
    onAdd(tag)
    setInput("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      handleAdd(input.trim())
    }
  }

  const customTags = selectedTags.filter(
    (t) => !["A+ Setup", "B Setup", "Revenge Trade", "FOMO", "Overtraded", "Followed Plan", "Break Even", "Scaled In", "Early Exit", "Let It Run", "News Play", "Breakout", "Pullback", "Reversal", "Trend", "Range"].includes(t)
  )

  return (
    <div className="relative">
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {customTags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary bg-primary/10 text-primary">
              #{tag}
              <button type="button" onClick={() => onRemove(tag)} className="hover:text-red-500">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Add custom tag..."
        className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleAdd(tag) }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
