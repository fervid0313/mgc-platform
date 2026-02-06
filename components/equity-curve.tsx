"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { TrendingUp } from "lucide-react"
import { format } from "date-fns"

export function EquityCurve() {
  const { entries, currentSpaceId, user } = useAppStore()

  const data = useMemo(() => {
    if (!currentSpaceId || !user) return []
    const all = (entries[currentSpaceId] || [])
      .filter((e) => e.userId === user.id && e.profitLoss !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    let cumulative = 0
    return all.map((e) => {
      cumulative += e.profitLoss || 0
      return { date: new Date(e.createdAt), pnl: cumulative, daily: e.profitLoss || 0 }
    })
  }, [entries, currentSpaceId, user])

  if (data.length < 2) return null

  const maxPnl = Math.max(...data.map((d) => d.pnl))
  const minPnl = Math.min(...data.map((d) => d.pnl))
  const range = maxPnl - minPnl || 1

  const width = 100
  const height = 60
  const padding = 2

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.pnl - minPnl) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const polyline = points.join(" ")
  const lastPoint = data[data.length - 1]
  const isPositive = lastPoint.pnl >= 0

  // Fill area
  const firstX = padding
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)
  const fillPoints = `${firstX},${height - padding} ${polyline} ${lastX},${height - padding}`

  return (
    <div className="glass-3d rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Equity Curve</h3>
        </div>
        <span className={`text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}${lastPoint.pnl.toFixed(0)}
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
          {/* Zero line */}
          {minPnl < 0 && maxPnl > 0 && (
            <line
              x1={padding}
              x2={width - padding}
              y1={height - padding - ((0 - minPnl) / range) * (height - padding * 2)}
              y2={height - padding - ((0 - minPnl) / range) * (height - padding * 2)}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeDasharray="2,2"
              strokeWidth="0.3"
            />
          )}
          {/* Fill */}
          <polygon
            points={fillPoints}
            fill={isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}
          />
          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Date labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">{format(data[0].date, "MMM d")}</span>
          <span className="text-[9px] text-muted-foreground">{format(lastPoint.date, "MMM d")}</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
        <div className="text-center flex-1">
          <p className="text-[9px] text-muted-foreground uppercase">High</p>
          <p className="text-xs font-bold text-green-500">+${maxPnl.toFixed(0)}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[9px] text-muted-foreground uppercase">Low</p>
          <p className="text-xs font-bold text-red-500">${minPnl.toFixed(0)}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[9px] text-muted-foreground uppercase">Trades</p>
          <p className="text-xs font-bold">{data.length}</p>
        </div>
      </div>
    </div>
  )
}
