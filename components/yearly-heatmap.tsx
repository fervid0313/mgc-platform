"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { format, eachDayOfInterval, startOfYear, endOfYear, getDay, getWeek } from "date-fns"
import { Calendar } from "lucide-react"

export function YearlyHeatmap() {
  const { entries, currentSpaceId, user } = useAppStore()

  const { dayMap, maxAbsPnL } = useMemo(() => {
    if (!currentSpaceId || !user) return { dayMap: new Map<string, number>(), maxAbsPnL: 1 }
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    const map = new Map<string, number>()
    let maxAbs = 1

    userEntries.forEach((e) => {
      const key = format(new Date(e.createdAt), "yyyy-MM-dd")
      const current = map.get(key) || 0
      const next = current + (e.profitLoss || 0)
      map.set(key, next)
      if (Math.abs(next) > maxAbs) maxAbs = Math.abs(next)
    })

    return { dayMap: map, maxAbsPnL: maxAbs }
  }, [entries, currentSpaceId, user])

  const year = new Date().getFullYear()
  const days = eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: new Date() })

  const getColor = (pnl: number | undefined) => {
    if (pnl === undefined) return "bg-secondary/20"
    if (pnl === 0) return "bg-secondary/40"
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnL, 1)
    if (pnl > 0) {
      if (intensity > 0.75) return "bg-green-500"
      if (intensity > 0.5) return "bg-green-500/70"
      if (intensity > 0.25) return "bg-green-500/40"
      return "bg-green-500/20"
    }
    if (intensity > 0.75) return "bg-red-500"
    if (intensity > 0.5) return "bg-red-500/70"
    if (intensity > 0.25) return "bg-red-500/40"
    return "bg-red-500/20"
  }

  if (dayMap.size === 0) return null

  const weeks: (Date | null)[][] = []
  let currentWeek: (Date | null)[] = []

  const firstDayOfWeek = getDay(days[0])
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null)

  days.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  })
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  const totalPnL = Array.from(dayMap.values()).reduce((a, b) => a + b, 0)
  const greenDays = Array.from(dayMap.values()).filter((v) => v > 0).length
  const redDays = Array.from(dayMap.values()).filter((v) => v < 0).length

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">{year} P&L Heatmap</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="text-green-500">{greenDays} green</span>
          <span className="text-red-500">{redDays} red</span>
          <span className={totalPnL >= 0 ? "text-green-500" : "text-red-500"}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[2px] min-w-[700px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="w-[11px] h-[11px]" />
                const key = format(day, "yyyy-MM-dd")
                const pnl = dayMap.get(key)
                return (
                  <div
                    key={di}
                    className={`w-[11px] h-[11px] rounded-[2px] ${getColor(pnl)} transition-colors`}
                    title={`${format(day, "MMM d")}: ${pnl !== undefined ? (pnl >= 0 ? "+" : "") + "$" + pnl.toFixed(0) : "No trades"}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-[9px] h-[9px] rounded-[2px] bg-red-500" />
          <div className="w-[9px] h-[9px] rounded-[2px] bg-red-500/40" />
          <div className="w-[9px] h-[9px] rounded-[2px] bg-secondary/20" />
          <div className="w-[9px] h-[9px] rounded-[2px] bg-green-500/40" />
          <div className="w-[9px] h-[9px] rounded-[2px] bg-green-500" />
          <span>More</span>
        </div>
        <span>{dayMap.size} trading days</span>
      </div>
    </div>
  )
}
