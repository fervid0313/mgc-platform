"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, BarChart3 } from "lucide-react"

interface Playbook {
  id: string
  name: string
  description: string
  entryCriteria: string
  stopRules: string
  targetRules: string
  createdAt: string
}

const STORAGE_KEY = "mgc-playbooks"

function loadPlaybooks(): Playbook[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function savePlaybooks(pbs: Playbook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pbs))
}

export function PlaybookBuilder() {
  const { entries, currentSpaceId } = useAppStore()
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [entryCriteria, setEntryCriteria] = useState("")
  const [stopRules, setStopRules] = useState("")
  const [targetRules, setTargetRules] = useState("")

  useEffect(() => { setPlaybooks(loadPlaybooks()) }, [])

  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []

  const playbookStats = useMemo(() => {
    const stats: Record<string, { trades: number; wins: number; totalPnL: number; avgPnL: number }> = {}
    playbooks.forEach((pb) => {
      const pbName = pb.name.toLowerCase()
      const matched = spaceEntries.filter((e) =>
        (e.strategy || "").toLowerCase().includes(pbName) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(pbName)) ||
        (e.content || "").toLowerCase().includes(pbName)
      )
      const wins = matched.filter((e) => (e.profitLoss || 0) > 0).length
      const totalPnL = matched.reduce((s, e) => s + (e.profitLoss || 0), 0)
      stats[pb.id] = {
        trades: matched.length,
        wins,
        totalPnL,
        avgPnL: matched.length > 0 ? totalPnL / matched.length : 0,
      }
    })
    return stats
  }, [playbooks, spaceEntries])

  const addPlaybook = () => {
    if (!name.trim()) return
    const pb: Playbook = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      entryCriteria: entryCriteria.trim(),
      stopRules: stopRules.trim(),
      targetRules: targetRules.trim(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...playbooks, pb]
    setPlaybooks(updated)
    savePlaybooks(updated)
    setName(""); setDescription(""); setEntryCriteria(""); setStopRules(""); setTargetRules("")
    setShowForm(false)
  }

  const removePlaybook = (id: string) => {
    const updated = playbooks.filter((p) => p.id !== id)
    setPlaybooks(updated)
    savePlaybooks(updated)
  }

  return (
    <div className="glass-3d rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest">Playbook Builder</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 mb-4 p-4 rounded-xl bg-secondary/20 border border-border">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playbook name (e.g., Opening Range Breakout)"
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50"
          />
          <textarea
            value={entryCriteria}
            onChange={(e) => setEntryCriteria(e.target.value)}
            placeholder="Entry criteria (e.g., Price breaks above OR high with volume)"
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 resize-none h-16"
          />
          <textarea
            value={stopRules}
            onChange={(e) => setStopRules(e.target.value)}
            placeholder="Stop loss rules (e.g., Below OR low or -$100 max)"
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 resize-none h-16"
          />
          <textarea
            value={targetRules}
            onChange={(e) => setTargetRules(e.target.value)}
            placeholder="Target rules (e.g., 2:1 R:R minimum, scale at 1:1)"
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 resize-none h-16"
          />
          <div className="flex gap-2">
            <button onClick={addPlaybook} className="btn-3d text-xs font-bold px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              Save Playbook
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs font-bold px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {playbooks.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground/50 text-center py-4">
          No playbooks yet. Define your trading setups to track their performance.
        </p>
      )}

      <div className="space-y-2">
        {playbooks.map((pb) => {
          const stats = playbookStats[pb.id] || { trades: 0, wins: 0, totalPnL: 0, avgPnL: 0 }
          const winRate = stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : 0
          const isExpanded = expanded === pb.id

          return (
            <div key={pb.id} className="rounded-xl border border-border bg-secondary/10 overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : pb.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <span className="text-xs font-bold">{pb.name}</span>
                    {pb.description && <p className="text-[10px] text-muted-foreground">{pb.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-3 text-[10px] font-bold">
                    <span className="text-muted-foreground">{stats.trades} trades</span>
                    <span className={stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">{winRate}% WR</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                  {pb.entryCriteria && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entry Criteria</span>
                      <p className="text-xs mt-0.5">{pb.entryCriteria}</p>
                    </div>
                  )}
                  {pb.stopRules && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stop Rules</span>
                      <p className="text-xs mt-0.5">{pb.stopRules}</p>
                    </div>
                  )}
                  {pb.targetRules && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Rules</span>
                      <p className="text-xs mt-0.5">{pb.targetRules}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="text-center p-2 rounded-lg bg-secondary/20">
                      <p className="text-[10px] text-muted-foreground">Trades</p>
                      <p className="text-sm font-black">{stats.trades}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/20">
                      <p className="text-[10px] text-muted-foreground">Win Rate</p>
                      <p className="text-sm font-black">{winRate}%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/20">
                      <p className="text-[10px] text-muted-foreground">Total P&L</p>
                      <p className={`text-sm font-black ${stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(0)}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/20">
                      <p className="text-[10px] text-muted-foreground">Avg P&L</p>
                      <p className={`text-sm font-black ${stats.avgPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.avgPnL >= 0 ? "+" : ""}${stats.avgPnL.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button onClick={() => removePlaybook(pb.id)} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">
        Tip: Use your playbook name as a tag or strategy when logging trades to auto-link them.
      </p>
    </div>
  )
}
