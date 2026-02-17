"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import { scaleFromNQ, scaleVolumeFromNQ } from "@/lib/market-data"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Target,
  Thermometer,
  Droplet,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderFlowLevel {
  price: number
  buyVolume: number
  sellVolume: number
  delta: number
  buyPressure: number
  sellPressure: number
  absorption: boolean
  exhaustion: boolean
  stackedImbalances: number
}

interface HeatmapData {
  levels: Array<{
    price: number
    intensity: number // 0-100
    type: "buy" | "sell" | "neutral"
    volume: number
    delta: number
  }>
  maxIntensity: number
  currentPrice: number
}

interface AbsorptionData {
  detected: boolean
  price: number
  strength: "weak" | "moderate" | "strong"
  type: "buy" | "sell"
  volume: number
  duration: number // in minutes
}

interface ExhaustionData {
  detected: boolean
  price: number
  type: "buy" | "sell"
  volumeSpike: number
  reversalProbability: number
}

interface DeltaProfile {
  cumulativeDelta: number
  deltaPerBar: number[]
  deltaTrend: "increasing" | "decreasing" | "flat"
  divergence: boolean
  volumeWeightedPrice: number
}

interface OrderFlowAnalysis {
  heatmap: HeatmapData
  levels: OrderFlowLevel[]
  absorption: AbsorptionData
  exhaustion: ExhaustionData
  deltaProfile: DeltaProfile
  predictions: {
    nextLevel: number
    direction: "bullish" | "bearish" | "neutral"
    confidence: number
    reasoning: string
  }
  realTime: {
    currentDelta: number
    buyVolume: number
    sellVolume: number
    timestamp: string
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function OrderFlowAnalysis({ market }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [analysis, setAnalysis] = useState<OrderFlowAnalysis | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("5m")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const timeframes = ["1m", "5m", "15m", "1H", "4H"]
  const selectedMarket = market || "NQ100"
  const p = (nqPrice: number) => scaleFromNQ(nqPrice, selectedMarket)
  const v = (nqVol: number) => scaleVolumeFromNQ(nqVol, selectedMarket)

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch order flow analysis
  const fetchAnalysis = useCallback(async (timeframe: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real order flow APIs
      const mockAnalysis: OrderFlowAnalysis = {
        heatmap: {
          levels: [
            { price: p(21832.50), intensity: 85, type: "buy", volume: v(1500000), delta: v(250000) },
            { price: p(21800.25), intensity: 72, type: "buy", volume: v(1200000), delta: v(180000) },
            { price: p(21775.00), intensity: 45, type: "neutral", volume: v(900000), delta: v(50000) },
            { price: p(21745.25), intensity: 68, type: "sell", volume: v(1100000), delta: v(-150000) },
            { price: p(21720.50), intensity: 91, type: "sell", volume: v(1800000), delta: v(-320000) }
          ],
          maxIntensity: 100,
          currentPrice: p(21805.50)
        },
        levels: [
          {
            price: p(21832.50),
            buyVolume: v(875000),
            sellVolume: v(625000),
            delta: v(250000),
            buyPressure: 0.58,
            sellPressure: 0.42,
            absorption: false,
            exhaustion: false,
            stackedImbalances: 3
          },
          {
            price: p(21800.25),
            buyVolume: v(690000),
            sellVolume: v(510000),
            delta: v(180000),
            buyPressure: 0.57,
            sellPressure: 0.43,
            absorption: true,
            exhaustion: false,
            stackedImbalances: 2
          },
          {
            price: p(21745.25),
            buyVolume: v(475000),
            sellVolume: v(625000),
            delta: v(-150000),
            buyPressure: 0.43,
            sellPressure: 0.57,
            absorption: false,
            exhaustion: true,
            stackedImbalances: 1
          }
        ],
        absorption: {
          detected: true,
          price: p(21800.25),
          strength: "moderate",
          type: "buy",
          volume: v(1200000),
          duration: 45
        },
        exhaustion: {
          detected: true,
          price: p(21745.25),
          type: "sell",
          volumeSpike: 2.8,
          reversalProbability: 0.73
        },
        deltaProfile: {
          cumulativeDelta: v(450000),
          deltaPerBar: [v(120000), v(80000), v(150000), v(95000), v(180000), v(125000)],
          deltaTrend: "increasing",
          divergence: false,
          volumeWeightedPrice: p(21803.00)
        },
        predictions: {
          nextLevel: p(21855.50),
          direction: "bullish",
          confidence: 0.78,
          reasoning: `Strong buying pressure on ${selectedMarket} at current levels with absorption detected. Delta trending up suggests continuation.`
        },
        realTime: {
          currentDelta: v(45000),
          buyVolume: v(275000),
          sellVolume: v(230000),
          timestamp: new Date().toISOString()
        }
      }
      
      setAnalysis(mockAnalysis)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[ORDER-FLOW] Error fetching analysis:", error)
    }
    setLoading(false)
  }, [p, v, selectedMarket])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchAnalysis(selectedTimeframe)
  }, [fetchAnalysis, selectedTimeframe, selectedMarket])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }
  const fmtDelta = (delta: number) => {
    const sign = delta > 0 ? "+" : ""
    return `${sign}${fmtVolume(delta)}`
  }

  // Get intensity color
  const getIntensityColor = (intensity: number, type: string) => {
    if (type === "buy") return `rgba(34, 197, 94, ${intensity / 100})`
    if (type === "sell") return `rgba(239, 68, 68, ${intensity / 100})`
    return `rgba(156, 163, 175, ${intensity / 100})`
  }

  // Get pressure color
  const getPressureColor = (pressure: number) => {
    if (pressure > 0.6) return "text-emerald-400"
    if (pressure < 0.4) return "text-red-400"
    return "text-yellow-400"
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Order Flow Analysis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* ── Header ── */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-black">Order Flow Analysis</span>
            {analysis && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                analysis.predictions.direction === "bullish" ? "bg-emerald-500/10 text-emerald-400" :
                analysis.predictions.direction === "bearish" ? "bg-red-500/10 text-red-400" :
                "bg-yellow-500/10 text-yellow-400"
              }`}>
                {analysis.predictions.direction.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Timeframe selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="text-[9px] bg-background/50 border border-border/20 rounded px-2 py-1 text-foreground/70"
            >
              {timeframes.map(tf => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
            <button
              onClick={() => fetchAnalysis(selectedTimeframe)}
              disabled={loading}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {lastUpdate && (
          <div className="text-[8px] text-muted-foreground/40 mb-3">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* ── Sections ── */}
      <div className="px-4 pb-4 space-y-3">
        {analysis && (
          <>
            {/* ── Real-Time Order Flow ── */}
            <div>
              <div 
                onClick={() => toggleSection('realtime-flow')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Real-Time Flow</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['realtime-flow'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['realtime-flow'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Delta</span>
                    <span className={`text-[9px] font-bold ${analysis.realTime.currentDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtDelta(analysis.realTime.currentDelta)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Buy Vol</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtVolume(analysis.realTime.buyVolume)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Sell Vol</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtVolume(analysis.realTime.sellVolume)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Price</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtPrice(analysis.heatmap.currentPrice)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Order Flow Heatmap ── */}
            <div>
              <div 
                onClick={() => toggleSection('heatmap')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Heatmap</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['heatmap'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['heatmap'] && (
                <div className="space-y-1">
                  {analysis.heatmap.levels.map((level, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getIntensityColor(level.intensity, level.type) }}
                      />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(level.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        level.type === "buy" ? "bg-emerald-500/10 text-emerald-400" :
                        level.type === "sell" ? "bg-red-500/10 text-red-400" :
                        "bg-gray-500/10 text-gray-400"
                      }`}>
                        {level.type}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtVolume(level.volume)}</span>
                      <span className={`text-[8px] font-bold ${level.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtDelta(level.delta)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Absorption & Exhaustion ── */}
            <div>
              <div 
                onClick={() => toggleSection('absorption-exhaustion')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Absorption & Exhaustion</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['absorption-exhaustion'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['absorption-exhaustion'] && (
                <div className="space-y-1">
                  {/* Absorption */}
                  <div className="flex items-center gap-2">
                    <Droplet className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Absorption</span>
                    {analysis.absorption.detected ? (
                      <>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                          analysis.absorption.type === "buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {analysis.absorption.type}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">{fmtPrice(analysis.absorption.price)}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                          analysis.absorption.strength === "strong" ? "bg-red-500/10 text-red-400" :
                          analysis.absorption.strength === "moderate" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {analysis.absorption.strength}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] text-muted-foreground/40">Not detected</span>
                    )}
                  </div>
                  {/* Exhaustion */}
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Exhaustion</span>
                    {analysis.exhaustion.detected ? (
                      <>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                          analysis.exhaustion.type === "buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {analysis.exhaustion.type}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">{fmtPrice(analysis.exhaustion.price)}</span>
                        <span className="text-[8px] text-orange-400">{(analysis.exhaustion.reversalProbability * 100).toFixed(0)}% rev</span>
                      </>
                    ) : (
                      <span className="text-[8px] text-muted-foreground/40">Not detected</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Delta Profile ── */}
            <div>
              <div 
                onClick={() => toggleSection('delta-profile')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Delta Profile</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['delta-profile'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['delta-profile'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Cumulative</span>
                    <span className={`text-[9px] font-bold ${analysis.deltaProfile.cumulativeDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtDelta(analysis.deltaProfile.cumulativeDelta)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Trend</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      analysis.deltaProfile.deltaTrend === "increasing" ? "bg-emerald-500/10 text-emerald-400" :
                      analysis.deltaProfile.deltaTrend === "decreasing" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {analysis.deltaProfile.deltaTrend}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VWAP</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtPrice(analysis.deltaProfile.volumeWeightedPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Divergence</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      analysis.deltaProfile.divergence ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {analysis.deltaProfile.divergence ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Key Levels ── */}
            <div>
              <div 
                onClick={() => toggleSection('key-levels')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Key Levels</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['key-levels'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['key-levels'] && (
                <div className="space-y-1">
                  {analysis.levels.map((level, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Target className={`h-3 w-3 shrink-0 ${getPressureColor(level.buyPressure)}`} />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(level.price)}</span>
                      <span className={`text-[8px] font-bold ${getPressureColor(level.buyPressure)}`}>
                        {fmtDelta(level.delta)}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtVolume(level.buyVolume + level.sellVolume)}</span>
                      {level.absorption && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">ABS</span>
                      )}
                      {level.exhaustion && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400">EXH</span>
                      )}
                      {level.stackedImbalances > 0 && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                          {level.stackedImbalances}x
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Predictions ── */}
            <div>
              <div 
                onClick={() => toggleSection('predictions')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Predictions</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['predictions'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['predictions'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className={`h-3 w-3 shrink-0 ${
                      analysis.predictions.direction === "bullish" ? "text-emerald-400" :
                      analysis.predictions.direction === "bearish" ? "text-red-400" :
                      "text-yellow-400"
                    }`} />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Next Level</span>
                    <span className={`text-[9px] font-bold ${
                      analysis.predictions.direction === "bullish" ? "text-emerald-400" :
                      analysis.predictions.direction === "bearish" ? "text-red-400" :
                      "text-yellow-400"
                    }`}>
                      {fmtPrice(analysis.predictions.nextLevel)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className="text-[9px] font-bold text-purple-400">
                      {(analysis.predictions.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {analysis.predictions.reasoning}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(OrderFlowAnalysis), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
