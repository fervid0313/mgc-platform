"use client"

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { calculateTraderStats } from "@/lib/achievements"
import type { JournalEntry } from "@/lib/types"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Brain,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, addWeeks, addMonths, isWithinInterval } from "date-fns"

type ReportPeriod = "week" | "month"

export function WeeklyReport() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [period, setPeriod] = useState<ReportPeriod>("week")
  const [offset, setOffset] = useState(0)

  const report = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const allEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    if (allEntries.length === 0) return null

    const now = new Date()
    let start: Date
    let end: Date

    if (period === "week") {
      const ref = offset === 0 ? now : subWeeks(now, -offset)
      start = startOfWeek(ref, { weekStartsOn: 1 })
      end = endOfWeek(ref, { weekStartsOn: 1 })
    } else {
      const ref = offset === 0 ? now : subMonths(now, -offset)
      start = startOfMonth(ref)
      end = endOfMonth(ref)
    }

    const periodEntries = allEntries.filter((e) =>
      isWithinInterval(new Date(e.createdAt), { start, end })
    )

    if (periodEntries.length === 0) return { start, end, empty: true, stats: null, moodBreakdown: null, dayBreakdown: null, topTags: null }

    const stats = calculateTraderStats(periodEntries)

    // Mood breakdown
    const moodCounts: Record<string, number> = {}
    periodEntries.forEach((e) => {
      if (e.mentalState) moodCounts[e.mentalState] = (moodCounts[e.mentalState] || 0) + 1
    })

    // Day-of-week breakdown
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayPnL: Record<string, number> = {}
    const dayCount: Record<string, number> = {}
    periodEntries.forEach((e) => {
      const day = dayNames[new Date(e.createdAt).getDay()]
      dayPnL[day] = (dayPnL[day] || 0) + (e.profitLoss || 0)
      dayCount[day] = (dayCount[day] || 0) + 1
    })

    const dayBreakdown = dayNames
      .filter((d) => dayCount[d])
      .map((d) => ({ day: d, pnl: dayPnL[d] || 0, trades: dayCount[d] || 0 }))

    // Top tags
    const tagCounts: Record<string, number> = {}
    periodEntries.forEach((e) => {
      e.tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
    })
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { start, end, empty: false, stats, moodBreakdown: moodCounts, dayBreakdown, topTags }
  }, [entries, currentSpaceId, user, period, offset])

  if (!report) return null

  const navigate = (dir: number) => setOffset((o) => o + dir)
  const periodLabel = report.start && report.end
    ? period === "week"
      ? `${format(report.start, "MMM d")} — ${format(report.end, "MMM d, yyyy")}`
      : format(report.start, "MMMM yyyy")
    : ""

  return (
    <div className="glass-3d rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Performance Report</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPeriod("week")}
            className={`btn-3d px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              period === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`btn-3d px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              period === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="btn-3d p-1.5 rounded-lg hover:bg-secondary/50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">{periodLabel}</span>
        <button onClick={() => navigate(1)} disabled={offset >= 0} className="btn-3d p-1.5 rounded-lg hover:bg-secondary/50 disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {report.empty ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No trades logged this {period}.
        </div>
      ) : report.stats && (
        <div className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="P&L" value={`${report.stats.totalPnL >= 0 ? "+" : ""}$${Math.abs(report.stats.totalPnL).toFixed(0)}`} positive={report.stats.totalPnL >= 0} />
            <MiniStat label="Win Rate" value={`${report.stats.totalWins + report.stats.totalLosses > 0 ? Math.round((report.stats.totalWins / (report.stats.totalWins + report.stats.totalLosses)) * 100) : 0}%`} />
            <MiniStat label="Trades" value={String(report.stats.totalEntries)} />
            <MiniStat label="Avg Win" value={`$${report.stats.avgWin.toFixed(0)}`} positive />
            <MiniStat label="Avg Loss" value={`-$${report.stats.avgLoss.toFixed(0)}`} negative />
            <MiniStat label="Best Streak" value={String(report.stats.bestWinStreak)} />
          </div>

          {/* Day Breakdown */}
          {report.dayBreakdown && report.dayBreakdown.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <span className="text-xs font-bold text-muted-foreground mb-2 block">P&L by Day</span>
              <div className="flex gap-1">
                {report.dayBreakdown.map((d) => {
                  const maxPnl = Math.max(...report.dayBreakdown!.map((x) => Math.abs(x.pnl)), 1)
                  const height = Math.max(Math.abs(d.pnl) / maxPnl * 40, 4)
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
                        <div
                          className={`w-full max-w-[20px] rounded-sm ${d.pnl >= 0 ? "bg-green-500/60" : "bg-red-500/60"}`}
                          style={{ height }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{d.day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mood Breakdown */}
          {report.moodBreakdown && Object.keys(report.moodBreakdown).length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <span className="text-xs font-bold text-muted-foreground mb-2 block flex items-center gap-1">
                <Brain className="h-3 w-3" /> Mood Distribution
              </span>
              <div className="flex gap-2">
                {Object.entries(report.moodBreakdown).map(([mood, count]) => (
                  <span key={mood} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/30 text-muted-foreground">
                    {mood} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Tags */}
          {report.topTags && report.topTags.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <span className="text-xs font-bold text-muted-foreground mb-2 block">Top Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {report.topTags.map(([tag, count]) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    #{tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-lg p-2 bg-secondary/10 text-center">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-bold ${positive ? "text-green-500" : negative ? "text-red-500" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
