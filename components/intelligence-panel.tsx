"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Newspaper,
  Zap,
  Calendar,
  Target,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

import SMTICTAnalysis from "./smt-ict-analysis"
import OrderFlowAnalysis from "./orderflow-analysis"
import VolumeProfileAnalysis from "./volume-profile-analysis"
import MarketStructureAnalysis from "./market-structure-analysis"
import MultiTimeframeAlignment from "./multi-timeframe-alignment"
import EconomicContext from "./economic-context"
import AIEnsemblePredictions from "./ai-ensemble-predictions"
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
    if (age > SENTIMENT_CACHE_DURATION) return null
    return cached.sentiment
  } catch { return null }
}

function saveCachedSentiment(market: string, sentiment: SentimentData) {
  localStorage.setItem(sentimentCacheKey(market), JSON.stringify({ sentiment, market, fetchedAt: new Date().toISOString() }))
}

function loadSelectedMarket(): string {
  if (typeof window === "undefined") return "NQ100"
  return localStorage.getItem(SELECTED_MARKET_KEY) || "NQ100"
}

// ─── Component ────────────────────────────────────────────────────────────────

function IntelligencePanel() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState("NQ100")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  // Data states
  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [sentimentLoading, setSentimentLoading] = useState(false)
  const [aiBias, setAiBias] = useState<BiasPrediction | null>(null)
  const [econEvents, setEconEvents] = useState<EconEvent[]>([])
  const [hodLod, setHodLod] = useState<HodLodData | null>(null)
  const [hodLodLoading, setHodLodLoading] = useState(false)

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch sentiment data
  const fetchSentiment = useCallback(async (market: string) => {
    setSentimentLoading(true)
    setSentiment(null)
    try {
      const res = await fetch(`/api/market-news?market=${market}`)
      if (res.ok) {
        const data = await res.json()
        if (data.sentiment) {
          setSentiment(data.sentiment)
          saveCachedSentiment(market, data.sentiment)
        }
      }
    } catch { /* silent */ }
    setSentimentLoading(false)
  }, [])

  // Fetch all data
  const fetchAll = useCallback(async (market: string, force = false) => {
    setLoading(true)
    try {
      // Fetch sentiment
      if (!force) {
        const cached = loadCachedSentiment(market)
        if (cached) { setSentiment(cached) }
        else { fetchSentiment(market) }
      } else {
        fetchSentiment(market)
      }

      // Fetch economic calendar data (same as EconomicCalendarButton)
      try {
        const eventsResponse = await fetch('/api/forex-calendar')
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          // Filter for today's events and format them
          const today = new Date()
          const todayEvents = eventsData
            .filter((event: any) => {
              const eventDate = new Date(event.date)
              return eventDate.toDateString() === today.toDateString()
            })
            .map((event: any) => ({
              time: event.time || 'TBD',
              event: event.event || event.title || 'Event',
              impact: event.impact || 'Medium'
            }))
          setEconEvents(todayEvents)
        }
      } catch (error) {
        console.error('[INTELLIGENCE-PANEL] Failed to fetch economic events:', error)
        setEconEvents([])
      }

      // Mock other data for now
      setAiBias({ bias: "bullish", confidence: 75, reasoning: "Strong momentum detected" })
      setHodLod({
        dailyHOD: { price: "15850.25", session: "RTH", time: "10:15" },
        dailyLOD: { price: "15675.50", session: "RTH", time: "09:45" },
        sessions: [
          { session: "ETH", status: "active", hodPrice: "15850.25", lodPrice: "15675.50" },
          { session: "RTH", status: "pending", hodPrice: "15850.25", lodPrice: "15675.50" },
        ]
      })
    } catch (err) {
      console.error("[INTELLIGENCE-PANEL] fetchAll error:", err)
    }
    setLoading(false)
  }, [fetchSentiment])

  // Effects
  useEffect(() => {
    setMounted(true)
    const market = loadSelectedMarket()
    setSelectedMarket(market)
    fetchAll(market, true)
  }, [fetchAll])

  // Handle market change
  const handleMarketChange = useCallback((market: string) => {
    setSelectedMarket(market)
    localStorage.setItem(SELECTED_MARKET_KEY, market)
    setDropdownOpen(false)
    setSentiment(null)
    setAiBias(null)
    setHodLod(null)
    fetchAll(market, true)
  }, [fetchAll])

  // Derived data
  const signals: ("bullish" | "bearish" | "neutral")[] = []
  if (aiBias) signals.push(aiBias.bias)
  if (sentiment) signals.push(sentiment.overallSentiment)
  
  const total = signals.length
  const bullCount = signals.filter((s) => s === "bullish").length
  const bearCount = signals.filter((s) => s === "bearish").length
  const consensusBias = bullCount > bearCount ? "bullish" : bearCount > bullCount ? "bearish" : "neutral"
  const allAgree = signals.length > 0 && new Set(signals).size === 1

  // Colors
  const conviction = 75
  const biasColor = consensusBias === "bullish" ? "text-emerald-400" : consensusBias === "bearish" ? "text-red-400" : "text-yellow-400"
  const biasBg = consensusBias === "bullish" ? "bg-emerald-500/10 border-emerald-500/20"
    : consensusBias === "bearish" ? "bg-red-500/10 border-red-500/20"
    : "bg-yellow-500/10 border-yellow-500/20"
  const biasIcon = consensusBias === "bullish" ? <TrendingUp className="h-4 w-4 text-emerald-400" />
    : consensusBias === "bearish" ? <TrendingDown className="h-4 w-4 text-red-400" />
    : <Minus className="h-4 w-4 text-yellow-400" />

  const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Intelligence Panel...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm overflow-hidden shadow-lg">
      {/* ── Header ── */}
      <div className="p-6 pb-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Intelligence Panel</span>
              <div className="text-xs text-muted-foreground/60">Advanced Trading Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="px-3 py-1.5 bg-background/50 border border-border/20 rounded-lg text-xs font-medium text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {MARKETS.map(market => (
                <option key={market.value} value={market.value}>{market.label}</option>
              ))}
            </select>
            <button
              onClick={() => fetchAll(selectedMarket, true)}
              disabled={loading}
              className="p-2 rounded-lg bg-background/50 border border-border/20 text-muted-foreground/60 hover:text-foreground/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40 mb-3">
          <span className="flex items-center gap-1">
            {biasIcon}
            <span className={biasColor}>{consensusBias.toUpperCase()}</span>
          </span>
          <span className="text-[8px] text-muted-foreground/50">{conviction}%</span>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="px-4 pb-4 space-y-3">

        {/* ── 1. Macro Pulse (News Sentiment) ── */}
        <div>
          <div 
            onClick={() => toggleSection('macro-pulse')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Macro Pulse</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['macro-pulse'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['macro-pulse'] && (
            <>
              {sentimentLoading && !sentiment ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/40">Analyzing...</span>
                </div>
              ) : sentiment ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Newspaper className="h-3 w-3 text-blue-400" />
                    <span className={`text-[10px] font-bold ${
                      sentiment.overallSentiment === "bullish" ? "text-emerald-400" : sentiment.overallSentiment === "bearish" ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {sentiment.overallSentiment.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-foreground/60 leading-snug mb-1.5">{sentiment.summary}</p>
                  {sentiment.keyThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sentiment.keyThemes.map((t, i) => (
                        <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-background/50 text-muted-foreground/50">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* ── 2. Model Consensus (Signals) ── */}
        {total > 0 && (
          <div>
            <div 
              onClick={() => toggleSection('model-consensus')}
              className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
            >
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Model Consensus</p>
              <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['model-consensus'] ? 'rotate-180' : ''}`} />
            </div>
            {!collapsedSections['model-consensus'] && (
              <div className="space-y-1">
                {aiBias && (
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">AI Model</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      aiBias.bias === "bullish" ? "bg-emerald-500/10 text-emerald-400" : aiBias.bias === "bearish" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>{aiBias.bias.toUpperCase()} {aiBias.confidence}%</span>
                  </div>
                )}
                {sentiment && (
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Sentiment</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      sentiment.overallSentiment === "bullish" ? "bg-emerald-500/10 text-emerald-400" : sentiment.overallSentiment === "bearish" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>{sentiment.overallSentiment.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 3. Session HOD / LOD ── */}
        <div>
          <div 
            onClick={() => toggleSection('hod-lod')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Session HOD / LOD</p>
            <div className="flex items-center gap-2">
              {hodLod && (
                <span className="text-[8px] text-muted-foreground/30">
                  HOD: {hodLod.dailyHOD.session} · LOD: {hodLod.dailyLOD.session}
                </span>
              )}
              <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['hod-lod'] ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {!collapsedSections['hod-lod'] && (
            <>
              {hodLodLoading && !hodLod ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/40">Predicting...</span>
                </div>
              ) : hodLod ? (
                <div className="space-y-2.5">
                  {hodLod.sessions.map((s) => (
                    <div key={s.session} className="p-2 rounded-lg border border-border/20 bg-background/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-foreground-60">{s.session}</span>
                          {s.status === "passed" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-muted-foreground/30">HOD: {s.hodPrice}</span>
                          <span className="text-[8px] text-muted-foreground/30">LOD: {s.lodPrice}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {s.hodNotes && (
                          <div className="text-[8px] text-muted-foreground/40 leading-snug">
                            {s.hodNotes}
                          </div>
                        )}
                        {s.lodNotes && (
                          <div className="text-[8px] text-muted-foreground/40 leading-snug">
                            {s.lodNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* ── 4. Today's Events ── */}
        <div>
          <div 
            onClick={() => {
              toggleSection('todays-events')
              // Open economic calendar in a new tab or modal
              const calendarButton = document.querySelector('[data-calendar-button]')
              if (calendarButton) {
                (calendarButton as HTMLElement).click()
              } else {
                // Fallback: open calendar page
                window.open('/analytics', '_blank')
              }
            }}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Today's Events</p>
            <div className="flex items-center gap-2">
              <span className="text-[7px] text-blue-400">Click for calendar</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  fetchAll(selectedMarket, true)
                }}
                className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              >
                <RefreshCw className="h-2.5 w-2.5" />
              </button>
              <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['todays-events'] ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {!collapsedSections['todays-events'] && (
            <div className="space-y-1">
              {econEvents.length > 0 ? (
                econEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Calendar className={`h-2.5 w-2.5 shrink-0 ${e.impact === "High" ? "text-red-400" : "text-yellow-400"}`} />
                    <span className="text-[9px] text-muted-foreground/50 w-12 shrink-0">{e.time}</span>
                    <span className="text-[9px] text-foreground/60 truncate">{e.event}</span>
                  </div>
                ))
              ) : (
                <div className="text-[9px] text-muted-foreground/40">No events today</div>
              )}
            </div>
          )}
        </div>

        {/* ── 5. SMT/ICT Analysis ── */}
        <div>
          <div 
            onClick={() => toggleSection('smt-ict')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">SMT/ICT Analysis</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['smt-ict'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['smt-ict'] && (
            <div className="space-y-2">
              <SMTICTAnalysis />
            </div>
          )}
        </div>

        {/* ── 6. Order Flow Analysis ── */}
        <div>
          <div 
            onClick={() => toggleSection('order-flow')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Order Flow Analysis</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['order-flow'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['order-flow'] && (
            <div className="space-y-2">
              <OrderFlowAnalysis />
            </div>
          )}
        </div>

        {/* ── 7. Volume Profile Analysis ── */}
        <div>
          <div 
            onClick={() => toggleSection('volume-profile')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Volume Profile Analysis</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['volume-profile'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['volume-profile'] && (
            <div className="space-y-2">
              <VolumeProfileAnalysis />
            </div>
          )}
        </div>

        {/* ── 8. Market Structure Analysis ── */}
        <div>
          <div 
            onClick={() => toggleSection('market-structure')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Market Structure Analysis</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['market-structure'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['market-structure'] && (
            <div className="space-y-2">
              <MarketStructureAnalysis />
            </div>
          )}
        </div>

        {/* ── 9. Multi-Timeframe Alignment ── */}
        <div>
          <div 
            onClick={() => toggleSection('multi-timeframe')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Multi-Timeframe Alignment</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['multi-timeframe'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['multi-timeframe'] && (
            <div className="space-y-2">
              <MultiTimeframeAlignment />
            </div>
          )}
        </div>

        {/* ── 10. Economic Context ── */}
        <div>
          <div 
            onClick={() => toggleSection('economic-context')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Economic Context</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['economic-context'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['economic-context'] && (
            <div className="space-y-2">
              <EconomicContext />
            </div>
          )}
        </div>

        {/* ── 11. AI Ensemble Predictions ── */}
        <div>
          <div 
            onClick={() => toggleSection('ai-ensemble')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">AI Ensemble Predictions</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['ai-ensemble'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['ai-ensemble'] && (
            <div className="space-y-2">
              <AIEnsemblePredictions />
            </div>
          )}
        </div>

        {/* ── 12. Real-Time Intelligence ── */}
        <div>
          <div 
            onClick={() => toggleSection('realtime-intelligence')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Real-Time Intelligence</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['realtime-intelligence'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['realtime-intelligence'] && (
            <div className="space-y-2">
              <RealTimeIntelligence />
            </div>
          )}
        </div>

        {/* ── 13. Actionable Alerts ── */}
        <div>
          <div 
            onClick={() => toggleSection('actionable-alerts')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Actionable Alerts</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['actionable-alerts'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['actionable-alerts'] && (
            <div className="space-y-2">
              <ActionableAlerts />
            </div>
          )}
        </div>

        {/* ── 14. Market Microstructure ── */}
        <div>
          <div 
            onClick={() => toggleSection('market-microstructure')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Market Microstructure</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['market-microstructure'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['market-microstructure'] && (
            <div className="space-y-2">
              <MarketMicrostructure />
            </div>
          )}
        </div>

        {/* ── 15. Visual Enhancements ── */}
        <div>
          <div 
            onClick={() => toggleSection('visual-enhancements')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Visual Enhancements</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['visual-enhancements'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['visual-enhancements'] && (
            <div className="space-y-2">
              <VisualEnhancements />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/20">
          <Zap className="h-2.5 w-2.5 text-primary/50" />
          <span className="text-[9px] text-muted-foreground/40">
            {allAgree ? "All signals agree" : total > 0 ? "Mixed signals" : "Waiting for data"} · Auto-fed into bias analysis
          </span>
        </div>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(IntelligencePanel), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
