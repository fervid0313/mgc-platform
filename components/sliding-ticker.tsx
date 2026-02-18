"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

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

function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? "+" : ""
  return `${sign}${change.toFixed(2)} (${sign}${Math.round(changePercent)}%)`
}

function getChangeColor(change: number): string {
  if (change > 0) return "text-green-400"
  if (change < 0) return "text-red-400"
  return "text-gray-400"
}

function getChangeIcon(change: number) {
  if (change > 0) return <TrendingUp className="h-3 w-3" />
  if (change < 0) return <TrendingDown className="h-3 w-3" />
  return <Minus className="h-3 w-3" />
}

export function SlidingTicker() {
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [biases, setBiases] = useState<BiasPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)

      // Fetch market data
      const marketRes = await fetch("/api/market")
      if (!marketRes.ok) throw new Error("Failed to fetch market data")
      const marketData = await marketRes.json()

      // Fetch bias data
      const biasRes = await fetch("/api/market-bias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketData }),
      })
      
      let biasData = []
      if (biasRes.ok) {
        const biasResult = await biasRes.json()
        biasData = biasResult.biases || []
      }

      setMarkets(marketData)
      setBiases(biasData)
    } catch (err) {
      console.error("[SLIDING-TICKER] Error:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMarketData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000)
    return () => clearInterval(interval)
  }, [fetchMarketData])

  if (loading) {
    return (
      <div className="w-full h-12 bg-background/90 border border-border/40 flex items-center justify-center backdrop-blur-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm">Loading markets...</span>
        </div>
      </div>
    )
  }

  if (error || markets.length === 0) {
    return (
      <div className="w-full h-12 bg-background/90 border border-border/40 flex items-center justify-center backdrop-blur-sm">
        <div className="text-sm text-muted-foreground">Market data unavailable</div>
      </div>
    )
  }

  return (
    <div className="w-full h-12 bg-background/90 border border-border/40 overflow-hidden backdrop-blur-sm">
      <div className="relative h-full">
        {/* Sliding animation */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex animate-slide whitespace-nowrap">
            {/* Duplicate markets for seamless loop */}
            {[...markets, ...markets].map((market, index) => {
              const bias = biases.find(b => b.label === market.label)
              return (
                <div
                  key={`${market.symbol}-${index}`}
                  className="flex items-center gap-3 px-4 border-r border-border/20"
                >
                  {/* Market Label */}
                  <span className="text-sm font-bold text-foreground min-w-[3rem]">
                    {market.label}
                  </span>
                  
                  {/* Price */}
                  <span className="text-sm font-mono text-foreground min-w-[5rem]">
                    {formatPrice(market.price)}
                  </span>
                  
                  {/* Change */}
                  <div className={`flex items-center gap-1 ${getChangeColor(market.change)}`}>
                    {getChangeIcon(market.change)}
                    <span className="text-xs font-medium">
                      {formatChange(market.change, market.changePercent)}
                    </span>
                  </div>
                  
                  {/* Bias */}
                  {bias && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      bias.bias === "bullish" ? "bg-green-500/10 text-green-400" :
                      bias.bias === "bearish" ? "bg-red-500/10 text-red-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      <span className="font-medium">{bias.bias.toUpperCase()}</span>
                      <span className="opacity-70">{Math.round(bias.confidence)}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-slide {
          animation: slide 30s linear infinite;
        }
        
        .animate-slide:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
