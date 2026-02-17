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
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Play,
  Pause,
  Settings,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceLevel {
  price: number
  type: "support" | "resistance" | "poc" | "vah" | "val" | "target" | "stop"
  strength: number
  probability: number
  source: string
  timestamp: string
  hit?: boolean
  hitTime?: string
}

interface SessionInfo {
  name: string
  status: "active" | "upcoming" | "closed"
  openTime: string
  closeTime: string
  timeRemaining: number
  countdown: string
  timezone: string
}

interface LevelHistory {
  level: number
  type: string
  hitTime: string
  approachPrice: number
  bouncePrice?: number
  breakPrice?: number
  strength: number
  accuracy: number
}

interface LivePriceData {
  current: number
  open: number
  high: number
  low: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
  bid: number
  ask: number
  spread: number
}

interface VisualEnhancements {
  priceData: LivePriceData
  priceLevels: PriceLevel[]
  sessions: SessionInfo[]
  levelHistory: LevelHistory[]
  overlay: {
    enabled: boolean
    showTargets: boolean
    showStops: boolean
    showVolume: boolean
    showSessions: boolean
    opacity: number
    animationSpeed: number
  }
  settings: {
    autoRefresh: boolean
    refreshInterval: number
    showHistory: boolean
    maxHistoryItems: number
    colorScheme: "default" | "dark" | "vibrant"
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function VisualEnhancements({ market }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [enhancements, setEnhancements] = useState<VisualEnhancements | null>(null)
  const [selectedMarket, setSelectedMarket] = useState(market || "NQ100")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

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

  // Fetch visual enhancements data
  const fetchEnhancements = useCallback(async (market: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real price APIs
      const mockEnhancements: VisualEnhancements = {
        priceData: {
          current: p(21805.50),
          open: p(21720.25),
          high: p(21825.75),
          low: p(21695.50),
          change: p(85.25),
          changePercent: 0.51,
          volume: v(125000000),
          timestamp: new Date().toISOString(),
          bid: p(21805.25),
          ask: p(21805.75),
          spread: 0.50
        },
        priceLevels: [
          {
            price: p(21910.75),
            type: "resistance",
            strength: 0.92,
            probability: 0.85,
            source: "Volume Profile",
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            price: p(21745.50),
            type: "support",
            strength: 0.88,
            probability: 0.82,
            source: "Market Structure",
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          {
            price: p(21832.50),
            type: "target",
            strength: 0.75,
            probability: 0.78,
            source: "AI Prediction",
            timestamp: new Date(Date.now() - 1800000).toISOString()
          },
          {
            price: p(21720.25),
            type: "stop",
            strength: 0.65,
            probability: 0.68,
            source: "Risk Management",
            timestamp: new Date(Date.now() - 900000).toISOString()
          },
          {
            price: p(21784.00),
            type: "poc",
            strength: 0.95,
            probability: 0.90,
            source: "Volume Profile",
            timestamp: new Date(Date.now() - 5400000).toISOString(),
            hit: true,
            hitTime: new Date(Date.now() - 600000).toISOString()
          }
        ],
        sessions: [
          {
            name: "London",
            status: "active",
            openTime: "03:00",
            closeTime: "11:30",
            timeRemaining: 3600000,
            countdown: "1h 00m",
            timezone: "GMT"
          },
          {
            name: "New York",
            status: "active",
            openTime: "08:00",
            closeTime: "16:00",
            timeRemaining: 7200000,
            countdown: "2h 00m",
            timezone: "EST"
          },
          {
            name: "Asian",
            status: "upcoming",
            openTime: "19:00",
            closeTime: "03:00",
            timeRemaining: 46800000,
            countdown: "13h 00m",
            timezone: "JST"
          }
        ],
        levelHistory: [
          {
            level: p(21784.00),
            type: "poc",
            hitTime: new Date(Date.now() - 600000).toISOString(),
            approachPrice: p(21780.50),
            bouncePrice: p(21800.75),
            strength: 0.95,
            accuracy: 0.88
          },
          {
            level: p(21720.25),
            type: "support",
            hitTime: new Date(Date.now() - 3600000).toISOString(),
            approachPrice: p(21722.75),
            bouncePrice: p(21745.50),
            strength: 0.88,
            accuracy: 0.92
          },
          {
            level: p(21880.00),
            type: "resistance",
            hitTime: new Date(Date.now() - 7200000).toISOString(),
            approachPrice: p(21875.25),
            breakPrice: p(21885.50),
            strength: 0.78,
            accuracy: 0.75
          }
        ],
        overlay: {
          enabled: true,
          showTargets: true,
          showStops: true,
          showVolume: true,
          showSessions: true,
          opacity: 0.8,
          animationSpeed: 1.0
        },
        settings: {
          autoRefresh: true,
          refreshInterval: 1000,
          showHistory: true,
          maxHistoryItems: 10,
          colorScheme: "default"
        }
      }
      
      setEnhancements(mockEnhancements)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[VISUAL-ENHANCEMENTS] Error fetching data:", error)
    }
    setLoading(false)
  }, [p, v, selectedMarket])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchEnhancements(selectedMarket)
    
    // Auto-refresh for live price
    let interval: NodeJS.Timeout
    if (enhancements?.settings.autoRefresh) {
      interval = setInterval(() => fetchEnhancements(selectedMarket), enhancements.settings.refreshInterval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedMarket, enhancements?.settings.autoRefresh, enhancements?.settings.refreshInterval])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtPercent = (value: number) => `${value.toFixed(2)}%`
  const fmtVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }
  const fmtTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Get level type color
  const getLevelTypeColor = (type: string) => {
    switch (type) {
      case "resistance": return "text-red-400"
      case "support": return "text-emerald-400"
      case "target": return "text-blue-400"
      case "stop": return "text-orange-400"
      case "poc": return "text-purple-400"
      case "vah": return "text-pink-400"
      case "val": return "text-yellow-400"
      default: return "text-muted-foreground/60"
    }
  }

  // Get session status color
  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-400"
      case "upcoming": return "bg-blue-500/10 text-blue-400"
      case "closed": return "bg-gray-500/10 text-gray-400"
      default: return "bg-gray-500/10 text-gray-400"
    }
  }

  // Update overlay setting
  const updateOverlaySetting = useCallback((key: keyof VisualEnhancements['overlay'], value: any) => {
    if (enhancements) {
      setEnhancements(prev => prev ? {
        ...prev,
        overlay: { ...prev.overlay, [key]: value }
      } : null)
    }
  }, [enhancements])

  // Update setting
  const updateSetting = useCallback((key: keyof VisualEnhancements['settings'], value: any) => {
    if (enhancements) {
      setEnhancements(prev => prev ? {
        ...prev,
        settings: { ...prev.settings, [key]: value }
      } : null)
    }
  }, [enhancements])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Visual Enhancements...</span>
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
            <Eye className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Visual Enhancements</span>
            {enhancements && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                enhancements.overlay.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
              }`}>
                {enhancements.overlay.enabled ? "Live" : "Paused"}
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
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Settings className="h-3 w-3" />
            </button>
            <button
              onClick={() => fetchEnhancements(selectedMarket)}
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

      {/* ── Settings Panel ── */}
      {showSettings && enhancements && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-lg border border-border/20 bg-background/20 space-y-2">
            <div className="text-[8px] font-bold text-foreground/60 mb-1">Overlay Settings</div>
            <div className="space-y-1">
              {[
                { key: 'enabled', label: 'Live Overlay' },
                { key: 'showTargets', label: 'Show Targets' },
                { key: 'showStops', label: 'Show Stops' },
                { key: 'showVolume', label: 'Show Volume' },
                { key: 'showSessions', label: 'Show Sessions' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[8px] text-muted-foreground/60">{label}</span>
                  <button
                    onClick={() => updateOverlaySetting(key as keyof VisualEnhancements['overlay'], !enhancements.overlay[key as keyof VisualEnhancements['overlay']])}
                    className={`w-6 h-3 rounded-full transition-colors ${
                      enhancements.overlay[key as keyof VisualEnhancements['overlay']] ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                      enhancements.overlay[key as keyof VisualEnhancements['overlay']] ? "translate-x-3" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-foreground/60">Refresh Rate</span>
              <select
                value={enhancements.settings.refreshInterval}
                onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                className="text-[8px] bg-background/50 border border-border/20 rounded px-2 py-1 text-foreground/70"
              >
                <option value="500">0.5s</option>
                <option value="1000">1s</option>
                <option value="2000">2s</option>
                <option value="5000">5s</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      <div className="px-4 pb-4 space-y-3">
        {enhancements && (
          <>
            {/* ── Live Price Overlay ── */}
            <div>
              <div 
                onClick={() => toggleSection('live-price')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Live Price Overlay</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['live-price'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['live-price'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-12">Current</span>
                    <span className="text-[10px] font-bold text-green-400">{fmtPrice(enhancements.priceData.current)}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      enhancements.priceData.change > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {enhancements.priceData.change > 0 ? "+" : ""}{fmtPercent(enhancements.priceData.changePercent)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-12">Range</span>
                    <span className="text-[9px] text-blue-400">{fmtPrice(enhancements.priceData.low)}</span>
                    <span className="text-[8px] text-muted-foreground/40">-</span>
                    <span className="text-[9px] text-red-400">{fmtPrice(enhancements.priceData.high)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-12">Volume</span>
                    <span className="text-[9px] font-bold text-purple-400">{fmtVolume(enhancements.priceData.volume)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-12">Spread</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtPrice(enhancements.priceData.spread)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] text-muted-foreground/40">
                    <div>Bid: {fmtPrice(enhancements.priceData.bid)}</div>
                    <div>Ask: {fmtPrice(enhancements.priceData.ask)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Price Levels ── */}
            <div>
              <div 
                onClick={() => toggleSection('price-levels')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Price Levels</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['price-levels'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['price-levels'] && (
                <div className="space-y-1">
                  {enhancements.priceLevels.map((level, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Target className={`h-3 w-3 shrink-0 ${getLevelTypeColor(level.type)}`} />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(level.price)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getLevelTypeColor(level.type)}`}>
                        {level.type.toUpperCase()}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{level.source}</span>
                      {level.hit && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          HIT
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Session Countdown ── */}
            <div>
              <div 
                onClick={() => toggleSection('session-countdown')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Session Countdown</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['session-countdown'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['session-countdown'] && (
                <div className="space-y-1">
                  {enhancements.sessions.map((session, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-12">{session.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getSessionStatusColor(session.status)}`}>
                        {session.status.toUpperCase()}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{session.countdown}</span>
                      <span className="text-[8px] text-muted-foreground/30">{session.openTime}-{session.closeTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Level Hit History ── */}
            <div>
              <div 
                onClick={() => toggleSection('level-history')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Level Hit History</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['level-history'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['level-history'] && (
                <div className="space-y-1">
                  {enhancements.levelHistory.map((history, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-16">{fmtPrice(history.level)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getLevelTypeColor(history.type)}`}>
                        {history.type.toUpperCase()}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">{fmtTime(history.hitTime)}</span>
                      <span className="text-[8px] text-blue-400">{fmtPercent(history.accuracy)}</span>
                      {history.bouncePrice && (
                        <span className="text-[8px] text-emerald-400">Bounce</span>
                      )}
                      {history.breakPrice && (
                        <span className="text-[8px] text-red-400">Break</span>
                      )}
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

export default dynamic(() => Promise.resolve(VisualEnhancements), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
