"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  BarChart3,
  Calculator,
  DollarSign,
  Percent,
  Activity,
  Target,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
} from "lucide-react"

interface Position {
  id: string
  market: string
  direction: "long" | "short"
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  riskAmount: number
  stopLoss: number
  takeProfit: number
  riskReward: number
  marginUsed: number
  openTime: string
}

interface RiskMetrics {
  totalEquity: number
  availableMargin: number
  usedMargin: number
  marginLevel: number
  totalRisk: number
  totalUnrealizedPnL: number
  dailyPnL: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

interface RiskAlert {
  id: string
  type: "margin_call" | "high_risk" | "drawdown" | "concentration" | "volatility"
  severity: "critical" | "high" | "medium" | "low"
  message: string
  value: number
  threshold: number
  timestamp: string
  acknowledged: boolean
}

interface ExposureData {
  market: string
  exposure: number
  percentage: number
  risk: number
  correlation: number
}

const RISK_THRESHOLDS = {
  marginCall: 100, // Margin level %
  highRisk: 80,    // Margin level %
  maxDrawdown: 20, // % of equity
  maxPositionSize: 10, // % of equity
  maxCorrelation: 0.7, // Correlation coefficient
}

export function RiskDashboard() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [exposure, setExposure] = useState<ExposureData[]>([])
  const [showDetails, setShowDetails] = useState(true)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    loadRiskData()
    
    const interval = setInterval(() => {
      loadRiskData()
    }, 15000) // Update every 15 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Load risk data
  const loadRiskData = useCallback(() => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from broker API
      // For now, we'll simulate the data
      const mockPositions: Position[] = [
        {
          id: "1",
          market: "NQ100",
          direction: "long",
          size: 2,
          entryPrice: 15200,
          currentPrice: 15250,
          unrealizedPnL: 1000,
          riskAmount: 200,
          stopLoss: 15100,
          takeProfit: 15500,
          riskReward: 2.5,
          marginUsed: 5000,
          openTime: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          market: "ES",
          direction: "short",
          size: 3,
          entryPrice: 4550,
          currentPrice: 4520,
          unrealizedPnL: 450,
          riskAmount: 300,
          stopLoss: 4580,
          takeProfit: 4450,
          riskReward: 1.8,
          marginUsed: 7500,
          openTime: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "3",
          market: "Gold",
          direction: "long",
          size: 1,
          entryPrice: 2350,
          currentPrice: 2380,
          unrealizedPnL: 300,
          riskAmount: 150,
          stopLoss: 2320,
          takeProfit: 2420,
          riskReward: 2.0,
          marginUsed: 2500,
          openTime: new Date(Date.now() - 1800000).toISOString(),
        },
      ]

      setPositions(mockPositions)

      // Calculate metrics
      const totalEquity = 50000
      const usedMargin = mockPositions.reduce((sum, pos) => sum + pos.marginUsed, 0)
      const availableMargin = totalEquity - usedMargin
      const marginLevel = usedMargin > 0 ? (totalEquity / usedMargin) * 100 : 100
      const totalRisk = mockPositions.reduce((sum, pos) => sum + pos.riskAmount, 0)
      const totalUnrealizedPnL = mockPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
      const dailyPnL = totalUnrealizedPnL + 1250 // Mock realized PnL

      const riskMetrics: RiskMetrics = {
        totalEquity,
        availableMargin,
        usedMargin,
        marginLevel,
        totalRisk,
        totalUnrealizedPnL,
        dailyPnL,
        maxDrawdown: 8.5,
        sharpeRatio: 1.45,
        winRate: 68,
        avgWin: 450,
        avgLoss: 180,
        profitFactor: 1.8,
      }

      setMetrics(riskMetrics)

      // Generate alerts
      const newAlerts: RiskAlert[] = []
      if (marginLevel < RISK_THRESHOLDS.marginCall) {
        newAlerts.push({
          id: "margin-call",
          type: "margin_call",
          severity: "critical",
          message: "Margin call warning - close positions immediately",
          value: marginLevel,
          threshold: RISK_THRESHOLDS.marginCall,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        })
      } else if (marginLevel < RISK_THRESHOLDS.highRisk) {
        newAlerts.push({
          id: "high-risk",
          type: "high_risk",
          severity: "high",
          message: "High margin usage - consider reducing position sizes",
          value: marginLevel,
          threshold: RISK_THRESHOLDS.highRisk,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        })
      }

      if (riskMetrics.maxDrawdown > RISK_THRESHOLDS.maxDrawdown) {
        newAlerts.push({
          id: "drawdown",
          type: "drawdown",
          severity: "medium",
          message: "Maximum drawdown exceeded - review risk management",
          value: riskMetrics.maxDrawdown,
          threshold: RISK_THRESHOLDS.maxDrawdown,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        })
      }

      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10))

      // Calculate exposure
      const exposureData: ExposureData[] = mockPositions.map(pos => ({
        market: pos.market,
        exposure: pos.size * pos.currentPrice,
        percentage: (pos.size * pos.currentPrice / totalEquity) * 100,
        risk: pos.riskAmount,
        correlation: Math.random() * 0.8 - 0.4, // Mock correlation
      }))

      setExposure(exposureData)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error("Failed to load risk data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get alert color
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-400"
      case "high": return "text-orange-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  // Get risk level color
  const getRiskColor = (value: number, threshold: number, inverse = false) => {
    const ratio = value / threshold
    if (inverse) {
      return ratio >= 1 ? "text-green-400" : ratio >= 0.8 ? "text-yellow-400" : "text-red-400"
    }
    return ratio >= 1 ? "text-red-400" : ratio >= 0.8 ? "text-yellow-400" : "text-green-400"
  }

  // Acknowledge alert
  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ))
  }, [])

  // Export risk data
  const exportRiskData = useCallback(() => {
    const data = {
      positions,
      metrics,
      alerts,
      exposure,
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `risk-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [positions, metrics, alerts, exposure])

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-xs font-black">Risk Management</span>
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                {alerts.filter(a => !a.acknowledged).length}
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
              onClick={loadRiskData}
              disabled={loading}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={exportRiskData}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Download className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Risk Alerts */}
        {alerts.filter(a => !a.acknowledged).length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Active Alerts</p>
            <div className="space-y-1">
              {alerts.filter(a => !a.acknowledged).map(alert => (
                <div key={alert.id} className={`p-2 rounded-lg border ${
                  alert.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  alert.severity === "high" ? "border-orange-500/30 bg-orange-500/5" :
                  alert.severity === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-blue-500/30 bg-blue-500/5"
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-3 w-3 ${getAlertColor(alert.severity)}`} />
                    <div className="flex-1">
                      <div className="text-[9px] font-bold text-foreground/60">
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[8px] text-muted-foreground/40">
                        {alert.message}
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-[8px] text-muted-foreground/40 hover:text-foreground/60"
                    >
                      Ack
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {metrics && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Portfolio Overview</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Equity</span>
                </div>
                <div className="text-lg font-bold text-green-400">
                  ${metrics.totalEquity.toLocaleString()}
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  Daily: {metrics.dailyPnL > 0 ? "+" : ""}${metrics.dailyPnL.toFixed(0)}
                </div>
              </div>
              
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Margin Level</span>
                </div>
                <div className={`text-lg font-bold ${getRiskColor(metrics.marginLevel, 100)}`}>
                  {metrics.marginLevel.toFixed(1)}%
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  Used: ${metrics.usedMargin.toLocaleString()}
                </div>
              </div>
              
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Total Risk</span>
                </div>
                <div className="text-lg font-bold text-orange-400">
                  ${metrics.totalRisk.toFixed(0)}
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  {((metrics.totalRisk / metrics.totalEquity) * 100).toFixed(1)}% of equity
                </div>
              </div>
              
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Win Rate</span>
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {metrics.winRate}%
                </div>
                <div className="text-[8px] text-muted-foreground/40">
                  PF: {metrics.profitFactor.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Positions */}
        {showDetails && positions.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Open Positions</p>
            <div className="space-y-1">
              {positions.map(position => (
                <div key={position.id} className="p-2 rounded border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {position.direction === "long" ? 
                        <TrendingUp className="h-3 w-3 text-green-400" /> :
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      }
                      <span className="text-[9px] font-bold text-foreground/60">
                        {position.market}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">
                        {position.size} @ {position.entryPrice}
                      </span>
                    </div>
                    <span className={`text-[8px] font-bold ${
                      position.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {position.unrealizedPnL >= 0 ? "+" : ""}${position.unrealizedPnL.toFixed(0)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 text-[8px] text-muted-foreground/40">
                    <div>
                      <span>Current:</span>
                      <span className="ml-1 text-foreground/60">{position.currentPrice}</span>
                    </div>
                    <div>
                      <span>SL:</span>
                      <span className="ml-1 text-red-400">{position.stopLoss}</span>
                    </div>
                    <div>
                      <span>TP:</span>
                      <span className="ml-1 text-green-400">{position.takeProfit}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40">
                    <span>Risk: ${position.riskAmount}</span>
                    <span>R/R: {position.riskReward}:1</span>
                    <span>Margin: ${position.marginUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Exposure */}
        {showDetails && exposure.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Market Exposure</p>
            <div className="space-y-1">
              {exposure.map(exp => (
                <div key={exp.market} className="p-2 rounded border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-foreground/60">{exp.market}</span>
                    <span className="text-[8px] text-muted-foreground/40">
                      {exp.percentage.toFixed(1)}% of portfolio
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          exp.percentage > 10 ? "bg-red-400" :
                          exp.percentage > 5 ? "bg-yellow-400" :
                          "bg-green-400"
                        }`}
                        style={{ width: `${Math.min(exp.percentage * 5, 100)}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground/40">
                      ${exp.exposure.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {showDetails && metrics && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Performance</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Avg Win</div>
                <div className="text-[10px] font-bold text-green-400">
                  ${metrics.avgWin.toFixed(0)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Avg Loss</div>
                <div className="text-[10px] font-bold text-red-400">
                  ${metrics.avgLoss.toFixed(0)}
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Max DD</div>
                <div className="text-[10px] font-bold text-orange-400">
                  {metrics.maxDrawdown.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-background/20 rounded border border-border/20">
                <div className="text-[8px] text-muted-foreground/40">Sharpe</div>
                <div className="text-[10px] font-bold text-blue-400">
                  {metrics.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {positions.length === 0 && (
          <div className="text-center py-4">
            <Shield className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No open positions</p>
            <p className="text-[8px] text-muted-foreground/30">Risk metrics available when trading</p>
          </div>
        )}
      </div>
    </div>
  )
}
