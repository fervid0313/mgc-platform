"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Clock, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react"

export function SessionView() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [dateOffset, setDateOffset] = useState(0)

  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []

  const { selectedDate, dayEntries, runningPnL, totalPnL, wins, losses, bestTrade, worstTrade } = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - dateOffset)
    const dateStr = date.toISOString().slice(0, 10)

    const dayEntries = spaceEntries
      .filter((e) => e.userId === user?.id && new Date(e.createdAt).toISOString().slice(0, 10) === dateStr)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    let running = 0
    const runningPnL = dayEntries.map((e) => {
      running += e.profitLoss || 0
      return running
    })

    const totalPnL = running
    const wins = dayEntries.filter((e) => (e.profitLoss || 0) > 0).length
    const losses = dayEntries.filter((e) => (e.profitLoss || 0) < 0).length
    const bestTrade = dayEntries.reduce((best, e) => (e.profitLoss || 0) > (best?.profitLoss || 0) ? e : best, dayEntries[0])
    const worstTrade = dayEntries.reduce((worst, e) => (e.profitLoss || 0) < (worst?.profitLoss || 0) ? e : worst, dayEntries[0])

    return { selectedDate: date, dayEntries, runningPnL, totalPnL, wins, losses, bestTrade, worstTrade }
  }, [spaceEntries, user?.id, dateOffset])

  const dateLabel = selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  const isToday = dateOffset === 0

  return (
    <div className="glass-3d rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest">Session View</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDateOffset((d) => d + 1)} className="p-1 hover:bg-secondary/30 rounded">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-xs font-bold min-w-[100px] text-center">
            {isToday ? "Today" : dateLabel}
          </span>
          <button
            onClick={() => setDateOffset((d) => Math.max(0, d - 1))}
            disabled={isToday}
            className="p-1 hover:bg-secondary/30 rounded disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {dayEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-6">
          No trades logged {isToday ? "today" : `on ${dateLabel}`}.
        </p>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-secondary/20">
              <p className="text-[10px] text-muted-foreground">Trades</p>
              <p className="text-sm font-black">{dayEntries.length}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/20">
              <p className="text-[10px] text-muted-foreground">W / L</p>
              <p className="text-sm font-black">
                <span className="text-emerald-400">{wins}</span>
                <span className="text-muted-foreground/50"> / </span>
                <span className="text-red-400">{losses}</span>
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/20">
              <p className="text-[10px] text-muted-foreground">Total P&L</p>
              <p className={`text-sm font-black ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(0)}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/20">
              <p className="text-[10px] text-muted-foreground">Win Rate</p>
              <p className="text-sm font-black">
                {dayEntries.length > 0 ? Math.round((wins / dayEntries.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-0">
              {dayEntries.map((entry, i) => {
                const pnl = entry.profitLoss || 0
                const time = new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                const isWin = pnl > 0
                const isLoss = pnl < 0

                return (
                  <div key={entry.id} className="flex gap-3 py-2 relative">
                    {/* Timeline dot */}
                    <div className={`relative z-10 mt-1 w-[9px] h-[9px] rounded-full border-2 shrink-0 ml-[14px] ${
                      isWin ? "bg-emerald-400 border-emerald-400" : isLoss ? "bg-red-400 border-red-400" : "bg-muted-foreground border-muted-foreground"
                    }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{time}</span>
                          {entry.symbol && <span className="text-[10px] font-black text-primary">{entry.symbol}</span>}
                          {entry.direction && (
                            <span className={`text-[10px] font-bold ${entry.direction === "long" ? "text-emerald-400" : "text-red-400"}`}>
                              {entry.direction.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {pnl !== 0 && (
                            <span className={`text-xs font-black ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                              {isWin ? "+" : ""}${pnl.toFixed(0)}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/50">
                            Σ {runningPnL[i] >= 0 ? "+" : ""}${runningPnL[i].toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {entry.content?.slice(0, 100)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Best/Worst */}
          {dayEntries.length >= 2 && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              {bestTrade && (bestTrade.profitLoss || 0) > 0 && (
                <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Best</p>
                    <p className="text-xs font-black text-emerald-400">+${(bestTrade.profitLoss || 0).toFixed(0)} {bestTrade.symbol || ""}</p>
                  </div>
                </div>
              )}
              {worstTrade && (worstTrade.profitLoss || 0) < 0 && (
                <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Worst</p>
                    <p className="text-xs font-black text-red-400">${(worstTrade.profitLoss || 0).toFixed(0)} {worstTrade.symbol || ""}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
