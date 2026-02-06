"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { BarChart3, Calendar, Brain, TrendingUp } from "lucide-react"

interface BreakdownRow {
  label: string
  trades: number
  wins: number
  winRate: number
  totalPnL: number
}

function buildBreakdown(entries: any[], groupBy: (e: any) => string): BreakdownRow[] {
  const groups: Record<string, { trades: number; wins: number; pnl: number }> = {}
  entries.forEach((e) => {
    const key = groupBy(e) || "Unknown"
    if (!groups[key]) groups[key] = { trades: 0, wins: 0, pnl: 0 }
    groups[key].trades++
    if ((e.profitLoss || 0) > 0) groups[key].wins++
    groups[key].pnl += e.profitLoss || 0
  })
  return Object.entries(groups)
    .map(([label, g]) => ({
      label,
      trades: g.trades,
      wins: g.wins,
      winRate: g.trades > 0 ? (g.wins / g.trades) * 100 : 0,
      totalPnL: g.pnl,
    }))
    .sort((a, b) => b.trades - a.trades)
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function TradeBreakdown() {
  const { entries, currentSpaceId, user } = useAppStore()

  const userEntries = useMemo(() => {
    if (!currentSpaceId || !user) return []
    return (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
  }, [entries, currentSpaceId, user])

  const byType = useMemo(() => buildBreakdown(userEntries, (e) => e.tradeType || "general"), [userEntries])
  const byDay = useMemo(() => buildBreakdown(userEntries, (e) => DAYS[new Date(e.createdAt).getDay()]), [userEntries])
  const byMood = useMemo(() => buildBreakdown(userEntries, (e) => e.mentalState || "unset"), [userEntries])

  if (userEntries.length === 0) return null

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Trade Breakdown</h3>
      </div>

      <BreakdownTable title="By Trade Type" icon={<TrendingUp className="h-3.5 w-3.5" />} rows={byType} />
      <BreakdownTable title="By Day of Week" icon={<Calendar className="h-3.5 w-3.5" />} rows={byDay} />
      <BreakdownTable title="By Mental State" icon={<Brain className="h-3.5 w-3.5" />} rows={byMood} />
    </div>
  )
}

function BreakdownTable({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: BreakdownRow[] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
        {icon} {title}
      </h4>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-xs">
            <span className="w-24 font-semibold truncate capitalize">{r.label}</span>
            <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${r.winRate >= 50 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.max(r.winRate, 3)}%` }}
              />
            </div>
            <span className="w-12 text-right font-bold">{r.winRate.toFixed(0)}%</span>
            <span className={`w-16 text-right font-bold ${r.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {r.totalPnL >= 0 ? "+" : ""}${r.totalPnL.toFixed(0)}
            </span>
            <span className="w-8 text-right text-muted-foreground">{r.trades}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
