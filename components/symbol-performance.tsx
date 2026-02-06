"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { BarChart3 } from "lucide-react"

export function SymbolPerformance() {
  const { entries, currentSpaceId, user } = useAppStore()

  const symbols = useMemo(() => {
    if (!currentSpaceId || !user) return []
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id && e.symbol)

    const map: Record<string, { trades: number; pnl: number; wins: number }> = {}
    userEntries.forEach((e) => {
      const s = e.symbol!.toUpperCase()
      if (!map[s]) map[s] = { trades: 0, pnl: 0, wins: 0 }
      map[s].trades++
      map[s].pnl += e.profitLoss || 0
      if ((e.profitLoss || 0) > 0) map[s].wins++
    })

    return Object.entries(map)
      .map(([symbol, s]) => ({ symbol, ...s, winRate: (s.wins / s.trades) * 100 }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [entries, currentSpaceId, user])

  if (symbols.length < 2) return null

  const maxAbs = Math.max(...symbols.map((s) => Math.abs(s.pnl)), 1)

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Symbol Performance</h3>
      </div>
      <div className="space-y-2">
        {symbols.slice(0, 8).map((s) => (
          <div key={s.symbol} className="flex items-center gap-3">
            <span className="w-14 text-xs font-bold truncate">{s.symbol}</span>
            <div className="flex-1 h-5 bg-secondary/20 rounded-lg overflow-hidden relative">
              <div
                className={`h-full rounded-lg ${s.pnl >= 0 ? "bg-green-500/30" : "bg-red-500/30"}`}
                style={{ width: `${(Math.abs(s.pnl) / maxAbs) * 100}%` }}
              />
              <span className={`absolute inset-0 flex items-center px-2 text-[10px] font-bold ${s.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(0)}
              </span>
            </div>
            <span className="w-10 text-right text-[10px] text-muted-foreground">{s.trades}t</span>
          </div>
        ))}
      </div>
    </div>
  )
}
