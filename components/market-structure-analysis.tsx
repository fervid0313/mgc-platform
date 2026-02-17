"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import { scaleFromNQ, scaleVolumeFromNQ, createPriceScaler } from "@/lib/market-data"
import { usePriceStore, priceSimulator } from "@/lib/price-store"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Zap,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Layers,
  Clock,
  GitBranch,
  Triangle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StructurePoint {
  price: number
  timestamp: string
  type: "high" | "low" | "break" | "reversal"
  strength: "weak" | "moderate" | "strong"
  significance: number // 0-100
}

interface TrendAnalysis {
  direction: "bullish" | "bearish" | "sideways"
  strength: number // 0-100
  duration: number // in bars
  angle: number // degrees
  momentum: "increasing" | "decreasing" | "stable"
}

interface StructureBreak {
  type: "break_of_structure" | "change_of_character" | "break_even"
  price: number
  timestamp: string
  direction: "bullish" | "bearish"
  confidence: number
  volume: number
  followThrough: boolean
}

interface MarketPhase {
  current: "accumulation" | "distribution" | "trending" | "reversal" | "consolidation"
  probability: number
  characteristics: string[]
  nextPhase: string
  nextPhaseProbability: number
}

interface MultiTimeframeAlignment {
  m5: { trend: string; alignment: boolean; bias: string }
  m15: { trend: string; alignment: boolean; bias: string }
  h1: { trend: string; alignment: boolean; bias: string }
  h4: { trend: string; alignment: boolean; bias: string }
  d1: { trend: string; alignment: boolean; bias: string }
  consensus: string
  alignmentScore: number
}

interface MarketStructureAnalysis {
  currentPrice: number
  trendAnalysis: TrendAnalysis
  structurePoints: StructurePoint[]
  structureBreaks: StructureBreak[]
  marketPhase: MarketPhase
  multiTimeframeAlignment: MultiTimeframeAlignment
  keyLevels: {
  support: Array<{ price: number; strength: number; tested: boolean }>
  resistance: Array<{ price: number; strength: number; tested: boolean }>
  }
  predictions: {
  nextMove: string
  target: number
  stopLoss: number
  confidence: number
  timeframe: string
  reasoning: string
  }
  quality: {
  dataQuality: number
  structureClarity: number
  signalStrength: number
  overallScore: number
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function MarketStructureAnalysis({ market = "NQ100" }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [analysis, setAnalysis] = useState<MarketStructureAnalysis | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Temporarily disabled to prevent usePriceStore crashes
  const currentPrice = 21805.50 // Fallback value
  const priceChange = 0
  const priceChangePercent = 0
  const priceScaler = createPriceScaler(market)

  const timeframes = ["15m", "1H", "4H", "1D"]
  const selectedMarket = market || "NQ100"
  const p = useCallback((nqPrice: number) => scaleFromNQ(nqPrice, selectedMarket), [selectedMarket])
  const v = useCallback((nqVol: number) => scaleVolumeFromNQ(nqVol, selectedMarket), [selectedMarket])

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch market structure analysis
  const fetchAnalysis = useCallback(async (timeframe: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real market structure APIs
      const mockAnalysis: MarketStructureAnalysis = {
        currentPrice: currentPrice || priceScaler.scalePrice(21805.50),
        trendAnalysis: {
          direction: priceChange > 0 ? "bullish" : priceChange < 0 ? "bearish" : "sideways",
          strength: 78,
          duration: 47,
          angle: priceChange > 0 ? 28.5 : priceChange < 0 ? -28.5 : 0,
          momentum: Math.abs(priceChange) > 10 ? "increasing" : "stable"
        },
        structurePoints: [
          { price: priceScaler.scalePrice(21910.50), timestamp: "2024-01-15T10:30:00Z", type: "high", strength: "strong", significance: 92 },
          { price: priceScaler.scalePrice(21650.25), timestamp: "2024-01-15T08:45:00Z", type: "low", strength: "strong", significance: 88 },
          { price: priceScaler.scalePrice(21832.50), timestamp: "2024-01-15T09:15:00Z", type: "break", strength: "moderate", significance: 75 },
          { price: priceScaler.scalePrice(21700.50), timestamp: "2024-01-15T11:00:00Z", type: "reversal", strength: "moderate", significance: 68 }
        ],
        structureBreaks: [
          {
            type: "break_of_structure",
            price: p(21832.50),
            timestamp: "2024-01-15T09:15:00Z",
            direction: "bullish",
            confidence: 0.85,
            volume: v(2500000),
            followThrough: true
          }
        ],
        marketPhase: {
          current: "trending",
          probability: 0.82,
          characteristics: ["Higher highs", "Higher lows", "Strong momentum", "Volume confirmation"],
          nextPhase: "consolidation",
          nextPhaseProbability: 0.35
        },
        multiTimeframeAlignment: {
          m5: { trend: "bullish", alignment: true, bias: "bullish" },
          m15: { trend: "bullish", alignment: true, bias: "bullish" },
          h1: { trend: "bullish", alignment: true, bias: "bullish" },
          h4: { trend: "bullish", alignment: true, bias: "bullish" },
          d1: { trend: "bullish", alignment: true, bias: "bullish" },
          consensus: "bullish",
          alignmentScore: 100
        },
        keyLevels: {
          support: [
            { price: p(21750.25), strength: 0.85, tested: false },
            { price: p(21700.50), strength: 0.72, tested: true },
            { price: p(21650.25), strength: 0.91, tested: false }
          ],
          resistance: [
            { price: p(21855.50), strength: 0.78, tested: false },
            { price: p(21910.50), strength: 0.92, tested: true },
            { price: p(21960.75), strength: 0.68, tested: false }
          ]
        },
        predictions: {
          nextMove: "bullish_continuation",
          target: p(21910.50),
          stopLoss: p(21750.25),
          confidence: 0.78,
          timeframe: "1H",
          reasoning: `Strong bullish structure on ${selectedMarket} with multi-timeframe alignment. Targeting previous high with stop below recent support.`
        },
        quality: {
          dataQuality: 94,
          structureClarity: 87,
          signalStrength: 78,
          overallScore: 86
        }
      }
      
      setAnalysis(mockAnalysis)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[MARKET-STRUCTURE] Error fetching analysis:", error)
    }
    setLoading(false)
  }, [p, v, selectedMarket])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchAnalysis(selectedTimeframe)
  }, [selectedTimeframe, selectedMarket])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtPercent = (value: number) => `${value.toFixed(1)}%`
  const fmtTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get trend color
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "bullish": return "text-emerald-400"
      case "bearish": return "text-red-400"
      case "sideways": return "text-yellow-400"
      default: return "text-muted-foreground/60"
    }
  }

  // Get strength color
  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "bg-emerald-500/10 text-emerald-400"
    if (strength >= 60) return "bg-yellow-500/10 text-yellow-400"
    return "bg-red-500/10 text-red-400"
  }

  // Get phase color
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "accumulation": return "text-blue-400"
      case "distribution": return "text-purple-400"
      case "trending": return "text-emerald-400"
      case "reversal": return "text-orange-400"
      case "consolidation": return "text-yellow-400"
      default: return "text-muted-foreground/60"
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Market Structure Analysis...</span>
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
            <GitBranch className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Market Structure Analysis</span>
            {currentPrice && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                priceChange > 0 ? "bg-emerald-500/10 text-emerald-400" :
                priceChange < 0 ? "bg-red-500/10 text-red-400" :
                "bg-gray-500/10 text-gray-400"
              }`}>
                {currentPrice ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "Loading..."}
                {priceChange !== null && (
                  <span className="ml-1">
                    {priceChange ? (priceChange >= 0 ? "+" : "") + priceChange.toFixed(2) : "0.00"}
                  </span>
                )}
              </span>
            )}
            {analysis && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.quality.overallScore)}`}>
                {fmtPercent(analysis.quality.overallScore)}
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
            {/* ── Trend Analysis ── */}
            <div>
              <div 
                onClick={() => toggleSection('trend-analysis')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Trend Analysis</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['trend-analysis'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['trend-analysis'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Direction</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      analysis.trendAnalysis.direction === "bullish" ? "bg-emerald-500/10 text-emerald-400" :
                      analysis.trendAnalysis.direction === "bearish" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {analysis.trendAnalysis.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Strength</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.trendAnalysis.strength)}`}>
                      {fmtPercent(analysis.trendAnalysis.strength)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Duration</span>
                    <span className="text-[9px] font-bold text-blue-400">{analysis.trendAnalysis.duration} bars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Triangle className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Angle</span>
                    <span className="text-[9px] font-bold text-orange-400">{analysis.trendAnalysis.angle.toFixed(1)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Momentum</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      analysis.trendAnalysis.momentum === "increasing" ? "bg-emerald-500/10 text-emerald-400" :
                      analysis.trendAnalysis.momentum === "decreasing" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {analysis.trendAnalysis.momentum}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Market Phase ── */}
            <div>
              <div 
                onClick={() => toggleSection('market-phase')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Market Phase</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['market-phase'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['market-phase'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Current</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getPhaseColor(analysis.marketPhase.current)}`}>
                      {analysis.marketPhase.current}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtPercent(analysis.marketPhase.probability)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Next</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getPhaseColor(analysis.marketPhase.nextPhase)}`}>
                      {analysis.marketPhase.nextPhase}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtPercent(analysis.marketPhase.nextPhaseProbability)}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {analysis.marketPhase.characteristics.slice(0, 2).join(" • ")}
                  </div>
                </div>
              )}
            </div>

            {/* ── Multi-Timeframe Alignment ── */}
            <div>
              <div 
                onClick={() => toggleSection('multi-timeframe')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Multi-Timeframe</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['multi-timeframe'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['multi-timeframe'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Consensus</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getTrendColor(analysis.multiTimeframeAlignment.consensus)}`}>
                      {analysis.multiTimeframeAlignment.consensus.toUpperCase()}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.multiTimeframeAlignment.alignmentScore)}`}>
                      {fmtPercent(analysis.multiTimeframeAlignment.alignmentScore)}
                    </span>
                  </div>
                  {Object.entries(analysis.multiTimeframeAlignment).filter(([key]) => key !== 'consensus' && key !== 'alignmentScore').map(([tf, data]: [string, any]) => (
                    <div key={tf} className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{tf.toUpperCase()}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(data.trend)}`}>
                        {data.trend.slice(0, 1).toUpperCase()}
                      </span>
                      {data.alignment && (
                        <span className="text-[8px] text-emerald-400">✓</span>
                      )}
                    </div>
                  ))}
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
                  {/* Support Levels */}
                  <div className="text-[8px] text-muted-foreground/50 mb-1">Support</div>
                  {analysis.keyLevels.support.map((level, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ArrowDown className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(level.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(level.strength * 100)}`}>
                        {fmtPercent(level.strength * 100)}
                      </span>
                      {level.tested && (
                        <span className="text-[8px] text-yellow-400">Tested</span>
                      )}
                    </div>
                  ))}
                  {/* Resistance Levels */}
                  <div className="text-[8px] text-muted-foreground/50 mb-1 mt-2">Resistance</div>
                  {analysis.keyLevels.resistance.map((level, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3 text-red-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(level.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(level.strength * 100)}`}>
                        {fmtPercent(level.strength * 100)}
                      </span>
                      {level.tested && (
                        <span className="text-[8px] text-yellow-400">Tested</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Structure Breaks ── */}
            <div>
              <div 
                onClick={() => toggleSection('structure-breaks')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Structure Breaks</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['structure-breaks'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['structure-breaks'] && (
                <div className="space-y-1">
                  {analysis.structureBreaks.map((breakData, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-20">{breakData.type.replace('_', ' ')}</span>
                      <span className="text-[9px] font-bold text-orange-400">{fmtPrice(breakData.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        breakData.direction === "bullish" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {breakData.direction}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtTime(breakData.timestamp)}</span>
                      {breakData.followThrough && (
                        <span className="text-[8px] text-emerald-400">FT</span>
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
                    <Target className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Move</span>
                    <span className="text-[9px] font-bold text-emerald-400">
                      {analysis.predictions.nextMove.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Target</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtPrice(analysis.predictions.target)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Stop</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(analysis.predictions.stopLoss)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.predictions.confidence * 100)}`}>
                      {fmtPercent(analysis.predictions.confidence * 100)}
                    </span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {analysis.predictions.reasoning}
                  </div>
                </div>
              )}
            </div>

            {/* ── Data Quality ── */}
            <div>
              <div 
                onClick={() => toggleSection('data-quality')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Data Quality</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['data-quality'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['data-quality'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Data</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.quality.dataQuality)}`}>
                      {fmtPercent(analysis.quality.dataQuality)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Clarity</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.quality.structureClarity)}`}>
                      {fmtPercent(analysis.quality.structureClarity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Signal</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.quality.signalStrength)}`}>
                      {fmtPercent(analysis.quality.signalStrength)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Overall</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.quality.overallScore)}`}>
                      {fmtPercent(analysis.quality.overallScore)}
                    </span>
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

export default dynamic(() => Promise.resolve(MarketStructureAnalysis), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
