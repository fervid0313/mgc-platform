"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import {
  Bell,
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
  Clock,
  CheckCircle2,
  XCircle,
  Volume2,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: string
  type: "level_break" | "session_transition" | "bias_shift" | "volume_spike" | "news_impact" | "technical_signal"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  market: string
  price?: number
  target?: number
  stopLoss?: number
  probability: number
  timeframe: string
  timestamp: string
  acknowledged: boolean
  actionRequired: boolean
  suggestedAction?: string
  expiry?: string
}

interface AlertSettings {
  enabled: boolean
  levelBreaks: boolean
  sessionTransitions: boolean
  biasShifts: boolean
  volumeSpikes: boolean
  newsImpacts: boolean
  technicalSignals: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
  minSeverity: "low" | "medium" | "high" | "critical"
  cooldownPeriod: number // minutes
}

interface AlertStats {
  total: number
  acknowledged: number
  accuracy: number
  falsePositives: number
  avgResponseTime: number
  performanceScore: number
}

// ─── Component ────────────────────────────────────────────────────────────────

function ActionableAlerts() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: true,
    levelBreaks: true,
    sessionTransitions: true,
    biasShifts: true,
    volumeSpikes: true,
    newsImpacts: true,
    technicalSignals: true,
    soundEnabled: true,
    desktopNotifications: true,
    minSeverity: "medium",
    cooldownPeriod: 5
  })
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      // Mock alerts data
      const mockAlerts: Alert[] = [
        {
          id: "1",
          type: "level_break",
          severity: "high",
          title: "Resistance Break Detected",
          message: "NQ100 breaking through key resistance at 15925.75 with strong volume confirmation.",
          market: "NQ100",
          price: 15928.50,
          target: 15975.00,
          stopLoss: 15875.25,
          probability: 0.85,
          timeframe: "15m",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          acknowledged: false,
          actionRequired: true,
          suggestedAction: "Consider long position with target at 15975.00",
          expiry: new Date(Date.now() + 900000).toISOString()
        },
        {
          id: "2",
          type: "session_transition",
          severity: "medium",
          title: "London Session Opening",
          message: "London session opening in 15 minutes. Expect increased volatility and volume.",
          market: "ES",
          probability: 0.72,
          timeframe: "1H",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          acknowledged: true,
          actionRequired: false,
          suggestedAction: "Monitor for breakout opportunities",
          expiry: new Date(Date.now() + 600000).toISOString()
        },
        {
          id: "3",
          type: "bias_shift",
          severity: "high",
          title: "Bias Shift Detected",
          message: "AI ensemble bias shifted from neutral to bullish (78% confidence). Multiple models confirming.",
          market: "BTC",
          probability: 0.78,
          timeframe: "4H",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          acknowledged: false,
          actionRequired: true,
          suggestedAction: "Review positions for bullish alignment",
          expiry: new Date(Date.now() + 1800000).toISOString()
        },
        {
          id: "4",
          type: "volume_spike",
          severity: "medium",
          title: "Unusual Volume Detected",
          message: "Volume spike detected in ES - 3x average volume with price movement.",
          market: "ES",
          price: 4525.75,
          probability: 0.65,
          timeframe: "5m",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          acknowledged: true,
          actionRequired: false,
          suggestedAction: "Monitor for continuation or reversal"
        },
        {
          id: "5",
          type: "news_impact",
          severity: "critical",
          title: "Breaking News Impact",
          message: "Fed announces unexpected policy change. High market impact expected.",
          market: "All",
          probability: 0.92,
          timeframe: "Immediate",
          timestamp: new Date(Date.now() - 1500000).toISOString(),
          acknowledged: false,
          actionRequired: true,
          suggestedAction: "Reduce position size, tighten stops",
          expiry: new Date(Date.now() + 3600000).toISOString()
        },
        {
          id: "6",
          type: "technical_signal",
          severity: "low",
          title: "Golden Cross Forming",
          message: "50-day MA crossing above 200-day MA on NQ100 daily chart.",
          market: "NQ100",
          probability: 0.58,
          timeframe: "1D",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          acknowledged: true,
          actionRequired: false,
          suggestedAction: "Watch for confirmation"
        }
      ]

      const mockStats: AlertStats = {
        total: 1247,
        acknowledged: 1098,
        accuracy: 0.76,
        falsePositives: 0.12,
        avgResponseTime: 3.2,
        performanceScore: 0.82
      }

      setAlerts(mockAlerts)
      setStats(mockStats)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[ALERTS] Error fetching alerts:", error)
    }
    setLoading(false)
  }, [])

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }, [])

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  // Update settings
  const updateSetting = useCallback((key: keyof AlertSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchAlerts()
    
    // Auto-refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtPercent = (value: number) => `${(value * 100).toFixed(0)}%`
  const fmtTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "low": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "level_break": return <Target className="h-3 w-3" />
      case "session_transition": return <Clock className="h-3 w-3" />
      case "bias_shift": return <TrendingUp className="h-3 w-3" />
      case "volume_spike": return <Volume2 className="h-3 w-3" />
      case "news_impact": return <AlertTriangle className="h-3 w-3" />
      case "technical_signal": return <BarChart3 className="h-3 w-3" />
      default: return <Bell className="h-3 w-3" />
    }
  }

  // Filter alerts based on settings
  const filteredAlerts = alerts.filter(alert => {
    if (!settings.enabled) return false
    if (settings.minSeverity === "high" && !["high", "critical"].includes(alert.severity)) return false
    if (settings.minSeverity === "critical" && alert.severity !== "critical") return false
    
    switch (alert.type) {
      case "level_break": return settings.levelBreaks
      case "session_transition": return settings.sessionTransitions
      case "bias_shift": return settings.biasShifts
      case "volume_spike": return settings.volumeSpikes
      case "news_impact": return settings.newsImpacts
      case "technical_signal": return settings.technicalSignals
      default: return true
    }
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Actionable Alerts...</span>
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
            <Bell className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-black">Actionable Alerts</span>
            {filteredAlerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                {filteredAlerts.filter(a => !a.acknowledged).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Settings className="h-3 w-3" />
            </button>
            <button
              onClick={fetchAlerts}
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
      {showSettings && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-lg border border-border/20 bg-background/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-foreground/60">Alerts Enabled</span>
              <button
                onClick={() => updateSetting('enabled', !settings.enabled)}
                className={`w-8 h-4 rounded-full transition-colors ${
                  settings.enabled ? "bg-emerald-500" : "bg-gray-500"
                }`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                  settings.enabled ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </button>
            </div>
            
            <div className="text-[8px] font-bold text-foreground/60 mb-1">Alert Types</div>
            <div className="space-y-1">
              {[
                { key: 'levelBreaks', label: 'Level Breaks' },
                { key: 'sessionTransitions', label: 'Session Transitions' },
                { key: 'biasShifts', label: 'Bias Shifts' },
                { key: 'volumeSpikes', label: 'Volume Spikes' },
                { key: 'newsImpacts', label: 'News Impacts' },
                { key: 'technicalSignals', label: 'Technical Signals' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[8px] text-muted-foreground/60">{label}</span>
                  <button
                    onClick={() => updateSetting(key as keyof AlertSettings, !settings[key as keyof AlertSettings])}
                    className={`w-6 h-3 rounded-full transition-colors ${
                      settings[key as keyof AlertSettings] ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                      settings[key as keyof AlertSettings] ? "translate-x-3" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-foreground/60">Min Severity</span>
              <select
                value={settings.minSeverity}
                onChange={(e) => updateSetting('minSeverity', e.target.value)}
                className="text-[8px] bg-background/50 border border-border/20 rounded px-2 py-1 text-foreground/70"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      <div className="px-4 pb-4 space-y-3">
        {/* ── Active Alerts ── */}
        <div>
          <div 
            onClick={() => toggleSection('active-alerts')}
            className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
          >
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Active Alerts</p>
            <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['active-alerts'] ? 'rotate-180' : ''}`} />
          </div>
          {!collapsedSections['active-alerts'] && (
            <div className="space-y-2">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, index) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.type)}
                        <div>
                          <div className="text-[10px] font-bold text-foreground/80 line-clamp-1">
                            {alert.title}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-muted-foreground/40">{alert.market}</span>
                            <span className="text-[8px] text-muted-foreground/30">{fmtTime(alert.timestamp)}</span>
                            {alert.actionRequired && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                                Action Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-[8px] text-muted-foreground/40 hover:text-foreground-60"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-[8px] text-muted-foreground/40 hover:text-foreground-60"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-[8px] text-muted-foreground/40 mb-2">
                      {alert.message}
                    </div>
                    
                    {alert.suggestedAction && (
                      <div className="text-[8px] text-blue-400 mb-2">
                        💡 {alert.suggestedAction}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40">
                      <span>Probability: {fmtPercent(alert.probability)}</span>
                      <span>•</span>
                      <span>{alert.timeframe}</span>
                      {alert.price && (
                        <>
                          <span>•</span>
                          <span>Price: {fmtPrice(alert.price)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Bell className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground/40">No active alerts</p>
                  <p className="text-[8px] text-muted-foreground/30">Monitoring market conditions...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Alert Statistics ── */}
        {stats && (
          <div>
            <div 
              onClick={() => toggleSection('alert-stats')}
              className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
            >
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Alert Statistics</p>
              <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['alert-stats'] ? 'rotate-180' : ''}`} />
            </div>
            {!collapsedSections['alert-stats'] && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                  <span className="text-[10px] font-bold text-foreground/60 w-16">Total</span>
                  <span className="text-[9px] font-bold text-purple-400">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-foreground/60 w-16">Acknowledged</span>
                  <span className="text-[9px] font-bold text-emerald-400">{stats.acknowledged}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="text-[10px] font-bold text-foreground/60 w-16">Accuracy</span>
                  <span className="text-[9px] font-bold text-blue-400">{fmtPercent(stats.accuracy)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
                  <span className="text-[10px] font-bold text-foreground/60 w-16">False Pos</span>
                  <span className="text-[9px] font-bold text-orange-400">{fmtPercent(stats.falsePositives)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-green-400 shrink-0" />
                  <span className="text-[10px] font-bold text-foreground/60 w-16">Response</span>
                  <span className="text-[9px] font-bold text-green-400">{stats.avgResponseTime.toFixed(1)}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3 text-yellow-400 shrink-0" />
                  <span className="text-[10px] font-bold text-foreground/60 w-16">Score</span>
                  <span className="text-[9px] font-bold text-yellow-400">{fmtPercent(stats.performanceScore)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ActionableAlerts), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
