"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { ShieldAlert, Settings, X } from "lucide-react"

const STORAGE_KEY = "mgc-drawdown-settings"

interface DrawdownSettings {
  dailyMax: number
  weeklyMax: number
  enabled: boolean
}

function loadSettings(): DrawdownSettings {
  if (typeof window === "undefined") return { dailyMax: 500, weeklyMax: 2000, enabled: true }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return { dailyMax: saved.dailyMax || 500, weeklyMax: saved.weeklyMax || 2000, enabled: saved.enabled !== false }
  } catch { return { dailyMax: 500, weeklyMax: 2000, enabled: true } }
}

function saveSettings(s: DrawdownSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function DrawdownMonitor() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [settings, setSettings] = useState<DrawdownSettings>({ dailyMax: 500, weeklyMax: 2000, enabled: true })
  const [showSettings, setShowSettings] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => { setSettings(loadSettings()) }, [])

  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []

  const { dailyPnL, weeklyPnL, peakEquity, currentEquity, maxDrawdown } = useMemo(() => {
    const myEntries = spaceEntries
      .filter((e) => e.userId === user?.id && e.profitLoss !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 86400000)

    const dailyPnL = myEntries
      .filter((e) => new Date(e.createdAt).toISOString().slice(0, 10) === today)
      .reduce((s, e) => s + (e.profitLoss || 0), 0)

    const weeklyPnL = myEntries
      .filter((e) => new Date(e.createdAt) >= weekAgo)
      .reduce((s, e) => s + (e.profitLoss || 0), 0)

    let peak = 0
    let running = 0
    let maxDD = 0
    myEntries.forEach((e) => {
      running += e.profitLoss || 0
      if (running > peak) peak = running
      const dd = peak - running
      if (dd > maxDD) maxDD = dd
    })

    return { dailyPnL, weeklyPnL, peakEquity: peak, currentEquity: running, maxDrawdown: maxDD }
  }, [spaceEntries, user?.id])

  if (!settings.enabled) return null

  const dailyBreached = dailyPnL <= -settings.dailyMax
  const weeklyBreached = weeklyPnL <= -settings.weeklyMax
  const dailyPct = settings.dailyMax > 0 ? Math.min(100, Math.abs(Math.min(0, dailyPnL)) / settings.dailyMax * 100) : 0
  const weeklyPct = settings.weeklyMax > 0 ? Math.min(100, Math.abs(Math.min(0, weeklyPnL)) / settings.weeklyMax * 100) : 0
  const approaching = dailyPct >= 70 || weeklyPct >= 70
  const breached = dailyBreached || weeklyBreached

  if (!breached && !approaching && !showSettings) return null
  if (dismissed && !showSettings) return null

  const updateSettings = (updates: Partial<DrawdownSettings>) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    saveSettings(next)
  }

  return (
    <div className={`glass-3d rounded-2xl p-5 border ${
      breached ? "border-red-500/50 bg-red-500/5" : approaching ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/10"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`h-4 w-4 ${breached ? "text-red-400" : approaching ? "text-yellow-400" : "text-primary"}`} />
          <h3 className="text-xs font-black uppercase tracking-widest">
            {breached ? "⚠️ Circuit Breaker Triggered" : approaching ? "⚠️ Approaching Limit" : "Drawdown Monitor"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(!showSettings)} className="text-muted-foreground hover:text-foreground p-1">
            <Settings className="h-3.5 w-3.5" />
          </button>
          {!showSettings && (
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {breached && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30">
          <p className="text-xs font-bold text-red-400">
            {dailyBreached && weeklyBreached
              ? "Daily AND weekly loss limits breached. Stop trading now."
              : dailyBreached
              ? "Daily loss limit breached. Step away and review your trades."
              : "Weekly loss limit breached. Consider taking the rest of the week off."}
          </p>
        </div>
      )}

      {showSettings && (
        <div className="space-y-3 mb-4 p-3 rounded-xl bg-secondary/20 border border-border">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily Max Loss ($)</label>
            <input
              type="number"
              value={settings.dailyMax}
              onChange={(e) => updateSettings({ dailyMax: parseFloat(e.target.value) || 0 })}
              className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 mt-1 outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weekly Max Loss ($)</label>
            <input
              type="number"
              value={settings.weeklyMax}
              onChange={(e) => updateSettings({ weeklyMax: parseFloat(e.target.value) || 0 })}
              className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 mt-1 outline-none focus:border-primary/50"
            />
          </div>
          <button onClick={() => setShowSettings(false)} className="btn-3d text-xs font-bold px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Done
          </button>
        </div>
      )}

      <div className="space-y-3">
        {/* Daily */}
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-muted-foreground">Daily P&L</span>
            <span className={dailyPnL >= 0 ? "text-emerald-400" : dailyBreached ? "text-red-400" : "text-yellow-400"}>
              {dailyPnL >= 0 ? "+" : ""}${dailyPnL.toFixed(0)} / -${settings.dailyMax.toFixed(0)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dailyBreached ? "bg-red-500" : dailyPct >= 70 ? "bg-yellow-500" : "bg-emerald-500"
              }`}
              style={{ width: `${dailyPnL >= 0 ? 0 : dailyPct}%` }}
            />
          </div>
        </div>

        {/* Weekly */}
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-muted-foreground">Weekly P&L</span>
            <span className={weeklyPnL >= 0 ? "text-emerald-400" : weeklyBreached ? "text-red-400" : "text-yellow-400"}>
              {weeklyPnL >= 0 ? "+" : ""}${weeklyPnL.toFixed(0)} / -${settings.weeklyMax.toFixed(0)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                weeklyBreached ? "bg-red-500" : weeklyPct >= 70 ? "bg-yellow-500" : "bg-emerald-500"
              }`}
              style={{ width: `${weeklyPnL >= 0 ? 0 : weeklyPct}%` }}
            />
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="flex justify-between pt-1 border-t border-border">
          <span className="text-[10px] font-bold text-muted-foreground">Max Drawdown (all time)</span>
          <span className="text-[10px] font-bold text-red-400">-${maxDrawdown.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
