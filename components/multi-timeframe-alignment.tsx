"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import { scaleFromNQ, scaleVolumeFromNQ } from "@/lib/market-data"
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
  CheckCircle2,
  XCircle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeframeData {
  timeframe: string
  trend: "bullish" | "bearish" | "sideways"
  bias: "bullish" | "bearish" | "neutral"
  strength: number // 0-100
  momentum: "increasing" | "decreasing" | "stable"
  keyLevel: {
    price: number
    type: "support" | "resistance"
    strength: number
  }
  volume: {
    current: number
    average: number
    ratio: number
  }
  volatility: {
    current: number
    average: number
    regime: "low" | "normal" | "high"
  }
}

interface AlignmentScore {
  overall: number // 0-100
  bullish: number
  bearish: number
  sideways: number
  consensus: "bullish" | "bearish" | "neutral" | "conflicted"
  strength: "weak" | "moderate" | "strong" | "very_strong"
}

interface HigherTimeframeStructure {
  daily: {
    trend: string
    keyLevels: Array<{ price: number; type: string; strength: number }>
    structure: string
  }
  weekly: {
    trend: string
    keyLevels: Array<{ price: number; type: string; strength: number }>
    structure: string
  }
  monthly: {
    trend: string
    keyLevels: Array<{ price: number; type: string; strength: number }>
    structure: string
  }
}

interface ConfluenceZones {
  zones: Array<{
    price: number
    type: "support" | "resistance"
    timeframes: string[]
    strength: number
    probability: number
  }>
  strongestZone: {
    price: number
    type: string
    strength: number
  }
}

interface MultiTimeframeAlignment {
  currentPrice: number
  timeframes: TimeframeData[]
  alignmentScore: AlignmentScore
  higherTimeframeStructure: HigherTimeframeStructure
  confluenceZones: ConfluenceZones
  recommendations: {
    direction: string
    confidence: number
    entryZone: number
    targetZone: number
    stopZone: number
    reasoning: string
    riskReward: number
  }
  warnings: Array<{
    type: "divergence" | "conflict" | "exhaustion"
    severity: "low" | "medium" | "high"
    message: string
    timeframes: string[]
  }>
}

// ─── Component ────────────────────────────────────────────────────────────────

function MultiTimeframeAlignment({ market }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [analysis, setAnalysis] = useState<MultiTimeframeAlignment | null>(null)
  const [selectedMarket, setSelectedMarket] = useState(market || "NQ100")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => { if (market) setSelectedMarket(market) }, [market])

  const p = (nqPrice: number) => scaleFromNQ(nqPrice, selectedMarket)
  const v = (nqVol: number) => scaleVolumeFromNQ(nqVol, selectedMarket)

  const markets = ["NQ100", "ES", "BTC", "ETH", "US10Y"]

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch multi-timeframe alignment
  const fetchAnalysis = useCallback(async (market: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real multi-timeframe APIs
      const mockAnalysis: MultiTimeframeAlignment = {
        currentPrice: p(21805.50),
        timeframes: [
          {
            timeframe: "5m",
            trend: "bullish",
            bias: "bullish",
            strength: 72,
            momentum: "increasing",
            keyLevel: { price: p(21832.50), type: "resistance", strength: 0.78 },
            volume: { current: v(1500000), average: v(1200000), ratio: 1.25 },
            volatility: { current: 18.5, average: 16.2, regime: "normal" }
          },
          {
            timeframe: "15m",
            trend: "bullish",
            bias: "bullish",
            strength: 78,
            momentum: "increasing",
            keyLevel: { price: p(21745.50), type: "support", strength: 0.85 },
            volume: { current: v(2800000), average: v(2500000), ratio: 1.12 },
            volatility: { current: 17.8, average: 15.5, regime: "normal" }
          },
          {
            timeframe: "1H",
            trend: "bullish",
            bias: "bullish",
            strength: 85,
            momentum: "stable",
            keyLevel: { price: p(21910.75), type: "resistance", strength: 0.92 },
            volume: { current: v(8500000), average: v(7800000), ratio: 1.09 },
            volatility: { current: 16.2, average: 14.8, regime: "normal" }
          },
          {
            timeframe: "4H",
            trend: "bullish",
            bias: "bullish",
            strength: 88,
            momentum: "increasing",
            keyLevel: { price: p(21650.25), type: "support", strength: 0.91 },
            volume: { current: v(22000000), average: v(19500000), ratio: 1.13 },
            volatility: { current: 15.5, average: 13.2, regime: "normal" }
          },
          {
            timeframe: "1D",
            trend: "bullish",
            bias: "bullish",
            strength: 92,
            momentum: "increasing",
            keyLevel: { price: p(22135.50), type: "resistance", strength: 0.95 },
            volume: { current: v(85000000), average: v(78000000), ratio: 1.09 },
            volatility: { current: 14.2, average: 12.8, regime: "low" }
          }
        ],
        alignmentScore: {
          overall: 95,
          bullish: 95,
          bearish: 0,
          sideways: 5,
          consensus: "bullish",
          strength: "very_strong"
        },
        higherTimeframeStructure: {
          daily: {
            trend: "bullish",
            keyLevels: [
              { price: p(22135.50), type: "resistance", strength: 0.95 },
              { price: p(21650.25), type: "support", strength: 0.91 }
            ],
            structure: "higher_highs_higher_lows"
          },
          weekly: {
            trend: "bullish",
            keyLevels: [
              { price: p(22485.00), type: "resistance", strength: 0.88 },
              { price: p(21225.00), type: "support", strength: 0.85 }
            ],
            structure: "uptrend_continuation"
          },
          monthly: {
            trend: "bullish",
            keyLevels: [
              { price: p(23235.00), type: "resistance", strength: 0.82 },
              { price: p(20475.00), type: "support", strength: 0.78 }
            ],
            structure: "major_uptrend"
          }
        },
        confluenceZones: {
          zones: [
            {
              price: p(21910.75),
              type: "resistance",
              timeframes: ["1H", "4H", "1D"],
              strength: 0.92,
              probability: 0.88
            },
            {
              price: p(21745.50),
              type: "support",
              timeframes: ["15m", "1H"],
              strength: 0.85,
              probability: 0.82
            },
            {
              price: p(21650.25),
              type: "support",
              timeframes: ["4H", "1D"],
              strength: 0.91,
              probability: 0.85
            }
          ],
          strongestZone: {
            price: p(21910.75),
            type: "resistance",
            strength: 0.92
          }
        },
        recommendations: {
          direction: "bullish_continuation",
          confidence: 0.92,
          entryZone: p(21832.50),
          targetZone: p(21910.75),
          stopZone: p(21745.50),
          reasoning: `Exceptional ${selectedMarket} multi-timeframe alignment with 95% bullish consensus. All timeframes from 5m to Daily show bullish bias with increasing momentum. Strong confluence at resistance zone.`,
          riskReward: 2.1
        },
        warnings: []
      }
      
      setAnalysis(mockAnalysis)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[MULTI-TIMEFRAME] Error fetching analysis:", error)
    }
    setLoading(false)
  }, [p, v, selectedMarket])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchAnalysis(selectedMarket)
  }, [selectedMarket])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtPercent = (value: number) => `${value.toFixed(1)}%`
  const fmtVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
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
    if (strength >= 90) return "bg-emerald-500/10 text-emerald-400"
    if (strength >= 75) return "bg-blue-500/10 text-blue-400"
    if (strength >= 60) return "bg-yellow-500/10 text-yellow-400"
    return "bg-red-500/10 text-red-400"
  }

  // Get consensus strength color
  const getConsensusStrengthColor = (strength: string) => {
    switch (strength) {
      case "very_strong": return "bg-emerald-500/10 text-emerald-400"
      case "strong": return "bg-blue-500/10 text-blue-400"
      case "moderate": return "bg-yellow-500/10 text-yellow-400"
      case "weak": return "bg-red-500/10 text-red-400"
      default: return "bg-gray-500/10 text-gray-400"
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Multi-Timeframe Alignment...</span>
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
            <Layers className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Multi-Timeframe Alignment</span>
            {analysis && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getConsensusStrengthColor(analysis.alignmentScore.strength)}`}>
                {analysis.alignmentScore.strength.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Market selector */}
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="text-[9px] bg-background/50 border border-border/20 rounded px-2 py-1 text-foreground/70"
            >
              {markets.map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
            <button
              onClick={() => fetchAnalysis(selectedMarket)}
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
            {/* ── Alignment Score ── */}
            <div>
              <div 
                onClick={() => toggleSection('alignment-score')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Alignment Score</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['alignment-score'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['alignment-score'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Overall</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.alignmentScore.overall)}`}>
                      {fmtPercent(analysis.alignmentScore.overall)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Bullish</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPercent(analysis.alignmentScore.bullish)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Bearish</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPercent(analysis.alignmentScore.bearish)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-yellow-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Sideways</span>
                    <span className="text-[9px] font-bold text-yellow-400">{fmtPercent(analysis.alignmentScore.sideways)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Consensus</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getTrendColor(analysis.alignmentScore.consensus)}`}>
                      {analysis.alignmentScore.consensus.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Timeframe Analysis ── */}
            <div>
              <div 
                onClick={() => toggleSection('timeframe-analysis')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Timeframe Analysis</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['timeframe-analysis'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['timeframe-analysis'] && (
                <div className="space-y-1">
                  {analysis.timeframes.map((tf, index) => (
                    <div key={index} className="border border-border/20 rounded-lg p-2 bg-background/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-foreground/80">{tf.timeframe}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(tf.trend)}`}>
                            {tf.trend.slice(0, 1).toUpperCase()}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(tf.strength)}`}>
                            {fmtPercent(tf.strength)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[8px]">
                        <div className="flex items-center gap-1">
                          <Target className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                          <span className="text-muted-foreground/50">Key:</span>
                          <span className={`font-medium ${
                            tf.keyLevel.type === "support" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {fmtPrice(tf.keyLevel.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                          <span className="text-muted-foreground/50">Vol:</span>
                          <span className="font-medium text-purple-400">{tf.volume.ratio.toFixed(2)}x</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5 text-orange-400 shrink-0" />
                          <span className="text-muted-foreground/50">Mom:</span>
                          <span className="font-medium text-orange-400">{tf.momentum.slice(0, 1).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-2.5 w-2.5 text-yellow-400 shrink-0" />
                          <span className="text-muted-foreground/50">Volat:</span>
                          <span className="font-medium text-yellow-400">{tf.volatility.regime.slice(0, 1).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Higher Timeframe Structure ── */}
            <div>
              <div 
                onClick={() => toggleSection('higher-timeframe')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Higher Timeframe Structure</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['higher-timeframe'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['higher-timeframe'] && (
                <div className="space-y-1">
                  {Object.entries(analysis.higherTimeframeStructure).map(([timeframe, data]: [string, any]) => (
                    <div key={timeframe} className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-12 capitalize">{timeframe}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(data.trend)}`}>
                        {data.trend.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{data.structure.replace('_', ' ')}</span>
                      <div className="flex items-center gap-1">
                        {data.keyLevels.slice(0, 2).map((level: any, i: number) => (
                          <span key={i} className={`text-[8px] ${
                            level.type === "support" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {fmtPrice(level.price)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Confluence Zones ── */}
            <div>
              <div 
                onClick={() => toggleSection('confluence-zones')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Confluence Zones</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['confluence-zones'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['confluence-zones'] && (
                <div className="space-y-1">
                  {analysis.confluenceZones.zones.map((zone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Target className={`h-3 w-3 shrink-0 ${
                        zone.type === "support" ? "text-emerald-400" : "text-red-400"
                      }`} />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(zone.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        zone.type === "support" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {zone.type}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(zone.strength * 100)}`}>
                        {fmtPercent(zone.strength * 100)}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{zone.timeframes.join('+')}</span>
                      {zone.price === analysis.confluenceZones.strongestZone.price && (
                        <span className="text-[8px] text-purple-400">STRONGEST</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Recommendations ── */}
            <div>
              <div 
                onClick={() => toggleSection('recommendations')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Recommendations</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['recommendations'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['recommendations'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Direction</span>
                    <span className="text-[9px] font-bold text-purple-400">
                      {analysis.recommendations.direction.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getStrengthColor(analysis.recommendations.confidence * 100)}`}>
                      {fmtPercent(analysis.recommendations.confidence * 100)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Entry</span>
                    <span className="text-[9px] font-bold text-green-400">{fmtPrice(analysis.recommendations.entryZone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Target</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPrice(analysis.recommendations.targetZone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Stop</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(analysis.recommendations.stopZone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">R:R</span>
                    <span className="text-[9px] font-bold text-orange-400">{analysis.recommendations.riskReward.toFixed(2)}:1</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {analysis.recommendations.reasoning}
                  </div>
                </div>
              )}
            </div>

            {/* ── Warnings ── */}
            {analysis.warnings.length > 0 && (
              <div>
                <div 
                  onClick={() => toggleSection('warnings')}
                  className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
                >
                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Warnings</p>
                  <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['warnings'] ? 'rotate-180' : ''}`} />
                </div>
                {!collapsedSections['warnings'] && (
                  <div className="space-y-1">
                    {analysis.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className={`h-3 w-3 shrink-0 ${
                          warning.severity === "high" ? "text-red-400" :
                          warning.severity === "medium" ? "text-yellow-400" :
                          "text-blue-400"
                        }`} />
                        <span className="text-[10px] font-bold text-foreground/60 w-16">{warning.type}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                          warning.severity === "high" ? "bg-red-500/10 text-red-400" :
                          warning.severity === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {warning.severity}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">{warning.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(MultiTimeframeAlignment), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
