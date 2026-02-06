"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { BarChart3 } from "lucide-react"

export function WinLossDistribution() {
  const { entries, currentSpaceId, user } = useAppStore()

  const buckets = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const pnls = (entries[currentSpaceId] || [])
      .filter((e) => e.userId === user.id && e.profitLoss !== undefined)
      .map((e) => e.profitLoss || 0)

    if (pnls.length < 5) return null

    const ranges = [
      { label: "< -$200", min: -Infinity, max: -200 },
      { label: "-$200–100", min: -200, max: -100 },
      { label: "-$100–50", min: -100, max: -50 },
      { label: "-$50–0", min: -50, max: 0 },
      { label: "$0–50", min: 0, max: 50 },
      { label: "$50–100", min: 50, max: 100 },
      { label: "$100–200", min: 100, max: 200 },
      { label: "> $200", min: 200, max: Infinity },
    ]

    const counts = ranges.map((r) => ({
      ...r,
      count: pnls.filter((p) => p >= r.min && p < r.max).length,
    }))

    const maxCount = Math.max(...counts.map((c) => c.count), 1)
    return { counts, maxCount, total: pnls.length }
  }, [entries, currentSpaceId, user])

  if (!buckets) return null

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">P&L Distribution</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{buckets.total} trades</span>
      </div>
      <div className="flex items-end gap-1 h-20">
        {buckets.counts.map((b, i) => {
          const height = b.count > 0 ? Math.max((b.count / buckets.maxCount) * 100, 6) : 2
          const isLoss = i < 4
          return (
            <div key={i} className="flex-1 flex flex-col items-center" title={`${b.label}: ${b.count} trades`}>
              <span className="text-[8px] font-bold mb-1">{b.count || ""}</span>
              <div
                className={`w-full rounded-t-sm ${isLoss ? "bg-red-500/50" : "bg-green-500/50"}`}
                style={{ height: `${height}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1">
        {buckets.counts.map((b, i) => (
          <span key={i} className="flex-1 text-center text-[7px] text-muted-foreground leading-tight">{b.label}</span>
        ))}
      </div>
    </div>
  )
}
