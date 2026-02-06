"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Clock } from "lucide-react"

const HOURS = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"]

export function TimeOfDayAnalysis() {
  const { entries, currentSpaceId, user } = useAppStore()

  const hourStats = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id && e.profitLoss !== undefined)
    if (userEntries.length < 5) return null

    const hours: { trades: number; pnl: number; wins: number }[] = Array.from({ length: 24 }, () => ({ trades: 0, pnl: 0, wins: 0 }))
    userEntries.forEach((e) => {
      const h = new Date(e.createdAt).getHours()
      hours[h].trades++
      hours[h].pnl += e.profitLoss || 0
      if ((e.profitLoss || 0) > 0) hours[h].wins++
    })

    const maxTrades = Math.max(...hours.map((h) => h.trades), 1)
    const maxPnl = Math.max(...hours.map((h) => Math.abs(h.pnl)), 1)
    const bestHour = hours.reduce((best, h, i) => h.pnl > hours[best].pnl ? i : best, 0)
    const worstHour = hours.reduce((worst, h, i) => h.pnl < hours[worst].pnl ? i : worst, 0)

    return { hours, maxTrades, maxPnl, bestHour, worstHour }
  }, [entries, currentSpaceId, user])

  if (!hourStats) return null

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Time of Day</h3>
        </div>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-green-500">Best: {HOURS[hourStats.bestHour]}</span>
          <span className="text-red-500">Worst: {HOURS[hourStats.worstHour]}</span>
        </div>
      </div>

      <div className="flex items-end gap-[2px] h-16">
        {hourStats.hours.map((h, i) => {
          const height = h.trades > 0 ? Math.max((h.trades / hourStats.maxTrades) * 100, 8) : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${HOURS[i]}: ${h.trades} trades, $${h.pnl.toFixed(0)} P&L`}>
              <div
                className={`w-full rounded-t-sm transition-all ${h.pnl >= 0 ? "bg-green-500/60" : "bg-red-500/60"} ${h.trades === 0 ? "bg-secondary/20" : ""}`}
                style={{ height: `${height}%`, minHeight: h.trades > 0 ? "3px" : "1px" }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-[2px] text-[7px] text-muted-foreground">
        {HOURS.map((h, i) => i % 4 === 0 ? <span key={i} className="flex-1 text-center">{h}</span> : <span key={i} className="flex-1" />)}
      </div>
    </div>
  )
}
