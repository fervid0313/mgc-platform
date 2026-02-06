"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Lightbulb, Send, X } from "lucide-react"
import { getAvatarUrl } from "@/lib/avatar-generator"

const IDEAS_KEY = "mgc-trade-ideas"

interface TradeIdea {
  id: string
  userId: string
  username: string
  avatar?: string
  symbol: string
  direction: "long" | "short"
  thesis: string
  createdAt: string
}

function loadIdeas(): TradeIdea[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(IDEAS_KEY) || "[]") } catch { return [] }
}

function saveIdeas(ideas: TradeIdea[]) {
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas.slice(0, 20)))
}

export function TradeIdeas() {
  const { user, profiles } = useAppStore()
  const [ideas, setIdeas] = useState<TradeIdea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [symbol, setSymbol] = useState("")
  const [direction, setDirection] = useState<"long" | "short">("long")
  const [thesis, setThesis] = useState("")

  useEffect(() => { setIdeas(loadIdeas()) }, [])

  const handleSubmit = () => {
    if (!symbol.trim() || !thesis.trim() || !user) return
    const profile = profiles.find((p) => p.id === user.id)
    const idea: TradeIdea = {
      id: Date.now().toString(),
      userId: user.id,
      username: profile?.username || user.username || "Unknown",
      avatar: profile?.avatar,
      symbol: symbol.toUpperCase(),
      direction,
      thesis,
      createdAt: new Date().toISOString(),
    }
    const updated = [idea, ...ideas].slice(0, 20)
    setIdeas(updated)
    saveIdeas(updated)
    setSymbol("")
    setThesis("")
    setShowForm(false)
  }

  const removeIdea = (id: string) => {
    const updated = ideas.filter((i) => i.id !== id)
    setIdeas(updated)
    saveIdeas(updated)
  }

  return (
    <div className="glass-3d rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-sm font-bold">Trade Ideas</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] font-bold text-primary hover:underline"
        >
          {showForm ? "Cancel" : "+ Share Idea"}
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 p-3 bg-secondary/20 rounded-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Symbol (e.g. AAPL)"
              className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary/50"
            />
            <div className="flex rounded-lg overflow-hidden border border-border/50">
              <button
                onClick={() => setDirection("long")}
                className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${direction === "long" ? "bg-green-500/20 text-green-500" : "text-muted-foreground"}`}
              >
                Long
              </button>
              <button
                onClick={() => setDirection("short")}
                className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${direction === "short" ? "bg-red-500/20 text-red-500" : "text-muted-foreground"}`}
              >
                Short
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="Your thesis..."
              className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary/50"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button onClick={handleSubmit} className="btn-3d p-1.5 bg-primary text-primary-foreground rounded-lg">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {ideas.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {ideas.slice(0, 5).map((idea) => (
            <div key={idea.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/20 transition-colors">
              <img src={getAvatarUrl(idea.username, idea.avatar, 24)} alt="" className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold">{idea.username}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${idea.direction === "long" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {idea.direction.toUpperCase()} {idea.symbol}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{idea.thesis}</p>
              </div>
              {user?.id === idea.userId && (
                <button onClick={() => removeIdea(idea.id)} className="p-0.5 text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground text-center py-2">No trade ideas yet. Be the first to share!</p>
      )}
    </div>
  )
}
