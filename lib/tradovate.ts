/**
 * Tradovate API Client
 * Handles authentication and trade data fetching from Tradovate's REST API.
 * 
 * Tradovate API docs: https://api.tradovate.com/
 * Demo: https://demo.tradovateapi.com
 * Live: https://live.tradovateapi.com
 */

const TRADOVATE_URLS = {
  demo: "https://demo.tradovateapi.com/v1",
  live: "https://live.tradovateapi.com/v1",
} as const

export interface TradovateCredentials {
  username: string
  password: string
  environment: "demo" | "live"
}

export interface TradovateAuthResponse {
  accessToken: string
  expirationTime: string
  userId: number
  name: string
  errorText?: string
}

export interface TradovateFill {
  id: number
  orderId: number
  contractId: number
  timestamp: string
  tradeDate: { year: number; month: number; day: number }
  action: "Buy" | "Sell"
  qty: number
  price: number
  active: boolean
  finallyPaired: number
}

export interface TradovateContract {
  id: number
  name: string
  contractMaturityId: number
}

export interface TradovatePosition {
  id: number
  accountId: number
  contractId: number
  timestamp: string
  tradeDate: { year: number; month: number; day: number }
  netPos: number
  netPrice: number
  bought: number
  boughtValue: number
  sold: number
  soldValue: number
}

export interface TradovateOrder {
  id: number
  accountId: number
  contractId: number
  timestamp: string
  action: "Buy" | "Sell"
  ordType: string
  price?: number
  stopPrice?: number
  qty: number
  filledQty: number
  avgFillPrice: number
  ordStatus: string
}

export interface ParsedTrade {
  externalId: string
  symbol: string
  direction: "long" | "short"
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  fees: number
  openedAt: string
  closedAt: string
}

/**
 * Authenticate with Tradovate API
 */
export async function tradovateAuth(
  credentials: TradovateCredentials
): Promise<TradovateAuthResponse> {
  const baseUrl = TRADOVATE_URLS[credentials.environment]

  const appId = process.env.TRADOVATE_APP_ID || "MGC-Platform"
  const appVersion = process.env.TRADOVATE_APP_VERSION || "1.0"
  const cid = process.env.TRADOVATE_CID
  const sec = process.env.TRADOVATE_SECRET

  if (!cid || !sec) {
    throw new Error(
      "Tradovate API credentials (TRADOVATE_CID, TRADOVATE_SECRET) not configured. " +
      "Register at https://trader.tradovate.com/ for API access."
    )
  }

  const res = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: credentials.username,
      password: credentials.password,
      appId,
      appVersion,
      cid: Number(cid),
      sec,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tradovate auth failed (${res.status}): ${text}`)
  }

  const data: TradovateAuthResponse = await res.json()

  if (data.errorText) {
    throw new Error(`Tradovate auth error: ${data.errorText}`)
  }

  return data
}

/**
 * Fetch fills (trade executions) from Tradovate
 */
async function fetchFills(
  baseUrl: string,
  accessToken: string
): Promise<TradovateFill[]> {
  const res = await fetch(`${baseUrl}/fill/list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch fills: ${res.status}`)
  }

  return res.json()
}

/**
 * Fetch contract details to resolve symbol names
 */
async function fetchContract(
  baseUrl: string,
  accessToken: string,
  contractId: number
): Promise<TradovateContract> {
  const res = await fetch(`${baseUrl}/contract/item?id=${contractId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch contract ${contractId}: ${res.status}`)
  }

  return res.json()
}

/**
 * Pair fills into round-trip trades (entry + exit)
 * Groups fills by contractId and pairs Buy/Sell fills into complete trades.
 */
function pairFillsIntoTrades(
  fills: TradovateFill[],
  contractNames: Record<number, string>
): ParsedTrade[] {
  // Group fills by contractId
  const byContract: Record<number, TradovateFill[]> = {}
  for (const fill of fills) {
    if (!byContract[fill.contractId]) {
      byContract[fill.contractId] = []
    }
    byContract[fill.contractId].push(fill)
  }

  const trades: ParsedTrade[] = []

  for (const [contractIdStr, contractFills] of Object.entries(byContract)) {
    const contractId = Number(contractIdStr)
    const symbol = contractNames[contractId] || `Contract-${contractId}`

    // Sort fills chronologically
    const sorted = [...contractFills].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Simple FIFO pairing: match buys with sells
    const buys: TradovateFill[] = []
    const sells: TradovateFill[] = []

    for (const fill of sorted) {
      if (fill.action === "Buy") buys.push(fill)
      else sells.push(fill)
    }

    // Pair opening with closing fills
    const pairs = Math.min(buys.length, sells.length)

    for (let i = 0; i < pairs; i++) {
      const buy = buys[i]
      const sell = sells[i]

      // Determine which is entry and which is exit by timestamp
      const buyFirst = new Date(buy.timestamp) <= new Date(sell.timestamp)
      const entry = buyFirst ? buy : sell
      const exit = buyFirst ? sell : buy
      const direction: "long" | "short" = buyFirst ? "long" : "short"

      const qty = Math.min(entry.qty, exit.qty)
      const rawPnl =
        direction === "long"
          ? (exit.price - entry.price) * qty
          : (entry.price - exit.price) * qty

      trades.push({
        externalId: `${entry.id}-${exit.id}`,
        symbol,
        direction,
        entryPrice: entry.price,
        exitPrice: exit.price,
        quantity: qty,
        pnl: Math.round(rawPnl * 100) / 100,
        fees: 0,
        openedAt: entry.timestamp,
        closedAt: exit.timestamp,
      })
    }
  }

  // Sort by closed date descending (most recent first)
  trades.sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
  )

  return trades
}

/**
 * Main function: authenticate, fetch fills, and return parsed trades
 */
export async function fetchTradovateTrades(
  credentials: TradovateCredentials
): Promise<ParsedTrade[]> {
  const baseUrl = TRADOVATE_URLS[credentials.environment]

  // 1. Authenticate
  const auth = await tradovateAuth(credentials)

  // 2. Fetch fills
  const fills = await fetchFills(baseUrl, auth.accessToken)

  if (fills.length === 0) {
    return []
  }

  // 3. Resolve contract names
  const uniqueContractIds = [...new Set(fills.map((f) => f.contractId))]
  const contractNames: Record<number, string> = {}

  for (const cid of uniqueContractIds) {
    try {
      const contract = await fetchContract(baseUrl, auth.accessToken, cid)
      contractNames[cid] = contract.name
    } catch {
      contractNames[cid] = `Contract-${cid}`
    }
  }

  // 4. Pair fills into round-trip trades
  return pairFillsIntoTrades(fills, contractNames)
}
