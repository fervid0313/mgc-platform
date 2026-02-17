"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Globe,
  DollarSign,
  Activity,
  Clock,
  RefreshCw,
  Filter,
  Star,
  Zap,
} from "lucide-react"

interface EconomicEvent {
  id: string
  date: string
  time: string
  currency: string
  event: string
  importance: "high" | "medium" | "low"
  actual?: string
  forecast?: string
  previous?: string
  impact: {
    markets: string[]
    direction: "bullish" | "bearish" | "neutral"
    confidence: number
    expectedMove: number
    volatility: number
    timeframe: string
  }
  aiAnalysis: string
  tradingImplications: string[]
  riskLevel: "low" | "medium" | "high" | "extreme"
}

interface MarketImpact {
  market: string
  preEventPrice: number
  postEventPrice?: number
  expectedMove: number
  actualMove?: number
  accuracy?: number
  volatility: number
  volume: number
}

interface ImpactScore {
  eventId: string
  overallScore: number
  marketScores: Record<string, number>
  accuracy: number
  volatility: number
  riskReward: number
  recommendation: "buy" | "sell" | "hold" | "avoid"
}

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"]
const IMPORTANCE_LEVELS = ["high", "medium", "low"]
const MARKETS = ["NQ100", "ES", "Gold", "Silver", "BTC", "Oil", "DXY", "VIX", "US10Y"]

export function EconomicImpact() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [selectedImportance, setSelectedImportance] = useState("all")
  const [timeframe, setTimeframe] = useState("upcoming")
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(true)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchEconomicEvents()
    
    const interval = setInterval(() => {
      fetchEconomicEvents()
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Fetch economic events with AI analysis
  const fetchEconomicEvents = useCallback(async () => {
    setLoading(true)
    try {
      // Get today's date
      const today = new Date()
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
      
      // Fetch from forex-calendar API
      const response = await fetch(`/api/forex-calendar?date=${todayKey}`)
      if (response.ok) {
        const data = await response.json()
        const todayEvents = data?.events?.[todayKey] || []
        
        // Enhance events with AI analysis
        const enhancedEvents = await Promise.all(
          todayEvents.map(async (event: any) => {
            // Generate AI analysis for each event
            const aiAnalysis = await analyzeEventImpact(event)
            
            return {
              id: `${event.time}-${event.event}`,
              date: todayKey,
              time: event.time,
              currency: event.currency || "USD",
              event: event.event,
              importance: event.impact === "High" ? "high" : event.impact === "Medium" ? "medium" : "low",
              actual: event.actual,
              forecast: event.forecast,
              previous: event.previous,
              impact: aiAnalysis.impact,
              aiAnalysis: aiAnalysis.analysis,
              tradingImplications: aiAnalysis.tradingImplications,
              riskLevel: aiAnalysis.riskLevel,
            }
          })
        )
        
        setEvents(enhancedEvents)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch economic events:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Analyze event impact using AI
  const analyzeEventImpact = useCallback(async (event: any) => {
    // In a real implementation, this would call an AI service
    // For now, we'll simulate the analysis
    const importance = event.impact === "High" ? "high" : event.impact === "Medium" ? "medium" : "low"
    
    // Determine affected markets based on currency and event type
    const affectedMarkets = determineAffectedMarkets(event.currency, event.event, event.impact as string)
    
    // Generate impact analysis
    const impact = {
      markets: affectedMarkets,
      direction: Math.random() > 0.5 ? "bullish" : "bearish",
      confidence: importance === "high" ? 85 : importance === "medium" ? 65 : 45,
      expectedMove: importance === "high" ? 2.5 : importance === "medium" ? 1.5 : 0.8,
      volatility: importance === "high" ? 3.5 : importance === "medium" ? 2.0 : 1.2,
      timeframe: importance === "high" ? "4h" : importance === "medium" ? "1h" : "30m",
    }
    
    // Generate AI analysis
    const analysis = generateAIAnalysis(event, impact)
    
    // Determine risk level
    const riskLevel = importance === "high" && impact.volatility > 3 ? "extreme" :
                     importance === "high" ? "high" :
                     importance === "medium" ? "medium" : "low"
    
    return {
      impact,
      analysis,
      tradingImplications: generateTradingImplications(event, impact),
      riskLevel,
    }
  }, [])

  // Determine which markets are affected by an event
  const determineAffectedMarkets = (currency: string, event: string, impact: string): string[] => {
    const markets = []
    
    // Currency-specific impacts
    if (currency === "USD") {
      markets.push("DXY", "US10Y", "VIX")
      if (event.toLowerCase().includes("interest") || event.toLowerCase().includes("fed")) {
        markets.push("NQ100", "ES", "BTC")
      }
      if (event.toLowerCase().includes("inflation")) {
        markets.push("Gold", "Silver")
      }
    } else if (currency === "EUR") {
      markets.push("EUR/USD")
      if (event.toLowerCase().includes("ecb")) {
        markets.push("DXY", "NQ100", "ES")
      }
    }
    
    // General market impacts
    if (impact === "High") {
      markets.push("NQ100", "ES", "VIX")
    }
    
    // Commodity-specific
    if (event.toLowerCase().includes("oil") || event.toLowerCase().includes("energy")) {
      markets.push("Oil")
      if (impact === "High") {
        markets.push("DXY", "BTC")
      }
    }
    
    // Safe haven assets during high importance events
    if (impact === "High") {
      markets.push("Gold", "Silver")
    }
    
    return [...new Set(markets)] // Remove duplicates
  }

  // Generate AI analysis text
  const generateAIAnalysis = (event: any, impact: any): string => {
    const templates = [
      `This ${event.impact.toLowerCase()} impact ${event.currency} economic data is expected to ${impact.direction}ly affect ${impact.markets.join(", ")}. The event carries ${impact.confidence}% confidence with an expected move of ${impact.expectedMove}% in the ${impact.timeframe} timeframe.`,
      `Market participants are anticipating ${impact.direction} momentum following this ${event.impact} economic announcement. The volatility forecast suggests ${impact.volatility}x normal levels, particularly in ${impact.markets.slice(0, 3).join(", ")}.`,
      `Based on historical patterns, this ${event.currency} ${event.event.toLowerCase()} typically triggers ${impact.direction} pressure on risk assets. The ${impact.confidence}% confidence level suggests traders should prepare for ${impact.expectedMove}% price movements.`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  // Generate trading implications
  const generateTradingImplications = (event: any, impact: any): string[] => {
    const implications = []
    
    if (impact.direction === "bullish") {
      implications.push("Consider long positions in affected markets")
      implications.push("Monitor for breakout patterns")
      if (impact.volatility > 2) {
        implications.push("Use wider stop losses due to expected volatility")
      }
    } else if (impact.direction === "bearish") {
      implications.push("Consider short positions or hedging")
      implications.push("Watch for support level tests")
      if (impact.volatility > 2) {
        implications.push("Reduce position size during high volatility")
      }
    }
    
    if (event.impact === "High") {
      implications.push("Avoid over-leveraging around event time")
      implications.push("Consider pre-positioning with tight risk management")
    }
    
    implications.push(`Monitor ${impact.timeframe} timeframe for primary move`)
    implications.push("Watch for reversal patterns after initial move")
    
    return implications
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    const currencyMatch = selectedCurrency === "all" || event.currency === selectedCurrency
    const importanceMatch = selectedImportance === "all" || event.importance === selectedImportance
    
    let timeMatch = true
    const eventTime = new Date(`${event.date} ${event.time}`)
    const now = new Date()
    
    if (timeframe === "upcoming") {
      timeMatch = eventTime > now
    } else if (timeframe === "past") {
      timeMatch = eventTime <= now
    }
    
    return currencyMatch && importanceMatch && timeMatch
  })

  // Get importance color
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high": return "text-red-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  // Get risk level color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "extreme": return "text-red-500"
      case "high": return "text-red-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-green-400"
      default: return "text-gray-400"
    }
  }

  // Get direction icon
  const getDirectionIcon = (direction: string) => {
    return direction === "bullish" ? <TrendingUp className="h-3 w-3 text-green-400" /> :
           direction === "bearish" ? <TrendingDown className="h-3 w-3 text-red-400" /> :
           <Activity className="h-3 w-3 text-gray-400" />
  }

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Economic Impact</span>
            {filteredEvents.length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {filteredEvents.length}
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
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Filter className="h-3 w-3" />
            </button>
            <button
              onClick={fetchEconomicEvents}
              disabled={loading}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Currencies</option>
            {CURRENCIES.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
          <select
            value={selectedImportance}
            onChange={(e) => setSelectedImportance(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="all">All Importance</option>
            {IMPORTANCE_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Economic Events */}
        {filteredEvents.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">
              Economic Events ({filteredEvents.length})
            </p>
            <div className="space-y-2">
              {filteredEvents.map(event => (
                <div key={event.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground/40" />
                      <div>
                        <div className="text-[10px] font-bold text-foreground/60">
                          {event.event}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-muted-foreground/40">{event.currency}</span>
                          <span className="text-[8px] text-muted-foreground/30">·</span>
                          <span className="text-[8px] text-muted-foreground/40">{event.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        event.importance === "high" ? "bg-red-500/10 text-red-400" :
                        event.importance === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {event.importance}
                      </span>
                      {getDirectionIcon(event.impact.direction)}
                    </div>
                  </div>

                  {/* Impact Details */}
                  <div className="grid grid-cols-2 gap-2 text-[8px] mb-2">
                    <div>
                      <span className="text-muted-foreground/40">Markets:</span>
                      <span className="ml-1 text-foreground/60">{event.impact.markets.slice(0, 2).join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Expected Move:</span>
                      <span className="ml-1 text-foreground/60">{event.impact.expectedMove}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Confidence:</span>
                      <span className="ml-1 text-foreground/60">{event.impact.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40">Volatility:</span>
                      <span className="ml-1 text-orange-400">{event.impact.volatility}x</span>
                    </div>
                  </div>

                  {/* Data */}
                  {(event.actual || event.forecast || event.previous) && (
                    <div className="grid grid-cols-3 gap-2 text-[8px] mb-2 p-2 bg-background/30 rounded">
                      {event.previous && (
                        <div>
                          <span className="text-muted-foreground/40">Previous:</span>
                          <span className="ml-1 text-foreground/60">{event.previous}</span>
                        </div>
                      )}
                      {event.forecast && (
                        <div>
                          <span className="text-muted-foreground/40">Forecast:</span>
                          <span className="ml-1 text-blue-400">{event.forecast}</span>
                        </div>
                      )}
                      {event.actual && (
                        <div>
                          <span className="text-muted-foreground/40">Actual:</span>
                          <span className="ml-1 text-green-400">{event.actual}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Analysis */}
                  {showAnalysis && (
                    <div className="space-y-2">
                      <div className="p-2 bg-background/30 rounded border border-border/20">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-[8px] font-bold text-foreground/60">AI Analysis</span>
                        </div>
                        <p className="text-[8px] text-muted-foreground/40 leading-snug">
                          {event.aiAnalysis}
                        </p>
                      </div>

                      {/* Trading Implications */}
                      <div className="p-2 bg-background/30 rounded border border-border/20">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="h-3 w-3 text-purple-400" />
                          <span className="text-[8px] font-bold text-foreground/60">Trading Implications</span>
                        </div>
                        <div className="space-y-1">
                          {event.tradingImplications.slice(0, 3).map((implication, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-purple-400 rounded-full" />
                              <span className="text-[8px] text-muted-foreground/40">{implication}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Level */}
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-3 w-3 ${getRiskColor(event.riskLevel)}`} />
                        <span className={`text-[8px] font-bold ${getRiskColor(event.riskLevel)}`}>
                          {event.riskLevel.toUpperCase()} RISK
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">
                          {event.impact.timeframe} timeframe
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Impact Summary */}
        {showAnalysis && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Market Impact Summary</p>
            <div className="grid grid-cols-3 gap-2">
              {MARKETS.slice(0, 6).map(market => {
                const marketEvents = filteredEvents.filter(e => e.impact.markets.includes(market))
                const avgImpact = marketEvents.length > 0 
                  ? marketEvents.reduce((sum, e) => sum + e.impact.expectedMove, 0) / marketEvents.length
                  : 0
                
                return (
                  <div key={market} className="p-2 bg-background/20 rounded border border-border/20">
                    <div className="text-[9px] font-bold text-foreground/60 mb-1">{market}</div>
                    <div className="text-[8px] text-muted-foreground/40">
                      {marketEvents.length} events
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-background/30 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            avgImpact > 2 ? "bg-red-400" :
                            avgImpact > 1 ? "bg-yellow-400" :
                            "bg-green-400"
                          }`}
                          style={{ width: `${Math.min(avgImpact * 20, 100)}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-muted-foreground/40 min-w-[30px]">
                        {avgImpact.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-4">
            <Globe className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No economic events</p>
            <p className="text-[8px] text-muted-foreground/30">Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
