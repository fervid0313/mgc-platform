// Market-specific price ranges and data for analysis components

export interface MarketProfile {
  symbol: string
  name: string
  tvSymbol: string // TradingView symbol (e.g. "CME_MINI:NQ1!")
  basePrice: number
  priceRange: { low: number; high: number }
  tickSize: number
  decimals: number
  volatilityMultiplier: number
  typicalVolume: number
  sessionHours: { eth: string; rth: string }
}

export const MARKET_PROFILES: Record<string, MarketProfile> = {
  NQ100: {
    symbol: "NQ100",
    name: "Nasdaq 100 Futures",
    tvSymbol: "OANDA:NAS100USD",
    basePrice: 24590.00,
    priceRange: { low: 24200, high: 24900 },
    tickSize: 0.25,
    decimals: 2,
    volatilityMultiplier: 1.0,
    typicalVolume: 85000000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
  },
  ES: {
    symbol: "ES",
    name: "S&P 500 Futures",
    tvSymbol: "OANDA:SPX500USD",
    basePrice: 6080.00,
    priceRange: { low: 6000, high: 6160 },
    tickSize: 0.25,
    decimals: 2,
    volatilityMultiplier: 0.7,
    typicalVolume: 120000000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    tvSymbol: "COINBASE:BTCUSD",
    basePrice: 97250.00,
    priceRange: { low: 94000, high: 101000 },
    tickSize: 0.01,
    decimals: 2,
    volatilityMultiplier: 2.5,
    typicalVolume: 45000000000,
    sessionHours: { eth: "24/7", rth: "24/7" },
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    tvSymbol: "COINBASE:ETHUSD",
    basePrice: 2735.40,
    priceRange: { low: 2600, high: 2870 },
    tickSize: 0.01,
    decimals: 2,
    volatilityMultiplier: 3.0,
    typicalVolume: 18000000000,
    sessionHours: { eth: "24/7", rth: "24/7" },
  },
  US10Y: {
    symbol: "US10Y",
    name: "10-Year Treasury Yield",
    tvSymbol: "TVC:US10Y",
    basePrice: 4.52,
    priceRange: { low: 4.35, high: 4.70 },
    tickSize: 0.001,
    decimals: 3,
    volatilityMultiplier: 0.3,
    typicalVolume: 950000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
  },
  GC: {
    symbol: "GC",
    name: "Gold Futures",
    tvSymbol: "COMEX:GC1!",
    basePrice: 2035.50,
    priceRange: { low: 1980, high: 2090 },
    tickSize: 0.1,
    decimals: 2,
    volatilityMultiplier: 1.2,
    typicalVolume: 15000000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
  },
  XAU: {
    symbol: "XAU",
    name: "Gold/USD Spot",
    tvSymbol: "FX:XAUUSD",
    basePrice: 2032.80,
    priceRange: { low: 1985, high: 2085 },
    tickSize: 0.01,
    decimals: 2,
    volatilityMultiplier: 1.1,
    typicalVolume: 12000000,
    sessionHours: { eth: "24/7", rth: "24/7" },
  },
  VIX: {
    symbol: "VIX",
    name: "CBOE Volatility Index",
    tvSymbol: "CBOE:VIX",
    basePrice: 18.50,
    priceRange: { low: 15.00, high: 25.00 },
    tickSize: 0.01,
    decimals: 2,
    volatilityMultiplier: 2.5,
    typicalVolume: 0,
    sessionHours: { eth: "24/7", rth: "24/7" },
  },
  DXY: {
    symbol: "DXY",
    name: "US Dollar Index",
    tvSymbol: "ICEUS:DXY",
    basePrice: 106.25,
    priceRange: { low: 100.00, high: 110.00 },
    tickSize: 0.01,
    decimals: 2,
    volatilityMultiplier: 0.8,
    typicalVolume: 0,
    sessionHours: { eth: "24/7", rth: "24/7" },
  },
}

export function getMarketProfile(market: string): MarketProfile {
  return MARKET_PROFILES[market] || MARKET_PROFILES.NQ100
}

// Generate a random price within the market's range
export function randomPrice(profile: MarketProfile, offsetPercent?: number): number {
  const range = profile.priceRange.high - profile.priceRange.low
  const offset = offsetPercent !== undefined
    ? profile.basePrice * (offsetPercent / 100)
    : (Math.random() - 0.5) * range * 0.5
  return parseFloat((profile.basePrice + offset).toFixed(profile.decimals))
}

// Generate price near the base
export function nearPrice(profile: MarketProfile, offsetPoints: number): number {
  return parseFloat((profile.basePrice + offsetPoints * (profile.basePrice / 15000)).toFixed(profile.decimals))
}

// Scale volume for market
export function scaleVolume(profile: MarketProfile, baseVolume: number): number {
  return Math.round(baseVolume * (profile.typicalVolume / 85000000))
}

// Scale a price from NQ100 base (~15830) to the target market
// This lets us reuse NQ100 mock data for any market
export const MARKETS = [
  { value: "NQ100", label: "NQ1!" },
  { value: "ES", label: "ES1!" },
  { value: "BTC", label: "BTC" },
  { value: "ETH", label: "ETH" },
  { value: "US10Y", label: "US10Y" },
  { value: "GC", label: "GC1!" },
  { value: "XAU", label: "XAUUSD" },
  { value: "VIX", label: "VIX" },
  { value: "DXY", label: "DXY" },
] as const

export const NQ_BASE = 24590.00
export function scaleFromNQ(nqPrice: number, market: string): number {
  const profile = getMarketProfile(market)
  const ratio = profile.basePrice / NQ_BASE
  return parseFloat((nqPrice * ratio).toFixed(profile.decimals))
}

// Scale volume from NQ100 base to target market
export function scaleVolumeFromNQ(nqVolume: number, market: string): number {
  const profile = getMarketProfile(market)
  return Math.round(nqVolume * (profile.typicalVolume / 85000000))
}

// Real-time price functions
export function getCurrentPrice(market: string): number {
  if (typeof window === "undefined") return getMarketProfile(market).basePrice
  
  try {
    const { usePriceStore } = require("./price-store")
    const priceStore = usePriceStore.getState()
    return priceStore.getCurrentPrice(market) || getMarketProfile(market).basePrice
  } catch {
    return getMarketProfile(market).basePrice
  }
}

export function getPriceChange(market: string): { change: number; changePercent: number } {
  if (typeof window === "undefined") return { change: 0, changePercent: 0 }
  
  try {
    const { usePriceStore } = require("./price-store")
    const priceStore = usePriceStore.getState()
    return priceStore.getPriceChange(market) || { change: 0, changePercent: 0 }
  } catch {
    return { change: 0, changePercent: 0 }
  }
}

// Helper to create price-aware scaling functions
export function createPriceScaler(market: string) {
  if (!market) {
    market = "NQ100"
  }
  
  const profile = getMarketProfile(market)
  const currentPrice = getCurrentPrice(market) || profile.basePrice
  const basePrice = profile.basePrice
  const ratio = currentPrice / basePrice
  
  return {
    scalePrice: (basePrice: number) => parseFloat((basePrice * ratio).toFixed(profile.decimals)),
    scaleVolume: (baseVolume: number) => Math.round(baseVolume * (profile.typicalVolume / 85000000)),
    currentPrice,
    basePrice,
    ratio,
  }
}
