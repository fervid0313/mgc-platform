"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import { scaleFromNQ, scaleVolumeFromNQ, getCurrentPrice, createPriceScaler } from "@/lib/market-data"
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
  ChevronUp,
  Minus,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Clock,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ICTLevel {
  type: "BOS" | "CHOCH" | "FVG" | "Liquidity" | "OrderBlock"
  price: number
  timeframe: string
  strength: "high" | "medium" | "low"
  bias: "bullish" | "bearish" | "neutral"
  session: string
  probability: number
}

interface VolumeProfileData {
  poc: number // Point of Control
  vah: number // Value Area High
  val: number // Value Area Low
  nvh: number // Naked Volume High
  nvl: number // Naked Volume Low
  volumeProfile: Array<{
    price: number
    volume: number
    percentage: number
  }>
}

interface OrderFlowData {
  delta: number // Buy volume - Sell volume
  buyVolume: number
  sellVolume: number
  absorption: boolean
  exhaustion: boolean
  aggressiveBuyers: number
  aggressiveSellers: number
  levels: Array<{
    price: number
    buyPressure: number
    sellPressure: number
    delta: number
  }>
}

interface MarketStructure {
  trend: "bullish" | "bearish" | "sideways"
  higherHighs: boolean
  higherLows: boolean
  lowerHighs: boolean
  lowerLows: boolean
  structureBreak: boolean
  currentPhase: "accumulation" | "distribution" | "trending" | "reversal"
}

interface SMTICTAnalysis {
  marketStructure: MarketStructure
  ictLevels: ICTLevel[]
  volumeProfile: VolumeProfileData
  orderFlow: OrderFlowData
  predictions: {
    nextTarget: number
    stopLevel: number
    confidence: number
    timeframe: string
    reasoning: string
  }
  sessions: {
    asian: { high: number; low: number; bias: string }
    london: { high: number; low: number; bias: string }
    ny: { high: number; low: number; bias: string }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function SMTICTAnalysis({ market = "NQ100" }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [analysis, setAnalysis] = useState<SMTICTAnalysis | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("15m")
  
  // Temporarily disabled to prevent usePriceStore crashes
  const currentPrice = 21805.50 // Fallback value
  const priceChange: number = 0
  const priceChangePercent = 0
  const priceScaler = createPriceScaler(market)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const timeframes = ["5m", "15m", "1H", "4H", "1D"]

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  const selectedMarket = market || "NQ100"
  const p = useCallback((nqPrice: number) => scaleFromNQ(nqPrice, selectedMarket), [selectedMarket])
  const v = useCallback((nqVol: number) => scaleVolumeFromNQ(nqVol, selectedMarket), [selectedMarket])

  // Fetch SMT/ICT analysis
  const fetchAnalysis = useCallback(async (timeframe: string) => {
    setLoading(true)
    try {
      const mockAnalysis: SMTICTAnalysis = {
        marketStructure: {
          trend: priceChange > 0 ? "bullish" : priceChange < 0 ? "bearish" : "sideways",
          higherHighs: priceChange > 0,
          higherLows: priceChange > 0,
          lowerHighs: priceChange < 0,
          lowerLows: priceChange < 0,
          structureBreak: false,
          currentPhase: "trending"
        },
        ictLevels: [
          {
            type: "BOS",
            price: priceScaler.scalePrice(21832.50),
            timeframe: "1H",
            strength: "high",
            bias: "bullish",
            session: "London",
            probability: 0.85
          },
          {
            type: "FVG",
            price: priceScaler.scalePrice(21745.50),
            timeframe: "15m",
            strength: "medium",
            bias: "bullish",
            session: "NY",
            probability: 0.72
          },
          {
            type: "Liquidity",
            price: p(21910.75),
            timeframe: "4H",
            strength: "high",
            bias: "bearish",
            session: "Asian",
            probability: 0.91
          }
        ],
        volumeProfile: {
          poc: p(21800.25),
          vah: p(21855.50),
          val: p(21725.75),
          nvh: p(21935.00),
          nvl: p(21670.25),
          volumeProfile: [
            { price: p(21800.25), volume: v(1500000), percentage: 15.5 },
            { price: p(21832.50), volume: v(1200000), percentage: 12.4 },
            { price: p(21775.00), volume: v(1100000), percentage: 11.4 }
          ]
        },
        orderFlow: {
          delta: v(250000),
          buyVolume: v(1500000),
          sellVolume: v(1250000),
          absorption: false,
          exhaustion: false,
          aggressiveBuyers: v(750000),
          aggressiveSellers: v(500000),
          levels: [
            { price: p(21832.50), buyPressure: 0.65, sellPressure: 0.35, delta: v(150000) },
            { price: p(21800.25), buyPressure: 0.58, sellPressure: 0.42, delta: v(100000) }
          ]
        },
        predictions: {
          nextTarget: p(21910.75),
          stopLevel: p(21745.50),
          confidence: 0.78,
          timeframe: "1H",
          reasoning: `Strong bullish structure on ${selectedMarket} with BOS confirmation and positive delta. Targeting previous liquidity level.`
        },
        sessions: {
          asian: { high: p(21725.25), low: p(21650.50), bias: "neutral" },
          london: { high: p(21860.75), low: p(21700.50), bias: "bullish" },
          ny: { high: p(21910.50), low: p(21775.25), bias: "bullish" }
        }
      }
      
      setAnalysis(mockAnalysis)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[SMT-ICT] Error fetching analysis:", error)
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
  const fmtPercent = (value: number) => `${(value * 100).toFixed(1)}%`
  const fmtVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }

  // Get level color
  const getLevelColor = (level: ICTLevel) => {
    if (level.bias === "bullish") return "text-emerald-400"
    if (level.bias === "bearish") return "text-red-400"
    return "text-yellow-400"
  }

  // Get strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "high": return "bg-red-500/10 text-red-400"
      case "medium": return "bg-yellow-500/10 text-yellow-400"
      case "low": return "bg-blue-500/10 text-blue-400"
      default: return "bg-gray-500/10 text-gray-400"
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading SMT/ICT Analysis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* ── Header ── */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-foreground">SMT/ICT Analysis</span>
            {currentPrice && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                priceChange > 0 ? "bg-emerald-500/10 text-emerald-400" :
                priceChange < 0 ? "bg-red-500/10 text-red-400" :
                "bg-gray-500/10 text-gray-400"
              }`}>
                {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {typeof priceChange === 'number' && priceChange !== 0 && (
                  <span className="ml-1">
                    {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}
                  </span>
                )}
              </span>
            )}
            {analysis && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                analysis.marketStructure.trend === "bullish" ? "bg-emerald-500/10 text-emerald-400" :
                analysis.marketStructure.trend === "bearish" ? "bg-red-500/10 text-red-400" :
                "bg-yellow-500/10 text-yellow-400"
              }`}>
                {analysis.marketStructure.trend.toUpperCase()}
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
            {/* ── Market Structure ── */}
            <div>
              <div 
                onClick={() => toggleSection('market-structure')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Market Structure</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['market-structure'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['market-structure'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Trend</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      analysis.marketStructure.trend === "bullish" ? "bg-emerald-500/10 text-emerald-400" :
                      analysis.marketStructure.trend === "bearish" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {analysis.marketStructure.trend.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Phase</span>
                    <span className="text-[9px] font-bold text-blue-400">{analysis.marketStructure.currentPhase}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] text-muted-foreground/50">
                    <div>HH: {analysis.marketStructure.higherHighs ? "✓" : "✗"}</div>
                    <div>HL: {analysis.marketStructure.higherLows ? "✓" : "✗"}</div>
                    <div>LH: {analysis.marketStructure.lowerHighs ? "✓" : "✗"}</div>
                    <div>LL: {analysis.marketStructure.lowerLows ? "✓" : "✗"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── ICT Levels ── */}
            <div>
              <div 
                onClick={() => toggleSection('ict-levels')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">ICT Levels</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['ict-levels'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['ict-levels'] && (
                <div className="space-y-1">
                  {analysis.ictLevels.map((level, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Target className={`h-3 w-3 shrink-0 ${getLevelColor(level)}`} />
                      <span className="text-[10px] font-bold text-foreground/60 w-12">{level.type}</span>
                      <span className={`text-[9px] font-bold ${getLevelColor(level)}`}>{fmtPrice(level.price)}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-background/50 text-muted-foreground/50">{level.timeframe}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(level.strength)}`}>{level.strength}</span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtPercent(level.probability)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Volume Profile ── */}
            <div>
              <div 
                onClick={() => toggleSection('volume-profile')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Volume Profile</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['volume-profile'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['volume-profile'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">POC</span>
                    <span className="text-[9px] font-bold text-purple-400">{fmtPrice(analysis.volumeProfile.poc)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VAH</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPrice(analysis.volumeProfile.vah)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VAL</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(analysis.volumeProfile.val)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">NVH</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtPrice(analysis.volumeProfile.nvh)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">NVL</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtPrice(analysis.volumeProfile.nvl)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Order Flow ── */}
            <div>
              <div 
                onClick={() => toggleSection('order-flow')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Order Flow</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['order-flow'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['order-flow'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Delta</span>
                    <span className={`text-[9px] font-bold ${analysis.orderFlow.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {analysis.orderFlow.delta > 0 ? "+" : ""}{fmtVolume(analysis.orderFlow.delta)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Buy Vol</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtVolume(analysis.orderFlow.buyVolume)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Sell Vol</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtVolume(analysis.orderFlow.sellVolume)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] text-muted-foreground/50">
                    <div>Absorption: {analysis.orderFlow.absorption ? "✓" : "✗"}</div>
                    <div>Exhaustion: {analysis.orderFlow.exhaustion ? "✓" : "✗"}</div>
                  </div>
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
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Target</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPrice(analysis.predictions.nextTarget)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Stop</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(analysis.predictions.stopLevel)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Conf</span>
                    <span className="text-[9px] font-bold text-purple-400">{fmtPercent(analysis.predictions.confidence)}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {analysis.predictions.reasoning}
                  </div>
                </div>
              )}
            </div>

            {/* ── Session Analysis ── */}
            <div>
              <div 
                onClick={() => toggleSection('sessions')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Session Analysis</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['sessions'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['sessions'] && (
                <div className="space-y-1">
                  {Object.entries(analysis.sessions).map(([session, data]) => (
                    <div key={session} className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-12 capitalize">{session}</span>
                      <span className="text-[8px] text-emerald-400">{fmtPrice(data.high)}</span>
                      <span className="text-[8px] text-red-400">{fmtPrice(data.low)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        data.bias === "bullish" ? "bg-emerald-500/10 text-emerald-400" :
                        data.bias === "bearish" ? "bg-red-500/10 text-red-400" :
                        "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {data.bias}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(SMTICTAnalysis), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
