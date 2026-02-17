"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Target,
  Zap,
  Calculator,
  Percent,
} from "lucide-react"

interface MonteCarloSimulation {
  id: string
  scenario: string
  iterations: number
  meanReturn: number
  stdDev: number
  percentiles: {
    p5: number
    p25: number
    p50: number
    p75: number
    p95: number
  }
  probability: {
    profit: number
    loss: number
    breakeven: number
  }
  var: number
  sharpe: number
  timestamp: string
}

interface StressTest {
  id: string
  scenario: string
  marketConditions: string
  portfolioValue: number
  stressValue: number
  drawdown: number
  recovery: number
  duration: string
  severity: "low" | "medium" | "high" | "critical"
  probability: number
  timestamp: string
}

interface CorrelationRegime {
  id: string
  regime: "normal" | "crisis" | "recovery" | "transition"
  correlation: number
  volatility: number
  duration: string
  probability: number
  affectedMarkets: string[]
  impact: string
  timestamp: string
}

interface LiquidityRisk {
  id: string
  market: string
  asset: string
  liquidityDepth: number
  slippage: {
    small: number
    medium: number
    large: number
  }
  marketImpact: {
    buy: number
    sell: number
  }
  volumeProfile: {
    price: number
    volume: number
    significance: "high" | "medium" | "low"
  }[]
  timestamp: string
}

interface RiskMetrics {
  portfolioVar: number
  componentVar: Record<string, number>
  expectedShortfall: number
  maximumDrawdown: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  beta: number
  alpha: number
  informationRatio: number
  trackingError: number
}

const SCENARIOS = [
  "Market Crash",
  "Bull Market",
  "Sideways Market",
  "High Volatility",
  "Low Volatility",
  "Interest Rate Shock",
  "Geopolitical Crisis",
  "Economic Recovery"
]

export function AdvancedRiskAnalytics() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("montecarlo")
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloSimulation[]>([])
  const [stressTests, setStressTests] = useState<StressTest[]>([])
  const [correlationRegimes, setCorrelationRegimes] = useState<CorrelationRegime[]>([])
  const [liquidityRisk, setLiquidityRisk] = useState<LiquidityRisk[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(true)

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    fetchRiskData()
    
    const interval = setInterval(() => {
      fetchRiskData()
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Fetch risk analytics data
  const fetchRiskData = useCallback(async () => {
    setLoading(true)
    try {
      // Mock Monte Carlo simulations
      const mockMonteCarlo: MonteCarloSimulation[] = [
        {
          id: "1",
          scenario: "Normal Market Conditions",
          iterations: 10000,
          meanReturn: 0.08,
          stdDev: 0.15,
          percentiles: {
            p5: -0.25,
            p25: -0.05,
            p50: 0.08,
            p75: 0.21,
            p95: 0.38
          },
          probability: {
            profit: 0.68,
            loss: 0.32,
            breakeven: 0.15
          },
          var: 0.12,
          sharpe: 1.85,
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          scenario: "High Volatility",
          iterations: 10000,
          meanReturn: 0.12,
          stdDev: 0.28,
          percentiles: {
            p5: -0.45,
            p25: -0.12,
            p50: 0.12,
            p75: 0.36,
            p95: 0.68
          },
          probability: {
            profit: 0.58,
            loss: 0.42,
            breakeven: 0.22
          },
          var: 0.22,
          sharpe: 1.42,
          timestamp: new Date().toISOString(),
        },
        {
          id: "3",
          scenario: "Market Crash",
          iterations: 10000,
          meanReturn: -0.15,
          stdDev: 0.35,
          percentiles: {
            p5: -0.85,
            p25: -0.38,
            p50: -0.15,
            p75: 0.08,
            p95: 0.31
          },
          probability: {
            profit: 0.25,
            loss: 0.75,
            breakeven: 0.35
          },
          var: 0.35,
          sharpe: -0.42,
          timestamp: new Date().toISOString(),
        },
      ]

      // Mock stress tests
      const mockStressTests: StressTest[] = [
        {
          id: "1",
          scenario: "2008 Financial Crisis",
          marketConditions: "Severe recession, credit crunch, liquidity freeze",
          portfolioValue: 100000,
          stressValue: 45000,
          drawdown: -55,
          recovery: 18,
          duration: "18 months",
          severity: "critical",
          probability: 0.02,
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          scenario: "COVID-19 Crash",
          marketConditions: "Pandemic, global shutdown, volatility spike",
          portfolioValue: 100000,
          stressValue: 62000,
          drawdown: -38,
          recovery: 8,
          duration: "6 months",
          severity: "high",
          probability: 0.05,
          timestamp: new Date().toISOString(),
        },
        {
          id: "3",
          scenario: "Interest Rate Shock",
          marketConditions: "Rapid rate hikes, bond market disruption",
          portfolioValue: 100000,
          stressValue: 78000,
          drawdown: -22,
          recovery: 4,
          duration: "3 months",
          severity: "medium",
          probability: 0.12,
          timestamp: new Date().toISOString(),
        },
      ]

      // Mock correlation regimes
      const mockCorrelationRegimes: CorrelationRegime[] = [
        {
          id: "1",
          regime: "normal",
          correlation: 0.65,
          volatility: 0.15,
          duration: "6 months",
          probability: 0.72,
          affectedMarkets: ["NQ100", "ES", "BTC"],
          impact: "Normal market correlations with moderate volatility",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          regime: "crisis",
          correlation: 0.92,
          volatility: 0.45,
          duration: "2 months",
          probability: 0.08,
          affectedMarkets: ["NQ100", "ES", "Gold", "VIX"],
          impact: "All correlations converge to 1 during market stress",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          regime: "recovery",
          correlation: 0.35,
          volatility: 0.25,
          duration: "3 months",
          probability: 0.15,
          affectedMarkets: ["BTC", "Gold", "Oil"],
          impact: "Correlations break down as markets recover independently",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ]

      // Mock liquidity risk
      const mockLiquidityRisk: LiquidityRisk[] = [
        {
          id: "1",
          market: "NQ100",
          asset: "E-mini Nasdaq",
          liquidityDepth: 5000000,
          slippage: {
            small: 0.05,
            medium: 0.15,
            large: 0.35
          },
          marketImpact: {
            buy: 0.12,
            sell: 0.08
          },
          volumeProfile: [
            { price: 15200, volume: 1000000, significance: "high" },
            { price: 15210, volume: 800000, significance: "medium" },
            { price: 15220, volume: 600000, significance: "medium" },
            { price: 15230, volume: 400000, significance: "low" },
          ],
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          market: "BTC",
          asset: "Bitcoin",
          liquidityDepth: 50000000,
          slippage: {
            small: 0.1,
            medium: 0.3,
            large: 0.8
          },
          marketImpact: {
            buy: 0.25,
            sell: 0.22
          },
          volumeProfile: [
            { price: 51500, volume: 10000000, significance: "high" },
            { price: 51520, volume: 8000000, significance: "medium" },
            { price: 51540, volume: 6000000, significance: "medium" },
            { price: 51560, volume: 4000000, significance: "low" },
          ],
          timestamp: new Date().toISOString(),
        },
      ]

      // Mock risk metrics
      const mockRiskMetrics: RiskMetrics = {
        portfolioVar: 0.085,
        componentVar: {
          "NQ100": 0.035,
          "ES": 0.028,
          "BTC": 0.022,
          "Gold": 0.015,
          "Oil": 0.012,
          "DXY": 0.010,
        },
        expectedShortfall: 0.125,
        maximumDrawdown: -0.18,
        sharpeRatio: 1.65,
        sortinoRatio: 2.25,
        calmarRatio: 1.45,
        beta: 1.12,
        alpha: 0.035,
        informationRatio: 0.85,
        trackingError: 0.08,
      }

      setMonteCarlo(mockMonteCarlo)
      setStressTests(mockStressTests)
      setCorrelationRegimes(mockCorrelationRegimes)
      setLiquidityRisk(mockLiquidityRisk)
      setRiskMetrics(mockRiskMetrics)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error("Failed to fetch risk data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

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

  // Get regime color
  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case "normal": return "text-green-400"
      case "crisis": return "text-red-400"
      case "recovery": return "text-blue-400"
      case "transition": return "text-yellow-400"
      default: return "text-gray-400"
    }
  }

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-xs font-black">Advanced Risk Analytics</span>
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
              onClick={fetchRiskData}
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
            { id: "montecarlo", label: "Monte Carlo", icon: Calculator },
            { id: "stress", label: "Stress Tests", icon: AlertTriangle },
            { id: "correlation", label: "Correlation", icon: BarChart3 },
            { id: "liquidity", label: "Liquidity", icon: Target },
            { id: "metrics", label: "Metrics", icon: Percent },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
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
        {/* Monte Carlo Simulations */}
        {activeTab === "montecarlo" && (
          <div className="space-y-3">
            {monteCarlo.length > 0 ? (
              monteCarlo.map(simulation => (
                <div key={simulation.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-foreground-60">
                      {simulation.scenario}
                    </div>
                    <div className="text-[8px] text-muted-foreground/40">
                      {simulation.iterations.toLocaleString()} iterations
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[8px] text-muted-foreground/40 mb-2">
                    <div>
                      <span>Mean Return:</span>
                      <span className={`ml-1 font-bold ${
                        simulation.meanReturn > 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {(simulation.meanReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span>Std Dev:</span>
                      <span className="ml-1 text-orange-400">
                        {(simulation.stdDev * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span>95th Percentile:</span>
                      <span className="ml-1 text-foreground-60">
                        {(simulation.percentiles.p95 * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span>5th Percentile:</span>
                      <span className="ml-1 text-foreground-60">
                        {(simulation.percentiles.p5 * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {showDetails && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-[8px] p-2 bg-background/30 rounded">
                        <div>
                          <span className="text-muted-foreground/50">Profit Prob:</span>
                          <span className="ml-1 text-green-400">{(simulation.probability.profit * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Loss Prob:</span>
                          <span className="ml-1 text-red-400">{(simulation.probability.loss * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Breakeven:</span>
                          <span className="ml-1 text-yellow-400">{(simulation.probability.breakeven * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[8px] p-2 bg-background/30 rounded">
                        <div>
                          <span className="text-muted-foreground/50">VaR (95%):</span>
                          <span className="ml-1 text-orange-400">{(simulation.var * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Sharpe:</span>
                          <span className={`ml-1 font-bold ${
                            simulation.sharpe > 1 ? "text-green-400" :
                            simulation.sharpe > 0 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>
                            {simulation.sharpe.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Calculator className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No simulations</p>
                <p className="text-[8px] text-muted-foreground/30">Running Monte Carlo...</p>
              </div>
            )}
          </div>
        )}

        {/* Stress Tests */}
        {activeTab === "stress" && (
          <div className="space-y-3">
            {stressTests.length > 0 ? (
              stressTests.map(test => (
                <div key={test.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-foreground-60">
                      {test.scenario}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getSeverityColor(test.severity)}`}>
                        {test.severity}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40">
                        {(test.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-[8px] text-muted-foreground/40 mb-1">
                    {test.marketConditions}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[8px] text-muted-foreground/40 mb-2">
                    <div>
                      <span>Portfolio:</span>
                      <span className="ml-1 text-foreground-60">${test.portfolioValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span>Stress Value:</span>
                      <span className="ml-1 text-red-400">${test.stressValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span>Drawdown:</span>
                      <span className="ml-1 text-red-400">-{test.drawdown}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40">
                    <span>Recovery: {test.recovery} months</span>
                    <span>·</span>
                    <span>Duration: {test.duration}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No stress tests</p>
                <p className="text-[8px] text-muted-foreground/30">Running scenarios...</p>
              </div>
            )}
          </div>
        )}

        {/* Correlation Regimes */}
        {activeTab === "correlation" && (
          <div className="space-y-3">
            {correlationRegimes.length > 0 ? (
              correlationRegimes.map(regime => (
                <div key={regime.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className={`h-3 w-3 ${getRegimeColor(regime.regime)}`} />
                      <div>
                        <div className="text-[10px] font-bold text-foreground-60">
                          {regime.regime.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-[8px] text-muted-foreground/40">
                          {regime.affectedMarkets.join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-[8px] text-muted-foreground/40">
                      {(regime.probability * 100).toFixed(0)}% probability
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[8px] text-muted-foreground/40 mb-1">
                    <div>
                      <span>Correlation:</span>
                      <span className="ml-1 text-foreground-60">{regime.correlation.toFixed(3)}</span>
                    </div>
                    <div>
                      <span>Volatility:</span>
                      <span className="ml-1 text-orange-400">{(regime.volatility * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span>Duration:</span>
                      <span className="ml-1 text-foreground-60">{regime.duration}</span>
                    </div>
                  </div>
                  
                  <p className="text-[8px] text-muted-foreground/40 leading-snug">
                    {regime.impact}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <BarChart3 className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No correlation data</p>
                <p className="text-[8px] text-muted-foreground/30">Analyzing regimes...</p>
              </div>
            )}
          </div>
        )}

        {/* Liquidity Risk */}
        {activeTab === "liquidity" && (
          <div className="space-y-3">
            {liquidityRisk.length > 0 ? (
              liquidityRisk.map(risk => (
                <div key={risk.id} className="p-3 rounded-lg border border-border/20 bg-background/20">
                  <div className="text-[10px] font-bold text-foreground-60 mb-2">
                    {risk.market} - {risk.asset}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[8px] text-muted-foreground/40 mb-2">
                    <div>
                      <span>Depth:</span>
                      <span className="ml-1 text-foreground-60">${(risk.liquidityDepth / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span>Market Impact:</span>
                      <span className="ml-1 text-orange-400">
                        Buy: {(risk.marketImpact.buy * 100).toFixed(1)}% /
                        Sell: {(risk.marketImpact.sell * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-[8px] text-muted-foreground/40 mb-1">Slippage</div>
                    <div className="grid grid-cols-3 gap-2 text-[8px]">
                      <div>
                        <span className="text-muted-foreground/50">Small:</span>
                        <span className="text-foreground-60">{(risk.slippage.small * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Medium:</span>
                        <span className="text-foreground-60">{(risk.slippage.medium * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Large:</span>
                        <span className="text-foreground-60">{(risk.slippage.large * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[8px] text-muted-foreground/40 mb-1">Volume Profile</div>
                    <div className="space-y-1">
                      {risk.volumeProfile.map((level, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[8px] text-foreground-60">{level.price}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-muted-foreground-40">
                              {(level.volume / 1000).toFixed(0)}K
                            </span>
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              level.significance === "high" ? "bg-red-500/10 text-red-400" :
                              level.significance === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                              "bg-blue-500/10 text-blue-400"
                            }`}>
                              {level.significance}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Target className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/40">No liquidity data</p>
                <p className="text-[8px] text-muted-foreground/30">Analyzing depth...</p>
              </div>
            )}
          </div>
        )}

        {/* Risk Metrics */}
        {activeTab === "metrics" && riskMetrics && (
          <div className="space-y-3">
            <div className="p-3 bg-background/20 rounded-lg border border-border/20">
              <div className="text-[10px] font-bold text-foreground-60 mb-2">Portfolio Risk Metrics</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Portfolio VaR</div>
                  <div className="text-[12px] font-bold text-orange-400">
                    {(riskMetrics.portfolioVar * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Expected Shortfall</div>
                  <div className="text-[12px] font-bold text-red-400">
                    {(riskMetrics.expectedShortfall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Max Drawdown</div>
                  <div className="text-[12px] font-bold text-red-400">
                    {(riskMetrics.maximumDrawdown * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Sharpe Ratio</div>
                  <div className="text-[12px] font-bold text-green-400">
                    {riskMetrics.sharpeRatio.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Sortino Ratio</div>
                  <div className="text-[12px] font-bold text-blue-400">
                    {riskMetrics.sortinoRatio.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Calmar Ratio</div>
                  <div className="text-[12px] font-bold text-purple-400">
                    {riskMetrics.calmarRatio.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Alpha</div>
                  <div className="text-[12px] font-bold text-green-400">
                    {(riskMetrics.alpha * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-background/30 rounded border border-border/20">
                  <div className="text-[8px] text-muted-foreground/40">Information Ratio</div>
                  <div className="text-[12px] font-bold text-blue-400">
                    {riskMetrics.informationRatio.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="text-[8px] text-muted-foreground/40 mb-1">Component VaR</div>
                <div className="space-y-1">
                  {Object.entries(riskMetrics.componentVar).map(([market, var_]) => (
                    <div key={market} className="flex items-center justify-between text-[8px]">
                      <span className="text-foreground-60">{market}</span>
                      <span className="text-orange-400">{(var_ * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
