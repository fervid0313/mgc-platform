"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"

interface MarketData {
  symbol: string
  label: string
  price: number
  change: number
  changePercent: number
}

export function MarketTicker() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/market")
      const data = await res.json()
      setMarketData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch market data:", error)
      setMarketData([])
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

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
          marketData.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">{item.label}</span>
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
          ))
        )}
      </div>

      {lastUpdated && (
        <div className="text-[9px] text-muted-foreground/50 mt-2">Updated {lastUpdated.toLocaleTimeString()}</div>
      )}
    </div>
  )
}
