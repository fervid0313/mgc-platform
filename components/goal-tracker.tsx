"use client"

import { useState, useMemo, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Target, ChevronDown } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

type GoalPeriod = "weekly" | "monthly"

export function GoalTracker() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [period, setPeriod] = useState<GoalPeriod>("weekly")
  const [goalAmount, setGoalAmount] = useState("")
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(`mgc-goal-${period}`)
    if (saved) setGoalAmount(saved)
  }, [period])

  const saveGoal = () => {
    localStorage.setItem(`mgc-goal-${period}`, goalAmount)
    setEditing(false)
  }

  const goal = Number.parseFloat(goalAmount) || 0

  const currentPnL = useMemo(() => {
    if (!currentSpaceId || !user) return 0
    const now = new Date()
    const interval = period === "weekly"
      ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      : { start: startOfMonth(now), end: endOfMonth(now) }

    return (entries[currentSpaceId] || [])
      .filter((e) => e.userId === user.id && e.profitLoss !== undefined && isWithinInterval(new Date(e.createdAt), interval))
      .reduce((sum, e) => sum + (e.profitLoss || 0), 0)
  }, [entries, currentSpaceId, user, period])

  const progress = goal > 0 ? Math.min((currentPnL / goal) * 100, 100) : 0
  const isPositive = currentPnL >= 0

  if (goal === 0 && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full glass-3d rounded-2xl p-4 mb-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span className="font-bold">Set a {period} P&L goal</span>
        </div>
      </button>
    )
  }

  return (
    <div className="glass-3d rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">P&L Goal</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
            className="text-[10px] font-bold bg-secondary/30 border border-border/50 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button onClick={() => setEditing(true)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Edit</button>
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="Target P&L ($)"
            className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50"
            autoFocus
          />
          <button onClick={saveGoal} className="btn-3d px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg">Save</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-xs mb-2">
            <span className={`font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? "+" : ""}${currentPnL.toFixed(0)}
            </span>
            <span className="text-muted-foreground">${goal.toFixed(0)} goal</span>
          </div>
          <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? "bg-green-500" : isPositive ? "bg-primary" : "bg-red-500"
              }`}
              style={{ width: `${Math.max(progress, 0)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {progress >= 100
              ? "Goal reached!"
              : `${progress.toFixed(0)}% — $${Math.max(goal - currentPnL, 0).toFixed(0)} remaining`}
          </p>
        </>
      )}
    </div>
  )
}
