"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
} from "lucide-react"

interface PredictionRecord {
  id: string
  type: "HOD" | "LOD" | "turnaround" | "breakout" | "liquidity"
  market: string
  predictedPrice: number
  actualPrice?: number
  predictedAt: string
  resolvedAt?: string
  probability: number
  accuracy?: number
  status: "pending" | "correct" | "incorrect" | "partial"
  session?: string
  notes?: string
}

interface PerformanceMetrics {
  totalPredictions: number
  correctPredictions: number
  accuracy: number
  averageProbability: number
  averageAccuracy: number
  bestMarket: string
  worstMarket: string
  bestType: string
  worstType: string
  streak: {
    current: number
    best: number
    worst: number
  }
}

interface MonthlyStats {
  month: string
  predictions: number
  accuracy: number
  profit: number
}

const MARKETS = [
  { value: "NQ100", label: "NQ100" },
  { value: "ES", label: "ES" },
  { value: "Gold", label: "Gold" },
  { value: "Silver", label: "Silver" },
  { value: "BTC", label: "BTC" },
  { value: "Oil", label: "Oil" },
  { value: "DXY", label: "DXY" },
  { value: "VIX", label: "VIX" },
  { value: "US10Y", label: "US10Y" },
]

const PREDICTION_TYPES = [
  { value: "HOD", label: "HOD", color: "text-green-400" },
  { value: "LOD", label: "LOD", color: "text-red-400" },
  { value: "turnaround", label: "Turnaround", color: "text-orange-400" },
  { value: "breakout", label: "Breakout", color: "text-blue-400" },
  { value: "liquidity", label: "Liquidity", color: "text-purple-400" },
]

export function PerformanceTracking() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<PredictionRecord[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [selectedMarket, setSelectedMarket] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [timeframe, setTimeframe] = useState("30d")
  const [loading, setLoading] = useState(false)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    loadRecords()
    calculateMetrics()
  }, [])

  // Load saved records
  const loadRecords = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-prediction-records")
      if (saved) {
        const parsed = JSON.parse(saved)
        setRecords(parsed)
        calculateMetrics(parsed)
        calculateMonthlyStats(parsed)
      }
    } catch (error) {
      console.error("Failed to load prediction records:", error)
    }
  }, [])

  // Save records
  const saveRecords = useCallback((records: PredictionRecord[]) => {
    localStorage.setItem("mgc-prediction-records", JSON.stringify(records))
  }, [])

  // Calculate performance metrics
  const calculateMetrics = useCallback((recordsList?: PredictionRecord[]) => {
    const recordsToAnalyze = recordsList || records
    const resolved = recordsToAnalyze.filter(r => r.status !== "pending")
    
    if (resolved.length === 0) {
      setMetrics(null)
      return
    }

    const correct = resolved.filter(r => r.status === "correct").length
    const accuracy = (correct / resolved.length) * 100
    const avgProbability = resolved.reduce((sum, r) => sum + r.probability, 0) / resolved.length
    const avgAccuracy = resolved
      .filter(r => r.accuracy !== undefined)
      .reduce((sum, r) => sum + (r.accuracy || 0), 0) / resolved.filter(r => r.accuracy !== undefined).length

    // Calculate market performance
    const marketStats: Record<string, { correct: number; total: number }> = {}
    const typeStats: Record<string, { correct: number; total: number }> = {}

    resolved.forEach(record => {
      // Market stats
      if (!marketStats[record.market]) {
        marketStats[record.market] = { correct: 0, total: 0 }
      }
      marketStats[record.market].total++
      if (record.status === "correct") {
        marketStats[record.market].correct++
      }

      // Type stats
      if (!typeStats[record.type]) {
        typeStats[record.type] = { correct: 0, total: 0 }
      }
      typeStats[record.type].total++
      if (record.status === "correct") {
        typeStats[record.type].correct++
      }
    })

    const bestMarket = Object.entries(marketStats)
      .reduce((best, [market, stats]) => {
        const accuracy = (stats.correct / stats.total) * 100
        const bestAccuracy = best ? (marketStats[best].correct / marketStats[best].total) * 100 : 0
        return accuracy > bestAccuracy ? market : best
      }, "")

    const worstMarket = Object.entries(marketStats)
      .reduce((worst, [market, stats]) => {
        const accuracy = (stats.correct / stats.total) * 100
        const worstAccuracy = worst ? (marketStats[worst].correct / marketStats[worst].total) * 100 : 100
        return accuracy < worstAccuracy ? market : worst
      }, "")

    const bestType = Object.entries(typeStats)
      .reduce((best, [type, stats]) => {
        const accuracy = (stats.correct / stats.total) * 100
        const bestAccuracy = best ? (typeStats[best].correct / typeStats[best].total) * 100 : 0
        return accuracy > bestAccuracy ? type : best
      }, "")

    const worstType = Object.entries(typeStats)
      .reduce((worst, [type, stats]) => {
        const accuracy = (stats.correct / stats.total) * 100
        const worstAccuracy = worst ? (typeStats[worst].correct / typeStats[worst].total) * 100 : 100
        return accuracy < worstAccuracy ? type : worst
      }, "")

    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let worstStreak = 0
    let tempStreak = 0

    resolved.forEach(record => {
      if (record.status === "correct") {
        currentStreak++
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        worstStreak = Math.max(worstStreak, tempStreak)
        tempStreak = 0
        currentStreak = 0
      }
    })

    setMetrics({
      totalPredictions: resolved.length,
      correctPredictions: correct,
      accuracy,
      averageProbability: avgProbability,
      averageAccuracy: avgAccuracy,
      bestMarket,
      worstMarket,
      bestType,
      worstType,
      streak: {
        current: currentStreak,
        best: bestStreak,
        worst: worstStreak,
      },
    })
  }, [records])

  // Calculate monthly statistics
  const calculateMonthlyStats = useCallback((recordsList?: PredictionRecord[]) => {
    const recordsToAnalyze = recordsList || records
    const resolved = recordsToAnalyze.filter(r => r.status !== "pending")
    
    // Group by month
    const monthlyData: Record<string, MonthlyStats> = {}
    
    resolved.forEach(record => {
      const date = new Date(record.predictedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          predictions: 0,
          accuracy: 0,
          profit: 0,
        }
      }
      
      monthlyData[monthKey].predictions++
      if (record.status === "correct") {
        monthlyData[monthKey].accuracy = (monthlyData[monthKey].accuracy * (monthlyData[monthKey].predictions - 1) + 100) / monthlyData[monthKey].predictions
      }
    })

    const stats = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month))
    setMonthlyStats(stats.slice(0, 6)) // Last 6 months
  }, [records])

  // Add new prediction record (this would be called by other components)
  const addPrediction = useCallback((prediction: Omit<PredictionRecord, "id" | "predictedAt">) => {
    const record: PredictionRecord = {
      ...prediction,
      id: Date.now().toString(),
      predictedAt: new Date().toISOString(),
    }

    setRecords(prev => {
      const updated = [record, ...prev]
      saveRecords(updated)
      calculateMetrics(updated)
      calculateMonthlyStats(updated)
      return updated
    })
  }, [calculateMetrics, calculateMonthlyStats, saveRecords])

  // Update prediction result
  const updatePrediction = useCallback((id: string, actualPrice: number, status: PredictionRecord["status"]) => {
    setRecords(prev => {
      const updated = prev.map(record => {
        if (record.id === id) {
          const accuracy = status === "correct" ? 100 : status === "incorrect" ? 0 : 50
          return {
            ...record,
            actualPrice,
            status,
            resolvedAt: new Date().toISOString(),
            accuracy,
          }
        }
        return record
      })
      saveRecords(updated)
      calculateMetrics(updated)
      calculateMonthlyStats(updated)
      return updated
    })
  }, [calculateMetrics, calculateMonthlyStats, saveRecords])

  // Export data
  const exportData = useCallback(() => {
    const data = {
      records,
      metrics,
      monthlyStats,
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `performance-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [records, metrics, monthlyStats])

  // Filter records
  const filteredRecords = records.filter(record => {
    const marketMatch = selectedMarket === "all" || record.market === selectedMarket
    const typeMatch = selectedType === "all" || record.type === selectedType
    
    // Timeframe filter
    const recordDate = new Date(record.predictedAt)
    const now = new Date()
    let daysDiff = 0
    
    switch (timeframe) {
      case "7d":
        daysDiff = 7
        break
      case "30d":
        daysDiff = 30
        break
      case "90d":
        daysDiff = 90
        break
      case "all":
        daysDiff = Infinity
        break
    }
    
    const timeMatch = (now.getTime() - recordDate.getTime()) <= (daysDiff * 24 * 60 * 60 * 1000)
    
    return marketMatch && typeMatch && timeMatch
  })

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Performance Tracking</span>
            {metrics && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                metrics.accuracy >= 70 ? "bg-green-500/10 text-green-400" :
                metrics.accuracy >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                "bg-red-500/10 text-red-400"
              }`}>
                {metrics.accuracy.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportData}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Download className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                loadRecords()
                calculateMetrics()
              }}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Markets</option>
            {MARKETS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Types</option>
            {PREDICTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Performance Metrics */}
        {metrics && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Performance Metrics</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Accuracy</span>
                </div>
                <div className={`text-lg font-bold ${
                  metrics.accuracy >= 70 ? "text-green-400" :
                  metrics.accuracy >= 50 ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {metrics.accuracy.toFixed(1)}%
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  {metrics.correctPredictions}/{metrics.totalPredictions}
                </div>
              </div>
              
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Award className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Streak</span>
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {metrics.streak.current}
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  Best: {metrics.streak.best} · Worst: {metrics.streak.worst}
                </div>
              </div>
              
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Best Type</span>
                </div>
                <div className="text-sm font-bold text-green-400">
                  {metrics.bestType}
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  Most accurate prediction type
                </div>
              </div>
              
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Worst Type</span>
                </div>
                <div className="text-sm font-bold text-red-400">
                  {metrics.worstType}
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  Needs improvement
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Predictions */}
        {filteredRecords.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">
              Recent Predictions ({filteredRecords.length})
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredRecords.slice(0, 10).map(record => {
                const TypeIcon = PREDICTION_TYPES.find(t => t.value === record.type)
                const StatusIcon = record.status === "correct" ? CheckCircle : 
                                 record.status === "incorrect" ? XCircle : 
                                 AlertTriangle
                const statusColor = record.status === "correct" ? "text-green-400" : 
                                 record.status === "incorrect" ? "text-red-400" : 
                                 "text-yellow-400"
                
                return (
                  <div key={record.id} className="flex items-center gap-2 p-2 rounded border border-border/20 bg-background/20">
                    <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-foreground/60">{record.market}</span>
                        <span className={`text-[8px] ${TypeIcon?.color}`}>
                          {record.type}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">
                          {record.probability}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-muted-foreground/40">
                          Pred: {record.predictedPrice}
                        </span>
                        {record.actualPrice && (
                          <span className="text-[8px] text-muted-foreground/40">
                            Actual: {record.actualPrice}
                          </span>
                        )}
                        {record.accuracy !== undefined && (
                          <span className={`text-[8px] font-bold ${statusColor}`}>
                            {record.accuracy}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[8px] text-muted-foreground/40">
                      {new Date(record.predictedAt).toLocaleDateString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Monthly Performance */}
        {monthlyStats.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Monthly Performance</p>
            <div className="space-y-1">
              {monthlyStats.map((stat, i) => (
                <div key={stat.month} className="flex items-center gap-2">
                  <div className="w-16 text-[8px] text-muted-foreground/40">
                    {new Date(stat.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            stat.accuracy >= 70 ? "bg-green-400" :
                            stat.accuracy >= 50 ? "bg-yellow-400" :
                            "bg-red-400"
                          }`}
                          style={{ width: `${stat.accuracy}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-bold min-w-[35px] text-right">
                        {stat.accuracy.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[7px] text-muted-foreground/30">
                      {stat.predictions} predictions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRecords.length === 0 && (
          <div className="text-center py-4">
            <BarChart3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No prediction data</p>
            <p className="text-[8px] text-muted-foreground/30">Start tracking your predictions</p>
          </div>
        )}
      </div>
    </div>
  )
}
