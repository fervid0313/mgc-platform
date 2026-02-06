"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Brain, TrendingUp, TrendingDown } from "lucide-react"

interface MoodStats {
  mood: string
  trades: number
  avgPnL: number
  winRate: number
  totalPnL: number
}

export function MoodCorrelation() {
  const { entries, currentSpaceId, user } = useAppStore()

  const stats = useMemo((): MoodStats[] => {
    if (!currentSpaceId || !user) return []
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id && e.mentalState)

    const groups: Record<string, { pnl: number[]; wins: number }> = {}
    userEntries.forEach((e) => {
      const m = e.mentalState!
      if (!groups[m]) groups[m] = { pnl: [], wins: 0 }
      groups[m].pnl.push(e.profitLoss || 0)
      if ((e.profitLoss || 0) > 0) groups[m].wins++
    })

    return Object.entries(groups)
      .map(([mood, g]) => ({
        mood,
        trades: g.pnl.length,
        avgPnL: g.pnl.reduce((a, b) => a + b, 0) / g.pnl.length,
        winRate: (g.wins / g.pnl.length) * 100,
        totalPnL: g.pnl.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.avgPnL - a.avgPnL)
  }, [entries, currentSpaceId, user])

  if (stats.length < 2) return null

  const best = stats[0]
  const worst = stats[stats.length - 1]

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Mood vs P&L</h3>
      </div>

      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />
        <div>
          <p className="text-xs font-bold text-green-500">Best mood: <span className="capitalize">{best.mood}</span></p>
          <p className="text-[10px] text-muted-foreground">
            Avg P&L: ${best.avgPnL.toFixed(2)} · Win rate: {best.winRate.toFixed(0)}% · {best.trades} trades
          </p>
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
        <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />
        <div>
          <p className="text-xs font-bold text-red-500">Worst mood: <span className="capitalize">{worst.mood}</span></p>
          <p className="text-[10px] text-muted-foreground">
            Avg P&L: ${worst.avgPnL.toFixed(2)} · Win rate: {worst.winRate.toFixed(0)}% · {worst.trades} trades
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.mood} className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold capitalize truncate">{s.mood}</span>
            <div className="flex-1 h-6 bg-secondary/30 rounded-lg overflow-hidden relative">
              <div
                className={`h-full rounded-lg ${s.avgPnL >= 0 ? "bg-green-500/30" : "bg-red-500/30"}`}
                style={{ width: `${Math.min(Math.abs(s.avgPnL) / Math.max(...stats.map((x) => Math.abs(x.avgPnL))) * 100, 100)}%` }}
              />
              <span className={`absolute inset-0 flex items-center px-2 text-[10px] font-bold ${s.avgPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                {s.avgPnL >= 0 ? "+" : ""}${s.avgPnL.toFixed(0)} avg · {s.winRate.toFixed(0)}% WR
              </span>
            </div>
            <span className="w-6 text-right text-[10px] text-muted-foreground">{s.trades}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
