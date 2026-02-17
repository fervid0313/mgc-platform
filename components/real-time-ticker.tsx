"use client"

import { useEffect } from "react"
import { usePriceStore, priceSimulator } from "@/lib/price-store"
import { MARKETS } from "@/lib/market-data"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function RealTimeTicker() {
  const { prices, isConnected, lastUpdate } = usePriceStore()

  // Start price simulator on mount
  useEffect(() => {
    const markets = MARKETS.map(m => m.value)
    priceSimulator.start(markets, 2000) // Update every 2 seconds

    return () => priceSimulator.stop()
  }, [])

  const formatPrice = (market: string, price: number): string => {
    switch (market) {
      case "US10Y":
        return price.toFixed(2) + "%"
      case "BTC":
      case "ETH":
        return "$" + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      case "GC":
      case "XAU":
        return "$" + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      default:
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }

  const formatChange = (change: number, changePercent: number): string => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  const getChangeColor = (change: number): string => {
    if (change > 0) return "text-green-400"
    if (change < 0) return "text-red-400"
    return "text-gray-400"
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  return (
    <div className="bg-background/90 border border-border/40 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-sm font-medium text-foreground">
            {isConnected ? "Live Prices" : "Disconnected"}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-xs text-muted-foreground">
            {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {MARKETS.map((market) => {
          const priceData = prices[market.value]
          if (!priceData) return null

          return (
            <div
              key={market.value}
              className="bg-background/50 border border-border/20 rounded-lg p-3 hover:bg-background/80 transition-colors"
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {market.label}
              </div>
              <div className="text-lg font-bold text-foreground mb-1">
                {formatPrice(market.value, priceData.price)}
              </div>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(priceData.change)}`}>
                {getChangeIcon(priceData.change)}
                <span>
                  {formatChange(priceData.change, priceData.changePercent)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
