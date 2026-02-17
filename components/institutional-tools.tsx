"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  DollarSign,
  Zap,
  Globe,
  Shield,
} from "lucide-react"

interface OrderBookLevel {
  price: number
  bidSize: number
  askSize: number
  totalSize: number
  spread: number
  depth: number
}

interface MarketMicrostructure {
  market: string
  bid: number
  ask: number
  spread: number
  volume: number
  orderFlow: "buying_pressure" | "selling_pressure" | "balanced"
  liquidity: "high" | "medium" | "low"
  volatility: "low" | "medium" | "high"
  momentum: "strong_up" | "strong_down" | "weak_up" | "weak_down" | "neutral"
  timestamp: string
}

interface SmartMoneyAlert {
  id: string
  market: string
  type: "whale_accumulation" | "whale_distribution" | "institutional_flow" | "dark_pool_activity"
  size: number
  price: number
  direction: "buy" | "sell"
  significance: "high" | "medium" | "low"
  confidence: number
  impact: number
  timestamp: string
  acknowledged: boolean
}

interface OnChainData {
  symbol: string
  whaleWallets: {
    address: string
    balance: number
    change24h: number
    lastActivity: string
    sentiment: "bullish" | "bearish" | "neutral"
  }[]
  exchangeFlow: {
    exchange: string
    inflow: number
    outflow: number
    netFlow: number
  }[]
  totalSupply: number
  circulatingSupply: number
  timestamp: string
}

interface CrossAssetArbitrage {
  id: string
  assets: string[]
  opportunity: "triangular" | "statistical" | "cross_exchange"
  entryPrice: number
  exitPrice: number
  profit: number
  profitPercent: number
  confidence: number
  timeframe: string
  risk: number
  status: "active" | "expired" | "executed"
}

const MARKETS = ["NQ100", "ES", "Gold", "Silver", "BTC", "Oil", "DXY", "VIX", "US10Y"]

export function InstitutionalTools() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("orderbook")
  const [orderBook, setOrderBook] = useState<OrderBookLevel[]>([])
  const [microstructure, setMicrostructure] = useState<MarketMicrostructure[]>([])
  const [smartMoneyAlerts, setSmartMoneyAlerts] = useState<SmartMoneyAlert[]>([])
  const [onChainData, setOnChainData] = useState<OnChainData[]>([])
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<CrossAssetArbitrage[]>([])
  const [selectedMarket, setSelectedMarket] = useState("NQ100")
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(true)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchInstitutionalData()
    
    const interval = setInterval(() => {
      fetchInstitutionalData()
    }, 20000) // Update every 20 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Fetch institutional data
  const fetchInstitutionalData = useCallback(async () => {
    setLoading(true)
    try {
      // Mock order book data
      const mockOrderBook: OrderBookLevel[] = [
        { price: 15250, bidSize: 1500, askSize: 1200, totalSize: 2700, spread: 0.25, depth: 5 },
        { price: 15245, bidSize: 800, askSize: 900, totalSize: 1700, spread: 0.25, depth: 4 },
        { price: 15240, bidSize: 600, askSize: 700, totalSize: 1300, spread: 0.25, depth: 3 },
        { price: 15235, bidSize: 400, askSize: 500, totalSize: 900, spread: 0.25, depth: 2 },
        { price: 15230, bidSize: 200, askSize: 300, totalSize: 500, spread: 0.25, depth: 1 },
      ]

      // Mock market microstructure
      const mockMicrostructure: MarketMicrostructure[] = [
        {
          market: "NQ100",
          bid: 15245.50,
          ask: 15245.75,
          spread: 0.25,
          volume: 2500000,
          orderFlow: "buying_pressure",
          liquidity: "high",
          volatility: "medium",
          momentum: "strong_up",
          timestamp: new Date().toISOString(),
        },
        {
          market: "ES",
          bid: 4520.25,
          ask: 4520.50,
          spread: 0.25,
          volume: 3200000,
          orderFlow: "balanced",
          liquidity: "high",
          volatility: "low",
          momentum: "neutral",
          timestamp: new Date().toISOString(),
        },
        {
          market: "BTC",
          bid: 51500,
          ask: 51520,
          spread: 20,
          volume: 850000000,
          orderFlow: "selling_pressure",
          liquidity: "medium",
          volatility: "high",
          momentum: "weak_down",
          timestamp: new Date().toISOString(),
        },
      ]

      // Mock smart money alerts
      const mockSmartMoney: SmartMoneyAlert[] = [
        {
          id: "1",
          market: "NQ100",
          type: "whale_accumulation",
          size: 50000,
          price: 15240,
          direction: "buy",
          significance: "high",
          confidence: 87,
          impact: 0.8,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          acknowledged: false,
        },
        {
          id: "2",
          market: "BTC",
          type: "institutional_flow",
          size: 100000000,
          price: 51500,
          direction: "sell",
          significance: "high",
          confidence: 92,
          impact: 1.2,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          acknowledged: false,
        },
        {
          id: "3",
          market: "Gold",
          type: "dark_pool_activity",
          size: 25000,
          price: 2380,
          direction: "buy",
          significance: "medium",
          confidence: 73,
          impact: 0.5,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          acknowledged: true,
        },
      ]

      // Mock on-chain data
      const mockOnChain: OnChainData[] = [
        {
          symbol: "BTC",
          whaleWallets: [
            { address: "0x1234...5678", balance: 1000, change24h: 2.5, lastActivity: new Date().toISOString(), sentiment: "bullish" },
            { address: "0xabcd...efgh", balance: 500, change24h: -1.2, lastActivity: new Date(Date.now() - 3600000).toISOString(), sentiment: "bearish" },
            { address: "0xijkl...mnop", balance: 750, change24h: 0.8, lastActivity: new Date(Date.now() - 7200000).toISOString(), sentiment: "neutral" },
          ],
          exchangeFlow: [
            { exchange: "Binance", inflow: 50000000, outflow: 30000000, netFlow: 20000000 },
            { exchange: "Coinbase", inflow: 25000000, outflow: 35000000, netFlow: -10000000 },
            { exchange: "Kraken", inflow: 15000000, outflow: 12000000, netFlow: 3000000 },
          ],
          totalSupply: 21000000,
          circulatingSupply: 19500000,
          timestamp: new Date().toISOString(),
        },
      ]

      // Mock arbitrage opportunities
      const mockArbitrage: CrossAssetArbitrage[] = [
        {
          id: "1",
          assets: ["BTC/USD", "ETH/USD", "ETH/BTC"],
          opportunity: "triangular",
          entryPrice: 51500,
          exitPrice: 51625,
          profit: 125,
          profitPercent: 0.24,
          confidence: 82,
          timeframe: "5m",
          risk: 0.15,
          status: "active",
        },
        {
          id: "2",
          assets: ["Gold", "Silver"],
          opportunity: "statistical",
          entryPrice: 2380,
          exitPrice: 2392,
          profit: 12,
          profitPercent: 0.50,
          confidence: 75,
          timeframe: "15m",
          risk: 0.08,
          status: "active",
        },
      ]

      setOrderBook(mockOrderBook)
      setMicrostructure(mockMicrostructure)
      setSmartMoneyAlerts(mockSmartMoney)
      setOnChainData(mockOnChain)
      setArbitrageOpportunities(mockArbitrage)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error("Failed to fetch institutional data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get alert type color
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "whale_accumulation": return "text-green-400"
      case "whale_distribution": return "text-red-400"
      case "institutional_flow": return "text-blue-400"
      case "dark_pool_activity": return "text-purple-400"
      default: return "text-gray-400"
    }
  }

  // Get significance color
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "high": return "text-red-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  // Acknowledge alert
  const acknowledgeAlert = useCallback((id: string) => {
    setSmartMoneyAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ))
  }, [])

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Institutional Tools</span>
            {smartMoneyAlerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {smartMoneyAlerts.filter(a => !a.acknowledged).length}
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
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              onClick={fetchInstitutionalData}
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
            { id: "orderbook", label: "Order Book", icon: BarChart3 },
            { id: "microstructure", label: "Microstructure", icon: Activity },
            { id: "smartmoney", label: "Smart Money", icon: DollarSign },
            { id: "onchain", label: "On-Chain", icon: Globe },
            { id: "arbitrage", label: "Arbitrage", icon: Target },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
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
        {/* Order Book */}
        {activeTab === "orderbook" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
              >
                {MARKETS.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </div>
            
            {orderBook.length > 0 ? (
              <div className="p-3 bg-background/20 rounded-lg border border-border/20">
                <div className="text-[10px] font-bold text-foreground/60 mb-2">
                  {selectedMarket} Order Book
                </div>
                <div className="space-y-1">
                  {orderBook.map((level, i) => (
                    <div key={i} className="flex items-center justify-between text-[8px]">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground-60 w-12 text-right">{level.price}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-red-400 w-8 text-right">{level.bidSize}</span>
                          <span className="text-green-400 w-8 text-right">{level.askSize}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground/40">Spread: {level.spread}</span>
                        <span className="text-muted-foreground/40">Depth: {level.depth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <BarChart3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No order book data</p>
                <p className="text-[8px] text-muted-foreground/30">Loading market depth...</p>
              </div>
            )}
          </div>
        )}

        {/* Market Microstructure */}
        {activeTab === "microstructure" && (
          <div className="space-y-3">
            {microstructure.length > 0 ? (
              microstructure.map(market => (
                <div key={market.market} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-foreground-60">{market.market}</div>
                    <div className="text-[8px] text-muted-foreground/40">
                      {new Date(market.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[8px] text-muted-foreground/40 mb-2">
                    <div>
                      <span>Bid:</span>
                      <span className="ml-1 text-foreground-60">{market.bid}</span>
                    </div>
                    <div>
                      <span>Ask:</span>
                      <span className="ml-1 text-foreground-60">{market.ask}</span>
                    </div>
                    <div>
                      <span>Spread:</span>
                      <span className="ml-1 text-orange-400">{market.spread}</span>
                    </div>
                    <div>
                      <span>Volume:</span>
                      <span className="ml-1 text-foreground-60">{(market.volume / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[8px]">
                    <div>
                      <span className="text-muted-foreground/50">Flow:</span>
                      <span className={`ml-1 ${
                        market.orderFlow === "buying_pressure" ? "text-green-400" :
                        market.orderFlow === "selling_pressure" ? "text-red-400" :
                        "text-gray-400"
                      }`}>
                        {market.orderFlow.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">Liquidity:</span>
                      <span className={`ml-1 ${
                        market.liquidity === "high" ? "text-green-400" :
                        market.liquidity === "medium" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {market.liquidity}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">Volatility:</span>
                      <span className={`ml-1 ${
                        market.volatility === "low" ? "text-green-400" :
                        market.volatility === "medium" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {market.volatility}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Activity className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No microstructure data</p>
                <p className="text-[8px] text-muted-foreground/30">Analyzing market depth...</p>
              </div>
            )}
          </div>
        )}

        {/* Smart Money Alerts */}
        {activeTab === "smartmoney" && (
          <div className="space-y-3">
            {smartMoneyAlerts.filter(a => !a.acknowledged).length > 0 ? (
              smartMoneyAlerts.filter(a => !a.acknowledged).map(alert => (
                <div key={alert.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className={`h-3 w-3 ${getAlertTypeColor(alert.type)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60">
                          {alert.market} - {alert.type.replace('_', ' ')}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getSignificanceColor(alert.significance)}`}>
                        {alert.significance}
                      </span>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-[8px] text-muted-foreground/40 hover:text-foreground-60"
                      >
                        Ack
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[8px] text-muted-foreground/40 mb-1">
                    <div>
                      <span>Size:</span>
                      <span className="ml-1 text-foreground-60">{alert.size.toLocaleString()}</span>
                    </div>
                    <div>
                      <span>Price:</span>
                      <span className="ml-1 text-foreground-60">{alert.price}</span>
                    </div>
                    <div>
                      <span>Impact:</span>
                      <span className="ml-1 text-orange-400">{alert.impact}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      alert.direction === "buy" ? "bg-green-500/10 text-green-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {alert.direction.toUpperCase()}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">
                      {alert.confidence}% confidence
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <DollarSign className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No smart money activity</p>
                <p className="text-[8px] text-muted-foreground/30">Monitoring institutional flow...</p>
              </div>
            )}
          </div>
        )}

        {/* On-Chain Data */}
        {activeTab === "onchain" && (
          <div className="space-y-3">
            {onChainData.length > 0 ? (
              onChainData.map(data => (
                <div key={data.symbol} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="text-[10px] font-bold text-foreground-60 mb-2">{data.symbol}</div>
                  
                  <div className="mb-2">
                    <div className="text-[8px] text-muted-foreground/40 mb-1">Whale Wallets</div>
                    <div className="space-y-1">
                      {data.whaleWallets.slice(0, 3).map((wallet, i) => (
                        <div key={i} className="flex items-center justify-between text-[8px]">
                          <span className="text-muted-foreground/50">{wallet.address.slice(0, 10)}...</span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground-60">{wallet.balance}</span>
                            <span className={`text-[8px] ${
                              wallet.change24h > 0 ? "text-green-400" :
                              wallet.change24h < 0 ? "text-red-400" :
                              "text-gray-400"
                            }`}>
                              {wallet.change24h > 0 ? "+" : ""}{wallet.change24h}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-[8px] text-muted-foreground/40 mb-1">Exchange Flow</div>
                    <div className="space-y-1">
                      {data.exchangeFlow.slice(0, 2).map((flow, i) => (
                        <div key={i} className="flex items-center justify-between text-[8px]">
                          <span className="text-muted-foreground/50">{flow.exchange}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">+${(flow.inflow / 1000000).toFixed(1)}M</span>
                            <span className="text-red-400">-${(flow.outflow / 1000000).toFixed(1)}M</span>
                            <span className={`text-[8px] ${
                              flow.netFlow > 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {flow.netFlow > 0 ? "+" : ""}${(flow.netFlow / 1000000).toFixed(1)}M
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Globe className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No on-chain data</p>
                <p className="text-[8px] text-muted-foreground/30">Tracking wallet activity...</p>
              </div>
            )}
          </div>
        )}

        {/* Cross-Asset Arbitrage */}
        {activeTab === "arbitrage" && (
          <div className="space-y-3">
            {arbitrageOpportunities.length > 0 ? (
              arbitrageOpportunities.map(opp => (
                <div key={opp.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-purple-400" />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60">
                          {opp.opportunity.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {opp.assets.join(" → ")}
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
                      <span className="ml-1 text-foreground-60">{opp.entryPrice}</span>
                    </div>
                    <div>
                      <span>Exit:</span>
                      <span className="ml-1 text-foreground-60">{opp.exitPrice}</span>
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
      </div>
    </div>
  )
}
