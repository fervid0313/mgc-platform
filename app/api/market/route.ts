import { NextResponse } from "next/server"

const symbols = [
  { symbol: "NQ=F", label: "NQ100" },
  { symbol: "ES=F", label: "ES" },
  { symbol: "GC=F", label: "Gold" },
  { symbol: "GLD", label: "XAU" },
  { symbol: "BTC-USD", label: "BTC" },
  { symbol: "^TNX", label: "US10Y" },
  { symbol: "^IRX", label: "US2Y" },
]

export async function GET() {
  try {
    const responses = await Promise.all(
      symbols.map(async ({ symbol, label }) => {
        try {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
            next: { revalidate: 30 },
          })

          if (!res.ok) {
            console.error(`Failed to fetch ${symbol}: ${res.status}`)
            return {
              symbol,
              label,
              price: 0,
              change: 0,
              changePercent: 0,
              error: true,
            }
          }

          const data = await res.json()
          const meta = data.chart?.result?.[0]?.meta

          if (!meta) {
            return {
              symbol,
              label,
              price: 0,
              change: 0,
              changePercent: 0,
              error: true,
            }
          }

          const price = meta.regularMarketPrice || 0
          const previousClose = meta.chartPreviousClose || meta.previousClose || price
          const change = price - previousClose
          const changePercent = previousClose ? (change / previousClose) * 100 : 0

          return {
            symbol,
            label,
            price,
            change,
            changePercent,
          }
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err)
          return {
            symbol,
            label,
            price: 0,
            change: 0,
            changePercent: 0,
            error: true,
          }
        }
      }),
    )

    // Filter out errored responses if all failed
    const validResponses = responses.filter((r) => !r.error)
    if (validResponses.length === 0) {
      return NextResponse.json(responses) // Return all anyway so UI can show partial data
    }

    return NextResponse.json(responses)
  } catch (error) {
    console.error("Market API error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
