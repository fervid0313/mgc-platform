"use client"

import { useState, useMemo, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Trophy, Users, Calendar, Check, ChevronDown, Plus, X } from "lucide-react"
import { differenceInDays, format, isAfter, isBefore, startOfDay } from "date-fns"

interface Challenge {
  id: string
  title: string
  description: string
  type: "journaling" | "pnl" | "streak"
  target: number
  startDate: string
  endDate: string
  participants: string[]
  createdBy: string
}

const STORAGE_KEY = "mgc-community-challenges"

function loadChallenges(): Challenge[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function saveChallenges(challenges: Challenge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges))
}

const PRESET_CHALLENGES: Omit<Challenge, "id" | "startDate" | "endDate" | "participants" | "createdBy">[] = [
  { title: "30-Day Journal Streak", description: "Post a journal entry every day for 30 days", type: "journaling", target: 30 },
  { title: "7-Day Green Week", description: "End 7 consecutive days with positive P&L", type: "pnl", target: 7 },
  { title: "100 Trades Challenge", description: "Complete and journal 100 trades", type: "journaling", target: 100 },
  { title: "14-Day Consistency", description: "Journal every day for 2 weeks straight", type: "streak", target: 14 },
]

export function CommunityChallenges() {
  const { user, entries, currentSpaceId } = useAppStore()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setChallenges(loadChallenges())
  }, [])

  const userEntries = useMemo(() => {
    if (!currentSpaceId || !user) return []
    return (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
  }, [entries, currentSpaceId, user])

  const getUserProgress = (challenge: Challenge): number => {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    const relevantEntries = userEntries.filter((e) => {
      const d = new Date(e.createdAt)
      return isAfter(d, start) && isBefore(d, end)
    })

    if (challenge.type === "journaling") return relevantEntries.length
    if (challenge.type === "pnl") return relevantEntries.filter((e) => (e.profitLoss || 0) > 0).length
    if (challenge.type === "streak") {
      const days = new Set(relevantEntries.map((e) => format(new Date(e.createdAt), "yyyy-MM-dd")))
      return days.size
    }
    return 0
  }

  const joinChallenge = (id: string) => {
    if (!user) return
    const updated = challenges.map((c) =>
      c.id === id && !c.participants.includes(user.id)
        ? { ...c, participants: [...c.participants, user.id] }
        : c
    )
    setChallenges(updated)
    saveChallenges(updated)
  }

  const createFromPreset = (preset: typeof PRESET_CHALLENGES[0]) => {
    if (!user) return
    const now = new Date()
    const challenge: Challenge = {
      ...preset,
      id: `challenge-${Date.now()}`,
      startDate: now.toISOString(),
      endDate: new Date(now.getTime() + preset.target * 24 * 60 * 60 * 1000).toISOString(),
      participants: [user.id],
      createdBy: user.id,
    }
    const updated = [...challenges, challenge]
    setChallenges(updated)
    saveChallenges(updated)
    setShowCreate(false)
  }

  const activeChallenges = challenges.filter((c) => isAfter(new Date(c.endDate), new Date()))

  return (
    <div className="glass-3d rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Challenges</h3>
          {activeChallenges.length > 0 && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {activeChallenges.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {showCreate && (
        <div className="space-y-2 border border-border/50 rounded-xl p-3 bg-secondary/20">
          <p className="text-xs font-bold text-muted-foreground">Choose a challenge:</p>
          {PRESET_CHALLENGES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => createFromPreset(preset)}
              className="w-full text-left p-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <p className="text-xs font-bold">{preset.title}</p>
              <p className="text-[10px] text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      )}

      {activeChallenges.length === 0 && !showCreate && (
        <p className="text-xs text-muted-foreground text-center py-4">No active challenges. Create one to get started!</p>
      )}

      <div className="space-y-3">
        {activeChallenges.slice(0, expanded ? undefined : 3).map((challenge) => {
          const progress = getUserProgress(challenge)
          const pct = Math.min((progress / challenge.target) * 100, 100)
          const daysLeft = differenceInDays(new Date(challenge.endDate), new Date())
          const joined = user ? challenge.participants.includes(user.id) : false

          return (
            <div key={challenge.id} className="border border-border/30 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold">{challenge.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{challenge.description}</p>
                </div>
                {!joined ? (
                  <button
                    onClick={() => joinChallenge(challenge.id)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                  >
                    Join
                  </button>
                ) : pct >= 100 ? (
                  <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><Check className="h-3 w-3" /> Done</span>
                ) : null}
              </div>

              {joined && (
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="font-bold">{progress}/{challenge.target}</span>
                    <span className="text-muted-foreground">{daysLeft}d left</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{challenge.participants.length} participant{challenge.participants.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )
        })}
      </div>

      {activeChallenges.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Show less" : `Show ${activeChallenges.length - 3} more`}
        </button>
      )}
    </div>
  )
}
