"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface PredictionModel {
  id: string
  name: string
  type: "lstm" | "ensemble" | "sentiment_fusion" | "anomaly_detection"
  market: string
  timeframe: string
  prediction: {
    direction: "bullish" | "bearish" | "neutral"
    confidence: number
    targetPrice: number
    timeHorizon: string
    probability: number
  }
  performance: {
    accuracy: number
    sharpeRatio: number
    maxDrawdown: number
    totalReturn: number
    winRate: number
  }
  lastUpdated: string
  status: "active" | "training" | "inactive"
}

interface EnsembleWeight {
  model: string
  weight: number
  performance: number
  contribution: number
}

interface AnomalyAlert {
  id: string
  market: string
  type: "volume_spike" | "price_anomaly" | "volatility_anomaly" | "correlation_breakdown"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  confidence: number
  timestamp: string
  acknowledged: boolean
}

interface SentimentData {
  source: string
  sentiment: "bullish" | "bearish" | "neutral"
  score: number
  volume: number
  impact: number
  timestamp: string
}

const MARKETS = ["NQ100", "ES", "Gold", "Silver", "BTC", "Oil", "DXY", "VIX", "US10Y"]
const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"]

export function PredictiveAI() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("models")
  const [models, setModels] = useState<PredictionModel[]>([])
  const [ensembleWeights, setEnsembleWeights] = useState<EnsembleWeight[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([])
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [selectedMarket, setSelectedMarket] = useState("all")
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(true)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchPredictiveData()
    
    const interval = setInterval(() => {
      fetchPredictiveData()
    }, 45000) // Update every 45 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Fetch predictive AI data
  const fetchPredictiveData = useCallback(async () => {
    setLoading(true)
    try {
      // Mock predictive models
      const mockModels: PredictionModel[] = [
        {
          id: "1",
          name: "LSTM Price Predictor",
          type: "lstm",
          market: "NQ100",
          timeframe: "15m",
          prediction: {
            direction: "bullish",
            confidence: 87,
            targetPrice: 15450,
            timeHorizon: "2h",
            probability: 0.73,
          },
          performance: {
            accuracy: 82.5,
            sharpeRatio: 2.1,
            maxDrawdown: -6.8,
            totalReturn: 34.2,
            winRate: 71.3,
          },
          lastUpdated: new Date().toISOString(),
          status: "active",
        },
        {
          id: "2",
          name: "Ensemble Model",
          type: "ensemble",
          market: "ES",
          timeframe: "30m",
          prediction: {
            direction: "bearish",
            confidence: 79,
            targetPrice: 4480,
            timeHorizon: "4h",
            probability: 0.68,
          },
          performance: {
            accuracy: 78.9,
            sharpeRatio: 1.8,
            maxDrawdown: -8.2,
            totalReturn: 28.7,
            winRate: 68.5,
          },
          lastUpdated: new Date(Date.now() - 300000).toISOString(),
          status: "active",
        },
        {
          id: "3",
          name: "Sentiment Fusion",
          type: "sentiment_fusion",
          market: "BTC",
          timeframe: "1h",
          prediction: {
            direction: "bullish",
            confidence: 91,
            targetPrice: 52000,
            timeHorizon: "6h",
            probability: 0.85,
          },
          performance: {
            accuracy: 85.2,
            sharpeRatio: 2.4,
            maxDrawdown: -5.5,
            totalReturn: 42.1,
            winRate: 74.8,
          },
          lastUpdated: new Date(Date.now() - 600000).toISOString(),
          status: "active",
        },
        {
          id: "4",
          name: "Anomaly Detector",
          type: "anomaly_detection",
          market: "Gold",
          timeframe: "30m",
          prediction: {
            direction: "neutral",
            confidence: 65,
            targetPrice: 2380,
            timeHorizon: "1h",
            probability: 0.52,
          },
          performance: {
            accuracy: 72.1,
            sharpeRatio: 1.5,
            maxDrawdown: -9.2,
            totalReturn: 22.4,
            winRate: 64.2,
          },
          lastUpdated: new Date(Date.now() - 900000).toISOString(),
          status: "training",
        },
      ]

      // Mock ensemble weights
      const mockEnsemble: EnsembleWeight[] = [
        { model: "LSTM Price Predictor", weight: 0.35, performance: 82.5, contribution: 28.9 },
        { model: "Sentiment Fusion", weight: 0.30, performance: 85.2, contribution: 25.6 },
        { model: "Technical Analysis", weight: 0.20, performance: 68.3, contribution: 13.7 },
        { model: "Market Microstructure", weight: 0.15, performance: 71.8, contribution: 10.8 },
      ]

      // Mock anomalies
      const mockAnomalies: AnomalyAlert[] = [
        {
          id: "1",
          market: "NQ100",
          type: "volume_spike",
          severity: "high",
          description: "Unusual volume spike detected - 3x average volume",
          confidence: 92,
          timestamp: new Date(Date.now() - 180000).toISOString(),
          acknowledged: false,
        },
        {
          id: "2",
          market: "BTC",
          type: "price_anomaly",
          severity: "medium",
          description: "Price deviation from predicted range by 2.3%",
          confidence: 78,
          timestamp: new Date(Date.now() - 420000).toISOString(),
          acknowledged: false,
        },
        {
          id: "3",
          market: "ES",
          type: "volatility_anomaly",
          severity: "low",
          description: "Volatility regime change detected",
          confidence: 65,
          timestamp: new Date(Date.now() - 720000).toISOString(),
          acknowledged: true,
        },
      ]

      // Mock sentiment data
      const mockSentiment: SentimentData[] = [
        { source: "Twitter", sentiment: "bullish", score: 0.73, volume: 12500, impact: 0.8, timestamp: new Date().toISOString() },
        { source: "Reddit", sentiment: "neutral", score: 0.51, volume: 8900, impact: 0.6, timestamp: new Date(Date.now() - 300000).toISOString() },
        { source: "News", sentiment: "bearish", score: 0.32, volume: 15600, impact: 0.9, timestamp: new Date(Date.now() - 600000).toISOString() },
        { source: "Telegram", sentiment: "bullish", score: 0.68, volume: 5400, impact: 0.4, timestamp: new Date(Date.now() - 900000).toISOString() },
      ]

      setModels(mockModels)
      setEnsembleWeights(mockEnsemble)
      setAnomalies(mockAnomalies)
      setSentimentData(mockSentiment)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error("Failed to fetch predictive data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get model type color
  const getModelColor = (type: string) => {
    switch (type) {
      case "lstm": return "text-purple-400"
      case "ensemble": return "text-blue-400"
      case "sentiment_fusion": return "text-green-400"
      case "anomaly_detection": return "text-orange-400"
      default: return "text-gray-400"
    }
  }

  // Get prediction direction icon
  const getDirectionIcon = (direction: string) => {
    return direction === "bullish" ? <TrendingUp className="h-3 w-3 text-green-400" /> :
           direction === "bearish" ? <TrendingDown className="h-3 w-3 text-red-400" /> :
           <Activity className="h-3 w-3 text-gray-400" />
  }

  // Get anomaly severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500"
      case "high": return "text-red-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  // Acknowledge anomaly
  const acknowledgeAnomaly = useCallback((id: string) => {
    setAnomalies(prev => prev.map(anomaly => 
      anomaly.id === id ? { ...anomaly, acknowledged: true } : anomaly
    ))
  }, [])

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-black">Predictive AI</span>
            {models.filter(m => m.status === "active").length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                {models.filter(m => m.status === "active").length}
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
              onClick={fetchPredictiveData}
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
            { id: "models", label: "Models", icon: Brain },
            { id: "ensemble", label: "Ensemble", icon: BarChart3 },
            { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
            { id: "sentiment", label: "Sentiment", icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
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
        {/* AI Models */}
        {activeTab === "models" && (
          <div className="space-y-3">
            {models.length > 0 ? (
              models.map(model => (
                <div key={model.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className={`h-3 w-3 ${getModelColor(model.type)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground/60">
                          {model.name}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {model.market} · {model.timeframe}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        model.status === "active" ? "bg-green-500/10 text-green-400" :
                        model.status === "training" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-gray-500/10 text-gray-400"
                      }`}>
                        {model.status}
                      </span>
                      {getDirectionIcon(model.prediction.direction)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[8px] text-muted-foreground/40 mb-2">
                    <div>
                      <span>Target:</span>
                      <span className="ml-1 text-foreground/60">{model.prediction.targetPrice}</span>
                    </div>
                    <div>
                      <span>Confidence:</span>
                      <span className="ml-1 text-blue-400">{model.prediction.confidence}%</span>
                    </div>
                    <div>
                      <span>Horizon:</span>
                      <span className="ml-1 text-foreground/60">{model.prediction.timeHorizon}</span>
                    </div>
                    <div>
                      <span>Probability:</span>
                      <span className="ml-1 text-purple-400">{(model.prediction.probability * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {showDetails && (
                    <div className="grid grid-cols-3 gap-2 text-[8px] p-2 bg-background/30 rounded">
                      <div>
                        <span className="text-muted-foreground/50">Accuracy:</span>
                        <span className="ml-1 text-green-400">{model.performance.accuracy.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Sharpe:</span>
                        <span className="ml-1 text-blue-400">{model.performance.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Win Rate:</span>
                        <span className="ml-1 text-purple-400">{model.performance.winRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Brain className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No AI models</p>
                <p className="text-[8px] text-muted-foreground/30">Training models...</p>
              </div>
            )}
          </div>
        )}

        {/* Ensemble Weights */}
        {activeTab === "ensemble" && (
          <div className="space-y-3">
            {ensembleWeights.length > 0 ? (
              <>
                <div className="p-3 bg-background/20 rounded-lg border border-border/20">
                  <div className="text-[10px] font-bold text-foreground/60 mb-2">Ensemble Model Weights</div>
                  <div className="space-y-2">
                    {ensembleWeights.map((weight, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-[9px] text-foreground/60 mb-1">{weight.model}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-background/30 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-purple-400"
                                style={{ width: `${weight.weight * 100}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-purple-400 min-w-[35px]">
                              {(weight.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] text-green-400">{weight.performance.toFixed(1)}%</div>
                          <div className="text-[8px] text-muted-foreground/40">{weight.contribution.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-2 bg-background/20 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Combined Performance</div>
                  <div className="text-[10px] font-bold text-green-400 mt-1">
                    Accuracy: {ensembleWeights.reduce((sum, w) => sum + w.performance * w.weight, 0).toFixed(1)}%
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <BarChart3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No ensemble data</p>
                <p className="text-[8px] text-muted-foreground/30">Calculating weights...</p>
              </div>
            )}
          </div>
        )}

        {/* Anomaly Detection */}
        {activeTab === "anomalies" && (
          <div className="space-y-3">
            {anomalies.filter(a => !a.acknowledged).length > 0 ? (
              anomalies.filter(a => !a.acknowledged).map(anomaly => (
                <div key={anomaly.id} className={`p-3 rounded-lg border ${
                  anomaly.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  anomaly.severity === "high" ? "border-orange-500/30 bg-orange-500/5" :
                  anomaly.severity === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-blue-500/30 bg-blue-500/5"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-3 w-3 ${getSeverityColor(anomaly.severity)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground/60">
                          {anomaly.market} - {anomaly.type.replace('_', ' ')}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {new Date(anomaly.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                      <button
                        onClick={() => acknowledgeAnomaly(anomaly.id)}
                        className="text-[8px] text-muted-foreground/40 hover:text-foreground/60"
                      >
                        Ack
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[8px] text-muted-foreground/40 mb-1">{anomaly.description}</p>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40">
                    <span>Confidence: {anomaly.confidence}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No anomalies detected</p>
                <p className="text-[8px] text-muted-foreground/30">Monitoring for unusual patterns...</p>
              </div>
            )}
          </div>
        )}

        {/* Sentiment Fusion */}
        {activeTab === "sentiment" && (
          <div className="space-y-3">
            {sentimentData.length > 0 ? (
              <>
                <div className="p-3 bg-background/20 rounded-lg border border-border/20">
                  <div className="text-[10px] font-bold text-foreground/60 mb-2">Sentiment Fusion Analysis</div>
                  <div className="space-y-2">
                    {sentimentData.map((sentiment, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-foreground/60">{sentiment.source}</span>
                          <div className="flex-1 bg-background/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sentiment.sentiment === "bullish" ? "bg-green-400" :
                                sentiment.sentiment === "bearish" ? "bg-red-400" :
                                "bg-gray-400"
                              }`}
                              style={{ width: `${sentiment.score * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-[8px] ${
                          sentiment.sentiment === "bullish" ? "text-green-400" :
                          sentiment.sentiment === "bearish" ? "text-red-400" :
                          "text-gray-400"
                        }`}>
                          {sentiment.sentiment}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-background/20 rounded border border-border/20">
                    <div className="text-[8px] text-muted-foreground/40">Total Volume</div>
                    <div className="text-[10px] font-bold text-foreground-60">
                      {(sentimentData.reduce((sum, s) => sum + s.volume, 0) / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="p-2 bg-background/20 rounded border border-border/20">
                    <div className="text-[8px] text-muted-foreground/40">Avg Impact</div>
                    <div className="text-[10px] font-bold text-purple-400">
                      {(sentimentData.reduce((sum, s) => sum + s.impact, 0) / sentimentData.length).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No sentiment data</p>
                <p className="text-[8px] text-muted-foreground/30">Analyzing social sentiment...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
