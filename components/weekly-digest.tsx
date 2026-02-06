"use client"

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { Mail, Copy, Check, Calendar } from "lucide-react"
import { startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns"

export function WeeklyDigest() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const digest = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const weekEntries = (entries[currentSpaceId] || [])
      .filter((e) => e.userId === user.id && isWithinInterval(new Date(e.createdAt), { start: weekStart, end: weekEnd }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const totalPnL = weekEntries.reduce((sum, e) => sum + (e.profitLoss || 0), 0)
    const wins = weekEntries.filter((e) => (e.profitLoss || 0) > 0).length
    const losses = weekEntries.filter((e) => (e.profitLoss || 0) < 0).length
    const winRate = weekEntries.length > 0 ? (wins / weekEntries.length) * 100 : 0
    const bestTrade = weekEntries.reduce((best, e) => (e.profitLoss || 0) > (best?.profitLoss || 0) ? e : best, weekEntries[0])
    const worstTrade = weekEntries.reduce((worst, e) => (e.profitLoss || 0) < (worst?.profitLoss || 0) ? e : worst, weekEntries[0])

    const moodBreakdown: Record<string, number> = {}
    weekEntries.forEach((e) => { if (e.mentalState) moodBreakdown[e.mentalState] = (moodBreakdown[e.mentalState] || 0) + 1 })

    return {
      weekStart,
      weekEnd,
      totalTrades: weekEntries.length,
      totalPnL,
      wins,
      losses,
      winRate,
      bestTrade,
      worstTrade,
      moodBreakdown,
      entries: weekEntries,
    }
  }, [entries, currentSpaceId, user])

  if (!digest || digest.totalTrades === 0) return null

  const digestText = `Weekly Trading Digest (${format(digest.weekStart, "MMM d")} - ${format(digest.weekEnd, "MMM d, yyyy")})

Trades: ${digest.totalTrades} | Wins: ${digest.wins} | Losses: ${digest.losses}
Win Rate: ${digest.winRate.toFixed(1)}%
Total P&L: ${digest.totalPnL >= 0 ? "+" : ""}$${digest.totalPnL.toFixed(2)}
${digest.bestTrade ? `Best: +$${(digest.bestTrade.profitLoss || 0).toFixed(2)}` : ""}
${digest.worstTrade ? `Worst: $${(digest.worstTrade.profitLoss || 0).toFixed(2)}` : ""}
${Object.keys(digest.moodBreakdown).length > 0 ? `\nMood: ${Object.entries(digest.moodBreakdown).map(([m, c]) => `${m} (${c})`).join(", ")}` : ""}`

  const handleCopy = () => {
    navigator.clipboard.writeText(digestText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass-3d rounded-2xl p-4 w-full text-left hover:bg-secondary/30 transition-colors flex items-center gap-3"
      >
        <Mail className="h-4 w-4 text-primary" />
        <div>
          <span className="text-sm font-bold">Weekly Digest</span>
          <span className="text-xs text-muted-foreground ml-2">{digest.totalTrades} trades this week</span>
        </div>
      </button>
    )
  }

  return (
    <div className="glass-3d rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold">Weekly Digest</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">Close</button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {format(digest.weekStart, "MMM d")} - {format(digest.weekEnd, "MMM d, yyyy")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{digest.totalTrades}</p>
          <p className="text-[10px] text-muted-foreground font-bold">Trades</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{digest.winRate.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground font-bold">Win Rate</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold ${digest.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
            {digest.totalPnL >= 0 ? "+" : ""}${digest.totalPnL.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold">P&L</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{digest.wins}<span className="text-muted-foreground text-sm">/{digest.losses}</span></p>
          <p className="text-[10px] text-muted-foreground font-bold">W / L</p>
        </div>
      </div>

      {Object.keys(digest.moodBreakdown).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(digest.moodBreakdown).map(([mood, count]) => (
            <span key={mood} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/50 capitalize">
              {mood} ({count})
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
