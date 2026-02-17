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
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Scale,
  GitBranch,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiquidityData {
  price: number
  buySide: number
  sellSide: number
  imbalance: number
  depth: number
  spread: number
  timestamp: string
}

interface LiquidityVoid {
  price: number
  type: "buy" | "sell"
  size: number
  probability: number
  riskLevel: "low" | "medium" | "high" | "critical"
  expectedMove: number
  timeframe: string
}

interface StopHuntZone {
  price: number
  type: "buy_stops" | "sell_stops"
  density: number
  probability: number
  clusterSize: number
  estimatedValue: number
  riskReward: number
}

interface SmartMoneyActivity {
  timestamp: string
  type: "block_trade" | "iceberg" | "sweep" | "absorption"
  size: number
  price: number
  direction: "buy" | "sell"
  aggressiveness: number
  impact: number
  source: string
}

interface OrderBookImbalance {
  ratio: number // buy/sell ratio
  delta: number
  momentum: "increasing" | "decreasing" | "stable"
  pressure: "buy" | "sell" | "balanced"
  strength: number
  sustainability: number
}

interface MarketMicrostructure {
  currentPrice: number
  liquidity: LiquidityData
  liquidityVoids: LiquidityVoid[]
  stopHuntZones: StopHuntZone[]
  smartMoneyActivity: SmartMoneyActivity[]
  orderBookImbalance: OrderBookImbalance
  marketDepth: {
    bidLevels: Array<{ price: number; size: number; orders: number }>
    askLevels: Array<{ price: number; size: number; orders: number }>
    totalDepth: number
    avgSpread: number
  }
  analysis: {
    liquidityHealth: "excellent" | "good" | "fair" | "poor"
    volatility: "low" | "normal" | "elevated" | "extreme"
    efficiency: number
    manipulationRisk: number
    institutionalActivity: "high" | "medium" | "low"
  }
  recommendations: {
    direction: string
    confidence: number
    entryZone: number
    targetZone: number
    stopZone: number
    reasoning: string
    riskFactors: string[]
  }
  warnings: Array<{
    type: "liquidity_void" | "stop_hunt" | "manipulation" | "absorption"
    severity: "low" | "medium" | "high" | "critical"
    message: string
    price: number
    timeframe: string
  }>
}

// ─── Component ────────────────────────────────────────────────────────────────

function MarketMicrostructure({ market }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [microstructure, setMicrostructure] = useState<MarketMicrostructure | null>(null)
  const [selectedMarket, setSelectedMarket] = useState(market || "NQ100")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(true)

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

  // Fetch market microstructure data
  const fetchMicrostructure = useCallback(async (market: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real order book APIs
      const mockMicrostructure: MarketMicrostructure = {
        currentPrice: p(21805.50),
        liquidity: {
          price: p(21805.50),
          buySide: v(4500000),
          sellSide: v(3800000),
          imbalance: 0.18,
          depth: v(8300000),
          spread: 0.25,
          timestamp: new Date().toISOString()
        },
        liquidityVoids: [
          {
            price: p(21745.50),
            type: "sell",
            size: v(250000),
            probability: 0.78,
            riskLevel: "high",
            expectedMove: p(60.25),
            timeframe: "15m"
          },
          {
            price: p(21910.75),
            type: "buy",
            size: v(180000),
            probability: 0.65,
            riskLevel: "medium",
            expectedMove: p(45.50),
            timeframe: "30m"
          },
          {
            price: p(21620.00),
            type: "sell",
            size: v(420000),
            probability: 0.85,
            riskLevel: "critical",
            expectedMove: p(85.25),
            timeframe: "1H"
          }
        ],
        stopHuntZones: [
          {
            price: p(21720.25),
            type: "sell_stops",
            density: 0.72,
            probability: 0.68,
            clusterSize: v(125000),
            estimatedValue: v(1250000),
            riskReward: 2.8
          },
          {
            price: p(21935.50),
            type: "buy_stops",
            density: 0.65,
            probability: 0.58,
            clusterSize: v(95000),
            estimatedValue: v(950000),
            riskReward: 2.2
          }
        ],
        smartMoneyActivity: [
          {
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: "block_trade",
            size: v(500000),
            price: p(21803.50),
            direction: "buy",
            aggressiveness: 0.75,
            impact: 0.82,
            source: "institutional"
          },
          {
            timestamp: new Date(Date.now() - 600000).toISOString(),
            type: "iceberg",
            size: v(250000),
            price: p(21807.25),
            direction: "sell",
            aggressiveness: 0.35,
            impact: 0.45,
            source: "dark_pool"
          },
          {
            timestamp: new Date(Date.now() - 900000).toISOString(),
            type: "sweep",
            size: v(180000),
            price: p(21745.50),
            direction: "buy",
            aggressiveness: 0.92,
            impact: 0.68,
            source: "market_maker"
          }
        ],
        orderBookImbalance: {
          ratio: 1.18,
          delta: v(700000),
          momentum: "increasing",
          pressure: "buy",
          strength: 0.72,
          sustainability: 0.68
        },
        marketDepth: {
          bidLevels: [
            { price: p(21805.25), size: v(125000), orders: 450 },
            { price: p(21805.00), size: v(98000), orders: 380 },
            { price: p(21804.75), size: v(156000), orders: 520 },
            { price: p(21804.50), size: v(87000), orders: 310 },
            { price: p(21804.25), size: v(134000), orders: 490 }
          ],
          askLevels: [
            { price: p(21805.75), size: v(112000), orders: 410 },
            { price: p(21806.00), size: v(89000), orders: 360 },
            { price: p(21806.25), size: v(143000), orders: 540 },
            { price: p(21806.50), size: v(76000), orders: 280 },
            { price: p(21806.75), size: v(121000), orders: 440 }
          ],
          totalDepth: v(1241000),
          avgSpread: 0.25
        },
        analysis: {
          liquidityHealth: "good",
          volatility: "normal",
          efficiency: 0.78,
          manipulationRisk: 0.32,
          institutionalActivity: "high"
        },
        recommendations: {
          direction: "bullish_continuation",
          confidence: 0.75,
          entryZone: p(21810.25),
          targetZone: p(21910.75),
          stopZone: p(21745.50),
          reasoning: `Strong ${selectedMarket} buy-side imbalance with institutional buying pressure. Smart money activity supports bullish bias.`,
          riskFactors: [
            "Liquidity void below current price",
            "Stop hunt zone nearby",
            "Moderate manipulation risk"
          ]
        },
        warnings: [
          {
            type: "liquidity_void",
            severity: "high",
            message: `Significant liquidity void detected at ${p(21745.50)}`,
            price: p(21745.50),
            timeframe: "15m"
          },
          {
            type: "stop_hunt",
            severity: "medium",
            message: `Dense sell stop cluster at ${p(21720.25)}`,
            price: p(21720.25),
            timeframe: "30m"
          }
        ]
      }
      
      setMicrostructure(mockMicrostructure)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[MICROSTRUCTURE] Error fetching data:", error)
    }
    setLoading(false)
  }, [p, v, selectedMarket])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchMicrostructure(selectedMarket)
    
    // Auto-refresh every 15 seconds for real-time data
    const interval = setInterval(() => fetchMicrostructure(selectedMarket), 15000)
    return () => clearInterval(interval)
  }, [selectedMarket])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }
  const fmtPercent = (value: number) => `${(value * 100).toFixed(0)}%`
  const fmtTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500/10 text-red-400"
      case "high": return "bg-orange-500/10 text-orange-400"
      case "medium": return "bg-yellow-500/10 text-yellow-400"
      case "low": return "bg-blue-500/10 text-blue-400"
      default: return "bg-gray-500/10 text-gray-400"
    }
  }

  // Get pressure color
  const getPressureColor = (pressure: string) => {
    switch (pressure) {
      case "buy": return "text-emerald-400"
      case "sell": return "text-red-400"
      case "balanced": return "text-yellow-400"
      default: return "text-muted-foreground/60"
    }
  }

  // Get health color
  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent": return "text-emerald-400"
      case "good": return "text-blue-400"
      case "fair": return "text-yellow-400"
      case "poor": return "text-red-400"
      default: return "text-muted-foreground/60"
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Market Microstructure...</span>
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
            <Layers className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-black">Market Microstructure</span>
            {microstructure && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getHealthColor(microstructure.analysis.liquidityHealth)}`}>
                {microstructure.analysis.liquidityHealth}
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
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              onClick={() => fetchMicrostructure(selectedMarket)}
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
        {microstructure && (
          <>
            {/* ── Liquidity Analysis ── */}
            <div>
              <div 
                onClick={() => toggleSection('liquidity')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Liquidity Analysis</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['liquidity'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['liquidity'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Buy/Sell</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtVolume(microstructure.liquidity.buySide)}</span>
                    <span className="text-[9px] text-muted-foreground/40">vs</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtVolume(microstructure.liquidity.sellSide)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Imbalance</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      microstructure.liquidity.imbalance > 0.1 ? "bg-emerald-500/10 text-emerald-400" :
                      microstructure.liquidity.imbalance < -0.1 ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {fmtPercent(microstructure.liquidity.imbalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Depth</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtVolume(microstructure.liquidity.depth)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Spread</span>
                    <span className="text-[9px] font-bold text-green-400">{microstructure.liquidity.spread.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Order Book Imbalance ── */}
            <div>
              <div 
                onClick={() => toggleSection('orderbook')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Order Book Imbalance</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['orderbook'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['orderbook'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Ratio</span>
                    <span className={`text-[9px] font-bold ${getPressureColor(microstructure.orderBookImbalance.pressure)}`}>
                      {microstructure.orderBookImbalance.ratio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Delta</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtVolume(microstructure.orderBookImbalance.delta)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Pressure</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getPressureColor(microstructure.orderBookImbalance.pressure)}`}>
                      {microstructure.orderBookImbalance.pressure.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Strength</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtPercent(microstructure.orderBookImbalance.strength)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Liquidity Voids ── */}
            <div>
              <div 
                onClick={() => toggleSection('liquidity-voids')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Liquidity Voids</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['liquidity-voids'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['liquidity-voids'] && (
                <div className="space-y-1">
                  {microstructure.liquidityVoids.map((void_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(void_.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getRiskLevelColor(void_.riskLevel)}`}>
                        {void_.riskLevel}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{void_.type}</span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtVolume(void_.size)}</span>
                      <span className="text-[8px] text-blue-400">{fmtPercent(void_.probability)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Stop Hunt Zones ── */}
            <div>
              <div 
                onClick={() => toggleSection('stop-hunt-zones')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Stop Hunt Zones</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['stop-hunt-zones'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['stop-hunt-zones'] && (
                <div className="space-y-1">
                  {microstructure.stopHuntZones.map((zone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-orange-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(zone.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        zone.type === "buy_stops" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {zone.type.replace('_', ' ')}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtVolume(zone.clusterSize)}</span>
                      <span className="text-[8px] text-blue-400">{fmtPercent(zone.probability)}</span>
                      <span className="text-[8px] text-purple-400">{zone.riskReward.toFixed(1)}:1</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Smart Money Activity ── */}
            <div>
              <div 
                onClick={() => toggleSection('smart-money')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Smart Money Activity</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['smart-money'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['smart-money'] && (
                <div className="space-y-1">
                  {microstructure.smartMoneyActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-purple-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-20">{activity.type.replace('_', ' ')}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        activity.direction === "buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {activity.direction}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtVolume(activity.size)}</span>
                      <span className="text-[8px] text-blue-400">{fmtPrice(activity.price)}</span>
                      <span className="text-[8px] text-orange-400">{fmtTime(activity.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Market Analysis ── */}
            <div>
              <div 
                onClick={() => toggleSection('market-analysis')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Market Analysis</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['market-analysis'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['market-analysis'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Liquidity</span>
                    <span className={`text-[9px] font-bold ${getHealthColor(microstructure.analysis.liquidityHealth)}`}>
                      {microstructure.analysis.liquidityHealth}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Volatility</span>
                    <span className="text-[9px] font-bold text-orange-400">{microstructure.analysis.volatility}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Efficiency</span>
                    <span className="text-[9px] font-bold text-green-400">{fmtPercent(microstructure.analysis.efficiency)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Manip Risk</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPercent(microstructure.analysis.manipulationRisk)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Institutional</span>
                    <span className="text-[9px] font-bold text-purple-400">{microstructure.analysis.institutionalActivity}</span>
                  </div>
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
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Direction</span>
                    <span className="text-[9px] font-bold text-emerald-400">{microstructure.recommendations.direction.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtPercent(microstructure.recommendations.confidence)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Entry</span>
                    <span className="text-[9px] font-bold text-green-400">{fmtPrice(microstructure.recommendations.entryZone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Target</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPrice(microstructure.recommendations.targetZone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Stop</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(microstructure.recommendations.stopZone)}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {microstructure.recommendations.reasoning}
                  </div>
                </div>
              )}
            </div>

            {/* ── Warnings ── */}
            {microstructure.warnings.length > 0 && (
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
                    {microstructure.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className={`h-3 w-3 shrink-0 ${getRiskLevelColor(warning.severity).split(' ')[1]}`} />
                        <span className="text-[10px] font-bold text-foreground/60 w-16">{warning.type.replace('_', ' ')}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getRiskLevelColor(warning.severity)}`}>
                          {warning.severity}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">{fmtPrice(warning.price)}</span>
                        <span className="text-[8px] text-blue-400">{warning.timeframe}</span>
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

export default dynamic(() => Promise.resolve(MarketMicrostructure), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
