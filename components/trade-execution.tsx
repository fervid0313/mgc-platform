"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Target,
  Calculator,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Minus,
  DollarSign,
  Percent,
} from "lucide-react"

interface TradeSetup {
  id: string
  market: string
  direction: "long" | "short"
  entryPrice: number
  stopLoss: number
  takeProfit: number
  positionSize: number
  riskAmount: number
  riskReward: number
  probability: number
  source: "turnaround" | "breakout" | "liquidity" | "pattern"
  confidence: number
  active: boolean
  createdAt: string
  executedAt?: string
  status: "pending" | "executed" | "cancelled" | "completed"
}

interface RiskProfile {
  maxRiskPerTrade: number
  maxDailyRisk: number
  maxPositions: number
  accountSize: number
  riskTolerance: "conservative" | "moderate" | "aggressive"
}

const MARKETS = [
  { value: "NQ100", label: "NQ100", multiplier: 20 },
  { value: "ES", label: "ES", multiplier: 50 },
  { value: "Gold", label: "Gold", multiplier: 100 },
  { value: "Silver", label: "Silver", multiplier: 5000 },
  { value: "BTC", label: "BTC", multiplier: 1 },
  { value: "Oil", label: "Oil", multiplier: 1000 },
  { value: "DXY", label: "DXY", multiplier: 1000 },
  { value: "VIX", label: "VIX", multiplier: 1000 },
  { value: "US10Y", label: "US10Y", multiplier: 1000 },
]

export function TradeExecution() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [setups, setSetups] = useState<TradeSetup[]>([])
  const [riskProfile, setRiskProfile] = useState<RiskProfile>({
    maxRiskPerTrade: 100,
    maxDailyRisk: 500,
    maxPositions: 3,
    accountSize: 10000,
    riskTolerance: "moderate",
  })
  const [showAddSetup, setShowAddSetup] = useState(false)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [dailyRisk, setDailyRisk] = useState(0)
  const [newSetup, setNewSetup] = useState({
    market: "NQ100",
    direction: "long" as const,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    positionSize: 1,
    source: "turnaround" as const,
  })

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    loadSetups()
    loadRiskProfile()
    loadDailyRisk()
  }, [])

  // Load saved data
  const loadSetups = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-trade-setups")
      if (saved) setSetups(JSON.parse(saved))
    } catch (error) {
      console.error("Failed to load trade setups:", error)
    }
  }, [])

  const loadRiskProfile = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-risk-profile")
      if (saved) setRiskProfile(JSON.parse(saved))
    } catch (error) {
      console.error("Failed to load risk profile:", error)
    }
  }, [])

  const loadDailyRisk = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-daily-risk")
      const today = new Date().toDateString()
      const data = JSON.parse(saved || "{}")
      
      if (data.date === today) {
        setDailyRisk(data.risk)
      } else {
        // Reset daily risk at midnight
        setDailyRisk(0)
        localStorage.setItem("mgc-daily-risk", JSON.stringify({ date: today, risk: 0 }))
      }
    } catch (error) {
      console.error("Failed to load daily risk:", error)
    }
  }, [])

  // Save data
  const saveSetups = useCallback((setups: TradeSetup[]) => {
    localStorage.setItem("mgc-trade-setups", JSON.stringify(setups))
  }, [])

  const saveRiskProfile = useCallback(() => {
    localStorage.setItem("mgc-risk-profile", JSON.stringify(riskProfile))
  }, [riskProfile])

  const saveDailyRisk = useCallback((risk: number) => {
    const today = new Date().toDateString()
    localStorage.setItem("mgc-daily-risk", JSON.stringify({ date: today, risk }))
  }, [])

  // Fetch current prices
  useEffect(() => {
    if (!mounted) return

    const fetchPrices = async () => {
      try {
        const response = await fetch("/api/market")
        if (response.ok) {
          const data = await response.json()
          const prices: Record<string, number> = {}
          data.forEach((item: any) => {
            prices[item.label] = item.price
          })
          setCurrentPrices(prices)
        }
      } catch (error) {
        console.error("Failed to fetch prices:", error)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [mounted])

  // Calculate position metrics
  const calculatePositionMetrics = useCallback((setup: typeof newSetup) => {
    const market = MARKETS.find(m => m.value === setup.market)
    if (!market) return null

    const entryPrice = setup.entryPrice
    const stopLoss = setup.direction === "long" ? setup.stopLoss : setup.stopLoss
    const takeProfit = setup.direction === "long" ? setup.takeProfit : setup.takeProfit
    
    const riskPerUnit = Math.abs(entryPrice - stopLoss) * market.multiplier
    const rewardPerUnit = Math.abs(takeProfit - entryPrice) * market.multiplier
    const riskReward = rewardPerUnit / riskPerUnit
    
    // Calculate position size based on risk
    const maxRisk = Math.min(riskProfile.maxRiskPerTrade, riskProfile.maxDailyRisk - dailyRisk)
    const positionSize = maxRisk / riskPerUnit
    
    const totalRisk = positionSize * riskPerUnit
    const totalReward = positionSize * rewardPerUnit

    return {
      riskPerUnit,
      rewardPerUnit,
      riskReward,
      positionSize,
      totalRisk,
      totalReward,
      probability: riskReward >= 2 ? 75 : riskReward >= 1.5 ? 60 : 40,
    }
  }, [riskProfile, dailyRisk])

  // Add new trade setup
  const addSetup = useCallback(() => {
    const metrics = calculatePositionMetrics(newSetup)
    if (!metrics) return

    const setup: TradeSetup = {
      id: Date.now().toString(),
      market: newSetup.market,
      direction: newSetup.direction,
      entryPrice: newSetup.entryPrice,
      stopLoss: newSetup.stopLoss,
      takeProfit: newSetup.takeProfit,
      positionSize: metrics.positionSize,
      riskAmount: metrics.totalRisk,
      riskReward: metrics.riskReward,
      probability: metrics.probability,
      source: newSetup.source,
      confidence: metrics.probability,
      active: true,
      createdAt: new Date().toISOString(),
      status: "pending",
    }

    setSetups(prev => {
      const updated = [...prev, setup]
      saveSetups(updated)
      return updated
    })

    setShowAddSetup(false)
    setNewSetup({
      market: "NQ100",
      direction: "long",
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      positionSize: 1,
      source: "turnaround",
    })
  }, [newSetup, calculatePositionMetrics, saveSetups])

  // Execute trade
  const executeTrade = useCallback((id: string) => {
    setSetups(prev => {
      const updated = prev.map(setup => {
        if (setup.id === id) {
          const executed = { ...setup, status: "executed" as const, executedAt: new Date().toISOString() }
          
          // Update daily risk
          setDailyRisk(prev => {
            const newRisk = prev + setup.riskAmount
            saveDailyRisk(newRisk)
            return newRisk
          })
          
          return executed
        }
        return setup
      })
      saveSetups(updated)
      return updated
    })
  }, [saveSetups, saveDailyRisk])

  // Cancel setup
  const cancelSetup = useCallback((id: string) => {
    setSetups(prev => {
      const updated = prev.map(setup => 
        setup.id === id ? { ...setup, status: "cancelled" as const, active: false } : setup
      )
      saveSetups(updated)
      return updated
    })
  }, [saveSetups])

  // Delete setup
  const deleteSetup = useCallback((id: string) => {
    setSetups(prev => {
      const updated = prev.filter(s => s.id !== id)
      saveSetups(updated)
      return updated
    })
  }, [saveSetups])

  if (!mounted) return null

  const activeSetups = setups.filter(s => s.active && s.status === "pending")
  const executedSetups = setups.filter(s => s.status === "executed")
  const riskRemaining = riskProfile.maxDailyRisk - dailyRisk
  const riskPercentage = (dailyRisk / riskProfile.maxDailyRisk) * 100

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-green-400" />
            <span className="text-xs font-black">Trade Execution</span>
            {activeSetups.length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                {activeSetups.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[8px] text-muted-foreground/40">
              Risk: {riskPercentage.toFixed(0)}%
            </div>
            <button
              onClick={() => setShowAddSetup(!showAddSetup)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Risk Meter */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-muted-foreground/40">Daily Risk</span>
            <span className="text-[8px] text-muted-foreground/40">
              ${dailyRisk.toFixed(0)} / ${riskProfile.maxDailyRisk}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-background/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                riskPercentage > 80 ? "bg-red-400" : riskPercentage > 60 ? "bg-yellow-400" : "bg-green-400"
              }`}
              style={{ width: `${Math.min(riskPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Add Setup Form */}
        {showAddSetup && (
          <div className="p-3 bg-background/30 border border-border/30 rounded-lg mb-3">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSetup.market}
                  onChange={(e) => setNewSetup(prev => ({ ...prev, market: e.target.value }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                >
                  {MARKETS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={newSetup.direction}
                  onChange={(e) => setNewSetup(prev => ({ ...prev, direction: e.target.value as any }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Entry"
                  value={newSetup.entryPrice || ""}
                  onChange={(e) => setNewSetup(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                />
                <input
                  type="number"
                  placeholder="Stop Loss"
                  value={newSetup.stopLoss || ""}
                  onChange={(e) => setNewSetup(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                />
                <input
                  type="number"
                  placeholder="Take Profit"
                  value={newSetup.takeProfit || ""}
                  onChange={(e) => setNewSetup(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                />
              </div>
              <select
                value={newSetup.source}
                onChange={(e) => setNewSetup(prev => ({ ...prev, source: e.target.value as any }))}
                className="w-full text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
              >
                <option value="turnaround">Turnaround Zone</option>
                <option value="breakout">Breakout</option>
                <option value="liquidity">Liquidity Grab</option>
                <option value="pattern">Pattern Recognition</option>
              </select>
              
              {/* Calculated Metrics */}
              {newSetup.entryPrice && newSetup.stopLoss && newSetup.takeProfit && (
                <div className="p-2 bg-background/20 rounded text-[8px] space-y-1">
                  {(() => {
                    const metrics = calculatePositionMetrics(newSetup)
                    return metrics ? (
                      <>
                        <div className="flex justify-between">
                          <span>R/R:</span>
                          <span className={`font-bold ${metrics.riskReward >= 2 ? "text-green-400" : metrics.riskReward >= 1.5 ? "text-yellow-400" : "text-red-400"}`}>
                            {metrics.riskReward.toFixed(2)}:1
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Position Size:</span>
                          <span>{metrics.positionSize.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk:</span>
                          <span className={metrics.totalRisk > riskRemaining ? "text-red-400" : ""}>
                            ${metrics.totalRisk.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reward:</span>
                          <span className="text-green-400">${metrics.totalReward.toFixed(2)}</span>
                        </div>
                      </>
                    ) : null
                  })()}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={addSetup}
                  disabled={!newSetup.entryPrice || !newSetup.stopLoss || !newSetup.takeProfit}
                  className="flex-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Setup
                </button>
                <button
                  onClick={() => setShowAddSetup(false)}
                  className="text-xs text-muted-foreground/50 px-2 py-1 hover:text-muted-foreground/70"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Active Setups */}
        {activeSetups.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Active Setups</p>
            <div className="space-y-1">
              {activeSetups.map(setup => {
                const currentPrice = currentPrices[setup.market]
                const DirectionIcon = setup.direction === "long" ? TrendingUp : TrendingDown
                const isNearEntry = currentPrice && Math.abs(currentPrice - setup.entryPrice) / setup.entryPrice < 0.01
                
                return (
                  <div key={setup.id} className={`p-2 rounded-lg border ${
                    isNearEntry ? "border-green-500/30 bg-green-500/5" : "border-border/20 bg-background/20"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <DirectionIcon className={`h-3 w-3 ${setup.direction === "long" ? "text-green-400" : "text-red-400"}`} />
                        <span className="text-[9px] font-bold text-foreground/60">{setup.market}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                          setup.source === "turnaround" ? "bg-orange-500/10 text-orange-400" :
                          setup.source === "breakout" ? "bg-blue-500/10 text-blue-400" :
                          setup.source === "liquidity" ? "bg-purple-500/10 text-purple-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {setup.source}
                        </span>
                      </div>
                      <span className={`text-[8px] font-bold ${
                        setup.riskReward >= 2 ? "text-green-400" : setup.riskReward >= 1.5 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {setup.riskReward.toFixed(1)}:1
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 text-[8px] mb-1">
                      <div>
                        <span className="text-muted-foreground/40">Entry:</span>
                        <span className="ml-1 text-foreground/60">{setup.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/40">SL:</span>
                        <span className="ml-1 text-red-400">{setup.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/40">TP:</span>
                        <span className="ml-1 text-green-400">{setup.takeProfit}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-muted-foreground/40">
                          Size: {setup.positionSize.toFixed(1)} · Risk: ${setup.riskAmount.toFixed(0)}
                        </span>
                        {currentPrice && (
                          <span className={`text-[8px] ${
                            currentPrice > setup.entryPrice ? "text-green-400" : "text-red-400"
                          }`}>
                            {currentPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => executeTrade(setup.id)}
                          disabled={setup.riskAmount > riskRemaining}
                          className="text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => cancelSetup(setup.id)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Executed Trades */}
        {executedSetups.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Executed Trades</p>
            <div className="space-y-1">
              {executedSetups.slice(0, 3).map(setup => (
                <div key={setup.id} className="p-2 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-[9px] font-bold text-foreground/60">{setup.market}</span>
                      <span className={`text-[8px] ${setup.direction === "long" ? "text-green-400" : "text-red-400"}`}>
                        {setup.direction.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[8px] text-muted-foreground/40">
                      {new Date(setup.executedAt!).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeSetups.length === 0 && executedSetups.length === 0 && (
          <div className="text-center py-4">
            <Play className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No trade setups</p>
            <p className="text-[8px] text-muted-foreground/30">Click + to add execution plans</p>
          </div>
        )}

        {/* Risk Summary */}
        <div className="p-2 bg-background/20 rounded-lg border border-border/20">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[8px] font-bold text-muted-foreground/40">Risk Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            <div>
              <span className="text-muted-foreground/50">Daily Used:</span>
              <span className={`ml-1 ${riskPercentage > 80 ? "text-red-400" : riskPercentage > 60 ? "text-yellow-400" : "text-green-400"}`}>
                ${dailyRisk.toFixed(0)} ({riskPercentage.toFixed(0)}%)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/50">Remaining:</span>
              <span className="ml-1 text-green-400">${riskRemaining.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground/50">Max/Trade:</span>
              <span className="ml-1">${riskProfile.maxRiskPerTrade}</span>
            </div>
            <div>
              <span className="text-muted-foreground/50">Positions:</span>
              <span className="ml-1">{executedSetups.length}/{riskProfile.maxPositions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
