"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
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
  DollarSign,
  Calendar,
  Clock,
  Globe,
  Building,
  Percent,
  Newspaper,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FedFundsData {
  currentRate: number
  expectedRate: number
  probability: number
  nextMeeting: string
  lastChange: string
  trend: "hawkish" | "dovish" | "neutral"
  impact: "positive" | "negative" | "neutral"
}

interface DXYCorrelation {
  dxy: number
  correlation: {
    gold: number
    btc: number
    es: number
    oil: number
    bonds: number
  }
  strength: "strong" | "moderate" | "weak"
  trend: "strengthening" | "weakening" | "stable"
  impact: "risk_on" | "risk_off" | "neutral"
}

interface VIXData {
  current: number
  termStructure: {
    oneMonth: number
    threeMonth: number
    sixMonth: number
    oneYear: number
  }
  regime: "contango" | "backwardation" | "flat"
  volatility: "low" | "normal" | "elevated" | "high"
  fearGreed: number // 0-100
  signal: "bullish" | "bearish" | "neutral"
}

interface EconomicIndicator {
  name: string
  current: number
  previous: number
  expected: number
  impact: "high" | "medium" | "low"
  trend: "improving" | "declining" | "stable"
  timestamp: string
}

interface EconomicContext {
  fedFunds: FedFundsData
  dxyCorrelation: DXYCorrelation
  vix: VIXData
  indicators: EconomicIndicator[]
  marketSentiment: {
    overall: "risk_on" | "risk_off" | "neutral"
    confidence: number
    keyDrivers: string[]
  }
  recommendations: {
    bias: string
    confidence: number
    reasoning: string
    riskFactors: string[]
    opportunities: string[]
  }
  warnings: Array<{
    type: string
    severity: "low" | "medium" | "high"
    message: string
    timeframe: string
  }>
}

// ─── Component ────────────────────────────────────────────────────────────────

function EconomicContext() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [context, setContext] = useState<EconomicContext | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch economic context
  const fetchContext = useCallback(async () => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real economic APIs
      const mockContext: EconomicContext = {
        fedFunds: {
          currentRate: 5.25,
          expectedRate: 5.00,
          probability: 0.75,
          nextMeeting: "2024-03-20",
          lastChange: "2023-07-26",
          trend: "dovish",
          impact: "positive"
        },
        dxyCorrelation: {
          dxy: 103.45,
          correlation: {
            gold: -0.78,
            btc: -0.65,
            es: -0.82,
            oil: -0.71,
            bonds: 0.85
          },
          strength: "strong",
          trend: "weakening",
          impact: "risk_on"
        },
        vix: {
          current: 16.8,
          termStructure: {
            oneMonth: 16.8,
            threeMonth: 18.2,
            sixMonth: 19.5,
            oneYear: 21.3
          },
          regime: "contango",
          volatility: "normal",
          fearGreed: 68,
          signal: "bullish"
        },
        indicators: [
          {
            name: "CPI YoY",
            current: 3.2,
            previous: 3.4,
            expected: 3.3,
            impact: "high",
            trend: "improving",
            timestamp: "2024-02-15T08:30:00Z"
          },
          {
            name: "Non-Farm Payrolls",
            current: 275,
            previous: 216,
            expected: 200,
            impact: "high",
            trend: "improving",
            timestamp: "2024-02-02T08:30:00Z"
          },
          {
            name: "GDP QoQ",
            current: 2.9,
            previous: 4.9,
            expected: 2.0,
            impact: "medium",
            trend: "declining",
            timestamp: "2024-01-25T08:30:00Z"
          },
          {
            name: "Retail Sales MoM",
            current: 0.8,
            previous: -0.2,
            expected: 0.2,
            impact: "medium",
            trend: "improving",
            timestamp: "2024-02-15T08:30:00Z"
          }
        ],
        marketSentiment: {
          overall: "risk_on",
          confidence: 0.72,
          keyDrivers: [
            "Dovish Fed expectations",
            "Strong labor market",
            "Moderating inflation",
            "Weakening DXY"
          ]
        },
        recommendations: {
          bias: "bullish_equities",
          confidence: 0.78,
          reasoning: "Strong risk-on environment with dovish Fed expectations and improving economic data. Lower volatility supports equity exposure.",
          riskFactors: [
            "Fed policy uncertainty",
            "Geopolitical tensions",
            "Earnings season volatility"
          ],
          opportunities: [
            "Growth stocks",
            "Technology sector",
            "Emerging markets",
            "Risk assets"
          ]
        },
        warnings: [
          {
            type: "Fed Meeting",
            severity: "medium",
            message: "Upcoming FOMC meeting could cause volatility",
            timeframe: "2 weeks"
          },
          {
            type: "Geopolitical",
            severity: "low",
            message: "Monitor Middle East tensions for market impact",
            timeframe: "ongoing"
          }
        ]
      }
      
      setContext(mockContext)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[ECONOMIC-CONTEXT] Error fetching context:", error)
    }
    setLoading(false)
  }, [])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchContext()
  }, [fetchContext])

  // Format helpers
  const fmtPercent = (value: number) => `${value.toFixed(1)}%`
  const fmtRate = (rate: number) => `${rate.toFixed(2)}%`
  const fmtDate = (date: string) => new Date(date).toLocaleDateString()
  const fmtTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Get trend color
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "bullish":
      case "improving":
      case "dovish":
      case "risk_on":
      case "strengthening":
        return "text-emerald-400"
      case "bearish":
      case "declining":
      case "hawkish":
      case "risk_off":
      case "weakening":
        return "text-red-400"
      case "neutral":
      case "stable":
      case "flat":
        return "text-yellow-400"
      default: return "text-muted-foreground/60"
    }
  }

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
      case "high":
        return "bg-emerald-500/10 text-emerald-400"
      case "negative":
      case "low":
        return "bg-red-500/10 text-red-400"
      case "neutral":
      case "medium":
        return "bg-yellow-500/10 text-yellow-400"
      default: return "bg-gray-500/10 text-gray-400"
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 text-red-400"
      case "medium": return "bg-yellow-500/10 text-yellow-400"
      case "low": return "bg-blue-500/10 text-blue-400"
      default: return "bg-gray-500/10 text-gray-400"
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading Economic Context...</span>
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
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black">Economic Context</span>
            {context && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(context.marketSentiment.overall)}`}>
                {context.marketSentiment.overall.replace('_', ' ')}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchContext()}
            disabled={loading}
            className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {lastUpdate && (
          <div className="text-[8px] text-muted-foreground/40 mb-3">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* ── Sections ── */}
      <div className="px-4 pb-4 space-y-3">
        {context && (
          <>
            {/* ── Fed Funds Futures ── */}
            <div>
              <div 
                onClick={() => toggleSection('fed-funds')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Fed Funds Futures</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['fed-funds'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['fed-funds'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Current</span>
                    <span className="text-[9px] font-bold text-purple-400">{fmtRate(context.fedFunds.currentRate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Expected</span>
                    <span className="text-[9px] font-bold text-blue-400">{fmtRate(context.fedFunds.expectedRate)}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtPercent(context.fedFunds.probability)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Next Meet</span>
                    <span className="text-[9px] font-bold text-orange-400">{fmtDate(context.fedFunds.nextMeeting)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Trend</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(context.fedFunds.trend)}`}>
                      {context.fedFunds.trend}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── DXY Correlation Matrix ── */}
            <div>
              <div 
                onClick={() => toggleSection('dxy-correlation')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">DXY Correlation</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['dxy-correlation'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['dxy-correlation'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">DXY</span>
                    <span className="text-[9px] font-bold text-green-400">{context.dxyCorrelation.dxy.toFixed(2)}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(context.dxyCorrelation.trend)}`}>
                      {context.dxyCorrelation.trend}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px]">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/50">Gold:</span>
                      <span className={`font-medium ${context.dxyCorrelation.correlation.gold < -0.5 ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                        {context.dxyCorrelation.correlation.gold.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/50">BTC:</span>
                      <span className={`font-medium ${context.dxyCorrelation.correlation.btc < -0.5 ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                        {context.dxyCorrelation.correlation.btc.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/50">ES:</span>
                      <span className={`font-medium ${context.dxyCorrelation.correlation.es < -0.5 ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                        {context.dxyCorrelation.correlation.es.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/50">Oil:</span>
                      <span className={`font-medium ${context.dxyCorrelation.correlation.oil < -0.5 ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                        {context.dxyCorrelation.correlation.oil.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/50">Bonds:</span>
                      <span className={`font-medium ${context.dxyCorrelation.correlation.bonds > 0.5 ? "text-red-400" : "text-muted-foreground/60"}`}>
                        {context.dxyCorrelation.correlation.bonds.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/50">Impact:</span>
                      <span className={`font-medium ${getTrendColor(context.dxyCorrelation.impact)}`}>
                        {context.dxyCorrelation.impact.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── VIX Term Structure ── */}
            <div>
              <div 
                onClick={() => toggleSection('vix-structure')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">VIX Term Structure</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['vix-structure'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['vix-structure'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Current</span>
                    <span className="text-[9px] font-bold text-orange-400">{context.vix.current.toFixed(1)}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(context.vix.signal)}`}>
                      {context.vix.signal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Regime</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      context.vix.regime === "contango" ? "bg-emerald-500/10 text-emerald-400" :
                      context.vix.regime === "backwardation" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {context.vix.regime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Volatility</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      context.vix.volatility === "low" ? "bg-emerald-500/10 text-emerald-400" :
                      context.vix.volatility === "normal" ? "bg-blue-500/10 text-blue-400" :
                      context.vix.volatility === "elevated" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {context.vix.volatility}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Fear/Greed</span>
                    <span className="text-[9px] font-bold text-green-400">{context.vix.fearGreed}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] text-muted-foreground/50">
                    <div>1M: {context.vix.termStructure.oneMonth.toFixed(1)}</div>
                    <div>3M: {context.vix.termStructure.threeMonth.toFixed(1)}</div>
                    <div>6M: {context.vix.termStructure.sixMonth.toFixed(1)}</div>
                    <div>1Y: {context.vix.termStructure.oneYear.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Economic Indicators ── */}
            <div>
              <div 
                onClick={() => toggleSection('indicators')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Economic Indicators</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['indicators'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['indicators'] && (
                <div className="space-y-1">
                  {context.indicators.map((indicator, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Newspaper className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/60 w-20">{indicator.name}</span>
                      <span className="text-[9px] font-bold text-foreground/80">{indicator.current}</span>
                      <span className="text-[8px] text-muted-foreground/40">vs {indicator.expected}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getImpactColor(indicator.impact)}`}>
                        {indicator.impact}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getTrendColor(indicator.trend)}`}>
                        {indicator.trend}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Market Sentiment ── */}
            <div>
              <div 
                onClick={() => toggleSection('sentiment')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Market Sentiment</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['sentiment'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['sentiment'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Overall</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getTrendColor(context.marketSentiment.overall)}`}>
                      {context.marketSentiment.overall.replace('_', ' ')}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtPercent(context.marketSentiment.confidence)}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40">
                    <div className="font-bold mb-1">Key Drivers:</div>
                    {context.marketSentiment.keyDrivers.map((driver, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <span className="text-emerald-400">•</span>
                        <span>{driver}</span>
                      </div>
                    ))}
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
                    <Target className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Bias</span>
                    <span className="text-[9px] font-bold text-emerald-400">{context.recommendations.bias.replace('_', ' ')}</span>
                    <span className="text-[8px] text-muted-foreground/40">{fmtPercent(context.recommendations.confidence)}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {context.recommendations.reasoning}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className="text-[8px] font-bold text-red-400 mb-1">Risk Factors:</div>
                      {context.recommendations.riskFactors.map((risk, index) => (
                        <div key={index} className="text-[8px] text-muted-foreground/40">• {risk}</div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-emerald-400 mb-1">Opportunities:</div>
                      {context.recommendations.opportunities.map((opportunity, index) => (
                        <div key={index} className="text-[8px] text-muted-foreground/40">• {opportunity}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Warnings ── */}
            {context.warnings.length > 0 && (
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
                    {context.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className={`h-3 w-3 shrink-0 ${getSeverityColor(warning.severity).split(' ')[1]}`} />
                        <span className="text-[10px] font-bold text-foreground/60 w-16">{warning.type}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getSeverityColor(warning.severity)}`}>
                          {warning.severity}
                        </span>
                        <span className="text-[8px] text-muted-foreground/40">{warning.message}</span>
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

export default dynamic(() => Promise.resolve(EconomicContext), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
