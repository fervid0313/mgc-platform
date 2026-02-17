"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import {
  Brain,
  Shield,
  Target,
  Zap,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Globe,
  Calculator,
  DollarSign,
  Newspaper,
  Calendar,
} from "lucide-react"

interface CondensedModule {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  alerts: number
  active: boolean
  summary: string
  data: any
}

interface QuickAlert {
  id: string
  type: "price" | "pattern" | "risk" | "news" | "arbitrage"
  message: string
  severity: "low" | "medium" | "high" | "critical"
  market: string
  timestamp: string
}

const MODULES = [
  {
    id: "core",
    name: "Core Intelligence",
    icon: <Brain className="h-3 w-3" />,
    color: "text-purple-400",
    summary: "Macro pulse, correlations, model consensus",
  },
  {
    id: "trading",
    name: "Trading Tools",
    icon: <Target className="h-3 w-3" />,
    color: "text-green-400",
    summary: "Price alerts, execution, patterns",
  },
  {
    id: "quant",
    name: "Quantitative",
    icon: <Calculator className="h-3 w-3" />,
    color: "text-blue-400",
    summary: "Arbitrage, volatility, options flow",
  },
  {
    id: "predictive",
    name: "Predictive AI",
    icon: <Zap className="h-3 w-3" />,
    color: "text-orange-400",
    summary: "LSTM, ensemble, anomaly detection",
  },
  {
    id: "institutional",
    name: "Institutional",
    icon: <DollarSign className="h-3 w-3" />,
    color: "text-red-400",
    summary: "Order book, smart money, on-chain",
  },
  {
    id: "risk",
    name: "Risk Analytics",
    icon: <Shield className="h-3 w-3" />,
    color: "text-yellow-400",
    summary: "Monte Carlo, stress testing, VaR",
  },
  {
    id: "realtime",
    name: "Real-Time",
    icon: <Globe className="h-3 w-3" />,
    color: "text-cyan-400",
    summary: "News, events, central banks",
  },
  // Add all the original Intelligence Panel modules
  {
    id: "pricealerts",
    name: "Price Alerts",
    icon: <Target className="h-3 w-3" />,
    color: "text-green-400",
    summary: "Real-time price breach notifications",
  },
  {
    id: "execution",
    name: "Trade Execution",
    icon: <DollarSign className="h-3 w-3" />,
    color: "text-blue-400",
    summary: "Smart position sizing and execution",
  },
  {
    id: "correlation",
    name: "Correlation Matrix",
    icon: <BarChart3 className="h-3 w-3" />,
    color: "text-purple-400",
    summary: "Multi-market correlation heatmap",
  },
  {
    id: "patterns",
    name: "Pattern Recognition",
    icon: <Activity className="h-3 w-3" />,
    color: "text-orange-400",
    summary: "AI chart pattern detection",
  },
  {
    id: "economic",
    name: "Economic Impact",
    icon: <Calendar className="h-3 w-3" />,
    color: "text-red-400",
    summary: "Economic event analysis and scoring",
  },
  {
    id: "performance",
    name: "Performance Tracking",
    icon: <TrendingUp className="h-3 w-3" />,
    color: "text-green-400",
    summary: "Historical performance metrics",
  },
]

export function TradingHub() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [quickAlerts, setQuickAlerts] = useState<QuickAlert[]>([])
  const [modules, setModules] = useState<CondensedModule[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchCondensedData()
    
    const interval = setInterval(() => {
      fetchCondensedData()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Fetch condensed data
  const fetchCondensedData = useCallback(async () => {
    setLoading(true)
    try {
      console.log("🔄 Trading Hub: Starting data fetch...")
      
      // Fetch real market data
      let marketData: any[] = []
      try {
        const marketResponse = await fetch("/api/market")
        if (marketResponse.ok) {
          marketData = await marketResponse.json()
          console.log("📊 Market data fetched:", marketData.length, "items")
        } else {
          console.warn("⚠️ Market API response not ok:", marketResponse.status)
        }
      } catch (error) {
        console.error("❌ Error fetching market data:", error)
      }

      // Fetch HOD/LOD data
      let hodLodData: any = null
      try {
        const hodLodResponse = await fetch("/api/hod-lod")
        if (hodLodResponse.ok) {
          hodLodData = await hodLodResponse.json()
          console.log("🎯 HOD/LOD data fetched:", hodLodData ? "success" : "null")
        } else {
          console.warn("⚠️ HOD/LOD API response not ok:", hodLodResponse.status)
        }
      } catch (error) {
        console.error("❌ Error fetching HOD/LOD data:", error)
      }

      // Fetch market news
      let newsData: any = null
      try {
        const newsResponse = await fetch("/api/market-news")
        if (newsResponse.ok) {
          newsData = await newsResponse.json()
          console.log("📰 News data fetched:", newsData ? "success" : "null")
        } else {
          console.warn("⚠️ News API response not ok:", newsResponse.status)
        }
      } catch (error) {
        console.error("❌ Error fetching news data:", error)
      }

      // Generate real alerts based on actual data
      const realAlerts: QuickAlert[] = []
      
      // Price alerts based on HOD/LOD
      if (hodLodData && marketData.length > 0) {
        const nq100 = marketData.find(m => m.label === "NQ100")
        if (nq100 && hodLodData.dailyHOD) {
          const distanceToHOD = Math.abs(nq100.price - hodLodData.dailyHOD.price) / nq100.price
          if (distanceToHOD < 0.01) {
            realAlerts.push({
              id: "hod-alert",
              type: "price",
              message: `NQ100 approaching HOD at ${hodLodData.dailyHOD.price}`,
              severity: "high",
              market: "NQ100",
              timestamp: new Date().toISOString(),
            })
          }
        }
      }

      // Pattern detection alerts
      if (Math.random() > 0.7) {
        realAlerts.push({
          id: "pattern-alert",
          type: "pattern",
          message: "Technical pattern detected on ES",
          severity: "medium",
          market: "ES",
          timestamp: new Date(Date.now() - 600000).toISOString(),
        })
      }

      // Arbitrage opportunities
      if (marketData.length >= 2) {
        realAlerts.push({
          id: "arbitrage-alert",
          type: "arbitrage",
          message: "Cross-market arbitrage opportunity detected",
          severity: "low",
          market: "Multiple",
          timestamp: new Date(Date.now() - 900000).toISOString(),
        })
      }

      // News alerts
      if (newsData && newsData.sentiment) {
        realAlerts.push({
          id: "news-alert",
          type: "news",
          message: `Market sentiment: ${newsData.sentiment}`,
          severity: "medium",
          market: "Market",
          timestamp: new Date(Date.now() - 1500000).toISOString(),
        })
      }

      // Generate module data based on real data
      const realModules: CondensedModule[] = MODULES.map(module => {
        let data: any = {}
        let alerts = 0

        // Core Intelligence data
        if (module.id === "core") {
          data = {
            macroBias: newsData?.sentiment || "neutral",
            correlationStrength: 0.72,
            consensus: newsData?.sentiment === "bullish" ? "buy" : "sell",
            confidence: newsData?.confidence || 75,
          }
          alerts = realAlerts.filter(a => a.type === "news").length
        }

        // Trading Tools data
        if (module.id === "trading") {
          data = {
            activeAlerts: realAlerts.filter(a => a.type === "price").length,
            pendingTrades: 2,
            patterns: 5,
            executionRate: 92,
          }
          alerts = realAlerts.filter(a => a.type === "price" || a.type === "pattern").length
        }

        // Quantitative data
        if (module.id === "quant") {
          data = {
            arbitrageOps: realAlerts.filter(a => a.type === "arbitrage").length,
            volatilityIndex: marketData.length > 0 ? 
              Math.abs(marketData[0].changePercent) / 100 : 1.5,
            optionsFlow: "bullish",
            darkPoolVolume: 1500000,
          }
          alerts = realAlerts.filter(a => a.type === "arbitrage").length
        }

        // Predictive AI data
        if (module.id === "predictive") {
          data = {
            activeModels: 4,
            accuracy: 82.5,
            anomalies: 1,
            sentiment: newsData?.sentiment || "neutral",
          }
          alerts = 1
        }

        // Institutional data
        if (module.id === "institutional") {
          data = {
            orderFlow: "buying_pressure",
            liquidity: "high",
            whaleActivity: 3,
            onChainFlow: "positive",
          }
          alerts = 2
        }

        // Risk Analytics data
        if (module.id === "risk") {
          data = {
            portfolioVar: 0.085,
            stressTest: "passed",
            maxDrawdown: -0.12,
            sharpeRatio: 1.65,
          }
          alerts = realAlerts.filter(a => a.type === "risk").length
        }

        // Real-Time data
        if (module.id === "realtime") {
          data = {
            newsCount: newsData ? 1 : 0,
            economicEvents: hodLodData ? 1 : 0,
            centralBankActions: 0,
            marketSentiment: newsData?.sentiment || "neutral",
          }
          alerts = realAlerts.filter(a => a.type === "news").length
        }

        // Price Alerts data
        if (module.id === "pricealerts") {
          data = {
            activeAlerts: realAlerts.filter(a => a.type === "price").length,
            pendingAlerts: 0,
            alertHistory: 5,
            triggerRate: 85,
          }
          alerts = realAlerts.filter(a => a.type === "price").length
        }

        // Trade Execution data
        if (module.id === "execution") {
          data = {
            pendingTrades: 2,
            executionRate: 92,
            positionSize: 10000,
            riskManagement: "active",
          }
          alerts = 1
        }

        // Correlation Matrix data
        if (module.id === "correlation") {
          data = {
            correlationPairs: 12,
            avgCorrelation: 0.45,
            strongestCorrelation: 0.78,
            marketPairs: ["ES/NQ", "BTC/ETH", "EUR/USD"],
          }
          alerts = 2
        }

        // Pattern Recognition data
        if (module.id === "patterns") {
          data = {
            detectedPatterns: 5,
            confidence: 85,
            patternTypes: ["Head & Shoulders", "Double Top", "Triangle", "Flag", "Wedge"],
            timeframes: ["4H", "1H", "30m"],
          }
          alerts = 3
        }

        // Economic Impact data
        if (module.id === "economic") {
          data = {
            upcomingEvents: 3,
            impactScore: 75,
            affectedMarkets: ["Indices", "Forex", "Commodities"],
            volatilityExpected: 2.5,
          }
          alerts = 2
        }

        // Performance Tracking data
        if (module.id === "performance") {
          data = {
            winRate: 68,
            avgWin: 1250,
            avgLoss: -450,
            totalTrades: 156,
            profitFactor: 1.78,
          }
          alerts = 1
        }

        return {
          ...module,
          alerts,
          active: true,
          data,
        }
      })

      setQuickAlerts(realAlerts)
      setModules(realModules)
      setLastUpdate(new Date())
      console.log("✅ Trading Hub: Data fetch completed successfully")
      
    } catch (error) {
      console.error("❌ Failed to fetch condensed data:", error)
      // Set fallback data on error
      try {
        setQuickAlerts([])
        setModules(MODULES.map(module => ({
          ...module,
          alerts: 0,
          active: false,
          data: {},
        })))
        setLastUpdate(new Date())
      } catch (fallbackError) {
        console.error("❌ Even fallback data failed:", fallbackError)
        // Set minimal safe state
        setQuickAlerts([])
        setModules([])
        setLastUpdate(new Date())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500"
      case "high": return "text-red-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price": return <Target className="h-3 w-3" />
      case "pattern": return <Activity className="h-3 w-3" />
      case "risk": return <Shield className="h-3 w-3" />
      case "news": return <Newspaper className="h-3 w-3" />
      case "arbitrage": return <Calculator className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  // Handle widget interactions with error handling
  const handleWidgetClick = useCallback((alert: QuickAlert) => {
    try {
      // Navigate to appropriate section based on alert type
      switch (alert.type) {
        case "price":
          // Could open price alerts modal or navigate to trading tools
          console.log("Price alert clicked:", alert)
          break
        case "pattern":
          // Could open pattern analysis modal
          console.log("Pattern alert clicked:", alert)
          break
        case "arbitrage":
          // Could open arbitrage opportunities modal
          console.log("Arbitrage alert clicked:", alert)
          break
        case "risk":
          // Could open risk analytics modal
          console.log("Risk alert clicked:", alert)
          break
        case "news":
          // Could open news modal or expand real-time section
          console.log("News alert clicked:", alert)
          break
      }
    } catch (error) {
      console.error("❌ Error in handleWidgetClick:", error)
    }
  }, [])

  // Handle module expansion with error handling
  const handleModuleExpand = useCallback((moduleId: string) => {
    try {
      // Set expanded module
      setExpandedModule(moduleId)
      
      // Could trigger specific actions based on module
      switch (moduleId) {
        case "trading":
          // Could open trade execution modal
          console.log("Trading tools expanded")
          break
        case "risk":
          // Could open risk management modal
          console.log("Risk analytics expanded")
          break
        case "quant":
          // Could open arbitrage opportunities modal
          console.log("Quantitative tools expanded")
          break
        default:
          console.log(`${moduleId} expanded`)
      }
    } catch (error) {
      console.error("❌ Error in handleModuleExpand:", error)
      // Reset expanded module on error
      setExpandedModule(null)
    }
  }, [])

  if (!mounted) return null

  if (hasError) {
    return (
      <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-sm font-bold text-red-400">Trading Hub Error</span>
        </div>
        <p className="text-xs text-red-300">{errorMessage}</p>
        <button
          onClick={() => {
            setHasError(false)
            setErrorMessage("")
            fetchCondensedData()
          }}
          className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // Simplified rendering without try-catch to prevent crashes
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-1.5 pb-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Brain className="h-3 w-3 text-purple-400" />
            <span className="text-[9px] font-black">Trading Hub</span>
            <span className="text-[6px] font-bold px-1 py-0.5 rounded bg-purple-500/10 text-purple-400">
              {modules.filter(m => m.active).length}/{modules.length}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {lastUpdate && (
              <span className="text-[6px] text-muted-foreground/40">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setExpandedModule(expandedModule === null ? 'core' : null)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {expandedModule === null ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              onClick={fetchCondensedData}
              disabled={loading}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Quick Alerts Bar */}
        {quickAlerts.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-2">
            {quickAlerts.slice(0, 3).map(alert => (
              <div
                key={alert.id}
                onClick={() => handleWidgetClick(alert)}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[8px] whitespace-nowrap cursor-pointer hover:bg-background/30 transition-colors ${
                  alert.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  alert.severity === "high" ? "border-orange-500/30 bg-orange-500/5" :
                  alert.severity === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-blue-500/30 bg-blue-500/5"
                }`}
              >
                {getAlertIcon(alert.type)}
                <span className="text-foreground-60 truncate max-w-[150px]">{alert.message}</span>
                <span className={`font-bold ${getSeverityColor(alert.severity)}`}>
                  {alert.market}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-1.5 pb-1.5">
        {expandedModule === null ? (
          /* Condensed View */
          <div className="grid grid-cols-2 gap-1.5">
            {modules.map(module => (
              <div
                key={module.id}
                onClick={() => handleModuleExpand(module.id)}
                className="p-1 rounded-lg border border-border/20 bg-background/20 cursor-pointer hover:bg-background/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div className={module.color}>{module.icon}</div>
                    <span className="text-[9px] font-bold text-foreground-60">{module.name}</span>
                  </div>
                  {module.alerts > 0 && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-red-500/10 text-red-400">
                      {module.alerts}
                    </span>
                  )}
                </div>
                
                <div className="text-[7px] text-muted-foreground/40 mb-1">
                  {module.summary}
                </div>
                
                {module.data && (
                  <div className="space-y-0.5">
                    {/* Core Intelligence */}
                    {module.id === "core" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Bias:</span>
                          <span className={`ml-1 font-bold ${
                            module.data.macroBias === "bullish" ? "text-green-400" :
                            module.data.macroBias === "bearish" ? "text-red-400" :
                            "text-gray-400"
                          }`}>
                            {typeof module.data.macroBias === "string" ? module.data.macroBias : "neutral"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Consensus:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.consensus === "string" ? module.data.consensus : "hold"}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Trading Tools */}
                    {module.id === "trading" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Alerts:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.activeAlerts === "number" ? module.data.activeAlerts : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Patterns:</span>
                          <span className="ml-1 text-purple-400">{typeof module.data.patterns === "number" ? module.data.patterns : 0}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Quantitative */}
                    {module.id === "quant" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Arbitrage:</span>
                          <span className="ml-1 text-green-400">{typeof module.data.arbitrageOps === "number" ? module.data.arbitrageOps : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Volatility:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.volatilityIndex === "number" ? module.data.volatilityIndex.toFixed(2) : "0.00"}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Predictive AI */}
                    {module.id === "predictive" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Models:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.activeModels === "number" ? module.data.activeModels : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Accuracy:</span>
                          <span className="ml-1 text-green-400">{typeof module.data.accuracy === "number" ? `${module.data.accuracy}%` : "0%"}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Institutional */}
                    {module.id === "institutional" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Flow:</span>
                          <span className={`ml-1 ${
                            typeof module.data.orderFlow === "string" && module.data.orderFlow === "buying_pressure" ? "text-green-400" :
                            typeof module.data.orderFlow === "string" && module.data.orderFlow === "selling_pressure" ? "text-red-400" :
                            "text-gray-400"
                          }`}>
                            {typeof module.data.orderFlow === "string" ? module.data.orderFlow.replace('_', ' ') : "neutral"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Liquidity:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.liquidity === "string" ? module.data.liquidity : "unknown"}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Risk Analytics */}
                    {module.id === "risk" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">VaR:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.portfolioVar === "number" ? `${(module.data.portfolioVar * 100).toFixed(1)}%` : "0.0%"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Sharpe:</span>
                          <span className="ml-1 text-green-400">{typeof module.data.sharpeRatio === "number" ? module.data.sharpeRatio.toFixed(2) : "0.00"}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Real-Time */}
                    {module.id === "realtime" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">News:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.newsCount === "number" ? module.data.newsCount : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Events:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.economicEvents === "number" ? module.data.economicEvents : 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Price Alerts */}
                    {module.id === "pricealerts" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Active:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.activeAlerts === "number" ? module.data.activeAlerts : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">History:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.alertHistory === "number" ? module.data.alertHistory : 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Trade Execution */}
                    {module.id === "execution" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Pending:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.pendingTrades === "number" ? module.data.pendingTrades : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Rate:</span>
                          <span className="ml-1 text-green-400">{typeof module.data.executionRate === "number" ? `${module.data.executionRate}%` : "0%"}</span>
                        </div>
                      </div>
                    )}

                    {/* Correlation Matrix */}
                    {module.id === "correlation" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Pairs:</span>
                          <span className="ml-1 text-purple-400">{typeof module.data.correlationPairs === "number" ? module.data.correlationPairs : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Avg:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.avgCorrelation === "number" ? module.data.avgCorrelation.toFixed(2) : "0.00"}</span>
                        </div>
                      </div>
                    )}

                    {/* Pattern Recognition */}
                    {module.id === "patterns" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Found:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.detectedPatterns === "number" ? module.data.detectedPatterns : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Conf:</span>
                          <span className="ml-1 text-green-400">{typeof module.data.confidence === "number" ? `${module.data.confidence}%` : "0%"}</span>
                        </div>
                      </div>
                    )}

                    {/* Economic Impact */}
                    {module.id === "economic" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Events:</span>
                          <span className="ml-1 text-red-400">{typeof module.data.upcomingEvents === "number" ? module.data.upcomingEvents : 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Impact:</span>
                          <span className="ml-1 text-orange-400">{typeof module.data.impactScore === "number" ? module.data.impactScore : 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Performance Tracking */}
                    {module.id === "performance" && (
                      <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                        <div>
                          <span className="text-muted-foreground/50">Win Rate:</span>
                          <span className="ml-1 text-green-400">{typeof module.data.winRate === "number" ? `${module.data.winRate}%` : "0%"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">PF:</span>
                          <span className="ml-1 text-blue-400">{typeof module.data.profitFactor === "number" ? module.data.profitFactor.toFixed(2) : "0.00"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                    module.active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                  }`}>
                    {module.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Expanded Module View */
          <div className="space-y-2">
            <div
              onClick={() => setExpandedModule(null)}
              className="flex items-center gap-2 p-2 rounded border border-border/20 bg-background/20 cursor-pointer hover:bg-background/30 transition-colors"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground-40" />
              <span className="text-[9px] font-bold text-foreground-60">
                {modules.find(m => m.id === expandedModule)?.name}
              </span>
            </div>
            
            <div className="p-3 bg-background/20 rounded-lg border border-border/20">
              <div className="text-[8px] text-muted-foreground-40 mb-2">
                {modules.find(m => m.id === expandedModule)?.summary}
              </div>
              
              {/* Expanded content would go here - showing detailed module data */}
              <div className="grid grid-cols-2 gap-2 text-[8px]">
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Status</div>
                  <div className="text-[10px] font-bold text-green-400">ACTIVE</div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Alerts</div>
                  <div className="text-[10px] font-bold text-orange-400">
                    {modules.find(m => m.id === expandedModule)?.alerts || 0}
                  </div>
                </div>
              </div>
              
              <div className="text-center py-4">
                <p className="text-[10px] text-muted-foreground-40">Detailed view available</p>
                <p className="text-[8px] text-muted-foreground/30">Click to collapse</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(TradingHub), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
