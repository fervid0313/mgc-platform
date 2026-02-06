import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface CSVTrade {
  symbol: string
  direction?: string
  entryPrice?: number
  exitPrice?: number
  quantity?: number
  pnl?: number
  fees?: number
  openedAt?: string
  closedAt?: string
}

/**
 * Parse CSV text into trade rows.
 * Supports common CSV exports from Project X / NinjaTrader / generic platforms.
 * Auto-detects column mapping by header names.
 */
function parseCSV(csvText: string): CSVTrade[] {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""))

  // Map common header variations to our fields
  const colMap: Record<string, number> = {}
  const synonyms: Record<string, string[]> = {
    symbol: ["symbol", "instrument", "contract", "ticker", "market"],
    direction: ["direction", "side", "action", "buy/sell", "type", "order action"],
    entryPrice: ["entry price", "entryprice", "entry", "avg entry", "fill price", "open price"],
    exitPrice: ["exit price", "exitprice", "exit", "avg exit", "close price"],
    quantity: ["quantity", "qty", "contracts", "lots", "size", "volume"],
    pnl: ["pnl", "p&l", "profit", "profit/loss", "net profit", "realized p&l", "realized pnl", "net p/l"],
    fees: ["fees", "commission", "commissions", "comm"],
    openedAt: ["opened", "opened at", "entry time", "entry date", "open time", "open date", "date"],
    closedAt: ["closed", "closed at", "exit time", "exit date", "close time", "close date"],
  }

  for (const [field, alts] of Object.entries(synonyms)) {
    const idx = headers.findIndex((h) => alts.includes(h))
    if (idx !== -1) colMap[field] = idx
  }

  if (!colMap.symbol && !colMap.pnl) {
    throw new Error("Could not detect CSV columns. Ensure headers include at least 'Symbol' or 'PnL'.")
  }

  const trades: CSVTrade[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.split(",").map((c) => c.trim().replace(/['"]/g, ""))

    const get = (field: string): string | undefined => {
      const idx = colMap[field]
      return idx !== undefined ? cols[idx] : undefined
    }

    const num = (field: string): number | undefined => {
      const v = get(field)
      if (!v) return undefined
      const cleaned = v.replace(/[$,]/g, "")
      const n = parseFloat(cleaned)
      return isNaN(n) ? undefined : n
    }

    const symbol = get("symbol")
    if (!symbol) continue

    const dirRaw = (get("direction") || "").toLowerCase()
    let direction: "long" | "short" | undefined
    if (dirRaw.includes("buy") || dirRaw.includes("long")) direction = "long"
    else if (dirRaw.includes("sell") || dirRaw.includes("short")) direction = "short"

    trades.push({
      symbol,
      direction,
      entryPrice: num("entryPrice"),
      exitPrice: num("exitPrice"),
      quantity: num("quantity"),
      pnl: num("pnl"),
      fees: num("fees"),
      openedAt: get("openedAt"),
      closedAt: get("closedAt"),
    })
  }

  return trades
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const broker = (formData.get("broker") as string) || "projectx"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const csvText = await file.text()
    let trades: CSVTrade[]

    try {
      trades = parseCSV(csvText)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    if (trades.length === 0) {
      return NextResponse.json({ error: "No trades found in CSV" }, { status: 400 })
    }

    // Insert imported trades
    let imported = 0
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i]
      const externalId = `csv-${Date.now()}-${i}`

      const { error: insertError } = await supabase
        .from("imported_trades")
        .insert({
          user_id: user.id,
          broker,
          external_id: externalId,
          symbol: trade.symbol,
          direction: trade.direction,
          entry_price: trade.entryPrice,
          exit_price: trade.exitPrice,
          quantity: trade.quantity,
          pnl: trade.pnl,
          fees: trade.fees,
          opened_at: trade.openedAt ? new Date(trade.openedAt).toISOString() : null,
          closed_at: trade.closedAt ? new Date(trade.closedAt).toISOString() : null,
          raw_data: trade,
          status: "pending",
        })

      if (!insertError) imported++
    }

    return NextResponse.json({
      success: true,
      imported,
      total: trades.length,
    })
  } catch (err: any) {
    console.error("[BROKER] CSV import error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
