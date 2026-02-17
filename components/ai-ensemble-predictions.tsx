"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/lib/store"
import { scaleFromNQ, scaleVolumeFromNQ } from "@/lib/market-data"
import {
  Brain,
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
  Users,
  CheckCircle2,
  XCircle,
  Star,
  GitBranch,
  Lightbulb,
  Clock,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelPrediction {
  model: "GPT-4o" | "Claude-3.5-Sonnet" | "Sentiment" | "Technical" | "Macro"
  prediction: {
    direction: "bullish" | "bearish" | "neutral"
    confidence: number
    target: number
    stopLoss: number
    timeframe: string
    reasoning: string
  }
  accuracy: {
    historical: number
    recent: number
    weighted: number
  }
  weight: number
  lastUpdate: string
}

interface ConsensusData {
  overallDirection: "bullish" | "bearish" | "neutral"
  overallConfidence: number
  consensus: number // 0-100
  disagreement: number // 0-100
  strongestSignal: string
  weakestSignal: string
}

interface EnsemblePrediction {
  consensus: ConsensusData
  models: ModelPrediction[]
  weightedPrediction: {
    direction: string
    confidence: number
    target: number
    stopLoss: number
    riskReward: number
    reasoning: string
  }
  performance: {
    totalPredictions: number
    accuracy: number
    profitFactor: number
    maxDrawdown: number
    sharpeRatio: number
  }
  learning: {
    adaptiveWeights: boolean
    promptOptimization: boolean
    accuracyTrend: "improving" | "declining" | "stable"
    lastOptimization: string
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function AIEnsemblePredictions({ market }: { market?: string }) {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [predictions, setPredictions] = useState<EnsemblePrediction | null>(null)
  const [selectedMarket, setSelectedMarket] = useState(market || "NQ100")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => { if (market) setSelectedMarket(market) }, [market])

  const p = (nqPrice: number) => scaleFromNQ(nqPrice, selectedMarket)

  const markets = ["NQ100", "ES", "BTC", "ETH", "US10Y"]

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Fetch ensemble predictions
  const fetchPredictions = useCallback(async (market: string) => {
    setLoading(true)
    try {
      // Mock data for now - will integrate with real AI APIs
      const mockPredictions: EnsemblePrediction = {
        consensus: {
          overallDirection: "bullish",
          overallConfidence: 0.82,
          consensus: 78,
          disagreement: 22,
          strongestSignal: "GPT-4o",
          weakestSignal: "Sentiment"
        },
        models: [
          {
            model: "GPT-4o",
            prediction: {
              direction: "bullish",
              confidence: 0.88,
              target: p(21935.00),
              stopLoss: p(21745.50),
              timeframe: "1H",
              reasoning: `Strong ${selectedMarket} technical setup with multi-timeframe alignment. Volume profile shows buying pressure above POC. Economic context supports risk-on.`
            },
            accuracy: {
              historical: 0.74,
              recent: 0.81,
              weighted: 0.78
            },
            weight: 0.35,
            lastUpdate: "2024-02-16T10:30:00Z"
          },
          {
            model: "Claude-3.5-Sonnet",
            prediction: {
              direction: "bullish",
              confidence: 0.85,
              target: p(21910.75),
              stopLoss: p(21720.25),
              timeframe: "4H",
              reasoning: "Market structure confirms bullish continuation. Order flow shows aggressive buying at key levels. Fed expectations remain dovish."
            },
            accuracy: {
              historical: 0.71,
              recent: 0.79,
              weighted: 0.75
            },
            weight: 0.30,
            lastUpdate: "2024-02-16T10:28:00Z"
          },
          {
            model: "Technical",
            prediction: {
              direction: "bullish",
              confidence: 0.92,
              target: p(22010.50),
              stopLoss: p(21775.00),
              timeframe: "1D",
              reasoning: "Perfect multi-timeframe alignment with 95% bullish consensus. Key resistance at 15925 with strong confluence. Volume confirms breakout potential."
            },
            accuracy: {
              historical: 0.68,
              recent: 0.85,
              weighted: 0.76
            },
            weight: 0.20,
            lastUpdate: "2024-02-16T10:32:00Z"
          },
          {
            model: "Sentiment",
            prediction: {
              direction: "neutral",
              confidence: 0.65,
              target: p(21855.25),
              stopLoss: p(21700.50),
              timeframe: "2H",
              reasoning: "Mixed signals from news sentiment. Some caution due to upcoming Fed meeting. Overall risk-on but with moderation."
            },
            accuracy: {
              historical: 0.62,
              recent: 0.58,
              weighted: 0.60
            },
            weight: 0.10,
            lastUpdate: "2024-02-16T10:25:00Z"
          },
          {
            model: "Macro",
            prediction: {
              direction: "bullish",
              confidence: 0.78,
              target: p(21880.00),
              stopLoss: p(21720.00),
              timeframe: "4H",
              reasoning: "Dovish Fed expectations with strong economic data. VIX remains low supporting equities. DXY weakening helps risk assets."
            },
            accuracy: {
              historical: 0.69,
              recent: 0.72,
              weighted: 0.70
            },
            weight: 0.05,
            lastUpdate: "2024-02-16T10:27:00Z"
          }
        ],
        weightedPrediction: {
          direction: "bullish_continuation",
          confidence: 0.82,
          target: p(21920.25),
          stopLoss: p(21745.50),
          riskReward: 2.1,
          reasoning: "Strong consensus (78%) among AI models with GPT-4o leading. Technical analysis provides highest confidence. Weighted approach balances different perspectives."
        },
        performance: {
          totalPredictions: 1247,
          accuracy: 0.76,
          profitFactor: 2.34,
          maxDrawdown: 0.08,
          sharpeRatio: 1.85
        },
        learning: {
          adaptiveWeights: true,
          promptOptimization: true,
          accuracyTrend: "improving",
          lastOptimization: "2024-02-16T09:00:00Z"
        }
      }
      
      setPredictions(mockPredictions)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[AI-ENSEMBLE] Error fetching predictions:", error)
    }
    setLoading(false)
  }, [p, selectedMarket])

  // Effects
  useEffect(() => {
    setMounted(true)
    fetchPredictions(selectedMarket)
  }, [selectedMarket])

  // Format helpers
  const fmtPrice = (price: number) => price.toFixed(2)
  const fmtPercent = (value: number) => `${(value * 100).toFixed(1)}%`
  const fmtTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Get direction color
  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bullish": return "text-emerald-400"
      case "bearish": return "text-red-400"
      case "neutral": return "text-yellow-400"
      default: return "text-muted-foreground/60"
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-emerald-500/10 text-emerald-400"
    if (confidence >= 0.6) return "bg-blue-500/10 text-blue-400"
    if (confidence >= 0.4) return "bg-yellow-500/10 text-yellow-400"
    return "bg-red-500/10 text-red-400"
  }

  // Get accuracy color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.75) return "text-emerald-400"
    if (accuracy >= 0.65) return "text-blue-400"
    if (accuracy >= 0.55) return "text-yellow-400"
    return "text-red-400"
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Loading AI Ensemble Predictions...</span>
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
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-black">AI Ensemble Predictions</span>
            {predictions && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getConfidenceColor(predictions.consensus.overallConfidence)}`}>
                {fmtPercent(predictions.consensus.consensus)}
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
              onClick={() => fetchPredictions(selectedMarket)}
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

      {/* ── Sections ── */}
      <div className="px-4 pb-4 space-y-3">
        {predictions && (
          <>
            {/* ── Consensus Overview ── */}
            <div>
              <div 
                onClick={() => toggleSection('consensus')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Consensus Overview</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['consensus'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['consensus'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Direction</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getDirectionColor(predictions.consensus.overallDirection)}`}>
                      {predictions.consensus.overallDirection.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getConfidenceColor(predictions.consensus.overallConfidence)}`}>
                      {fmtPercent(predictions.consensus.overallConfidence)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Consensus</span>
                    <span className="text-[9px] font-bold text-emerald-400">{fmtPercent(predictions.consensus.consensus / 100)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Disagree</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPercent(predictions.consensus.disagreement / 100)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Strongest</span>
                    <span className="text-[9px] font-bold text-yellow-400">{predictions.consensus.strongestSignal}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Individual Models ── */}
            <div>
              <div 
                onClick={() => toggleSection('models')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Individual Models</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['models'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['models'] && (
                <div className="space-y-2">
                  {predictions.models.map((model, index) => (
                    <div key={index} className="border border-border/20 rounded-lg p-2 bg-background/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Brain className="h-3 w-3 text-purple-400 shrink-0" />
                          <span className="text-[9px] font-bold text-foreground/80">{model.model}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getDirectionColor(model.prediction.direction)}`}>
                            {model.prediction.direction.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getConfidenceColor(model.prediction.confidence)}`}>
                            {fmtPercent(model.prediction.confidence)}
                          </span>
                          <span className="text-[8px] text-muted-foreground/40">{fmtPercent(model.weight)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[8px]">
                        <div className="flex items-center gap-1">
                          <Target className="h-2.5 w-2.5 text-green-400 shrink-0" />
                          <span className="text-green-400">{fmtPrice(model.prediction.target)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5 text-red-400 shrink-0" />
                          <span className="text-red-400">{fmtPrice(model.prediction.stopLoss)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                          <span className="text-blue-400">{model.prediction.timeframe}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground/50">Accuracy:</span>
                        <span className={`font-medium ${getAccuracyColor(model.accuracy.weighted)}`}>
                          {fmtPercent(model.accuracy.weighted)}
                        </span>
                        <span className="text-muted-foreground/40">({fmtTime(model.lastUpdate)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Weighted Prediction ── */}
            <div>
              <div 
                onClick={() => toggleSection('weighted-prediction')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Weighted Prediction</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['weighted-prediction'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['weighted-prediction'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Direction</span>
                    <span className="text-[9px] font-bold text-purple-400">
                      {predictions.weightedPrediction.direction.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Confidence</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getConfidenceColor(predictions.weightedPrediction.confidence)}`}>
                      {fmtPercent(predictions.weightedPrediction.confidence)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Target</span>
                    <span className="text-[9px] font-bold text-green-400">{fmtPrice(predictions.weightedPrediction.target)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Stop</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPrice(predictions.weightedPrediction.stopLoss)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">R:R</span>
                    <span className="text-[9px] font-bold text-orange-400">{predictions.weightedPrediction.riskReward.toFixed(2)}:1</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/40 mt-1">
                    {predictions.weightedPrediction.reasoning}
                  </div>
                </div>
              )}
            </div>

            {/* ── Performance Metrics ── */}
            <div>
              <div 
                onClick={() => toggleSection('performance')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Performance Metrics</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['performance'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['performance'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Accuracy</span>
                    <span className={`text-[9px] font-bold ${getAccuracyColor(predictions.performance.accuracy)}`}>
                      {fmtPercent(predictions.performance.accuracy)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Profit Factor</span>
                    <span className="text-[9px] font-bold text-green-400">{predictions.performance.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Max DD</span>
                    <span className="text-[9px] font-bold text-red-400">{fmtPercent(predictions.performance.maxDrawdown)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Sharpe</span>
                    <span className="text-[9px] font-bold text-blue-400">{predictions.performance.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Predictions</span>
                    <span className="text-[9px] font-bold text-purple-400">{predictions.performance.totalPredictions}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Learning & Optimization ── */}
            <div>
              <div 
                onClick={() => toggleSection('learning')}
                className="flex items-center justify-between mb-1.5 cursor-pointer hover:text-foreground/80 transition-colors"
              >
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Learning & Optimization</p>
                <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform ${!collapsedSections['learning'] ? 'rotate-180' : ''}`} />
              </div>
              {!collapsedSections['learning'] && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3 w-3 text-yellow-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Adaptive</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      predictions.learning.adaptiveWeights ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {predictions.learning.adaptiveWeights ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Prompt Opt</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      predictions.learning.promptOptimization ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {predictions.learning.promptOptimization ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Trend</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      predictions.learning.accuracyTrend === "improving" ? "bg-emerald-500/10 text-emerald-400" :
                      predictions.learning.accuracyTrend === "declining" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {predictions.learning.accuracyTrend}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-orange-400 shrink-0" />
                    <span className="text-[10px] font-bold text-foreground/60 w-16">Last Opt</span>
                    <span className="text-[8px] text-orange-400">{fmtTime(predictions.learning.lastOptimization)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(AIEnsemblePredictions), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
})
