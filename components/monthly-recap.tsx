"use client"

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval } from "date-fns"

export function MonthlyRecap() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [monthOffset, setMonthOffset] = useState(0)

  const { current, previous } = useMemo(() => {
    if (!currentSpaceId || !user) return { current: null, previous: null }
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)

    const calcMonth = (offset: number) => {
      const ref = subMonths(new Date(), offset)
      const start = startOfMonth(ref)
      const end = endOfMonth(ref)
      const monthEntries = userEntries.filter((e) => isWithinInterval(new Date(e.createdAt), { start, end }))
      const pnls = monthEntries.map((e) => e.profitLoss || 0)
      const wins = pnls.filter((p) => p > 0)
      const losses = pnls.filter((p) => p < 0)
      return {
        label: format(ref, "MMMM yyyy"),
        trades: monthEntries.length,
        totalPnL: pnls.reduce((a, b) => a + b, 0),
        wins: wins.length,
        losses: losses.length,
        winRate: pnls.length > 0 ? (wins.length / pnls.length) * 100 : 0,
        avgWin: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
        avgLoss: losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0,
        bestDay: pnls.length > 0 ? Math.max(...pnls) : 0,
        worstDay: pnls.length > 0 ? Math.min(...pnls) : 0,
        tradingDays: new Set(monthEntries.map((e) => format(new Date(e.createdAt), "yyyy-MM-dd"))).size,
      }
    }

    return { current: calcMonth(monthOffset), previous: calcMonth(monthOffset + 1) }
  }, [entries, currentSpaceId, user, monthOffset])

  if (!current || current.trades === 0) return null

  const diff = previous && previous.trades > 0
    ? { pnl: current.totalPnL - previous.totalPnL, winRate: current.winRate - previous.winRate }
    : null

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Monthly Recap</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1 rounded hover:bg-secondary/50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs font-bold min-w-[100px] text-center">{current.label}</span>
          <button onClick={() => setMonthOffset((o) => Math.max(o - 1, 0))} disabled={monthOffset === 0} className="p-1 rounded hover:bg-secondary/50 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/20 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold ${current.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
            {current.totalPnL >= 0 ? "+" : ""}${current.totalPnL.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold">Total P&L</p>
          {diff && (
            <p className={`text-[9px] font-bold mt-1 ${diff.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
              {diff.pnl >= 0 ? "↑" : "↓"} ${Math.abs(diff.pnl).toFixed(0)} vs prev
            </p>
          )}
        </div>
        <div className="bg-secondary/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{current.winRate.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground font-bold">Win Rate</p>
          {diff && (
            <p className={`text-[9px] font-bold mt-1 ${diff.winRate >= 0 ? "text-green-500" : "text-red-500"}`}>
              {diff.winRate >= 0 ? "↑" : "↓"} {Math.abs(diff.winRate).toFixed(1)}% vs prev
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-sm font-bold">{current.trades}</p>
          <p className="text-[9px] text-muted-foreground">Trades</p>
        </div>
        <div>
          <p className="text-sm font-bold text-green-500">{current.wins}</p>
          <p className="text-[9px] text-muted-foreground">Wins</p>
        </div>
        <div>
          <p className="text-sm font-bold text-red-500">{current.losses}</p>
          <p className="text-[9px] text-muted-foreground">Losses</p>
        </div>
        <div>
          <p className="text-sm font-bold">{current.tradingDays}</p>
          <p className="text-[9px] text-muted-foreground">Days</p>
        </div>
      </div>

      <div className="flex justify-between text-[10px] border-t border-border/30 pt-3">
        <div>
          <span className="text-muted-foreground">Best trade: </span>
          <span className="font-bold text-green-500">+${current.bestDay.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Worst trade: </span>
          <span className="font-bold text-red-500">${current.worstDay.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Avg W/L: </span>
          <span className="font-bold">${current.avgWin.toFixed(0)}/${current.avgLoss.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
