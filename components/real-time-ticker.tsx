"use client"

import { useEffect } from "react"
import { usePriceStore, priceSimulator } from "@/lib/price-store"
import { MARKETS } from "@/lib/market-data"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function RealTimeTicker() {
  // Temporarily disabled to prevent usePriceStore crashes
  return (
    <div className="bg-background/90 border border-border/40 rounded-lg p-4 backdrop-blur-sm">
      <div className="text-center text-muted-foreground">
        Live Prices temporarily disabled
      </div>
    </div>
  )
}
