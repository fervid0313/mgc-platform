import type { JournalEntry } from "./types"

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  check: (stats: TraderStats) => boolean
}

export interface TraderStats {
  totalEntries: number
  totalWins: number
  totalLosses: number
  totalPnL: number
  currentWinStreak: number
  currentLossStreak: number
  bestWinStreak: number
  bestDayPnL: number
  worstDayPnL: number
  greenDays: number
  totalDays: number
  avgWin: number
  avgLoss: number
  journalStreak: number // consecutive days with at least 1 entry
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-entry", name: "First Steps", description: "Post your first journal entry", icon: "📝", check: (s) => s.totalEntries >= 1 },
  { id: "ten-entries", name: "Getting Started", description: "Post 10 journal entries", icon: "📖", check: (s) => s.totalEntries >= 10 },
  { id: "fifty-entries", name: "Consistent Logger", description: "Post 50 journal entries", icon: "📚", check: (s) => s.totalEntries >= 50 },
  { id: "hundred-entries", name: "Dedicated Journaler", description: "Post 100 journal entries", icon: "🏅", check: (s) => s.totalEntries >= 100 },

  { id: "first-win", name: "First Green", description: "Log your first winning trade", icon: "💚", check: (s) => s.totalWins >= 1 },
  { id: "ten-wins", name: "Winner", description: "Log 10 winning trades", icon: "🎯", check: (s) => s.totalWins >= 10 },
  { id: "fifty-wins", name: "Sharp Shooter", description: "Log 50 winning trades", icon: "🔫", check: (s) => s.totalWins >= 50 },

  { id: "streak-3", name: "Hot Hand", description: "3 wins in a row", icon: "🔥", check: (s) => s.bestWinStreak >= 3 },
  { id: "streak-5", name: "On Fire", description: "5 wins in a row", icon: "🔥🔥", check: (s) => s.bestWinStreak >= 5 },
  { id: "streak-10", name: "Unstoppable", description: "10 wins in a row", icon: "⚡", check: (s) => s.bestWinStreak >= 10 },

  { id: "journal-7", name: "Weekly Warrior", description: "Journal 7 days in a row", icon: "📅", check: (s) => s.journalStreak >= 7 },
  { id: "journal-30", name: "Monthly Master", description: "Journal 30 days in a row", icon: "🗓️", check: (s) => s.journalStreak >= 30 },

  { id: "green-week", name: "Green Week", description: "5 green days in a row", icon: "💹", check: (s) => s.greenDays >= 5 },
  { id: "pnl-1k", name: "Four Figures", description: "Reach $1,000 total P&L", icon: "💰", check: (s) => s.totalPnL >= 1000 },
  { id: "pnl-10k", name: "Five Figures", description: "Reach $10,000 total P&L", icon: "💎", check: (s) => s.totalPnL >= 10000 },

  { id: "bounced-back", name: "Bounce Back", description: "Win after 3 consecutive losses", icon: "🏀", check: (s) => s.totalWins > 0 && s.totalLosses >= 3 },
]

/**
 * Calculate trader stats from journal entries
 */
export function calculateTraderStats(entries: JournalEntry[]): TraderStats {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  let totalWins = 0
  let totalLosses = 0
  let totalPnL = 0
  let currentWinStreak = 0
  let currentLossStreak = 0
  let bestWinStreak = 0
  let bestDayPnL = 0
  let worstDayPnL = 0
  let totalWinAmount = 0
  let totalLossAmount = 0

  // Track daily P&L for green days
  const dailyPnL: Record<string, number> = {}
  // Track days with entries for journal streak
  const entryDays = new Set<string>()

  for (const entry of sorted) {
    const dayKey = new Date(entry.createdAt).toISOString().split("T")[0]
    entryDays.add(dayKey)

    const pnl = entry.profitLoss || 0
    totalPnL += pnl
    dailyPnL[dayKey] = (dailyPnL[dayKey] || 0) + pnl

    if (pnl > 0) {
      totalWins++
      totalWinAmount += pnl
      currentWinStreak++
      currentLossStreak = 0
      if (currentWinStreak > bestWinStreak) bestWinStreak = currentWinStreak
    } else if (pnl < 0) {
      totalLosses++
      totalLossAmount += Math.abs(pnl)
      currentLossStreak++
      currentWinStreak = 0
    }
  }

  // Calculate green days and best/worst day
  let greenDays = 0
  for (const [, pnl] of Object.entries(dailyPnL)) {
    if (pnl > 0) greenDays++
    if (pnl > bestDayPnL) bestDayPnL = pnl
    if (pnl < worstDayPnL) worstDayPnL = pnl
  }

  // Calculate journal streak (consecutive days from today going back)
  let journalStreak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    if (entryDays.has(key)) {
      journalStreak++
    } else if (i > 0) {
      break
    }
  }

  return {
    totalEntries: entries.length,
    totalWins,
    totalLosses,
    totalPnL: Math.round(totalPnL * 100) / 100,
    currentWinStreak,
    currentLossStreak,
    bestWinStreak,
    bestDayPnL: Math.round(bestDayPnL * 100) / 100,
    worstDayPnL: Math.round(worstDayPnL * 100) / 100,
    greenDays,
    totalDays: Object.keys(dailyPnL).length,
    avgWin: totalWins > 0 ? Math.round((totalWinAmount / totalWins) * 100) / 100 : 0,
    avgLoss: totalLosses > 0 ? Math.round((totalLossAmount / totalLosses) * 100) / 100 : 0,
    journalStreak,
  }
}

/**
 * Get unlocked achievements for a trader
 */
export function getUnlockedAchievements(stats: TraderStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats))
}
