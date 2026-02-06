"use client"

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { calculateTraderStats } from "@/lib/achievements"
import { Crown, TrendingUp, Flame, Medal, BarChart3, X } from "lucide-react"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { FollowButton } from "./follow-system"

interface LeaderboardEntry {
  userId: string
  username: string
  avatar?: string
  totalPnL: number
  winRate: number
  bestStreak: number
  totalWins: number
}

export function Leaderboard() {
  const { entries, currentSpaceId, profiles } = useAppStore()
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null)

  const leaderboard = useMemo((): LeaderboardEntry[] => {
    if (!currentSpaceId) return []
    const spaceEntries = entries[currentSpaceId] || []

    // Group entries by user
    const byUser: Record<string, typeof spaceEntries> = {}
    for (const entry of spaceEntries) {
      if (!byUser[entry.userId]) byUser[entry.userId] = []
      byUser[entry.userId].push(entry)
    }

    // Calculate stats per user
    const board: LeaderboardEntry[] = []
    for (const [userId, userEntries] of Object.entries(byUser)) {
      const profile = profiles.find((p) => p.id === userId)
      if (!profile) continue
      const stats = calculateTraderStats(userEntries)
      board.push({
        userId,
        username: profile.username,
        avatar: profile.avatar,
        totalPnL: stats.totalPnL,
        winRate: stats.totalWins + stats.totalLosses > 0
          ? Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100)
          : 0,
        bestStreak: stats.bestWinStreak,
        totalWins: stats.totalWins,
      })
    }

    // Sort by total P&L descending
    board.sort((a, b) => b.totalPnL - a.totalPnL)
    return board.slice(0, 10)
  }, [entries, currentSpaceId, profiles])

  if (leaderboard.length === 0) return null

  const rankIcons = [
    <Crown key="1" className="h-4 w-4 text-yellow-500" />,
    <Medal key="2" className="h-4 w-4 text-gray-400" />,
    <Medal key="3" className="h-4 w-4 text-amber-700" />,
  ]

  return (
    <>
      <div className="glass-3d rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-bold">Leaderboard</h3>
          <span className="text-xs text-muted-foreground">Top performers</span>
        </div>

        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <button
              key={entry.userId}
              onClick={() => setSelectedUser(entry)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                i === 0 ? "bg-yellow-500/5 border border-yellow-500/10 hover:bg-yellow-500/10" : "hover:bg-secondary/20"
              }`}
            >
              {/* Rank */}
              <div className="w-6 flex justify-center">
                {i < 3 ? rankIcons[i] : (
                  <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <img
                  src={getAvatarUrl(entry.username, entry.avatar, 28)}
                  alt={entry.username}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{entry.username}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1" title="Best streak">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="font-medium">{entry.bestStreak}</span>
                </div>
                <div className="flex items-center gap-1" title="Win rate">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">{entry.winRate}%</span>
                </div>
                <span className={`font-bold min-w-[60px] text-right ${
                  entry.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                }`}>
                  {entry.totalPnL >= 0 ? "+" : ""}${Math.abs(entry.totalPnL).toFixed(0)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Popup */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="glass-3d rounded-2xl w-full max-w-xs p-6 space-y-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <img
                src={getAvatarUrl(selectedUser.username, selectedUser.avatar, 96)}
                alt={selectedUser.username}
                className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg mb-4"
              />
              <h3 className="text-xl font-bold">{selectedUser.username}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{selectedUser.winRate}% WR</span>
                <span>·</span>
                <span className={selectedUser.totalPnL >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                  {selectedUser.totalPnL >= 0 ? "+" : ""}${selectedUser.totalPnL.toFixed(0)}
                </span>
                <span>·</span>
                <span>{selectedUser.totalWins} wins</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <FollowButton userId={selectedUser.userId} />
              <button
                onClick={() => { setSelectedUser(null); router.push(`/profile/${selectedUser.userId}`) }}
                className="btn-3d flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-bold w-full"
              >
                <BarChart3 className="h-4 w-4" />
                Trade Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
