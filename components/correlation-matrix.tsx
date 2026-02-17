"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Grid3x3,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react"

interface CorrelationData {
  market1: string
  market2: string
  correlation: number
  strength: "strong" | "moderate" | "weak" | "none"
  trend: "increasing" | "decreasing" | "stable"
  divergence: boolean
  lastUpdated: string
}

interface MarketData {
  label: string
  price: number
  change: number
  changePercent: number
  volume?: number
}

interface CorrelationAlert {
  id: string
  market1: string
  market2: string
  type: "divergence" | "breakdown" | "convergence"
  severity: "high" | "medium" | "low"
  message: string
  timestamp: string
  acknowledged: boolean
}

const MARKETS = [
  { value: "NQ100", label: "NQ100", category: "Equities", color: "text-blue-400" },
  { value: "ES", label: "ES", category: "Equities", color: "text-green-400" },
  { value: "Gold", label: "Gold", category: "Commodities", color: "text-yellow-400" },
  { value: "Silver", label: "Silver", category: "Commodities", color: "text-gray-400" },
  { value: "BTC", label: "BTC", category: "Crypto", color: "text-orange-400" },
  { value: "Oil", label: "Oil", category: "Commodities", color: "text-purple-400" },
  { value: "DXY", label: "DXY", category: "Currencies", color: "text-red-400" },
  { value: "VIX", label: "VIX", category: "Volatility", color: "text-pink-400" },
  { value: "US10Y", label: "US10Y", category: "Bonds", color: "text-indigo-400" },
]

const CATEGORIES = ["Equities", "Commodities", "Crypto", "Currencies", "Volatility", "Bonds"]

export function CorrelationMatrix() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [correlations, setCorrelations] = useState<CorrelationData[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [alerts, setAlerts] = useState<CorrelationAlert[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showDivergencesOnly, setShowDivergencesOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [historicalData, setHistoricalData] = useState<Record<string, number[]>>({})

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    loadHistoricalData()
    fetchMarketData()
    
    const interval = setInterval(() => {
      fetchMarketData()
      calculateCorrelations()
    }, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Load historical data for correlation calculation
  const loadHistoricalData = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-historical-prices")
      if (saved) {
        const data = JSON.parse(saved)
        setHistoricalData(data)
      }
    } catch (error) {
      console.error("Failed to load historical data:", error)
    }
  }, [])

  // Save historical data
  const saveHistoricalData = useCallback((data: Record<string, number[]>) => {
    localStorage.setItem("mgc-historical-prices", JSON.stringify(data))
  }, [])

  // Fetch current market data
  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch("/api/market")
      if (response.ok) {
        const data = await response.json()
        setMarketData(data)
        setLastUpdate(new Date())
        
        // Update historical data
        setHistoricalData(prev => {
          const updated = { ...prev }
          data.forEach((item: MarketData) => {
            if (!updated[item.label]) {
              updated[item.label] = []
            }
            updated[item.label].push(item.price)
            // Keep only last 100 data points
            if (updated[item.label].length > 100) {
              updated[item.label] = updated[item.label].slice(-100)
            }
          })
          saveHistoricalData(updated)
          return updated
        })
        
        calculateCorrelations()
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error)
    }
  }, [])

  // Calculate correlations between all market pairs
  const calculateCorrelations = useCallback(() => {
    if (marketData.length < 2) return

    const newCorrelations: CorrelationData[] = []
    const newAlerts: CorrelationAlert[] = []

    for (let i = 0; i < marketData.length; i++) {
      for (let j = i + 1; j < marketData.length; j++) {
        const market1 = marketData[i]
        const market2 = marketData[j]
        
        // Calculate correlation
        const correlation = calculatePearsonCorrelation(
          historicalData[market1.label] || [],
          historicalData[market2.label] || []
        )
        
        // Determine strength
        const absCorr = Math.abs(correlation)
        const strength = absCorr >= 0.7 ? "strong" : 
                        absCorr >= 0.4 ? "moderate" : 
                        absCorr >= 0.2 ? "weak" : "none"
        
        // Determine trend (simplified - would need more historical data for real trend)
        const trend = "stable" // Would analyze correlation over time
        
        // Check for divergence
        const divergence = checkDivergence(market1, market2, correlation)
        
        const correlationData: CorrelationData = {
          market1: market1.label,
          market2: market2.label,
          correlation,
          strength,
          trend,
          divergence,
          lastUpdated: new Date().toISOString(),
        }
        
        newCorrelations.push(correlationData)
        
        // Create alert for significant divergences
        if (divergence && strength !== "none") {
          const alert: CorrelationAlert = {
            id: `${market1.label}-${market2.label}-${Date.now()}`,
            market1: market1.label,
            market2: market2.label,
            type: "divergence",
            severity: strength === "strong" ? "high" : strength === "moderate" ? "medium" : "low",
            message: `${market1.label} and ${market2.label} showing divergence despite ${strength} correlation`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          }
          newAlerts.push(alert)
        }
      }
    }
    
    setCorrelations(newCorrelations)
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 20)) // Keep last 20 alerts
  }, [marketData, historicalData])

  // Calculate Pearson correlation coefficient
  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length < 2) return 0
    
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0)
    const sumX2 = x.reduce((a, b) => a + b * b, 0)
    const sumY2 = y.reduce((a, b) => a + b * b, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  // Check for divergence between two markets
  const checkDivergence = (market1: MarketData, market2: MarketData, correlation: number): boolean => {
    // Simple divergence check: opposite movements when correlation is strong
    if (Math.abs(correlation) < 0.5) return false
    
    const bothUp = market1.changePercent > 0.5 && market2.changePercent > 0.5
    const bothDown = market1.changePercent < -0.5 && market2.changePercent < -0.5
    const diverging = (market1.changePercent > 0.5 && market2.changePercent < -0.5) ||
                     (market1.changePercent < -0.5 && market2.changePercent > 0.5)
    
    // If correlation is positive but markets are moving in opposite directions
    if (correlation > 0.5 && diverging) return true
    // If correlation is negative but markets are moving in same direction
    if (correlation < -0.5 && bothUp) return true
    
    return false
  }

  // Get correlation color
  const getCorrelationColor = (correlation: number): string => {
    const abs = Math.abs(correlation)
    if (abs >= 0.7) return correlation > 0 ? "bg-green-500/80" : "bg-red-500/80"
    if (abs >= 0.4) return correlation > 0 ? "bg-green-500/50" : "bg-red-500/50"
    if (abs >= 0.2) return correlation > 0 ? "bg-green-500/30" : "bg-red-500/30"
    return "bg-gray-500/20"
  }

  // Get correlation icon
  const getCorrelationIcon = (correlation: number) => {
    if (correlation > 0.3) return <TrendingUp className="h-3 w-3 text-green-400" />
    if (correlation < -0.3) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  // Filter correlations
  const filteredCorrelations = correlations.filter(corr => {
    const categoryMatch = selectedCategory === "all" || 
      MARKETS.find(m => m.label === corr.market1)?.category === selectedCategory ||
      MARKETS.find(m => m.label === corr.market2)?.category === selectedCategory
    
    const divergenceMatch = !showDivergencesOnly || corr.divergence
    
    return categoryMatch && divergenceMatch
  })

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-black">Correlation Matrix</span>
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                {alerts.filter(a => !a.acknowledged).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {lastUpdate && (
              <span className="text-[8px] text-muted-foreground/40">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => {
                fetchMarketData()
                calculateCorrelations()
              }}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => setShowDivergencesOnly(!showDivergencesOnly)}
            className={`text-xs px-2 py-1 rounded border ${
              showDivergencesOnly 
                ? "bg-red-500/10 border-red-500/30 text-red-400" 
                : "bg-background/50 border-border/30 text-muted-foreground/60"
            }`}
          >
            {showDivergencesOnly ? "Divergences Only" : "All Correlations"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Divergence Alerts */}
        {alerts.filter(a => !a.acknowledged).length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Active Divergences</p>
            <div className="space-y-1">
              {alerts.filter(a => !a.acknowledged).slice(0, 3).map(alert => (
                <div key={alert.id} className={`p-2 rounded-lg border ${
                  alert.severity === "high" ? "border-red-500/30 bg-red-500/5" :
                  alert.severity === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-orange-500/30 bg-orange-500/5"
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <div className="flex-1">
                      <div className="text-[9px] font-bold text-foreground/60">
                        {alert.market1} / {alert.market2}
                      </div>
                      <div className="text-[8px] text-muted-foreground/40">
                        {alert.message}
                      </div>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      alert.severity === "high" ? "bg-red-500/20 text-red-400" :
                      alert.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlation Matrix */}
        <div>
          <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">
            Correlation Matrix ({filteredCorrelations.length})
          </p>
          
          {/* Matrix Grid */}
          <div className="bg-background/20 rounded-lg border border-border/20 p-2">
            <div className="grid grid-cols-3 gap-1">
              {filteredCorrelations.slice(0, 9).map(corr => {
                const market1Info = MARKETS.find(m => m.label === corr.market1)
                const market2Info = MARKETS.find(m => m.label === corr.market2)
                
                return (
                  <div key={`${corr.market1}-${corr.market2}`} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getCorrelationColor(corr.correlation)}`} />
                      <span className="text-[8px] text-muted-foreground/40">
                        {corr.market1.slice(0, 3)}/{corr.market2.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getCorrelationIcon(corr.correlation)}
                      <span className={`text-[9px] font-bold ${
                        corr.correlation > 0.3 ? "text-green-400" :
                        corr.correlation < -0.3 ? "text-red-400" :
                        "text-gray-400"
                      }`}>
                        {corr.correlation.toFixed(2)}
                      </span>
                    </div>
                    {corr.divergence && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-2 w-2 text-red-400" />
                        <span className="text-[7px] text-red-400">DIVERGING</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Strong Correlations */}
        {filteredCorrelations.filter(c => c.strength === "strong").length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Strong Correlations</p>
            <div className="space-y-1">
              {filteredCorrelations
                .filter(c => c.strength === "strong")
                .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                .slice(0, 5)
                .map(corr => (
                  <div key={`strong-${corr.market1}-${corr.market2}`} className="flex items-center gap-2 p-2 rounded border border-border/20 bg-background/20">
                    {getCorrelationIcon(corr.correlation)}
                    <div className="flex-1">
                      <div className="text-[9px] font-bold text-foreground/60">
                        {corr.market1} ↔ {corr.market2}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold ${
                          corr.correlation > 0.7 ? "text-green-400" :
                          corr.correlation < -0.7 ? "text-red-400" :
                          "text-gray-400"
                        }`}>
                          {corr.correlation.toFixed(3)}
                        </span>
                        {corr.divergence && (
                          <span className="text-[7px] text-red-400">DIVERGING</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Category Overview */}
        <div>
          <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Category Overview</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.slice(0, 4).map(category => {
              const categoryMarkets = MARKETS.filter(m => m.category === category)
              const categoryCorrs = filteredCorrelations.filter(corr => 
                categoryMarkets.some(m => m.label === corr.market1) ||
                categoryMarkets.some(m => m.label === corr.market2)
              )
              
              const avgCorrelation = categoryCorrs.length > 0 
                ? categoryCorrs.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / categoryCorrs.length
                : 0
              
              const divergences = categoryCorrs.filter(c => c.divergence).length
              
              return (
                <div key={category} className="p-2 bg-background/20 rounded border border-border/20">
                  <div className="text-[9px] font-bold text-foreground/60 mb-1">{category}</div>
                  <div className="text-[8px] text-muted-foreground/40">
                    {categoryMarkets.length} markets
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-background/30 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          avgCorrelation >= 0.7 ? "bg-green-400" :
                          avgCorrelation >= 0.4 ? "bg-yellow-400" :
                          "bg-gray-400"
                        }`}
                        style={{ width: `${avgCorrelation * 100}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground/40 min-w-[35px]">
                      {(avgCorrelation * 100).toFixed(0)}%
                    </span>
                  </div>
                  {divergences > 0 && (
                    <div className="text-[7px] text-red-400 mt-1">
                      {divergences} divergences
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredCorrelations.length === 0 && (
          <div className="text-center py-4">
            <Grid3x3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No correlation data</p>
            <p className="text-[8px] text-muted-foreground/30">Waiting for market data</p>
          </div>
        )}
      </div>
    </div>
  )
}
