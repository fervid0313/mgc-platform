"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { GitCompare, ChevronDown, ArrowRight } from "lucide-react"

export function TradeComparison() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [mode, setMode] = useState<"entries" | "periods">("entries")
  const [entryA, setEntryA] = useState("")
  const [entryB, setEntryB] = useState("")
  const [periodA, setPeriodA] = useState<"this_week" | "last_week" | "this_month" | "last_month">("this_week")
  const [periodB, setPeriodB] = useState<"this_week" | "last_week" | "this_month" | "last_month">("last_week")

  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []
  const myEntries = spaceEntries.filter((e) => e.userId === user?.id)

  const getPeriodRange = (period: string): [Date, Date] => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    switch (period) {
      case "this_week":
        return [startOfWeek, now]
      case "last_week": {
        const end = new Date(startOfWeek)
        end.setMilliseconds(-1)
        const start = new Date(startOfWeek)
        start.setDate(start.getDate() - 7)
        return [start, end]
      }
      case "this_month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        return [start, now]
      }
      case "last_month": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        return [start, end]
      }
      default:
        return [startOfWeek, now]
    }
  }

  const periodStats = useMemo(() => {
    if (mode !== "periods") return null
    const calc = (period: string) => {
      const [start, end] = getPeriodRange(period)
      const filtered = myEntries.filter((e) => {
        const d = new Date(e.createdAt)
        return d >= start && d <= end
      })
      const wins = filtered.filter((e) => (e.profitLoss || 0) > 0).length
      const losses = filtered.filter((e) => (e.profitLoss || 0) < 0).length
      const totalPnL = filtered.reduce((s, e) => s + (e.profitLoss || 0), 0)
      const avgPnL = filtered.length > 0 ? totalPnL / filtered.length : 0
      const winRate = filtered.length > 0 ? Math.round((wins / filtered.length) * 100) : 0
      return { trades: filtered.length, wins, losses, totalPnL, avgPnL, winRate }
    }
    return { a: calc(periodA), b: calc(periodB) }
  }, [mode, periodA, periodB, myEntries])

  const entryComparison = useMemo(() => {
    if (mode !== "entries" || !entryA || !entryB) return null
    const a = myEntries.find((e) => e.id === entryA)
    const b = myEntries.find((e) => e.id === entryB)
    if (!a || !b) return null
    return { a, b }
  }, [mode, entryA, entryB, myEntries])

  const periodLabels: Record<string, string> = {
    this_week: "This Week",
    last_week: "Last Week",
    this_month: "This Month",
    last_month: "Last Month",
  }

  return (
    <div className="glass-3d rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest">Trade Comparison</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("entries")}
            className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
              mode === "entries" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Entries
          </button>
          <button
            onClick={() => setMode("periods")}
            className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
              mode === "periods" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Periods
          </button>
        </div>
      </div>

      {mode === "entries" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Entry A</label>
              <select
                value={entryA}
                onChange={(e) => setEntryA(e.target.value)}
                className="w-full text-xs bg-secondary/30 border border-border rounded-lg px-2 py-2 outline-none focus:border-primary/50"
              >
                <option value="">Select trade...</option>
                {myEntries.slice(0, 50).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.symbol || "—"} {(e.profitLoss || 0) >= 0 ? "+" : ""}${(e.profitLoss || 0).toFixed(0)} ({new Date(e.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Entry B</label>
              <select
                value={entryB}
                onChange={(e) => setEntryB(e.target.value)}
                className="w-full text-xs bg-secondary/30 border border-border rounded-lg px-2 py-2 outline-none focus:border-primary/50"
              >
                <option value="">Select trade...</option>
                {myEntries.slice(0, 50).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.symbol || "—"} {(e.profitLoss || 0) >= 0 ? "+" : ""}${(e.profitLoss || 0).toFixed(0)} ({new Date(e.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {entryComparison && (
            <div className="grid grid-cols-2 gap-3">
              {[entryComparison.a, entryComparison.b].map((e, i) => (
                <div key={e.id} className="p-3 rounded-xl bg-secondary/20 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">Entry {i === 0 ? "A" : "B"}</span>
                    <span className={`text-xs font-black ${(e.profitLoss || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(e.profitLoss || 0) >= 0 ? "+" : ""}${(e.profitLoss || 0).toFixed(0)}
                    </span>
                  </div>
                  {e.symbol && <p className="text-xs font-black text-primary">{e.symbol} {e.direction?.toUpperCase()}</p>}
                  {e.strategy && <p className="text-[10px] text-muted-foreground">Strategy: {e.strategy}</p>}
                  {e.mentalState && <p className="text-[10px] text-muted-foreground">Mood: {e.mentalState}</p>}
                  {e.tags && e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.tags.map((t) => (
                        <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">#{t}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground line-clamp-3">{e.content?.slice(0, 150)}</p>
                  <p className="text-[10px] text-muted-foreground/50">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {!entryComparison && entryA && entryB && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">Could not find selected entries.</p>
          )}
          {(!entryA || !entryB) && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">Select two trades to compare side-by-side.</p>
          )}
        </>
      )}

      {mode === "periods" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Period A</label>
              <select
                value={periodA}
                onChange={(e) => setPeriodA(e.target.value as any)}
                className="w-full text-xs bg-secondary/30 border border-border rounded-lg px-2 py-2 outline-none focus:border-primary/50"
              >
                {Object.entries(periodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Period B</label>
              <select
                value={periodB}
                onChange={(e) => setPeriodB(e.target.value as any)}
                className="w-full text-xs bg-secondary/30 border border-border rounded-lg px-2 py-2 outline-none focus:border-primary/50"
              >
                {Object.entries(periodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {periodStats && (
            <div className="space-y-2">
              {[
                { label: "Trades", a: periodStats.a.trades, b: periodStats.b.trades },
                { label: "Win Rate", a: `${periodStats.a.winRate}%`, b: `${periodStats.b.winRate}%`, aNum: periodStats.a.winRate, bNum: periodStats.b.winRate },
                { label: "Total P&L", a: `$${periodStats.a.totalPnL.toFixed(0)}`, b: `$${periodStats.b.totalPnL.toFixed(0)}`, aNum: periodStats.a.totalPnL, bNum: periodStats.b.totalPnL },
                { label: "Avg P&L", a: `$${periodStats.a.avgPnL.toFixed(0)}`, b: `$${periodStats.b.avgPnL.toFixed(0)}`, aNum: periodStats.a.avgPnL, bNum: periodStats.b.avgPnL },
                { label: "Wins", a: periodStats.a.wins, b: periodStats.b.wins },
                { label: "Losses", a: periodStats.a.losses, b: periodStats.b.losses },
              ].map((row) => {
                const aVal = row.aNum ?? (typeof row.a === "number" ? row.a : 0)
                const bVal = row.bNum ?? (typeof row.b === "number" ? row.b : 0)
                const better = aVal > bVal ? "a" : bVal > aVal ? "b" : "tie"

                return (
                  <div key={row.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10 border border-border">
                    <span className={`text-xs font-bold w-20 text-right ${better === "a" ? "text-emerald-400" : "text-foreground"}`}>
                      {String(row.a)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center flex-1">{row.label}</span>
                    <span className={`text-xs font-bold w-20 ${better === "b" ? "text-emerald-400" : "text-foreground"}`}>
                      {String(row.b)}
                    </span>
                  </div>
                )
              })}
              <div className="flex justify-between text-[10px] text-muted-foreground/50 px-3">
                <span>{periodLabels[periodA]}</span>
                <span>{periodLabels[periodB]}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
