"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Shield, Plus, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface TradingRule {
  id: string
  name: string
  type: "max_trades_day" | "no_trading_before" | "no_trading_after" | "max_loss_day" | "min_rr" | "no_revenge" | "custom"
  value: string
  createdAt: string
}

const STORAGE_KEY = "mgc-trading-rules"

const RULE_TYPES = [
  { value: "max_trades_day", label: "Max trades per day", placeholder: "e.g., 3" },
  { value: "no_trading_before", label: "No trading before (hour)", placeholder: "e.g., 9" },
  { value: "no_trading_after", label: "No trading after (hour)", placeholder: "e.g., 16" },
  { value: "max_loss_day", label: "Max daily loss ($)", placeholder: "e.g., 500" },
  { value: "no_revenge", label: "No revenge trades (wait after loss)", placeholder: "Minutes to wait, e.g., 15" },
  { value: "custom", label: "Custom rule", placeholder: "Describe your rule" },
] as const

function loadRules(): TradingRule[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function saveRules(rules: TradingRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function RuleEnforcer() {
  const { entries, currentSpaceId, user } = useAppStore()
  const [rules, setRules] = useState<TradingRule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<TradingRule["type"]>("max_trades_day")
  const [value, setValue] = useState("")

  useEffect(() => { setRules(loadRules()) }, [])

  const spaceEntries = currentSpaceId ? entries[currentSpaceId] || [] : []

  const ruleResults = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const myEntries = spaceEntries.filter((e) => e.userId === user?.id)
    const todayEntries = myEntries.filter((e) => new Date(e.createdAt).toISOString().slice(0, 10) === todayStr)
    const todayPnL = todayEntries.reduce((s, e) => s + (e.profitLoss || 0), 0)
    const currentHour = today.getHours()

    const lastEntry = todayEntries.length > 0
      ? todayEntries.reduce((latest, e) => new Date(e.createdAt) > new Date(latest.createdAt) ? e : latest, todayEntries[0])
      : null
    const lastWasLoss = lastEntry ? (lastEntry.profitLoss || 0) < 0 : false
    const minutesSinceLastTrade = lastEntry
      ? Math.round((Date.now() - new Date(lastEntry.createdAt).getTime()) / 60000)
      : Infinity

    return rules.map((rule) => {
      let passed = true
      let message = ""

      switch (rule.type) {
        case "max_trades_day": {
          const max = parseInt(rule.value) || 99
          passed = todayEntries.length <= max
          message = passed
            ? `${todayEntries.length}/${max} trades today`
            : `${todayEntries.length}/${max} trades — limit exceeded!`
          break
        }
        case "no_trading_before": {
          const hour = parseInt(rule.value) || 0
          passed = currentHour >= hour
          message = passed
            ? `Trading allowed (after ${hour}:00)`
            : `No trading before ${hour}:00 — it's currently ${currentHour}:00`
          break
        }
        case "no_trading_after": {
          const hour = parseInt(rule.value) || 24
          passed = currentHour < hour
          message = passed
            ? `Trading allowed (before ${hour}:00)`
            : `No trading after ${hour}:00 — it's currently ${currentHour}:00`
          break
        }
        case "max_loss_day": {
          const maxLoss = parseFloat(rule.value) || 0
          passed = todayPnL >= -maxLoss
          message = passed
            ? `Today's P&L: $${todayPnL.toFixed(0)} (limit: -$${maxLoss.toFixed(0)})`
            : `Daily loss limit breached! P&L: -$${Math.abs(todayPnL).toFixed(0)} / -$${maxLoss.toFixed(0)}`
          break
        }
        case "no_revenge": {
          const waitMin = parseInt(rule.value) || 15
          if (!lastWasLoss) {
            passed = true
            message = "Last trade was a win — no cooldown needed"
          } else {
            passed = minutesSinceLastTrade >= waitMin
            message = passed
              ? `${minutesSinceLastTrade}min since last loss — cooldown cleared`
              : `Wait ${waitMin - minutesSinceLastTrade}min more after your last loss`
          }
          break
        }
        case "custom": {
          passed = true
          message = rule.value
          break
        }
      }

      return { rule, passed, message }
    })
  }, [rules, spaceEntries, user?.id])

  const violations = ruleResults.filter((r) => !r.passed).length
  const compliance = rules.length > 0
    ? Math.round(((rules.length - violations) / rules.length) * 100)
    : 100

  const addRule = () => {
    if (!name.trim() || !value.trim()) return
    const rule: TradingRule = {
      id: Date.now().toString(),
      name: name.trim(),
      type,
      value: value.trim(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...rules, rule]
    setRules(updated)
    saveRules(updated)
    setName(""); setValue(""); setShowForm(false)
  }

  const removeRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id)
    setRules(updated)
    saveRules(updated)
  }

  return (
    <div className="glass-3d rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest">Trading Rules</h3>
          {rules.length > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              violations === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}>
              {compliance}% compliant
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </button>
      </div>

      {violations > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs font-bold text-red-400">
            {violations} rule{violations > 1 ? "s" : ""} violated — consider stepping away
          </p>
        </div>
      )}

      {showForm && (
        <div className="space-y-3 mb-4 p-4 rounded-xl bg-secondary/20 border border-border">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rule name (e.g., Max 3 trades per day)"
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TradingRule["type"])}
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50"
          >
            {RULE_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={RULE_TYPES.find((rt) => rt.value === type)?.placeholder || "Value"}
            className="w-full text-xs bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50"
          />
          <div className="flex gap-2">
            <button onClick={addRule} className="btn-3d text-xs font-bold px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              Save Rule
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs font-bold px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground/50 text-center py-4">
          No rules set. Add trading rules to keep yourself accountable.
        </p>
      )}

      <div className="space-y-2">
        {ruleResults.map(({ rule, passed, message }) => (
          <div key={rule.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${
            passed ? "border-border bg-secondary/10" : "border-red-500/30 bg-red-500/5"
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {passed
                ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              }
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{rule.name}</p>
                <p className={`text-[10px] ${passed ? "text-muted-foreground" : "text-red-400"}`}>{message}</p>
              </div>
            </div>
            <button onClick={() => removeRule(rule.id)} className="text-muted-foreground/30 hover:text-red-400 ml-2 shrink-0">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
