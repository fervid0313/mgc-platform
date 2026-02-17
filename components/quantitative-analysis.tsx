"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Zap,
  Target,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  DollarSign,
  Percent,
} from "lucide-react"

interface ArbitrageOpportunity {
  id: string
  type: "triangular" | "statistical" | "cross_market"
  markets: string[]
  entryPrice: number
  exitPrice: number
  profit: number
  profitPercent: number
  confidence: number
  timeframe: string
  risk: number
  status: "active" | "expired" | "executed"
}

interface VolatilitySurface {
  strike: number
  impliedVol: number
  callPrice: number
  putPrice: number
  skew: number
  kurtosis: number
  timestamp: string
}

interface OptionsFlow {
  id: string
  symbol: string
  type: "unusual_volume" | "large_block" | "sweep" | "split"
  strike: number
  expiry: string
  volume: number
  premium: number
  sentiment: "bullish" | "bearish" | "neutral"
  confidence: number
  timestamp: string
}

interface DarkPoolTrade {
  id: string
  symbol: string
  size: number
  price: number
  time: string
  venue: string
  side: "buy" | "sell"
  significance: "high" | "medium" | "low"
  impact: number
}

interface QuantMetrics {
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  calmarRatio: number
  winRate: number
  avgTrade: number
  totalReturn: number
  volatility: number
  beta: number
  alpha: number
  informationRatio: number
}

const MARKETS = ["NQ100", "ES", "Gold", "Silver", "BTC", "Oil", "DXY", "VIX", "US10Y"]

export function QuantitativeAnalysis() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("arbitrage")
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [volatilitySurface, setVolatilitySurface] = useState<VolatilitySurface[]>([])
  const [optionsFlow, setOptionsFlow] = useState<OptionsFlow[]>([])
  const [darkPoolTrades, setDarkPoolTrades] = useState<DarkPoolTrade[]>([])
  const [quantMetrics, setQuantMetrics] = useState<QuantMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(true)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchQuantData()
    
    const interval = setInterval(() => {
      fetchQuantData()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Fetch quantitative data
  const fetchQuantData = useCallback(async () => {
    setLoading(true)
    try {
      // Mock arbitrage opportunities
      const mockArbitrage: ArbitrageOpportunity[] = [
        {
          id: "1",
          type: "triangular",
          markets: ["BTC/USD", "ETH/USD", "ETH/BTC"],
          entryPrice: 45000,
          exitPrice: 45150,
          profit: 150,
          profitPercent: 0.33,
          confidence: 85,
          timeframe: "5m",
          risk: 0.15,
          status: "active",
        },
        {
          id: "2",
          type: "statistical",
          markets: ["NQ100", "ES"],
          entryPrice: 15200,
          exitPrice: 15235,
          profit: 35,
          profitPercent: 0.23,
          confidence: 72,
          timeframe: "15m",
          risk: 0.08,
          status: "active",
        },
        {
          id: "3",
          type: "cross_market",
          markets: ["Gold", "Silver", "DXY"],
          entryPrice: 2350,
          exitPrice: 2368,
          profit: 18,
          profitPercent: 0.77,
          confidence: 68,
          timeframe: "30m",
          risk: 0.12,
          status: "active",
        },
      ]

      // Mock volatility surface
      const mockVolSurface: VolatilitySurface[] = [
        { strike: 15000, impliedVol: 0.28, callPrice: 245, putPrice: 180, skew: -0.15, kurtosis: 3.2, timestamp: new Date().toISOString() },
        { strike: 15200, impliedVol: 0.25, callPrice: 180, putPrice: 220, skew: -0.12, kurtosis: 2.8, timestamp: new Date().toISOString() },
        { strike: 15400, impliedVol: 0.22, callPrice: 125, putPrice: 265, skew: -0.08, kurtosis: 2.5, timestamp: new Date().toISOString() },
      ]

      // Mock options flow
      const mockOptionsFlow: OptionsFlow[] = [
        {
          id: "1",
          symbol: "NQ100",
          type: "unusual_volume",
          strike: 15250,
          expiry: "2024-02-16",
          volume: 5000,
          premium: 125000,
          sentiment: "bullish",
          confidence: 88,
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "2",
          symbol: "ES",
          type: "large_block",
          strike: 4550,
          expiry: "2024-02-23",
          volume: 10000,
          premium: 450000,
          sentiment: "bearish",
          confidence: 92,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
      ]

      // Mock dark pool trades
      const mockDarkPool: DarkPoolTrade[] = [
        {
          id: "1",
          symbol: "NQ100",
          size: 50000,
          price: 15215,
          time: new Date(Date.now() - 180000).toISOString(),
          venue: "INSTINET",
          side: "buy",
          significance: "high",
          impact: 0.8,
        },
        {
          id: "2",
          symbol: "ES",
          size: 25000,
          price: 4525,
          time: new Date(Date.now() - 420000).toISOString(),
          venue: "NOMURA",
          side: "sell",
          significance: "medium",
          impact: 0.5,
        },
      ]

      // Mock quantitative metrics
      const mockMetrics: QuantMetrics = {
        sharpeRatio: 1.85,
        sortinoRatio: 2.45,
        maxDrawdown: -8.2,
        calmarRatio: 1.65,
        winRate: 68.5,
        avgTrade: 245,
        totalReturn: 28.4,
        volatility: 15.2,
        beta: 1.12,
        alpha: 3.8,
        informationRatio: 1.42,
      }

      setArbitrageOpportunities(mockArbitrage)
      setVolatilitySurface(mockVolSurface)
      setOptionsFlow(mockOptionsFlow)
      setDarkPoolTrades(mockDarkPool)
      setQuantMetrics(mockMetrics)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error("Failed to fetch quantitative data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get arbitrage type color
  const getArbitrageColor = (type: string) => {
    switch (type) {
      case "triangular": return "text-purple-400"
      case "statistical": return "text-blue-400"
      case "cross_market": return "text-green-400"
      default: return "text-gray-400"
    }
  }

  // Get options flow type color
  const getOptionsFlowColor = (type: string) => {
    switch (type) {
      case "unusual_volume": return "text-orange-400"
      case "large_block": return "text-red-400"
      case "sweep": return "text-purple-400"
      case "split": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-black">Quantitative Analysis</span>
          </div>
          <div className="flex items-center gap-1.5">
            {lastUpdate && (
              <span className="text-[8px] text-muted-foreground/40">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              onClick={fetchQuantData}
              disabled={loading}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-3">
          {[
            { id: "arbitrage", label: "Arbitrage", icon: Target },
            { id: "volatility", label: "Volatility", icon: Activity },
            { id: "options", label: "Options Flow", icon: Zap },
            { id: "darkpool", label: "Dark Pool", icon: BarChart3 },
            { id: "metrics", label: "Metrics", icon: Percent },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-muted-foreground/50 hover:text-muted-foreground/70"
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Arbitrage Opportunities */}
        {activeTab === "arbitrage" && (
          <div className="space-y-3">
            {arbitrageOpportunities.length > 0 ? (
              arbitrageOpportunities.map(opp => (
                <div key={opp.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className={`h-3 w-3 ${getArbitrageColor(opp.type)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground/60">
                          {opp.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {opp.markets.join(" → ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-bold ${opp.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                        ${opp.profit.toFixed(0)}
                      </div>
                      <div className="text-[8px] text-muted-foreground/40">
                        {opp.profitPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[8px] text-muted-foreground/40">
                    <div>
                      <span>Entry:</span>
                      <span className="ml-1 text-foreground/60">{opp.entryPrice}</span>
                    </div>
                    <div>
                      <span>Exit:</span>
                      <span className="ml-1 text-foreground/60">{opp.exitPrice}</span>
                    </div>
                    <div>
                      <span>Confidence:</span>
                      <span className="ml-1 text-blue-400">{opp.confidence}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40">
                    <span>Risk: {opp.risk}%</span>
                    <span>·</span>
                    <span>{opp.timeframe}</span>
                    <span>·</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      opp.status === "active" ? "bg-green-500/10 text-green-400" :
                      opp.status === "expired" ? "bg-red-500/10 text-red-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {opp.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Target className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No arbitrage opportunities</p>
                <p className="text-[8px] text-muted-foreground/30">Scanning for opportunities...</p>
              </div>
            )}
          </div>
        )}

        {/* Volatility Surface */}
        {activeTab === "volatility" && (
          <div className="space-y-3">
            {volatilitySurface.length > 0 ? (
              <>
                <div className="p-3 bg-background/20 rounded-lg border border-border/20">
                  <div className="text-[10px] font-bold text-foreground/60 mb-2">Implied Volatility Surface</div>
                  <div className="space-y-2">
                    {volatilitySurface.map((surface, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-foreground/60">{surface.strike}</span>
                          <div className="flex-1 bg-background/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-400"
                              style={{ width: `${surface.impliedVol * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[8px] text-purple-400">{(surface.impliedVol * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-background/20 rounded border border-border/20">
                    <div className="text-[8px] text-muted-foreground/40">Skew</div>
                    <div className="text-[10px] font-bold text-orange-400">
                      {volatilitySurface[0]?.skew.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2 bg-background/20 rounded border border-border/20">
                    <div className="text-[8px] text-muted-foreground/40">Kurtosis</div>
                    <div className="text-[10px] font-bold text-blue-400">
                      {volatilitySurface[0]?.kurtosis.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No volatility data</p>
                <p className="text-[8px] text-muted-foreground/30">Calculating surface...</p>
              </div>
            )}
          </div>
        )}

        {/* Options Flow */}
        {activeTab === "options" && (
          <div className="space-y-3">
            {optionsFlow.length > 0 ? (
              optionsFlow.map(flow => (
                <div key={flow.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-3 w-3 ${getOptionsFlowColor(flow.type)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground/60">
                          {flow.symbol} {flow.type.replace('_', ' ')}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {flow.strike} · {flow.expiry}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-foreground/60">
                        ${(flow.premium / 1000).toFixed(0)}K
                      </div>
                      <div className="text-[8px] text-muted-foreground/40">
                        {flow.volume} contracts
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      flow.sentiment === "bullish" ? "bg-green-500/10 text-green-400" :
                      flow.sentiment === "bearish" ? "bg-red-500/10 text-red-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {flow.sentiment}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">
                      {flow.confidence}% confidence
                    </span>
                    <span className="text-[8px] text-blue-400">
                      {new Date(flow.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Zap className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No options flow</p>
                <p className="text-[8px] text-muted-foreground/30">Monitoring unusual activity...</p>
              </div>
            )}
          </div>
        )}

        {/* Dark Pool Trades */}
        {activeTab === "darkpool" && (
          <div className="space-y-3">
            {darkPoolTrades.length > 0 ? (
              darkPoolTrades.map(trade => (
                <div key={trade.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3 text-blue-400" />
                      <div>
                        <div className="text-[10px] font-bold text-foreground/60">
                          {trade.symbol}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {trade.venue}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-foreground/60">
                        {trade.price}
                      </div>
                      <div className="text-[8px] text-muted-foreground/40">
                        {(trade.size / 1000).toFixed(0)}K shares
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      trade.side === "buy" ? "bg-green-500/10 text-green-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      trade.significance === "high" ? "bg-red-500/10 text-red-400" :
                      trade.significance === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {trade.significance}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">
                      Impact: {trade.impact}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <BarChart3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No dark pool activity</p>
                <p className="text-[8px] text-muted-foreground/30">Monitoring institutional flow...</p>
              </div>
            )}
          </div>
        )}

        {/* Quantitative Metrics */}
        {activeTab === "metrics" && quantMetrics && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Sharpe Ratio</div>
                <div className="text-[12px] font-bold text-green-400">
                  {quantMetrics.sharpeRatio.toFixed(2)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Sortino Ratio</div>
                <div className="text-[12px] font-bold text-blue-400">
                  {quantMetrics.sortinoRatio.toFixed(2)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Max Drawdown</div>
                <div className="text-[12px] font-bold text-red-400">
                  {quantMetrics.maxDrawdown.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Calmar Ratio</div>
                <div className="text-[12px] font-bold text-purple-400">
                  {quantMetrics.calmarRatio.toFixed(2)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Win Rate</div>
                <div className="text-[12px] font-bold text-green-400">
                  {quantMetrics.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Avg Trade</div>
                <div className="text-[12px] font-bold text-foreground/60">
                  ${quantMetrics.avgTrade.toFixed(0)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Total Return</div>
                <div className="text-[12px] font-bold text-green-400">
                  {quantMetrics.totalReturn.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Volatility</div>
                <div className="text-[12px] font-bold text-orange-400">
                  {quantMetrics.volatility.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Beta</div>
                <div className="text-[12px] font-bold text-foreground-60">
                  {quantMetrics.beta.toFixed(2)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Alpha</div>
                <div className="text-[12px] font-bold text-green-400">
                  {quantMetrics.alpha.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Info Ratio</div>
                <div className="text-[12px] font-bold text-blue-400">
                  {quantMetrics.informationRatio.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
