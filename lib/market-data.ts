// Market-specific price ranges and data for analysis components

export interface MarketProfile {
  symbol: string
  name: string
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
    basePrice: 21805.50,
    priceRange: { low: 21550, high: 22050 },
    tickSize: 0.25,
    decimals: 2,
    volatilityMultiplier: 1.0,
    typicalVolume: 85000000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
  },
  ES: {
    symbol: "ES",
    name: "S&P 500 Futures",
    basePrice: 6083.25,
    priceRange: { low: 5980, high: 6180 },
    tickSize: 0.25,
    decimals: 2,
    volatilityMultiplier: 0.7,
    typicalVolume: 120000000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
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
    basePrice: 4.52,
    priceRange: { low: 4.35, high: 4.70 },
    tickSize: 0.001,
    decimals: 3,
    volatilityMultiplier: 0.3,
    typicalVolume: 950000,
    sessionHours: { eth: "18:00-09:30", rth: "09:30-16:00" },
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
const NQ_BASE = 21805.50
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
