"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import {
  BarChart3,
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
  Minus,
  Thermometer,
  BarChart,
  Layers,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface VolumeLevel {
  price: number
  volume: number
  percentage: number
  type: "poc" | "vah" | "val" | "nvh" | "nvl" | "normal"
  distanceFromCurrent: number
  strength: "high" | "medium" | "low"
}

interface ValueArea {
  poc: number // Point of Control
  vah: number // Value Area High
  val: number // Value Area Low
  vwap: number // Volume Weighted Average Price
  valueAreaVolume: number
  totalVolume: number
  valueAreaPercentage: number
}

interface NakedLevels {
  nvh: number // Naked Volume High
  nvl: number // Naked Volume Low
  nvhStrength: number
  nvlStrength: number
  nvhProbability: number
  nvlProbability: number
}

interface VolumeProfileData {
  currentPrice: number
  valueArea: ValueArea
  nakedLevels: NakedLevels
  levels: VolumeLevel[]
  distribution: {
    buying: number // percentage
    selling: number // percentage
    neutral: number // percentage
  }
  imbalance: {
    detected: boolean
    price: number
    strength: "weak" | "moderate" | "strong"
    type: "buy" | "sell"
  }
  predictions: {
    nextSupport: number
    nextResistance: number
    target: number
    confidence: number
    reasoning: string
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function VolumeProfileAnalysis() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [analysis, setAnalysis] = useState<VolumeProfileData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const timeframes = ["15m", "1H", "4H", "1D", "1W"]

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch volume profile analysis
  const fetchAnalysis = useCallback(async (timeframe: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real volume profile APIs
      const mockAnalysis: VolumeProfileData = {
        currentPrice: 15830.75,
        valueArea: {
          poc: 15825.50,
          vah: 15875.25,
          val: 15750.75,
          vwap: 15828.35,
          valueAreaVolume: 8500000,
          totalVolume: 12000000,
          valueAreaPercentage: 70.8
        },
        nakedLevels: {
          nvh: 15950.00,
          nvl: 15700.25,
          nvhStrength: 0.85,
          nvlStrength: 0.72,
          nvhProbability: 0.78,
          nvlProbability: 0.65
        },
        levels: [
          { price: 15825.50, volume: 1500000, percentage: 12.5, type: "poc", distanceFromCurrent: -5.25, strength: "high" },
          { price: 15875.25, volume: 1200000, percentage: 10.0, type: "vah", distanceFromCurrent: 44.5, strength: "high" },
          { price: 15750.75, volume: 1100000, percentage: 9.2, type: "val", distanceFromCurrent: -80.0, strength: "high" },
          { price: 15950.00, volume: 900000, percentage: 7.5, type: "nvh", distanceFromCurrent: 119.25, strength: "medium" },
          { price: 15700.25, volume: 850000, percentage: 7.1, type: "nvl", distanceFromCurrent: -130.5, strength: "medium" },
          { price: 15850.25, volume: 750000, percentage: 6.3, type: "normal", distanceFromCurrent: 19.5, strength: "medium" },
          { price: 15800.75, volume: 680000, percentage: 5.7, type: "normal", distanceFromCurrent: -30.0, strength: "low" }
        ],
        distribution: {
          buying: 58.5,
          selling: 31.2,
          neutral: 10.3
        },
        imbalance: {
          detected: true,
          price: 15850.25,
          strength: "moderate",
          type: "buy"
        },
        predictions: {
          nextSupport: 15750.75,
          nextResistance: 15875.25,
          target: 15950.00,
          confidence: 0.82,
          reasoning: "Price above POC with strong buying volume. Targeting NVH if current resistance breaks."
        }
      }
      
      setAnalysis(mockAnalysis)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[VOLUME-PROFILE] Error fetching analysis:", error)
    }
    setLoading(false)
  }, [])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchAnalysis(selectedTimeframe)
  }, [fetchAnalysis, selectedTimeframe])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }
  const fmtDistance = (distance: number) => {
    const sign = distance > 0 ? "+" : ""
    return `${sign}${distance.toFixed(2)}`
  }

  // Get level type color
  const getLevelTypeColor = (type: string) => {
    switch (type) {
      case "poc": return "text-purple-400"
      case "vah": return "text-emerald-400"
      case "val": return "text-red-400"
      case "nvh": return "text-orange-400"
      case "nvl": return "text-blue-400"
      default: return "text-muted-foreground/60"
    }
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

  // Get distribution color
  const getDistributionColor = (percentage: number) => {
    if (percentage > 60) return "text-emerald-400"
    if (percentage < 40) return "text-red-400"
    return "text-yellow-400"
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Volume Profile Analysis...</span>
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
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-black">Volume Profile Analysis</span>
            {analysis && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                POC: {fmtPrice(analysis.valueArea.poc)}
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
            {/* ── Value Area ── */}
            <div>
              <div 
                onClick={() => toggleSection('value-area')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Value Area</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['value-area'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['value-area'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">POC</span>
                    <span className="text-[9px] font-bold text-purple-400">{fmtPrice(analysis.valueArea.poc)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtDistance(analysis.currentPrice - analysis.valueArea.poc)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VAH</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPrice(analysis.valueArea.vah)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtDistance(analysis.currentPrice - analysis.valueArea.vah)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VAL</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(analysis.valueArea.val)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtDistance(analysis.currentPrice - analysis.valueArea.val)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VWAP</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtPrice(analysis.valueArea.vwap)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtDistance(analysis.currentPrice - analysis.valueArea.vwap)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">VA %</span>
                    <span className="text-[9px] font-bold text-orange-400">{analysis.valueArea.valueAreaPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Naked Levels ── */}
            <div>
              <div 
                onClick={() => toggleSection('naked-levels')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Naked Levels</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['naked-levels'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['naked-levels'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">NVH</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtPrice(analysis.nakedLevels.nvh)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtDistance(analysis.currentPrice - analysis.nakedLevels.nvh)}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                      {(analysis.nakedLevels.nvhProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">NVL</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtPrice(analysis.nakedLevels.nvl)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtDistance(analysis.currentPrice - analysis.nakedLevels.nvl)}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {(analysis.nakedLevels.nvlProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Volume Distribution ── */}
            <div>
              <div 
                onClick={() => toggleSection('volume-distribution')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Volume Distribution</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['volume-distribution'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['volume-distribution'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Buying</span>
                    <span className={`text-[9px] font-bold ${getDistributionColor(analysis.distribution.buying)}`}>
                      {analysis.distribution.buying.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Selling</span>
                    <span className={`text-[9px] font-bold ${getDistributionColor(analysis.distribution.selling)}`}>
                      {analysis.distribution.selling.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="h-3 w-3 text-yellow-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Neutral</span>
                    <span className="text-[9px] font-bold text-yellow-400">
                      {analysis.distribution.neutral.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Volume Levels ── */}
            <div>
              <div 
                onClick={() => toggleSection('volume-levels')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Volume Levels</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['volume-levels'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['volume-levels'] && (
                <div className="space-y-1">
                  {analysis.levels.map((level, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <BarChart3 className={`h-3 w-3 shrink-0 ${getLevelTypeColor(level.type)}`} />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(level.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getLevelTypeColor(level.type)}`}>
                        {level.type.toUpperCase()}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtVolume(level.volume)}</span>
                      <span className="text-[8px] text-muted-foreground/40">{level.percentage.toFixed(1)}%</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getStrengthColor(level.strength)}`}>
                        {level.strength}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Imbalance Detection ── */}
            <div>
              <div 
                onClick={() => toggleSection('imbalance')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Imbalance Detection</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['imbalance'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['imbalance'] && (
                <div className="space-y-1">
                  {analysis.imbalance.detected ? (
                    <>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
                        <span className="text-[10px] font-bold text-foreground/60 w-16">Imbalance</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                          analysis.imbalance.type === "buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {analysis.imbalance.type}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">{fmtPrice(analysis.imbalance.price)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                        <span className="text-[10px] font-bold text-foreground/60 w-16">Strength</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                          analysis.imbalance.strength === "strong" ? "bg-red-500/10 text-red-400" :
                          analysis.imbalance.strength === "moderate" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {analysis.imbalance.strength}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[9px] text-muted-foreground/40">No imbalance detected</div>
                  )}
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
                    <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Support</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(analysis.predictions.nextSupport)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Resistance</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPrice(analysis.predictions.nextResistance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Target</span>
                    <span className="text-[9px] font-bold text-purple-400">{fmtPrice(analysis.predictions.target)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className="text-[9px] font-bold text-blue-400">
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

export default dynamic(() => Promise.resolve(VolumeProfileAnalysis), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
