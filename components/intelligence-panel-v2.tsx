"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"

// Add custom styles for animations
const customStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0);
      max-height: 400px;
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
  }
  
  .animate-in {
    animation: slideIn 0.3s ease-out forwards;
  }
  
  .animate-out {
    animation: slideOut 0.3s ease-out forwards;
  }
  
  .content-collapsed {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
  }
  
  .content-expanded {
    max-height: 400px;
    opacity: 1;
    overflow-y: auto;
  }
`
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Newspaper,
  Zap,
  Calendar,
  Target,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Activity,
  Layers,
  Eye,
  Bell,
  Settings,
  Maximize2,
  Grid3x3,
  List,
  Filter,
  Search,
} from "lucide-react"

// Import all analysis components
import SMTICTAnalysis from "./smt-ict-analysis"
import OrderFlowAnalysis from "./orderflow-analysis"
import VolumeProfileAnalysis from "./volume-profile-analysis"
import MarketStructureAnalysis from "./market-structure-analysis"
import MultiTimeframeAlignment from "./multi-timeframe-alignment"
import EconomicContext from "./economic-context"
import AIEnsemblePredictions from "./ai-ensemble-predictions"
import IntradayAnalysis from "./intraday-analysis"
import { RealTimeIntelligence } from "./realtime-intelligence"
import ActionableAlerts from "./actionable-alerts"
import MarketMicrostructure from "./market-microstructure"
import VisualEnhancements from "./visual-enhancements"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketItem {
  label: string
  price: number
  change: number
  changePercent: number
}

interface SentimentData {
  overallSentiment: "bullish" | "bearish" | "neutral"
  sentimentScore: number
  summary: string
  keyThemes: string[]
}

interface BiasPrediction {
  bias: "bullish" | "bearish" | "neutral"
  confidence: number
  reasoning: string
}

interface EconEvent {
  time: string
  event: string
  impact: "High" | "Medium" | "Low"
}

interface HodLodData {
  dailyHOD: { price: string; session: string; time: string }
  dailyLOD: { price: string; session: string; time: string }
  sessions: Array<{
    session: string
    status: string
    hodPrice: string
    lodPrice: string
    hodNotes?: string
    lodNotes?: string
  }>
}

// ─── Component Categories ────────────────────────────────────────────────────────

const COMPONENT_CATEGORIES = {
  core: {
    name: "Core Analysis",
    icon: BarChart3,
    color: "blue",
    components: [
      { id: "smt-ict", name: "SMT/ICT Analysis", component: SMTICTAnalysis },
      { id: "orderflow", name: "Order Flow", component: OrderFlowAnalysis },
      { id: "volume", name: "Volume Profile", component: VolumeProfileAnalysis },
      { id: "structure", name: "Market Structure", component: MarketStructureAnalysis },
    ]
  },
  advanced: {
    name: "Advanced Outlook",
    icon: Brain,
    color: "purple",
    components: [
      { id: "multi-timeframe", name: "Multi-Timeframe", component: MultiTimeframeAlignment },
      { id: "economic", name: "Economic Context", component: EconomicContext },
      { id: "ai", name: "AI Ensemble", component: AIEnsemblePredictions },
      { id: "microstructure", name: "Market Microstructure", component: MarketMicrostructure },
    ]
  },
  realtime: {
    name: "Real-Time",
    icon: Activity,
    color: "green",
    components: [
      { id: "realtime", name: "Real-Time Intelligence", component: RealTimeIntelligence },
      { id: "alerts", name: "Actionable Alerts", component: ActionableAlerts },
      { id: "visual", name: "Visual Enhancements", component: VisualEnhancements },
    ]
  }
} as const

// ─── Constants ────────────────────────────────────────────────────────────────────

const MARKETS = [
  { value: "NQ100", label: "NQ100" },
  { value: "ES", label: "ES" },
  { value: "BTC", label: "BTC" },
  { value: "ETH", label: "ETH" },
  { value: "US10Y", label: "US10Y" },
]

const THRESHOLD = 0.15
const SENTIMENT_CACHE_PREFIX = "mgc-news-sentiment-"
const SENTIMENT_CACHE_DURATION = 15 * 60 * 1000
const SELECTED_MARKET_KEY = "mgc-intelligence-market"
const BIAS_CACHE_KEY = "mgc-market-bias"

function sentimentCacheKey(m: string) { return SENTIMENT_CACHE_PREFIX + m }

function loadCachedSentiment(market: string): SentimentData | null {
  if (typeof window === "undefined") return null
  try {
    const cached = JSON.parse(localStorage.getItem(sentimentCacheKey(market)) || "null")
    if (!cached) return null
    const age = Date.now() - new Date(cached.fetchedAt).getTime()
    return age < SENTIMENT_CACHE_DURATION ? cached : null
  } catch {
    return null
  }
}

function saveCachedSentiment(market: string, data: SentimentData) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(sentimentCacheKey(market), JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }))
  } catch {}
}

function loadBias(market: string): BiasPrediction | null {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(`${BIAS_CACHE_KEY}-${market}`)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function saveBias(market: string, bias: BiasPrediction) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`${BIAS_CACHE_KEY}-${market}`, JSON.stringify(bias))
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

function IntelligencePanelV2() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)

  // Inject custom styles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styleElement = document.createElement('style')
      styleElement.textContent = customStyles
      document.head.appendChild(styleElement)
      return () => {
        document.head.removeChild(styleElement)
      }
    }
  }, [])

  const [loading, setLoading] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState("NQ100")
  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [bias, setBias] = useState<BiasPrediction | null>(null)
  const [events, setEvents] = useState<EconEvent[]>([])
  const [hodLod, setHodLod] = useState<HodLodData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // UI State
  const [collapsedComponents, setCollapsedComponents] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  // Load saved market
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SELECTED_MARKET_KEY)
      if (saved && MARKETS.some(m => m.value === saved)) {
        setSelectedMarket(saved)
      }
    }
  }, [])

  // Save market preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_MARKET_KEY, selectedMarket)
    }
  }, [selectedMarket])

  // Fetch sentiment
  const fetchSentiment = useCallback(async (market: string) => {
    try {
      const cached = loadCachedSentiment(market)
      if (cached) {
        setSentiment(cached)
        return
      }

      const res = await fetch(`/api/news-sentiment?market=${market}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`Sentiment fetch failed: ${res.status}`)

      const data = await res.json()
      setSentiment(data)
      saveCachedSentiment(market, data)
    } catch (err) {
      console.error("[INTELLIGENCE] Sentiment fetch error:", err)
      setError("Failed to fetch sentiment")
    }
  }, [])

  // Fetch bias
  const fetchBias = useCallback(async (market: string) => {
    try {
      const cached = loadBias(market)
      if (cached) {
        setBias(cached)
        return
      }

      const res = await fetch(`/api/market-bias?market=${market}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`Bias fetch failed: ${res.status}`)

      const data = await res.json()
      setBias(data)
      saveBias(market, data)
    } catch (err) {
      console.error("[INTELLIGENCE] Bias fetch error:", err)
      setError("Failed to fetch bias")
    }
  }, [])

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/economic-events", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`)

      const data = await res.json()
      setEvents(data.slice(0, 5))
    } catch (err) {
      console.error("[INTELLIGENCE] Events fetch error:", err)
      setError("Failed to fetch events")
    }
  }, [])

  // Fetch HOD/LOD
  const fetchHodLod = useCallback(async (market: string) => {
    try {
      const res = await fetch(`/api/hod-lod?market=${market}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`HOD/LOD fetch failed: ${res.status}`)

      const data = await res.json()
      setHodLod(data)
    } catch (err) {
      console.error("[INTELLIGENCE] HOD/LOD fetch error:", err)
      setError("Failed to fetch HOD/LOD")
    }
  }, [])

  // Initial load
  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      setLoading(true)
      Promise.all([
        fetchSentiment(selectedMarket),
        fetchBias(selectedMarket),
        fetchEvents(),
        fetchHodLod(selectedMarket),
      ]).finally(() => {
        setLoading(false)
        setLastUpdate(new Date())
      })
    }
  }, [isAuthenticated, selectedMarket, fetchSentiment, fetchBias, fetchEvents, fetchHodLod])

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      fetchSentiment(selectedMarket)
      fetchBias(selectedMarket)
      fetchEvents()
      fetchHodLod(selectedMarket)
      setLastUpdate(new Date())
    }, 60000) // 1 minute
    return () => clearInterval(interval)
  }, [isAuthenticated, selectedMarket, fetchSentiment, fetchBias, fetchEvents, fetchHodLod])

  // Toggle component collapse
  const toggleComponent = useCallback((componentId: string) => {
    setCollapsedComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }))
  }, [])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtPercent = (value: number) => `${value.toFixed(2)}%`
  const fmtTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Get color for bias
  const getBiasColor = (bias: string) => {
    switch (bias) {
      case "bullish": return "text-emerald-400"
      case "bearish": return "text-red-400"
      default: return "text-yellow-400"
    }
  }

  // Get category color classes
  const getCategoryColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-400",
        hover: "hover:bg-blue-500/20"
      },
      purple: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-400",
        hover: "hover:bg-purple-500/20"
      },
      green: {
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        text: "text-green-400",
        hover: "hover:bg-green-500/20"
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  // Filter components by search
  const filteredComponents = Object.entries(COMPONENT_CATEGORIES).map(([key, category]) => {
    const filteredComps = category.components.filter((comp: any) => 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return { key, category: { ...category, components: filteredComps } }
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full mx-auto space-y-4">
      
      
      {/* ── Analysis Components Grid ── */}
      <div className="space-y-8 w-full">
        {/* Top Row: Core Analysis | Intraday Analysis AI | Advanced Outlook */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6">
          {/* Core Analysis - Left */}
          <div className="space-y-4">
            <div className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Core Analysis</div>
            {COMPONENT_CATEGORIES.core.components
              .filter((comp: any) => 
                comp.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((comp: any) => {
                const Component = comp.component
                
                return (
                  <div 
                  key={comp.id} 
                  className="min-h-[300px] bg-gradient-to-br from-background via-background/95 to-background border border-border/30 rounded-xl overflow-hidden"
                >
                  {/* Component Content */}
                  <div className="px-4 pb-4 pt-3">
                    <Component />
                  </div>
                </div>
              )
              })}
          </div>

          {/* Intraday Analysis AI - Center */}
          <div className="space-y-4">
            <div className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Intraday Analysis AI</div>
            <div className="min-h-[300px] bg-gradient-to-br from-background via-background/95 to-background border border-border/30 rounded-xl overflow-hidden">
              <div className="px-4 pb-4 pt-3">
                <IntradayAnalysis />
              </div>
            </div>
          </div>

          {/* Advanced Outlook - Right */}
          <div className="space-y-4">
            <div className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Advanced Outlook</div>
            {COMPONENT_CATEGORIES.advanced.components
              .filter((comp: any) => 
                comp.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((comp: any) => {
                const Component = comp.component
                
                return (
                  <div 
                  key={comp.id} 
                  className="min-h-[300px] bg-gradient-to-br from-background via-background/95 to-background border border-border/30 rounded-xl overflow-hidden"
                >
                  {/* Component Content */}
                  <div className="px-4 pb-4 pt-3">
                    <Component />
                  </div>
                </div>
              )
              })}
          </div>
        </div>

        {/* Bottom Row: Real-Time Tools */}
        <div className="space-y-4">
          <div className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Real-Time</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMPONENT_CATEGORIES.realtime.components
              .filter((comp: any) => 
                comp.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((comp: any) => {
                const Component = comp.component
                
                return (
                  <div 
                  key={comp.id} 
                  className="min-h-[300px] bg-gradient-to-br from-background via-background/95 to-background border border-border/30 rounded-xl overflow-hidden"
                >
                  {/* Component Content */}
                  <div className="px-4 pb-4 pt-3">
                    <Component />
                  </div>
                </div>
              )
              })}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-gradient-to-r from-background via-background/95 to-background border border-border/50 rounded-xl p-4 backdrop-blur-sm shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary/50" />
            <span className="text-sm text-muted-foreground/40 font-medium">
              Intelligence Hub v2.0 • Real-time analysis powered by AI
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/40 font-medium">
            <span>15 Analysis Tools</span>
            <span>•</span>
            <span>Real-time Data</span>
            <span>•</span>
            <span>AI Enhanced</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(IntelligencePanelV2), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
})
