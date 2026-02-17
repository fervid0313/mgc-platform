"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Triangle,
  Circle,
  Square,
  Hexagon,
  Zap,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

interface ChartPattern {
  id: string
  market: string
  timeframe: string
  pattern: "head_and_shoulders" | "inverse_head_and_shoulders" | "double_top" | "double_bottom" | "triangle" | "flag" | "pennant" | "wedge" | "rectangle" | "cup_and_handle"
  direction: "bullish" | "bearish" | "neutral"
  confidence: number
  status: "forming" | "confirmed" | "failed"
  entryPrice: number
  targetPrice: number
  stopLoss: number
  riskReward: number
  volumeConfirmation: boolean
  breakoutLevel: number
  description: string
  detectedAt: string
  completedAt?: string
}

interface VolumeProfile {
  price: number
  volume: number
  type: "buy" | "sell" | "neutral"
  significance: "high" | "medium" | "low"
}

interface MarketMicrostructure {
  market: string
  bidAskSpread: number
  volume: number
  orderFlow: "buying_pressure" | "selling_pressure" | "balanced"
  liquidity: "high" | "medium" | "low"
  volatility: "low" | "medium" | "high"
  momentum: "strong_up" | "strong_down" | "weak_up" | "weak_down" | "neutral"
}

const PATTERN_TYPES = [
  { value: "head_and_shoulders", label: "Head & Shoulders", icon: Triangle, direction: "bearish" },
  { value: "inverse_head_and_shoulders", label: "Inverse H&S", icon: Triangle, direction: "bullish" },
  { value: "double_top", label: "Double Top", icon: Square, direction: "bearish" },
  { value: "double_bottom", label: "Double Bottom", icon: Square, direction: "bullish" },
  { value: "triangle", label: "Triangle", icon: Triangle, direction: "neutral" },
  { value: "flag", label: "Flag", icon: Square, direction: "neutral" },
  { value: "pennant", label: "Pennant", icon: Triangle, direction: "neutral" },
  { value: "wedge", label: "Wedge", icon: Triangle, direction: "neutral" },
  { value: "rectangle", label: "Rectangle", icon: Square, direction: "neutral" },
  { value: "cup_and_handle", label: "Cup & Handle", icon: Circle, direction: "bullish" },
]

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"]

export function PatternRecognition() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [patterns, setPatterns] = useState<ChartPattern[]>([])
  const [volumeProfiles, setVolumeProfiles] = useState<Record<string, VolumeProfile[]>>({})
  const [microstructure, setMicrostructure] = useState<MarketMicrostructure[]>([])
  const [selectedMarket, setSelectedMarket] = useState("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState("all")
  const [loading, setLoading] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    scanForPatterns()
    
    const interval = setInterval(() => {
      scanForPatterns()
    }, 30000) // Scan every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Scan for patterns using AI
  const scanForPatterns = useCallback(async () => {
    setLoading(true)
    try {
      // In a real implementation, this would analyze actual chart data
      // For now, we'll simulate pattern detection
      const mockPatterns: ChartPattern[] = [
        {
          id: "1",
          market: "NQ100",
          timeframe: "15m",
          pattern: "head_and_shoulders",
          direction: "bearish",
          confidence: 85,
          status: "forming",
          entryPrice: 15250,
          targetPrice: 15000,
          stopLoss: 15300,
          riskReward: 2.5,
          volumeConfirmation: true,
          breakoutLevel: 15200,
          description: "Classic head and shoulders forming with right shoulder developing",
          detectedAt: new Date().toISOString(),
        },
        {
          id: "2",
          market: "ES",
          timeframe: "30m",
          pattern: "double_bottom",
          direction: "bullish",
          confidence: 78,
          status: "confirmed",
          entryPrice: 4520,
          targetPrice: 4650,
          stopLoss: 4480,
          riskReward: 2.1,
          volumeConfirmation: true,
          breakoutLevel: 4525,
          description: "Double bottom confirmed with volume spike on second bottom",
          detectedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date().toISOString(),
        },
        {
          id: "3",
          market: "Gold",
          timeframe: "1h",
          pattern: "triangle",
          direction: "bullish",
          confidence: 72,
          status: "forming",
          entryPrice: 2350,
          targetPrice: 2420,
          stopLoss: 2320,
          riskReward: 1.8,
          volumeConfirmation: false,
          breakoutLevel: 2380,
          description: "Ascending triangle building, waiting for breakout confirmation",
          detectedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ]

      setPatterns(mockPatterns)
      setLastScan(new Date())
      
      // Generate mock volume profiles
      const mockVolumeProfiles: Record<string, VolumeProfile[]> = {}
      mockPatterns.forEach(pattern => {
        const profile: VolumeProfile[] = [
          { price: pattern.entryPrice - 50, volume: 1000000, type: "sell", significance: "high" },
          { price: pattern.entryPrice, volume: 2500000, type: "buy", significance: "high" },
          { price: pattern.entryPrice + 50, volume: 800000, type: "neutral", significance: "medium" },
        ]
        mockVolumeProfiles[`${pattern.market}-${pattern.timeframe}`] = profile
      })
      setVolumeProfiles(mockVolumeProfiles)

      // Generate mock microstructure data
      const mockMicrostructure: MarketMicrostructure[] = [
        {
          market: "NQ100",
          bidAskSpread: 0.25,
          volume: 1500000,
          orderFlow: "buying_pressure",
          liquidity: "high",
          volatility: "medium",
          momentum: "strong_up",
        },
        {
          market: "ES",
          bidAskSpread: 0.125,
          volume: 2000000,
          orderFlow: "balanced",
          liquidity: "high",
          volatility: "low",
          momentum: "neutral",
        },
        {
          market: "Gold",
          bidAskSpread: 0.5,
          volume: 800000,
          orderFlow: "selling_pressure",
          liquidity: "medium",
          volatility: "high",
          momentum: "weak_down",
        },
      ]
      setMicrostructure(mockMicrostructure)
      
    } catch (error) {
      console.error("Failed to scan for patterns:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get pattern icon and color
  const getPatternInfo = (pattern: string) => {
    const patternType = PATTERN_TYPES.find(p => p.value === pattern)
    return patternType || { label: pattern, icon: Square, direction: "neutral" }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400"
    if (confidence >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-green-400"
      case "forming": return "text-yellow-400"
      case "failed": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  // Filter patterns
  const filteredPatterns = patterns.filter(pattern => {
    const marketMatch = selectedMarket === "all" || pattern.market === selectedMarket
    const timeframeMatch = selectedTimeframe === "all" || pattern.timeframe === selectedTimeframe
    return marketMatch && timeframeMatch
  })

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-black">Pattern Recognition</span>
            {filteredPatterns.length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                {filteredPatterns.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {lastScan && (
              <span className="text-[8px] text-muted-foreground/40">
                {lastScan.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={scanForPatterns}
              disabled={loading}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Markets</option>
            <option value="NQ100">NQ100</option>
            <option value="ES">ES</option>
            <option value="Gold">Gold</option>
            <option value="BTC">BTC</option>
            <option value="Oil">Oil</option>
          </select>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Timeframes</option>
            {TIMEFRAMES.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Detected Patterns */}
        {filteredPatterns.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Detected Patterns</p>
            <div className="space-y-2">
              {filteredPatterns.map(pattern => {
                const patternInfo = getPatternInfo(pattern.pattern)
                const PatternIcon = patternInfo.icon
                
                return (
                  <div key={pattern.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PatternIcon className={`h-4 w-4 ${
                          patternInfo.direction === "bullish" ? "text-green-400" :
                          patternInfo.direction === "bearish" ? "text-red-400" :
                          "text-gray-400"
                        }`} />
                        <div>
                          <div className="text-[10px] font-bold text-foreground/60">
                            {patternInfo.label}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-muted-foreground/40">{pattern.market}</span>
                            <span className="text-[8px] text-muted-foreground/30">·</span>
                            <span className="text-[8px] text-muted-foreground/40">{pattern.timeframe}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[8px] font-bold ${getConfidenceColor(pattern.confidence)}`}>
                          {pattern.confidence}%
                        </div>
                        <div className={`text-[8px] ${getStatusColor(pattern.status)}`}>
                          {pattern.status}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px] mb-2">
                      <div>
                        <span className="text-muted-foreground/40">Entry:</span>
                        <span className="ml-1 text-foreground/60">{pattern.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/40">Target:</span>
                        <span className="ml-1 text-green-400">{pattern.targetPrice}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/40">Stop:</span>
                        <span className="ml-1 text-red-400">{pattern.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/40">R/R:</span>
                        <span className="ml-1 text-blue-400">{pattern.riskReward}:1</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {pattern.volumeConfirmation && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-green-400" />
                          <span className="text-[8px] text-green-400">Volume Confirmed</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-blue-400" />
                        <span className="text-[8px] text-blue-400">Breakout: {pattern.breakoutLevel}</span>
                      </div>
                    </div>

                    <p className="text-[8px] text-muted-foreground/40 leading-snug">
                      {pattern.description}
                    </p>

                    {pattern.status === "confirmed" && (
                      <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-[8px] text-green-400">Pattern Confirmed</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Volume Profile */}
        {Object.keys(volumeProfiles).length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Volume Profile</p>
            <div className="space-y-2">
              {Object.entries(volumeProfiles).slice(0, 2).map(([key, profile]) => {
                const [market, timeframe] = key.split('-')
                const maxVolume = Math.max(...profile.map(p => p.volume))
                
                return (
                  <div key={key} className="p-2 bg-background/20 rounded border border-border/20">
                    <div className="text-[8px] font-bold text-foreground/60 mb-1">
                      {market} {timeframe}
                    </div>
                    <div className="space-y-1">
                      {profile.map((level, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] text-foreground/60">{level.price}</span>
                              <span className="text-[8px] text-muted-foreground/40">
                                {(level.volume / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            <div className="w-full bg-background/30 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  level.type === "buy" ? "bg-green-400" :
                                  level.type === "sell" ? "bg-red-400" :
                                  "bg-gray-400"
                                }`}
                                style={{ width: `${(level.volume / maxVolume) * 100}%` }}
                              />
                            </div>
                          </div>
                          {level.significance === "high" && (
                            <Zap className="h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Market Microstructure */}
        {microstructure.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Market Microstructure</p>
            <div className="space-y-1">
              {microstructure.map(market => (
                <div key={market.market} className="p-2 bg-background/20 rounded border border-border/20">
                  <div className="text-[9px] font-bold text-foreground/60 mb-1">{market.market}</div>
                  <div className="grid grid-cols-3 gap-2 text-[8px]">
                    <div>
                      <span className="text-muted-foreground/40">Spread:</span>
                      <span className="ml-1">{market.bidAskSpread}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Volume:</span>
                      <span className="ml-1">{(market.volume / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Liquidity:</span>
                      <span className={`ml-1 ${
                        market.liquidity === "high" ? "text-green-400" :
                        market.liquidity === "medium" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {market.liquidity}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Flow:</span>
                      <span className={`ml-1 ${
                        market.orderFlow === "buying_pressure" ? "text-green-400" :
                        market.orderFlow === "selling_pressure" ? "text-red-400" :
                        "text-gray-400"
                      }`}>
                        {market.orderFlow.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Volatility:</span>
                      <span className={`ml-1 ${
                        market.volatility === "low" ? "text-green-400" :
                        market.volatility === "medium" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {market.volatility}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Momentum:</span>
                      <span className={`ml-1 ${
                        market.momentum.includes("up") ? "text-green-400" :
                        market.momentum.includes("down") ? "text-red-400" :
                        "text-gray-400"
                      }`}>
                        {market.momentum.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPatterns.length === 0 && Object.keys(volumeProfiles).length === 0 && (
          <div className="text-center py-4">
            <Eye className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No patterns detected</p>
            <p className="text-[8px] text-muted-foreground/30">Scanning for technical patterns</p>
          </div>
        )}
      </div>
    </div>
  )
}
