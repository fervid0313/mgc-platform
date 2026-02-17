"use client"

import { useEffect, useRef, memo } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  const profile = getMarketProfile(market)
  const tvSymbol = profile.tvSymbol

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ""

    // Create widget container div
    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = `${height}px`
    widgetDiv.style.width = "100%"
    containerRef.current.appendChild(widgetDiv)

    // Create and load TradingView widget script
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      timezone: "America/Chicago",
      theme: theme,
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_top_toolbar: !showToolbar,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      backgroundColor: theme === "dark" ? "rgba(10, 10, 20, 1)" : "rgba(255, 255, 255, 1)",
      gridColor: theme === "dark" ? "rgba(40, 40, 60, 0.3)" : "rgba(200, 200, 200, 0.3)",
      studies: [
        "STD;VWAP",
        "STD;Volume%1Profile"
      ],
    })

    containerRef.current.appendChild(script)
    scriptRef.current = script

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [tvSymbol, height, theme, interval, showToolbar])

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: `${height}px`, width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
    </div>
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
  const containerRef = useRef<HTMLDivElement>(null)

  const profile = getMarketProfile(market)
  const tvSymbol = profile.tvSymbol

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ""

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = `${height}px`
    widgetDiv.style.width = "100%"
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: "100%",
      height: height,
      locale: "en",
      dateRange: "1D",
      colorTheme: theme,
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [tvSymbol, height, theme])

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: `${height}px`, width: "100%" }} />
  )
}

export const TradingViewMiniChart = memo(TradingViewMiniChartInner)

// Ticker tape widget showing all markets
function TradingViewTickerInner({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ""

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "CME_MINI:NQ1!", title: "NQ100" },
        { proName: "CME_MINI:ES1!", title: "ES" },
        { proName: "COINBASE:BTCUSD", title: "BTC" },
        { proName: "COINBASE:ETHUSD", title: "ETH" },
        { proName: "TVC:US10Y", title: "US10Y" },
        { proName: "TVC:VIX", title: "VIX" },
        { proName: "TVC:DXY", title: "DXY" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: theme,
      locale: "en",
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [theme])

  return (
    <div className="tradingview-widget-container" ref={containerRef} />
  )
}

export const TradingViewTicker = memo(TradingViewTickerInner)
