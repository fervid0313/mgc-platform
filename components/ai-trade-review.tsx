"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import type { JournalEntry, MentalState } from "@/lib/types"
import { Sparkles, TrendingUp, TrendingDown, Brain, AlertTriangle, CheckCircle } from "lucide-react"
import { format } from "date-fns"

interface Insight {
  type: "positive" | "warning" | "neutral"
  title: string
  detail: string
}

function analyzeEntries(entries: JournalEntry[]): Insight[] {
  if (entries.length < 3) return []
  const insights: Insight[] = []

  const tradesWithPnL = entries.filter((e) => e.profitLoss !== undefined)
  const wins = tradesWithPnL.filter((e) => (e.profitLoss || 0) > 0)
  const losses = tradesWithPnL.filter((e) => (e.profitLoss || 0) < 0)

  // 1. Mood-Performance Correlation
  const moodStats: Record<string, { wins: number; losses: number; totalPnL: number }> = {}
  for (const e of tradesWithPnL) {
    const mood = e.mentalState || "unknown"
    if (!moodStats[mood]) moodStats[mood] = { wins: 0, losses: 0, totalPnL: 0 }
    moodStats[mood].totalPnL += e.profitLoss || 0
    if ((e.profitLoss || 0) > 0) moodStats[mood].wins++
    else moodStats[mood].losses++
  }

  const moods = Object.entries(moodStats).filter(([m]) => m !== "unknown")
  if (moods.length > 1) {
    const bestMood = moods.sort((a, b) => {
      const aRate = a[1].wins / (a[1].wins + a[1].losses || 1)
      const bRate = b[1].wins / (b[1].wins + b[1].losses || 1)
      return bRate - aRate
    })[0]
    const worstMood = moods[moods.length - 1]
    const bestRate = Math.round((bestMood[1].wins / (bestMood[1].wins + bestMood[1].losses || 1)) * 100)
    const worstRate = Math.round((worstMood[1].wins / (worstMood[1].wins + worstMood[1].losses || 1)) * 100)

    if (bestRate > worstRate + 15) {
      insights.push({
        type: "positive",
        title: `Best mood: ${bestMood[0]}`,
        detail: `${bestRate}% win rate when ${bestMood[0]} vs ${worstRate}% when ${worstMood[0]}. Try to trade in your optimal state.`,
      })
    }

    if (worstRate < 40 && (worstMood[1].wins + worstMood[1].losses) >= 3) {
      insights.push({
        type: "warning",
        title: `Avoid trading when ${worstMood[0]}`,
        detail: `Only ${worstRate}% win rate across ${worstMood[1].wins + worstMood[1].losses} trades. Consider sitting out when feeling this way.`,
      })
    }
  }

  // 2. Day-of-week analysis
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayStats: Record<number, { pnl: number; count: number }> = {}
  for (const e of tradesWithPnL) {
    const day = new Date(e.createdAt).getDay()
    if (!dayStats[day]) dayStats[day] = { pnl: 0, count: 0 }
    dayStats[day].pnl += e.profitLoss || 0
    dayStats[day].count++
  }

  const dayEntries = Object.entries(dayStats).filter(([, v]) => v.count >= 2)
  if (dayEntries.length > 1) {
    const bestDay = dayEntries.sort((a, b) => b[1].pnl - a[1].pnl)[0]
    const worstDay = dayEntries[dayEntries.length - 1]

    if (bestDay[1].pnl > 0) {
      insights.push({
        type: "positive",
        title: `Best day: ${dayNames[Number(bestDay[0])]}`,
        detail: `+$${bestDay[1].pnl.toFixed(0)} across ${bestDay[1].count} trades. This is your strongest day.`,
      })
    }

    if (worstDay[1].pnl < 0 && worstDay[1].count >= 3) {
      insights.push({
        type: "warning",
        title: `Worst day: ${dayNames[Number(worstDay[0])]}`,
        detail: `-$${Math.abs(worstDay[1].pnl).toFixed(0)} across ${worstDay[1].count} trades. Consider reducing size or sitting out.`,
      })
    }
  }

  // 3. Tag analysis
  const tagStats: Record<string, { wins: number; losses: number; pnl: number }> = {}
  for (const e of tradesWithPnL) {
    for (const tag of e.tags || []) {
      if (!tagStats[tag]) tagStats[tag] = { wins: 0, losses: 0, pnl: 0 }
      tagStats[tag].pnl += e.profitLoss || 0
      if ((e.profitLoss || 0) > 0) tagStats[tag].wins++
      else tagStats[tag].losses++
    }
  }

  const tagEntries = Object.entries(tagStats).filter(([, v]) => v.wins + v.losses >= 2)
  for (const [tag, stats] of tagEntries) {
    const rate = Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    if (rate >= 70 && stats.pnl > 0) {
      insights.push({
        type: "positive",
        title: `"${tag}" setups work well`,
        detail: `${rate}% win rate, +$${stats.pnl.toFixed(0)} total. Keep focusing on these.`,
      })
    }
    if (rate <= 30 && stats.pnl < 0 && (stats.wins + stats.losses) >= 3) {
      insights.push({
        type: "warning",
        title: `"${tag}" trades are losing`,
        detail: `Only ${rate}% win rate, -$${Math.abs(stats.pnl).toFixed(0)} total. Reassess this approach.`,
      })
    }
  }

  // 4. Win/Loss size imbalance
  if (wins.length >= 3 && losses.length >= 3) {
    const avgWin = wins.reduce((s, e) => s + (e.profitLoss || 0), 0) / wins.length
    const avgLoss = Math.abs(losses.reduce((s, e) => s + (e.profitLoss || 0), 0) / losses.length)

    if (avgLoss > avgWin * 1.5) {
      insights.push({
        type: "warning",
        title: "Losses are bigger than wins",
        detail: `Avg win: $${avgWin.toFixed(0)}, Avg loss: -$${avgLoss.toFixed(0)}. Tighten stops or let winners run longer.`,
      })
    }

    if (avgWin > avgLoss * 2) {
      insights.push({
        type: "positive",
        title: "Great risk/reward ratio",
        detail: `Avg win ($${avgWin.toFixed(0)}) is ${(avgWin / avgLoss).toFixed(1)}x your avg loss ($${avgLoss.toFixed(0)}). Keep it up!`,
      })
    }
  }

  // 5. Overtrading detection
  const dayTradeCounts: Record<string, number> = {}
  for (const e of tradesWithPnL) {
    const day = format(new Date(e.createdAt), "yyyy-MM-dd")
    dayTradeCounts[day] = (dayTradeCounts[day] || 0) + 1
  }
  const highDays = Object.entries(dayTradeCounts).filter(([, c]) => c >= 5)
  if (highDays.length >= 2) {
    const avgPnlHighDays = highDays.reduce((sum, [day]) => {
      return sum + tradesWithPnL
        .filter((e) => format(new Date(e.createdAt), "yyyy-MM-dd") === day)
        .reduce((s, e) => s + (e.profitLoss || 0), 0)
    }, 0) / highDays.length

    if (avgPnlHighDays < 0) {
      insights.push({
        type: "warning",
        title: "Overtrading hurts your P&L",
        detail: `Days with 5+ trades average -$${Math.abs(avgPnlHighDays).toFixed(0)}. Quality over quantity.`,
      })
    }
  }

  return insights.slice(0, 6)
}

export function AITradeReview() {
  const { entries, currentSpaceId, user } = useAppStore()

  const insights = useMemo(() => {
    if (!currentSpaceId || !user) return []
    const spaceEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    return analyzeEntries(spaceEntries)
  }, [entries, currentSpaceId, user])

  if (insights.length === 0) return null

  const iconMap = {
    positive: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
    neutral: <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />,
  }

  return (
    <div className="glass-3d rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-bold">Trade Insights</h3>
        <span className="text-xs text-muted-foreground">Pattern analysis</span>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`flex gap-3 p-3 rounded-xl ${
              insight.type === "positive" ? "bg-green-500/5" : insight.type === "warning" ? "bg-amber-500/5" : "bg-blue-500/5"
            }`}
          >
            {iconMap[insight.type]}
            <div>
              <p className="text-xs font-bold">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{insight.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
