"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Shield, TrendingDown, BarChart3, AlertTriangle } from "lucide-react"

export function RiskMetrics() {
  const { entries, currentSpaceId, user } = useAppStore()

  const metrics = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const userEntries = (entries[currentSpaceId] || [])
      .filter((e) => e.userId === user.id && e.profitLoss !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    if (userEntries.length < 3) return null

    const pnls = userEntries.map((e) => e.profitLoss || 0)
    const cumulative = pnls.reduce<number[]>((acc, p) => {
      acc.push((acc[acc.length - 1] || 0) + p)
      return acc
    }, [])

    // Max drawdown
    let peak = -Infinity
    let maxDrawdown = 0
    cumulative.forEach((v) => {
      if (v > peak) peak = v
      const dd = peak - v
      if (dd > maxDrawdown) maxDrawdown = dd
    })

    // Consecutive losses
    let maxConsecLoss = 0
    let currentConsec = 0
    pnls.forEach((p) => {
      if (p < 0) { currentConsec++; maxConsecLoss = Math.max(maxConsecLoss, currentConsec) }
      else currentConsec = 0
    })

    // Profit factor
    const grossProfit = pnls.filter((p) => p > 0).reduce((a, b) => a + b, 0)
    const grossLoss = Math.abs(pnls.filter((p) => p < 0).reduce((a, b) => a + b, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

    // Sharpe-like ratio (simplified: mean/stddev of returns)
    const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length
    const variance = pnls.reduce((a, p) => a + (p - mean) ** 2, 0) / pnls.length
    const stddev = Math.sqrt(variance)
    const sharpe = stddev > 0 ? mean / stddev : 0

    // Average win vs average loss
    const wins = pnls.filter((p) => p > 0)
    const losses = pnls.filter((p) => p < 0)
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    // Expectancy
    const winRate = wins.length / pnls.length
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss)

    return { maxDrawdown, maxConsecLoss, profitFactor, sharpe, avgWin, avgLoss, rrRatio, expectancy, totalTrades: pnls.length }
  }, [entries, currentSpaceId, user])

  if (!metrics) return null

  const cards = [
    { label: "Max Drawdown", value: `-$${metrics.maxDrawdown.toFixed(0)}`, icon: <TrendingDown className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Profit Factor", value: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2), icon: <BarChart3 className="h-4 w-4" />, color: metrics.profitFactor >= 1 ? "text-green-500" : "text-red-500", bg: metrics.profitFactor >= 1 ? "bg-green-500/10" : "bg-red-500/10" },
    { label: "Sharpe Ratio", value: metrics.sharpe.toFixed(2), icon: <Shield className="h-4 w-4" />, color: metrics.sharpe >= 0 ? "text-green-500" : "text-red-500", bg: metrics.sharpe >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
    { label: "Max Consec. Losses", value: String(metrics.maxConsecLoss), icon: <AlertTriangle className="h-4 w-4" />, color: metrics.maxConsecLoss >= 5 ? "text-red-500" : "text-amber-500", bg: metrics.maxConsecLoss >= 5 ? "bg-red-500/10" : "bg-amber-500/10" },
    { label: "Avg Win", value: `+$${metrics.avgWin.toFixed(0)}`, icon: null, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Avg Loss", value: `-$${metrics.avgLoss.toFixed(0)}`, icon: null, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "R:R Ratio", value: metrics.rrRatio === Infinity ? "∞" : `${metrics.rrRatio.toFixed(2)}:1`, icon: null, color: metrics.rrRatio >= 1 ? "text-green-500" : "text-red-500", bg: metrics.rrRatio >= 1 ? "bg-green-500/10" : "bg-red-500/10" },
    { label: "Expectancy", value: `${metrics.expectancy >= 0 ? "+" : ""}$${metrics.expectancy.toFixed(0)}`, icon: null, color: metrics.expectancy >= 0 ? "text-green-500" : "text-red-500", bg: metrics.expectancy >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
  ]

  return (
    <div className="glass-3d rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Risk Metrics</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{metrics.totalTrades} trades</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl p-3 text-center`}>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
