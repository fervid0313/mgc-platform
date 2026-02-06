"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { calculateTraderStats, getUnlockedAchievements, ACHIEVEMENTS } from "@/lib/achievements"
import { Flame, Trophy, Target, Calendar, TrendingUp, Lock } from "lucide-react"

export function TradeStreaks() {
  const { entries, currentSpaceId, user } = useAppStore()

  const stats = useMemo(() => {
    if (!currentSpaceId || !user) return null
    const spaceEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    return calculateTraderStats(spaceEntries)
  }, [entries, currentSpaceId, user])

  const unlocked = useMemo(() => {
    if (!stats) return []
    return getUnlockedAchievements(stats)
  }, [stats])

  if (!stats || stats.totalEntries === 0) return null

  return (
    <div className="glass-3d rounded-2xl p-5 mb-6 space-y-4">
      {/* Streaks Row */}
      <div className="flex items-center gap-2 mb-1">
        <Flame className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-bold">Streaks & Stats</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Win Streak"
          value={String(stats.currentWinStreak)}
          sub={`Best: ${stats.bestWinStreak}`}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-blue-500" />}
          label="Journal Streak"
          value={`${stats.journalStreak}d`}
          sub="Consecutive days"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          label="Green Days"
          value={String(stats.greenDays)}
          sub={`of ${stats.totalDays} days`}
        />
        <StatCard
          icon={<Target className="h-4 w-4 text-purple-500" />}
          label="Win Rate"
          value={stats.totalWins + stats.totalLosses > 0
            ? `${Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100)}%`
            : "—"}
          sub={`${stats.totalWins}W / ${stats.totalLosses}L`}
        />
      </div>

      {/* Achievements */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-bold text-muted-foreground">
            Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.some((u) => u.id === a.id)
            return (
              <div
                key={a.id}
                className="relative group"
              >
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-default ${
                    isUnlocked
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : "bg-secondary/20 text-muted-foreground/40 border border-white/5"
                  }`}
                >
                  {isUnlocked ? (
                    <span>{a.icon}</span>
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  <span>{a.name}</span>
                </div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-popover border border-border shadow-xl text-xs w-48 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                  <p className="font-bold text-foreground">{a.icon} {a.name}</p>
                  <p className="text-muted-foreground mt-0.5">{a.description}</p>
                  {isUnlocked && <p className="text-green-500 font-semibold mt-1">✓ Unlocked</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="glass-3d lift-3d rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground/60">{sub}</p>
    </div>
  )
}
