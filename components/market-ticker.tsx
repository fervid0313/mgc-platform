"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, TrendingDown, RefreshCw, Brain, Loader2 } from "lucide-react"

interface MarketData {
  symbol: string
  label: string
  price: number
  change: number
  changePercent: number
}

interface BiasPrediction {
  label: string
  bias: "bullish" | "bearish" | "neutral"
  confidence: number
  reason: string
}

interface CachedBias {
  biases: BiasPrediction[]
  generatedAt: string
}

const BIAS_CACHE_KEY = "mgc-market-bias"
const BIAS_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

function loadCachedBias(): CachedBias | null {
  if (typeof window === "undefined") return null
  try {
    const cached = JSON.parse(localStorage.getItem(BIAS_CACHE_KEY) || "null")
    if (!cached) return null
    const age = Date.now() - new Date(cached.generatedAt).getTime()
    if (age > BIAS_CACHE_DURATION) return null
    return cached
  } catch {
    return null
  }
}

function saveCachedBias(data: CachedBias) {
  localStorage.setItem(BIAS_CACHE_KEY, JSON.stringify(data))
}

export function MarketTicker() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [biases, setBiases] = useState<BiasPrediction[]>([])
  const [biasLoading, setBiasLoading] = useState(false)
  const [biasError, setBiasError] = useState(false)

  const fetchBias = useCallback(async (data: MarketData[]) => {
    if (data.length === 0) return

    // Check cache first
    const cached = loadCachedBias()
    if (cached) {
      setBiases(cached.biases)
      return
    }

    setBiasLoading(true)
    setBiasError(false)
    try {
      const res = await fetch("/api/market-bias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketData: data }),
      })
      const result = await res.json()
      if (res.ok && result.biases) {
        setBiases(result.biases)
        saveCachedBias({ biases: result.biases, generatedAt: result.generatedAt })
      } else {
        setBiasError(true)
      }
    } catch {
      setBiasError(true)
    }
    setBiasLoading(false)
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/market")
      const data = await res.json()
      setMarketData(data)
      setLastUpdated(new Date())
      fetchBias(data)
    } catch (error) {
      console.error("Failed to fetch market data:", error)
      setMarketData([])
    }
    setLoading(false)
  }

  const refreshBiasManual = async () => {
    if (marketData.length === 0) return
    // Clear cache to force refresh
    localStorage.removeItem(BIAS_CACHE_KEY)
    await fetchBias(marketData)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  const getBias = (label: string): BiasPrediction | undefined => {
    return biases.find((b) => b.label === label)
  }

  const formatPrice = (price: number, label: string) => {
    if (label === "BTC") return price.toLocaleString("en-US", { maximumFractionDigits: 0 })
    if (label === "US10Y" || label === "US2Y") return price.toFixed(3) + "%"
    if (label === "XAU/USD" || label === "Gold" || label === "XAU") return price.toFixed(2)
    return price.toFixed(2)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Markets</span>
          <span
            className="flex items-center gap-1 text-[9px] font-medium"
            style={{ color: "rgb(var(--theme-accent-rgb))" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: "rgb(var(--theme-accent-rgb))",
                boxShadow: "0 0 6px rgb(var(--theme-accent-rgb))",
              }}
            />
            Live
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors icon-glow"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-1.5">
        {loading && marketData.length === 0 ? (
          <div className="text-[10px] text-muted-foreground">Loading...</div>
        ) : marketData.length === 0 ? (
          <div className="text-[10px] text-muted-foreground">Unable to load</div>
        ) : (
          marketData.map((item) => {
            const bias = getBias(item.label)
            return (
              <div key={item.symbol} className="flex items-center justify-between text-[11px] group">
                <div className="flex items-center gap-1.5">
                  {/* Bias indicator */}
                  {biasLoading ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground/40" />
                  ) : bias ? (
                    <div className="relative" title={`${bias.bias.toUpperCase()} ${bias.confidence}% — ${bias.reason}`}>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          bias.bias === "bullish"
                            ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]"
                            : bias.bias === "bearish"
                            ? "bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.6)]"
                            : "bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]"
                        }`}
                      />
                    </div>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                  )}
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  {/* Bias label on hover */}
                  {bias && (
                    <span
                      className={`hidden group-hover:inline text-[8px] font-bold uppercase tracking-wider ${
                        bias.bias === "bullish"
                          ? "text-emerald-400"
                          : bias.bias === "bearish"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {bias.bias} {bias.confidence}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-bold">{formatPrice(item.price, item.label)}</span>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] ${
                      item.change >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {item.change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bias footer */}
      <div className="flex items-center justify-between mt-2">
        {lastUpdated && (
          <div className="text-[9px] text-muted-foreground/50">Updated {lastUpdated.toLocaleTimeString()}</div>
        )}
        {biases.length > 0 && !biasLoading && (
          <button
            onClick={refreshBiasManual}
            className="flex items-center gap-1 text-[9px] text-primary/60 hover:text-primary transition-colors"
            title="Refresh AI bias predictions"
          >
            <Brain className="h-2.5 w-2.5" />
            Refresh Bias
          </button>
        )}
        {biasError && (
          <span className="text-[9px] text-red-400/60">Bias unavailable</span>
        )}
      </div>
    </div>
  )
}
