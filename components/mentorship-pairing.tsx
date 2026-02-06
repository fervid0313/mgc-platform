"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { GraduationCap, ArrowRight } from "lucide-react"
import { getAvatarUrl } from "@/lib/avatar-generator"

export function MentorshipPairing() {
  const { entries, currentSpaceId, user, profiles } = useAppStore()
  const router = useRouter()

  const pairings = useMemo((): { mentors: { profile: any; trades: number; totalPnL: number; winRate: number }[]; mentees: { profile: any; trades: number; totalPnL: number; winRate: number }[] } => {
    if (!currentSpaceId || !user) return { mentors: [], mentees: [] }
    const spaceEntries = entries[currentSpaceId] || []

    const userStats = profiles
      .filter((p) => p.id !== user.id)
      .map((p) => {
        const pEntries = spaceEntries.filter((e) => e.userId === p.id)
        const pnls = pEntries.filter((e) => e.profitLoss !== undefined).map((e) => e.profitLoss || 0)
        const totalPnL = pnls.reduce((a, b) => a + b, 0)
        const winRate = pnls.length > 0 ? (pnls.filter((v) => v > 0).length / pnls.length) * 100 : 0
        return { profile: p, trades: pEntries.length, totalPnL, winRate }
      })
      .filter((s) => s.trades >= 3)
      .sort((a, b) => b.totalPnL - a.totalPnL)

    const myEntries = spaceEntries.filter((e) => e.userId === user.id)
    const myPnL = myEntries.reduce((sum, e) => sum + (e.profitLoss || 0), 0)

    const mentors = userStats.filter((s) => s.totalPnL > myPnL && s.winRate > 50).slice(0, 3)
    const mentees = userStats.filter((s) => s.totalPnL < myPnL).slice(-3).reverse()

    return { mentors, mentees }
  }, [entries, currentSpaceId, user, profiles])

  if (!pairings.mentors.length && !pairings.mentees.length) return null

  return (
    <div className="glass-3d rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Mentorship</h3>
      </div>

      {pairings.mentors && pairings.mentors.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Suggested Mentors</p>
          <div className="space-y-2">
            {pairings.mentors.map((m) => (
              <button
                key={m.profile.id}
                onClick={() => router.push(`/profile/${m.profile.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 transition-colors text-left"
              >
                <img
                  src={getAvatarUrl(m.profile.username, m.profile.avatar, 32)}
                  alt={m.profile.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{m.profile.username}</p>
                  <p className="text-[10px] text-muted-foreground">{m.winRate.toFixed(0)}% WR · {m.trades} trades</p>
                </div>
                <span className="text-xs font-bold text-green-500">+${m.totalPnL.toFixed(0)}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {pairings.mentees && pairings.mentees.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">You Could Mentor</p>
          <div className="space-y-2">
            {pairings.mentees.map((m) => (
              <button
                key={m.profile.id}
                onClick={() => router.push(`/profile/${m.profile.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 transition-colors text-left"
              >
                <img
                  src={getAvatarUrl(m.profile.username, m.profile.avatar, 32)}
                  alt={m.profile.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{m.profile.username}</p>
                  <p className="text-[10px] text-muted-foreground">{m.trades} trades</p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
