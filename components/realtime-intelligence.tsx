"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Globe,
  Zap,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  Target,
  Newspaper,
  Calendar,
  DollarSign,
} from "lucide-react"

interface NewsItem {
  id: string
  source: string
  headline: string
  url: string
  timestamp: string
  sentiment: "bullish" | "bearish" | "neutral"
  impact: "high" | "medium" | "low"
  relevance: number
  keywords: string[]
}

interface EconomicEvent {
  id: string
  name: string
  date: string
  time: string
  currency: string
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
  }
  aiAnalysis: string
  tradingImplications: string[]
}

interface CentralBankAction {
  id: string
  bank: string
  type: "rate_decision" | "policy_statement" | "minutes_release" | "speech"
  action: string
  impact: string
  markets: string[]
  significance: "high" | "medium" | "low"
  timestamp: string
  acknowledged: boolean
}

interface GeopoliticalEvent {
  id: string
  title: string
  region: string
  type: "conflict" | "sanctions" | "trade_talks" | "election" | "natural_disaster" | "energy"
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  markets: string[]
  probability: number
  timestamp: string
  acknowledged: boolean
}

interface MarketSentiment {
  market: string
  overall: "bullish" | "bearish" | "neutral"
  score: number
  news: number
  social: number
  technical: number
  institutional: number
  timestamp: string
}

const NEWS_SOURCES = [
  "Reuters",
  "Bloomberg",
  "CNBC",
  "Financial Times",
  "Wall Street Journal",
  "MarketWatch",
  "Yahoo Finance",
  "Seeking Alpha"
]

const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "Middle East",
  "Latin America",
  "Africa"
]

export function RealTimeIntelligence() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("news")
  const [news, setNews] = useState<NewsItem[]>([])
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([])
  const [centralBanks, setCentralBanks] = useState<CentralBankAction[]>([])
  const [geopoliticalEvents, setGeopoliticalEvents] = useState<GeopoliticalEvent[]>([])
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(true)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchIntelligenceData()
    
    const interval = setInterval(() => {
      fetchIntelligenceData()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Fetch real-time intelligence data
  const fetchIntelligenceData = useCallback(async () => {
    setLoading(true)
    try {
      // Mock news data
      const mockNews: NewsItem[] = [
        {
          id: "1",
          source: "Reuters",
          headline: "Fed signals potential rate pause amid economic uncertainty",
          url: "https://reuters.com/markets/stocks",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          sentiment: "neutral",
          impact: "high",
          relevance: 0.92,
          keywords: ["fed", "interest rates", "economy", "inflation"],
        },
        {
          id: "2",
          source: "Bloomberg",
          headline: "Tech stocks lead market rally as AI optimism grows",
          url: "https://bloomberg.com/markets/tech",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          sentiment: "bullish",
          impact: "high",
          relevance: 0.88,
          keywords: ["tech stocks", "AI", "optimism", "rally"],
        },
        {
          id: "3",
          source: "CNBC",
          headline: "Oil prices surge on OPEC+ production cuts",
          url: "https://cnbc.com/markets/energy",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          sentiment: "bullish",
          impact: "medium",
          relevance: 0.75,
          keywords: ["oil", "OPEC", "production cuts", "energy"],
        },
        {
          id: "4",
          source: "Financial Times",
          headline: "European markets face uncertainty as ECB meeting approaches",
          url: "https://ft.com/markets/europe",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          sentiment: "neutral",
          impact: "medium",
          relevance: 0.68,
          keywords: ["ECB", "Europe", "uncertainty", "meeting"],
        },
      ]

      // Mock economic events
      const mockEconomicEvents: EconomicEvent[] = [
        {
          id: "1",
          name: "FOMC Interest Rate Decision",
          date: new Date().toISOString().split('T')[0],
          time: "14:00",
          currency: "USD",
          importance: "high",
          actual: "5.25%",
          forecast: "5.25%",
          previous: "5.25%",
          impact: {
            markets: ["NQ100", "ES", "DXY", "US10Y", "VIX"],
            direction: "neutral",
            confidence: 85,
            expectedMove: 1.2,
            volatility: 2.5,
          },
          aiAnalysis: "Fed maintains status quo as economic data shows mixed signals. Markets expect policy stability through Q2 2024.",
          tradingImplications: [
            "Monitor for forward guidance changes",
            "Watch for inflation data surprises",
            "Consider defensive positioning",
          ],
        },
        {
          id: "2",
          name: "ECB Monetary Policy Meeting",
          date: new Date().toISOString().split('T')[0],
          time: "08:30",
          currency: "EUR",
          importance: "high",
          actual: "4.00%",
          forecast: "4.00%",
          previous: "4.00%",
          impact: {
            markets: ["ES", "DXY", "EUR/USD"],
            direction: "neutral",
            confidence: 78,
            expectedMove: 0.8,
            volatility: 1.8,
          },
          aiAnalysis: "ECB maintains accommodative stance. European markets show resilience despite global uncertainty.",
          tradingImplications: [
            "Focus on quality European assets",
            "Monitor inflation data closely",
            "Consider currency hedging strategies",
          ],
        },
        {
          id: "3",
          name: "BOJ Policy Meeting",
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: "03:00",
          currency: "JPY",
          importance: "medium",
          forecast: "-0.10%",
          previous: "-0.10%",
          impact: {
            markets: ["NQ100", "DXY", "USD/JPY"],
            direction: "neutral",
            confidence: 65,
            expectedMove: 0.6,
            volatility: 1.2,
          },
          aiAnalysis: "BOJ continues ultra-loose policy. Yen remains weak but stable.",
          tradingImplications: [
            "Watch for intervention signals",
            "Monitor export data",
            "Consider carry trade opportunities",
          ],
        },
      ]

      // Mock central bank actions
      const mockCentralBanks: CentralBankAction[] = [
        {
          id: "1",
          bank: "Federal Reserve",
          type: "minutes_release",
          action: "Fed minutes show committee split on rate path",
          impact: "Markets react with increased volatility",
          markets: ["NQ100", "ES", "DXY", "VIX"],
          significance: "high",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: false,
        },
        {
          id: "2",
          bank: "European Central Bank",
          type: "policy_statement",
          action: "ECB President Lagarde emphasizes data dependence",
          impact: "Euro strengthens against dollar",
          markets: ["ES", "DXY", "EUR/USD"],
          significance: "medium",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          acknowledged: true,
        },
        {
          id: "3",
          bank: "Bank of Japan",
          type: "speech",
          action: "BOJ Governor Ueda warns about yen weakness",
          impact: "Yen sees brief bounce then resumes decline",
          markets: ["USD/JPY", "NQ100"],
          significance: "medium",
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          acknowledged: true,
        },
      ]

      // Mock geopolitical events
      const mockGeopolitical: GeopoliticalEvent[] = [
        {
          id: "1",
          title: "Middle East tensions escalate",
          region: "Middle East",
          type: "conflict",
          severity: "high",
          impact: "Oil prices surge, safe haven demand increases",
          markets: ["Oil", "Gold", "DXY"],
          probability: 0.65,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          acknowledged: false,
        },
        {
          "id": "2",
          title: "US-China trade talks resume",
          region: "Asia",
          type: "trade_talks",
          severity: "medium",
          impact: "Tech stocks rally on positive developments",
          markets: ["NQ100", "ES", "BTC"],
          probability: 0.45,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: true,
        },
        {
          id: "3",
          title: "European energy crisis deepens",
          region: "Europe",
          type: "energy",
          severity: "medium",
          impact: "Energy stocks rise, inflation concerns grow",
          markets: ["Oil", "Gas", "DXY"],
          probability: 0.35,
          timestamp: new Date(Date.now() - 5400000).toISOString(),
          acknowledged: true,
        },
      ]

      // Mock market sentiment
      const mockMarketSentiment: MarketSentiment[] = [
        {
          market: "NQ100",
          overall: "bullish",
          score: 0.72,
          news: 0.68,
          social: 0.75,
          technical: 0.70,
          institutional: 0.73,
          timestamp: new Date().toISOString(),
        },
        {
          market: "ES",
          overall: "neutral",
          score: 0.52,
          news: 0.48,
          social: 0.55,
          technical: 0.50,
          institutional: 0.55,
          timestamp: new Date().toISOString(),
        },
        {
          market: "BTC",
          overall: "bullish",
          score: 0.68,
          news: 0.62,
          social: 0.78,
          technical: 0.65,
          institutional: 0.58,
          timestamp: new Date().toISOString(),
        },
        {
          market: "Gold",
          overall: "neutral",
          score: 0.45,
          news: 0.42,
          social: 0.48,
          technical: 0.44,
          institutional: 0.46,
          timestamp: new Date().toISOString(),
        },
      ]

      setNews(mockNews)
      setEconomicEvents(mockEconomicEvents)
      setCentralBanks(mockCentralBanks)
      setGeopoliticalEvents(mockGeopolitical)
      setMarketSentiment(mockMarketSentiment)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error("Failed to fetch intelligence data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "text-green-400"
      case "bearish": return "text-red-400"
      case "neutral": return "text-yellow-400"
      default: return "text-gray-400"
    }
  }

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-red-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

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

  // Get direction icon
  const getDirectionIcon = (direction: string) => {
    return direction === "bullish" ? <TrendingUp className="h-3 w-3 text-green-400" /> :
           direction === "bearish" ? <TrendingDown className="h-3 w-3 text-red-400" /> :
           <Activity className="h-3 w-3 text-gray-400" />
  }

  // Acknowledge event
  const acknowledgeEvent = useCallback((type: string, id: string) => {
    if (type === "centralbank") {
      setCentralBanks(prev => prev.map(bank => 
        bank.id === id ? { ...bank, acknowledged: true } : bank
      ))
    } else if (type === "geopolitical") {
      setGeopoliticalEvents(prev => prev.map(event => 
        event.id === id ? { ...event, acknowledged: true } : event
      ))
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Real-Time Intelligence</span>
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
              onClick={fetchIntelligenceData}
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
            { id: "news", label: "News", icon: Newspaper },
            { id: "economic", label: "Economic", icon: Calendar },
            { id: "centralbank", label: "Central Banks", icon: DollarSign },
            { id: "geopolitical", label: "Geopolitical", icon: AlertTriangle },
            { id: "sentiment", label: "Sentiment", icon: BarChart3 },
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
        {/* News Feed */}
        {activeTab === "news" && (
          <div className="space-y-3">
            {news.length > 0 ? (
              news.map(item => (
                <div key={item.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-3 w-3 text-blue-400" />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60 line-clamp-1">
                          {item.headline}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-muted-foreground/40">{item.source}</span>
                          <span className="text-[8px] text-muted-foreground/30">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment.toUpperCase()}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${getImpactColor(item.impact)}`}>
                        {item.impact.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.keywords.map((keyword, i) => (
                      <span key={i} className="text-[7px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground/50">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-[8px] text-muted-foreground/40">
                    Relevance: {(item.relevance * 100).toFixed(0)}%
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Newspaper className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No news data</p>
                <p className="text-[8px] text-muted-foreground/30">Fetching headlines...</p>
              </div>
            )}
          </div>
        )}

        {/* Economic Events */}
        {activeTab === "economic" && (
          <div className="space-y-3">
            {economicEvents.length > 0 ? (
              economicEvents.map(event => (
                <div key={event.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-orange-400" />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60">
                          {event.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-muted-foreground/40">{event.currency}</span>
                          <span className="text-[8px] text-muted-foreground/30">{event.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        event.importance === "high" ? "bg-red-500/10 text-red-400" :
                        event.importance === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {event.importance.toUpperCase()}
                      </span>
                      {getDirectionIcon(event.impact.direction)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[8px] text-muted-foreground/40 mb-2">
                    {event.actual && (
                      <div>
                        <span>Actual:</span>
                        <span className="ml-1 text-green-400">{event.actual}</span>
                      </div>
                    )}
                    {event.forecast && (
                      <div>
                        <span>Forecast:</span>
                        <span className="ml-1 text-blue-400">{event.forecast}</span>
                      </div>
                    )}
                    {event.previous && (
                      <div>
                        <span>Previous:</span>
                        <span className="ml-1 text-gray-400">{event.previous}</span>
                      </div>
                    )}
                  </div>
                  
                  {showDetails && (
                    <div className="space-y-2">
                      <div className="p-2 bg-background/30 rounded border border-border/20">
                        <div className="text-[8px] font-bold text-foreground-60 mb-1">AI Analysis</div>
                        <p className="text-[8px] text-muted-foreground/40 leading-snug">
                          {event.aiAnalysis}
                        </p>
                      </div>
                      
                      <div className="p-2 bg-background/30 rounded border border-border/20">
                        <div className="text-[8px] font-bold text-foreground-60 mb-1">Trading Implications</div>
                        <div className="space-y-1">
                          {event.tradingImplications.map((implication, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-blue-400 rounded-full" />
                              <span className="text-[8px] text-muted-foreground-40">{implication}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No economic events</p>
                <p className="text-[8px] text-muted-foreground/30">Checking calendar...</p>
              </div>
            )}
          </div>
        )}

        {/* Central Banks */}
        {activeTab === "centralbank" && (
          <div className="space-y-3">
            {centralBanks.filter(bank => !bank.acknowledged).length > 0 ? (
              centralBanks.filter(bank => !bank.acknowledged).map(bank => (
                <div key={bank.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-purple-400" />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60">
                          {bank.bank}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {bank.type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getSeverityColor(bank.significance)}`}>
                        {bank.significance}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">
                        {new Date(bank.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-[8px] text-muted-foreground/40 mb-1">
                    {bank.action}
                  </div>
                  
                  <div className="text-[8px] text-muted-foreground/40 mb-1">
                    {bank.impact}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {bank.markets.map((market, i) => (
                      <span key={i} className="text-[7px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground/50">
                        {market}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => acknowledgeEvent("centralbank", bank.id)}
                    className="text-[8px] text-muted-foreground/40 hover:text-foreground-60"
                  >
                    Acknowledge
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <DollarSign className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No central bank activity</p>
                <p className="text-[8px] text-muted-foreground/30">Monitoring policy actions...</p>
              </div>
            )}
          </div>
        )}

        {/* Geopolitical Events */}
        {activeTab === "geopolitical" && (
          <div className="space-y-3">
            {geopoliticalEvents.filter(event => !event.acknowledged).length > 0 ? (
              geopoliticalEvents.filter(event => !event.acknowledged).map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${
                  event.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  event.severity === "high" ? "border-orange-500/30 bg-orange-500/5" :
                  event.severity === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-blue-500/30 bg-blue-500/5"
                } bg-background/20`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-3 w-3 ${getSeverityColor(event.severity)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60">
                          {event.title}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {event.region} · {event.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">
                        {(event.probability * 100).toFixed(0)}%
                      </span>
                      <button
                        onClick={() => acknowledgeEvent("geopolitical", event.id)}
                        className="text-[8px] text-muted-foreground/40 hover:text-foreground-60"
                      >
                        Ack
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-[8px] text-muted-foreground-40 mb-1">
                    {event.impact}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {event.markets.map((market, i) => (
                      <span key={i} className="text-[7px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground/50">
                        {market}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No geopolitical events</p>
                <p className="text-[8px] text-muted-foreground/30">Monitoring global events...</p>
              </div>
            )}
          </div>
        )}

        {/* Market Sentiment */}
        {activeTab === "sentiment" && (
          <div className="space-y-3">
            {marketSentiment.length > 0 ? (
              marketSentiment.map(sentiment => (
                <div key={sentiment.market} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-foreground-60">
                      {sentiment.market}
                    </div>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(sentiment.overall)}
                      <span className={`text-[10px] font-bold ${getSentimentColor(sentiment.overall)}`}>
                        {sentiment.overall.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] text-muted-foreground/40">Overall Score:</span>
                      <div className="flex-1 bg-background/30 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sentiment.score > 0.6 ? "bg-green-400" :
                            sentiment.score > 0.4 ? "bg-yellow-400" :
                            "bg-red-400"
                          }`}
                          style={{ width: `${sentiment.score * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-bold text-foreground-60 ml-2">
                        {(sentiment.score * 100).toFixed(0)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[8px] text-muted-foreground/40">
                      <div>
                        <span>News:</span>
                        <span className="ml-1 text-foreground-60">{(sentiment.news * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span>Social:</span>
                        <span className="ml-1 text-foreground-60">{(sentiment.social * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span>Technical:</span>
                        <span className="ml-1 text-foreground-60">{(sentiment.technical * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span>Institutional:</span>
                        <span className="ml-1 text-foreground-60">{(sentiment.institutional * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[8px] text-muted-foreground/40">
                    {new Date(sentiment.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <BarChart3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No sentiment data</p>
                <p className="text-[8px] text-muted-foreground/30">Analyzing sentiment...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
