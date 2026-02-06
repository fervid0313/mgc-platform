"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Brain } from "lucide-react"

export function TradingInsights() {
  const { entries, currentSpaceId, user } = useAppStore()

  const insights = useMemo(() => {
    if (!currentSpaceId || !user) return []
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id && e.profitLoss !== undefined)
    if (userEntries.length < 10) return []

    const tips: string[] = []

    // Day of week analysis
    const dayStats: Record<number, { pnl: number; trades: number }> = {}
    userEntries.forEach((e) => {
      const day = new Date(e.createdAt).getDay()
      if (!dayStats[day]) dayStats[day] = { pnl: 0, trades: 0 }
      dayStats[day].pnl += e.profitLoss || 0
      dayStats[day].trades++
    })
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const worstDay = Object.entries(dayStats).filter(([, s]) => s.trades >= 3).sort((a, b) => a[1].pnl - b[1].pnl)[0]
    const bestDay = Object.entries(dayStats).filter(([, s]) => s.trades >= 3).sort((a, b) => b[1].pnl - a[1].pnl)[0]
    if (worstDay && worstDay[1].pnl < 0) tips.push(`You tend to lose on ${dayNames[parseInt(worstDay[0])]}s — consider reducing size or sitting out.`)
    if (bestDay && bestDay[1].pnl > 0) tips.push(`${dayNames[parseInt(bestDay[0])]}s are your strongest day — lean into it.`)

    // Mood analysis
    const moodStats: Record<string, { pnl: number; trades: number }> = {}
    userEntries.filter((e) => e.mentalState).forEach((e) => {
      const m = e.mentalState!
      if (!moodStats[m]) moodStats[m] = { pnl: 0, trades: 0 }
      moodStats[m].pnl += e.profitLoss || 0
      moodStats[m].trades++
    })
    const worstMood = Object.entries(moodStats).filter(([, s]) => s.trades >= 3).sort((a, b) => a[1].pnl - b[1].pnl)[0]
    if (worstMood && worstMood[1].pnl < 0) tips.push(`Trading while "${worstMood[0]}" costs you money. Take a break when you feel that way.`)

    // Streak analysis
    const sorted = [...userEntries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    let maxLossStreak = 0, currentLoss = 0
    sorted.forEach((e) => {
      if ((e.profitLoss || 0) < 0) { currentLoss++; maxLossStreak = Math.max(maxLossStreak, currentLoss) }
      else currentLoss = 0
    })
    if (maxLossStreak >= 3) tips.push(`Your worst losing streak was ${maxLossStreak} trades — set a daily loss limit to protect capital.`)

    // Average win vs loss
    const wins = userEntries.filter((e) => (e.profitLoss || 0) > 0).map((e) => e.profitLoss || 0)
    const losses = userEntries.filter((e) => (e.profitLoss || 0) < 0).map((e) => Math.abs(e.profitLoss || 0))
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0
    if (avgLoss > avgWin * 1.5) tips.push(`Your average loss ($${avgLoss.toFixed(0)}) is much larger than your average win ($${avgWin.toFixed(0)}). Tighten your stops.`)
    if (avgWin > avgLoss * 2) tips.push(`Great R:R! Your winners ($${avgWin.toFixed(0)}) are ${(avgWin / avgLoss).toFixed(1)}x your losers. Keep letting winners run.`)

    return tips.slice(0, 4)
  }, [entries, currentSpaceId, user])

  if (insights.length === 0) return null

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-bold">Trading Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((tip, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="text-sm mt-0.5">💡</span>
            <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
