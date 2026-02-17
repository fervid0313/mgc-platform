"use client"

import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { getMarketProfile } from "./market-data"

interface PriceData {
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: number
  high: number
  low: number
}

interface PriceState {
  prices: Record<string, PriceData>
  lastUpdate: number | null
  isConnected: boolean
  error: string | null
  
  // Actions
  updatePrice: (market: string, data: Partial<PriceData>) => void
  setConnectionStatus: (connected: boolean) => void
  setError: (error: string | null) => void
  getCurrentPrice: (market: string) => number | null
  getPriceChange: (market: string) => { change: number; changePercent: number } | null
}

// Initial mock prices based on current market levels
const initialPrices: Record<string, PriceData> = {
  NQ100: {
    price: 24590.00,
    change: 0,
    changePercent: 0,
    volume: 85000000,
    timestamp: Date.now(),
    high: 24590.00,
    low: 24590.00,
  },
  ES: {
    price: 6080.00,
    change: 0,
    changePercent: 0,
    volume: 120000000,
    timestamp: Date.now(),
    high: 6080.00,
    low: 6080.00,
  },
  BTC: {
    price: 97250.00,
    change: 0,
    changePercent: 0,
    volume: 2500000000,
    timestamp: Date.now(),
    high: 97250.00,
    low: 97250.00,
  },
  ETH: {
    price: 2735.40,
    change: 0,
    changePercent: 0,
    volume: 1500000000,
    timestamp: Date.now(),
    high: 2735.40,
    low: 2735.40,
  },
  US10Y: {
    price: 4.52,
    change: 0,
    changePercent: 0,
    volume: 5000000000,
    timestamp: Date.now(),
    high: 4.52,
    low: 4.52,
  },
  GC: {
    price: 2035.50,
    change: 0,
    changePercent: 0,
    volume: 15000000,
    timestamp: Date.now(),
    high: 2035.50,
    low: 2035.50,
  },
  XAU: {
    price: 2032.80,
    change: 0,
    changePercent: 0,
    volume: 12000000,
    timestamp: Date.now(),
    high: 2032.80,
    low: 2032.80,
  },
}

export const usePriceStore = create<PriceState>()(
  subscribeWithSelector((set, get) => ({
    prices: initialPrices,
    lastUpdate: null,
    isConnected: false,
    error: null,

    updatePrice: (market: string, data: Partial<PriceData>) => {
      const current = get().prices[market]
      if (!current) return

      const updated = { ...current, ...data, timestamp: Date.now() }
      
      // Update high/low if price changed
      if (data.price !== undefined) {
        updated.high = Math.max(current.high, data.price)
        updated.low = Math.min(current.low, data.price)
      }

      set((state) => ({
        prices: { ...state.prices, [market]: updated },
        lastUpdate: Date.now(),
      }))
    },

    setConnectionStatus: (connected: boolean) => {
      set({ isConnected: connected, error: null })
    },

    setError: (error: string | null) => {
      set({ error, isConnected: false })
    },

    getCurrentPrice: (market: string) => {
      return get().prices[market]?.price || null
    },

    getPriceChange: (market: string) => {
      const priceData = get().prices[market]
      if (!priceData) return null
      return {
        change: priceData.change,
        changePercent: priceData.changePercent,
      }
    },
  }))
)


// Mock price generator for demo purposes
export function generateMockPriceUpdate(market: string, store: any): Partial<PriceData> {
  const profile = getMarketProfile(market)
  const current = store.prices[market]
  
  if (!current) return {}

  // Generate realistic price movement
  const volatility = profile.volatilityMultiplier
  const maxMove = profile.basePrice * 0.001 * volatility // 0.1% max move per update
  const move = (Math.random() - 0.5) * 2 * maxMove
  const newPrice = current.price + move
  
  // Calculate change and change percent
  const change = newPrice - current.price
  const changePercent = (change / current.price) * 100
  
  // Update high/low
  const newHigh = Math.max(current.high, newPrice)
  const newLow = Math.min(current.low, newPrice)
  
  // Generate volume spike occasionally
  const volumeMultiplier = Math.random() > 0.9 ? 1.5 + Math.random() : 0.8 + Math.random() * 0.4
  const newVolume = Math.round(profile.typicalVolume * volumeMultiplier)

  return {
    price: parseFloat(newPrice.toFixed(profile.decimals)),
    change: parseFloat(change.toFixed(profile.decimals)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: newVolume,
    high: newHigh,
    low: newLow,
    timestamp: Date.now(),
  }
}

// Real-time price simulator
export class PriceSimulator {
  private interval: NodeJS.Timeout | null = null
  private markets: string[] = []

  start(markets: string[], updateInterval: number = 1000) {
    this.markets = markets
    this.stop()

    this.interval = setInterval(() => {
      const store = usePriceStore.getState()
      
      this.markets.forEach(market => {
        const update = generateMockPriceUpdate(market, store)
        store.updatePrice(market, update)
      })

      store.setConnectionStatus(true)
    }, updateInterval)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

// Global simulator instance
export const priceSimulator = new PriceSimulator()
