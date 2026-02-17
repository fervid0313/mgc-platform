"use client"

import { useMemo, useRef, memo } from "react"
import { getMarketProfile } from "@/lib/market-data"

interface TradingViewChartProps {
  market: string
  height?: number
  theme?: "dark" | "light"
  interval?: string
  showToolbar?: boolean
}

function TradingViewChartInner({
  market = "NQ100",
  height = 500,
  theme = "dark",
  interval = "15",
  showToolbar = true,
}: TradingViewChartProps) {
  const profile = getMarketProfile(market)
  const tvSymbol = profile.tvSymbol

  const config = JSON.stringify({
    autosize: true,
    symbol: tvSymbol,
    interval: interval,
    timezone: "America/Chicago",
    theme: theme,
    style: "1",
    locale: "en",
    allow_symbol_change: true,
    calendar: false,
    hide_top_toolbar: !showToolbar,
    hide_legend: false,
    save_image: false,
    hide_volume: false,
    support_host: "https://www.tradingview.com",
  })

  const srcdoc = `<!DOCTYPE html>
<html><head><style>html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden;}</style></head>
<body>
<div class="tradingview-widget-container" style="height:100%;width:100%">
<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>${config}</script>
</div>
</body></html>`

  return (
    <iframe
      key={`${market}-${interval}-${theme}`}
      srcDoc={srcdoc}
      style={{ width: "100%", height: `${height}px`, border: "none" }}
      title={`TradingView Chart - ${market}`}
    />
  )
}

export const TradingViewChart = memo(TradingViewChartInner)

// Mini chart widget for smaller displays
function TradingViewMiniChartInner({
  market = "NQ100",
  height = 220,
  theme = "dark",
}: {
  market: string
  height?: number
  theme?: "dark" | "light"
}) {
  const profile = getMarketProfile(market)
  const tvSymbol = profile.tvSymbol

  const config = JSON.stringify({
    symbol: tvSymbol,
    width: "100%",
    height: height,
    locale: "en",
    dateRange: "1D",
    colorTheme: theme,
    isTransparent: false,
    autosize: true,
    largeChartUrl: "",
  })

  const srcdoc = `<!DOCTYPE html>
<html><head><style>html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden;}</style></head>
<body>
<div class="tradingview-widget-container" style="height:100%;width:100%">
<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>${config}</script>
</div>
</body></html>`

  return (
    <iframe
      key={`mini-${market}-${theme}`}
      srcDoc={srcdoc}
      style={{ width: "100%", height: `${height}px`, border: "none" }}
      title={`TradingView Mini - ${market}`}
    />
  )
}

export const TradingViewMiniChart = memo(TradingViewMiniChartInner)

// Ticker tape widget showing all markets
function TradingViewTickerInner({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const config = JSON.stringify({
    symbols: [
      { proName: "OANDA:NAS100USD", title: "NQ100" },
      { proName: "OANDA:SPX500USD", title: "ES" },
      { proName: "COINBASE:BTCUSD", title: "BTC" },
      { proName: "COINBASE:ETHUSD", title: "ETH" },
      { proName: "PYTH:US10Y", title: "US10Y" },
      { proName: "CBOE:VIX", title: "VIX" },
      { proName: "ICEUS:DXY", title: "DXY" },
    ],
    showSymbolLogo: true,
    isTransparent: false,
    displayMode: "adaptive",
    colorTheme: theme,
    locale: "en",
  })

  const srcdoc = `<!DOCTYPE html>
<html><head><style>html,body{margin:0;padding:0;width:100%;overflow:hidden;}</style></head>
<body>
<div class="tradingview-widget-container">
<div class="tradingview-widget-container__widget"></div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>${config}</script>
</div>
</body></html>`

  return (
    <iframe
      key={`ticker-${theme}`}
      srcDoc={srcdoc}
      style={{ width: "100%", height: "46px", border: "none" }}
      title="TradingView Ticker Tape"
    />
  )
}

export const TradingViewTicker = memo(TradingViewTickerInner)
