"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { format } from "date-fns"
import { useAppStore } from "@/lib/store"
import {
  Brain,
  Upload,
  X,
  ChevronDown,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Globe,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Trash2,
  Save,
  History,
  MessageCircle,
  Send,
  ChevronUp,
} from "lucide-react"

const MARKETS = [
  { value: "NQ", label: "NQ (Nasdaq Futures)", category: "Indices" },
  { value: "ES", label: "ES (S&P 500 Futures)", category: "Indices" },
  { value: "YM", label: "YM (Dow Futures)", category: "Indices" },
  { value: "RTY", label: "RTY (Russell 2000)", category: "Indices" },
  { value: "GC", label: "GC (Gold Futures)", category: "Commodities" },
  { value: "SI", label: "SI (Silver Futures)", category: "Commodities" },
  { value: "CL", label: "CL (Crude Oil)", category: "Commodities" },
  { value: "NG", label: "NG (Natural Gas)", category: "Commodities" },
  { value: "EUR/USD", label: "EUR/USD", category: "Forex" },
  { value: "GBP/USD", label: "GBP/USD", category: "Forex" },
  { value: "USD/JPY", label: "USD/JPY", category: "Forex" },
  { value: "GBP/JPY", label: "GBP/JPY", category: "Forex" },
  { value: "AUD/USD", label: "AUD/USD", category: "Forex" },
  { value: "USD/CAD", label: "USD/CAD", category: "Forex" },
  { value: "BTC/USD", label: "BTC (Bitcoin)", category: "Crypto" },
  { value: "ETH/USD", label: "ETH (Ethereum)", category: "Crypto" },
] as const

const SESSIONS = [
  { value: "Asian", label: "Asian Session", time: "6:00 PM – 3:00 AM EST" },
  { value: "London", label: "London Session", time: "3:00 AM – 12:00 PM EST" },
  { value: "New York", label: "New York Session", time: "8:00 AM – 5:00 PM EST" },
  { value: "NY AM", label: "NY AM (Killzone)", time: "9:30 AM – 12:00 PM EST" },
  { value: "NY PM", label: "NY PM", time: "1:30 PM – 4:00 PM EST" },
  { value: "London Close", label: "London Close", time: "10:00 AM – 12:00 PM EST" },
] as const

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "EU", label: "Europe" },
  { value: "Asia", label: "Asia-Pacific" },
  { value: "Global", label: "Global" },
] as const

const TIMEFRAMES = [
  { key: "1W", label: "Weekly", shortLabel: "1W", priority: 1 },
  { key: "1D", label: "Daily", shortLabel: "1D", priority: 2 },
  { key: "4H", label: "4 Hour", shortLabel: "4H", priority: 3 },
  { key: "1H", label: "1 Hour", shortLabel: "1H", priority: 4 },
  { key: "30m", label: "30 Min", shortLabel: "30m", priority: 5 },
  { key: "15m", label: "15 Min", shortLabel: "15m", priority: 6 },
  { key: "5m", label: "5 Min", shortLabel: "5m", priority: 7 },
  { key: "1m", label: "1 Min", shortLabel: "1m", priority: 8 },
] as const

interface AnalysisReport {
  analysis: string
  market: string
  session: string
  region: string
  timeframesAnalyzed: string[]
  generatedAt: string
}

interface SavedAnalysis {
  id: string
  report: AnalysisReport
  savedAt: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SAVED_KEY = "mgc-intraday-analyses"
const USAGE_KEY = "mgc-analysis-usage"
const LIMITS_KEY = "mgc-analysis-limits"
const EST_COST_PER_ANALYSIS = 0.03 // ~$0.03 avg per analysis

interface UsageRecord {
  date: string // yyyy-MM-dd
  count: number
}

interface UsageLimits {
  dailyMax: number
  monthlyMax: number
}

function loadSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")
  } catch {
    return []
  }
}

function saveAnalyses(analyses: SavedAnalysis[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(analyses.slice(0, 20)))
}

function loadUsage(): UsageRecord[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveUsage(records: UsageRecord[]) {
  // Keep only last 90 days of records
  localStorage.setItem(USAGE_KEY, JSON.stringify(records.slice(-90)))
}

function loadLimits(): UsageLimits {
  if (typeof window === "undefined") return { dailyMax: 3, monthlyMax: 50 }
  try {
    const saved = JSON.parse(localStorage.getItem(LIMITS_KEY) || "{}")
    return { dailyMax: saved.dailyMax || 3, monthlyMax: saved.monthlyMax || 50 }
  } catch {
    return { dailyMax: 3, monthlyMax: 50 }
  }
}

function saveLimits(limits: UsageLimits) {
  localStorage.setItem(LIMITS_KEY, JSON.stringify(limits))
}

export function IntradayAnalysis() {
  const { user } = useAppStore()
  const [market, setMarket] = useState("")
  const [session, setSession] = useState("")
  const [region, setRegion] = useState("US")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [screenshots, setScreenshots] = useState<Record<string, string>>({})
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [error, setError] = useState("")
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showUsage, setShowUsage] = useState(false)
  const [showMarketDropdown, setShowMarketDropdown] = useState(false)
  const [marketSearch, setMarketSearch] = useState("")
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [limits, setLimits] = useState<UsageLimits>({ dailyMax: 3, monthlyMax: 50 })
  const [showConfirm, setShowConfirm] = useState(false)
  const [showLimitsEditor, setShowLimitsEditor] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null)

  // Load saved data on mount
  useEffect(() => {
    setSavedAnalyses(loadSavedAnalyses())
    setUsageRecords(loadUsage())
    setLimits(loadLimits())
  }, [])

  const todayStr = format(new Date(), "yyyy-MM-dd")
  const monthStr = todayStr.slice(0, 7) // yyyy-MM
  const todayUsage = usageRecords.find((r) => r.date === todayStr)?.count || 0
  const monthlyUsage = usageRecords
    .filter((r) => r.date.startsWith(monthStr))
    .reduce((sum, r) => sum + r.count, 0)
  const dailyRemaining = Math.max(0, limits.dailyMax - todayUsage)
  const monthlyRemaining = Math.max(0, limits.monthlyMax - monthlyUsage)
  const isAtDailyLimit = dailyRemaining <= 0
  const isAtMonthlyLimit = monthlyRemaining <= 0
  const estimatedMonthlyCost = (monthlyUsage * EST_COST_PER_ANALYSIS).toFixed(2)

  const handleScreenshotUpload = useCallback((timeframe: string, file: File) => {
    if (!file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setScreenshots((prev) => ({ ...prev, [timeframe]: base64 }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (timeframe: string, e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleScreenshotUpload(timeframe, file)
    },
    [handleScreenshotUpload]
  )

  const removeScreenshot = (timeframe: string) => {
    setScreenshots((prev) => {
      const updated = { ...prev }
      delete updated[timeframe]
      return updated
    })
  }

  const uploadedCount = Object.keys(screenshots).length

  const recordUsage = () => {
    const updated = [...usageRecords]
    const existing = updated.find((r) => r.date === todayStr)
    if (existing) {
      existing.count++
    } else {
      updated.push({ date: todayStr, count: 1 })
    }
    setUsageRecords(updated)
    saveUsage(updated)
  }

  const handleAnalyzeClick = () => {
    if (!market || uploadedCount === 0) return
    if (isAtDailyLimit) {
      setError(`Daily limit reached (${limits.dailyMax}/${limits.dailyMax}). Increase your limit in settings or wait until tomorrow.`)
      return
    }
    if (isAtMonthlyLimit) {
      setError(`Monthly limit reached (${limits.monthlyMax}/${limits.monthlyMax}). Increase your limit in settings.`)
      return
    }
    setShowConfirm(true)
  }

  const handleAnalyze = async () => {
    if (!market || uploadedCount === 0) return
    setShowConfirm(false)

    setAnalyzing(true)
    setError("")
    setReport(null)

    try {
      // Strip data URL prefix to send just base64
      const cleanScreenshots: Record<string, string> = {}
      for (const [tf, data] of Object.entries(screenshots)) {
        cleanScreenshots[tf] = data
      }

      const res = await fetch("/api/analyze-charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          session: session || "New York",
          region,
          timeframes: cleanScreenshots,
          additionalNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Analysis failed")
        return
      }

      setReport(data)
      recordUsage()
    } catch (err: any) {
      setError(err.message || "Failed to connect to analysis server")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSaveReport = () => {
    if (!report) return
    const saved: SavedAnalysis = {
      id: Date.now().toString(),
      report,
      savedAt: new Date().toISOString(),
    }
    const updated = [saved, ...savedAnalyses].slice(0, 20)
    setSavedAnalyses(updated)
    saveAnalyses(updated)
  }

  const handleDeleteSaved = (id: string) => {
    const updated = savedAnalyses.filter((a) => a.id !== id)
    setSavedAnalyses(updated)
    saveAnalyses(updated)
  }

  const handleLoadSaved = (saved: SavedAnalysis) => {
    setReport(saved.report)
    setMarket(saved.report.market)
    setSession(saved.report.session)
    setRegion(saved.report.region)
    setShowHistory(false)
  }

  const handleReset = () => {
    setScreenshots({})
    setReport(null)
    setError("")
    setAdditionalNotes("")
  }

  const handleChatSend = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading) return

    const userMsg: ChatMessage = { role: "user", content: trimmed }
    const updatedMessages = [...chatMessages, userMsg]
    setChatMessages(updatedMessages)
    setChatInput("")
    setChatLoading(true)

    try {
      const analysisContext = report
        ? `Market: ${report.market}\nSession: ${report.session}\nRegion: ${report.region}\nTimeframes: ${report.timeframesAnalyzed.join(", ")}\n\nAnalysis:\n${report.analysis}`
        : undefined

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          analysisContext,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setChatMessages([...updatedMessages, { role: "assistant", content: `Error: ${data.error}` }])
        return
      }

      setChatMessages([...updatedMessages, { role: "assistant", content: data.reply }])
    } catch (err: any) {
      setChatMessages([...updatedMessages, { role: "assistant", content: `Error: ${err.message || "Failed to connect"}` }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, chatLoading])

  const filteredMarkets = MARKETS.filter(
    (m) =>
      m.label.toLowerCase().includes(marketSearch.toLowerCase()) ||
      m.value.toLowerCase().includes(marketSearch.toLowerCase())
  )

  const groupedMarkets = filteredMarkets.reduce(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = []
      acc[m.category].push(m)
      return acc
    },
    {} as Record<string, typeof MARKETS[number][]>
  )

  // Parse bias from report
  const parseBias = (text: string) => {
    const lower = text.toLowerCase()
    if (lower.includes("bullish")) return "bullish"
    if (lower.includes("bearish")) return "bearish"
    return "neutral"
  }

  return (
    <div className="glass-3d rounded-2xl p-5 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest">Intraday Analysis AI</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUsage(!showUsage)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
              isAtDailyLimit || isAtMonthlyLimit
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            {dailyRemaining}/{limits.dailyMax} today
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <History className="h-3 w-3" />
            History ({savedAnalyses.length})
          </button>
          {report && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <X className="h-3 w-3" />
              New Analysis
            </button>
          )}
        </div>
      </div>

      {/* Usage Panel */}
      {showUsage && (
        <div className="mb-5 p-4 rounded-xl bg-secondary/20 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-muted-foreground">Usage & Limits</h4>
            <button
              onClick={() => setShowLimitsEditor(!showLimitsEditor)}
              className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {showLimitsEditor ? "Done" : "Edit Limits"}
            </button>
          </div>

          {showLimitsEditor ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Daily Max</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={limits.dailyMax}
                  onChange={(e) => {
                    const updated = { ...limits, dailyMax: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) }
                    setLimits(updated)
                    saveLimits(updated)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Monthly Max</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={limits.monthlyMax}
                  onChange={(e) => {
                    const updated = { ...limits, monthlyMax: Math.max(1, Math.min(200, parseInt(e.target.value) || 1)) }
                    setLimits(updated)
                    saveLimits(updated)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Today</span>
                <span className={`text-[10px] font-bold ${isAtDailyLimit ? "text-red-400" : "text-foreground"}`}>
                  {todayUsage} / {limits.dailyMax}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAtDailyLimit ? "bg-red-400" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (todayUsage / limits.dailyMax) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">This Month</span>
                <span className={`text-[10px] font-bold ${isAtMonthlyLimit ? "text-red-400" : "text-foreground"}`}>
                  {monthlyUsage} / {limits.monthlyMax}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAtMonthlyLimit ? "bg-red-400" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (monthlyUsage / limits.monthlyMax) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                <span className="text-[10px] text-muted-foreground">Est. Monthly Cost</span>
                <span className="text-[10px] font-bold text-foreground">${estimatedMonthlyCost}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="mb-5 p-4 rounded-xl bg-secondary/20 border border-border/50">
          <h4 className="text-xs font-bold mb-3 text-muted-foreground">Saved Analyses</h4>
          {savedAnalyses.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">No saved analyses yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savedAnalyses.map((saved) => (
                <div key={saved.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                  <button onClick={() => handleLoadSaved(saved)} className="flex-1 text-left">
                    <p className="text-xs font-bold">{saved.report.market} — {saved.report.session}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(saved.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {" · "}{saved.report.timeframesAnalyzed.length} charts
                    </p>
                  </button>
                  <button onClick={() => handleDeleteSaved(saved.id)} className="p-1 hover:bg-red-500/10 rounded transition-colors">
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report View */}
      {report ? (
        <div className="space-y-4">
          {/* Report Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {parseBias(report.analysis) === "bullish" ? (
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                ) : parseBias(report.analysis) === "bearish" ? (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                ) : (
                  <Minus className="h-5 w-5 text-yellow-400" />
                )}
                <span className="text-sm font-black">{report.market}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  parseBias(report.analysis) === "bullish"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : parseBias(report.analysis) === "bearish"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {parseBias(report.analysis).toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {report.session} · {report.region} · {report.timeframesAnalyzed.length} charts analyzed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveReport}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="prose prose-invert prose-sm max-w-none p-4 rounded-xl bg-secondary/10 border border-border/30">
            <div
              className="text-xs leading-relaxed [&_h1]:text-sm [&_h1]:font-black [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xs [&_h2]:font-black [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:text-primary [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:mb-0.5 [&_p]:mb-2 [&_hr]:border-border/30 [&_hr]:my-3"
              dangerouslySetInnerHTML={{
                __html: report.analysis
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^- (.*$)/gim, '<li>$1</li>')
                  .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
                  .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
                  .replace(/\n{2,}/g, '</p><p>')
                  .replace(/\n/g, '<br/>')
                  .replace(/^---$/gim, '<hr/>')
              }}
            />
          </div>

          <p className="text-[9px] text-muted-foreground/40 text-center">
            Generated {new Date(report.generatedAt).toLocaleString()} · AI analysis is not financial advice
          </p>
        </div>
      ) : (
        /* Input Form */
        <div className="space-y-5">
          {/* Row 1: Market + Session + Region */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Market Selector */}
            <div className="relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Market *
              </label>
              <button
                onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm font-medium hover:border-primary/50 transition-colors"
              >
                <span className={market ? "text-foreground" : "text-muted-foreground"}>
                  {market ? MARKETS.find((m) => m.value === market)?.label || market : "Select market..."}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {showMarketDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-background border border-border shadow-xl max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      value={marketSearch}
                      onChange={(e) => setMarketSearch(e.target.value)}
                      placeholder="Search markets..."
                      className="w-full px-2 py-1.5 text-xs bg-secondary/30 rounded-lg border-0 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  {Object.entries(groupedMarkets).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase px-3 pt-2 pb-1">{category}</p>
                      {items.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => {
                            setMarket(m.value)
                            setShowMarketDropdown(false)
                            setMarketSearch("")
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/30 transition-colors ${
                            market === m.value ? "text-primary font-bold" : ""
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Selector */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="">Select session...</option>
                {SESSIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label} ({s.time})
                  </option>
                ))}
              </select>
            </div>

            {/* Region Selector */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Screenshots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Chart Screenshots ({uploadedCount}/8)
              </label>
              {uploadedCount > 0 && (
                <button
                  onClick={() => setScreenshots({})}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIMEFRAMES.map((tf) => {
                const hasScreenshot = !!screenshots[tf.key]

                return (
                  <div
                    key={tf.key}
                    onDrop={(e) => handleDrop(tf.key, e)}
                    onDragOver={(e) => e.preventDefault()}
                    className={`relative rounded-xl border-2 border-dashed transition-all ${
                      hasScreenshot
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/30 bg-secondary/10 hover:border-primary/30 hover:bg-secondary/20"
                    }`}
                  >
                    {hasScreenshot ? (
                      <div className="relative aspect-video">
                        <img
                          src={screenshots[tf.key]}
                          alt={tf.label}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-black text-white">
                          {tf.shortLabel}
                        </div>
                        <button
                          onClick={() => removeScreenshot(tf.key)}
                          className="absolute top-1 right-1 p-0.5 rounded-md bg-black/70 hover:bg-red-500/80 transition-colors"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[tf.key]?.click()}
                        className="w-full aspect-video flex flex-col items-center justify-center gap-1 p-2"
                      >
                        <Upload className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-[10px] font-black text-muted-foreground/60">{tf.shortLabel}</span>
                        <span className="text-[8px] text-muted-foreground/30">{tf.label}</span>
                      </button>
                    )}

                    <input
                      ref={(el) => { fileInputRefs.current[tf.key] = el }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleScreenshotUpload(tf.key, file)
                        e.target.value = ""
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Additional Notes (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional context... e.g., 'Expecting high volatility due to FOMC', 'Looking for longs only', 'Price is at weekly OB'..."
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-xs focus:outline-none focus:border-primary/50 transition-colors resize-none h-20"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirm && (
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <p className="text-xs font-bold text-yellow-400">Confirm Analysis</p>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                This will use 1 of your {dailyRemaining} remaining daily analyses ({todayUsage + 1}/{limits.dailyMax}).
                Estimated cost: ~${EST_COST_PER_ANALYSIS.toFixed(2)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  className="flex-1 btn-3d flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs transition-all"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Confirm & Analyze
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2.5 rounded-lg bg-secondary/30 text-xs font-bold hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          {!showConfirm && (
            <button
              onClick={handleAnalyzeClick}
              disabled={!market || uploadedCount === 0 || analyzing}
              className={`w-full btn-3d flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                isAtDailyLimit || isAtMonthlyLimit
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing {uploadedCount} chart{uploadedCount !== 1 ? "s" : ""}... This may take 30-60s
                </>
              ) : isAtDailyLimit || isAtMonthlyLimit ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  {isAtDailyLimit ? "Daily" : "Monthly"} Limit Reached
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate {market || "Market"} Bias — {session || "NY"} Session
                </>
              )}
            </button>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/10 border border-border/20">
            <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
            <div className="text-[10px] text-muted-foreground/50 leading-relaxed">
              <p className="font-bold text-muted-foreground/70 mb-1">How it works:</p>
              <p>Upload your chart screenshots from multiple timeframes. The AI will analyze market structure, identify FVGs, liquidity pools, order blocks, and key levels using ICT/SMC methodology. It then cross-references with macroeconomic data and news to generate a pre-session bias with specific trade setups and Draw on Liquidity targets.</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Box */}
      <div className="mt-5 rounded-2xl border border-border/50 overflow-hidden">
        <button
          onClick={() => {
            setShowChat(!showChat)
            if (!showChat) setTimeout(() => chatInputRef.current?.focus(), 100)
          }}
          className="w-full flex items-center justify-between px-4 py-3 bg-secondary/20 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold">Ask AI</span>
            {report && (
              <span className="text-[9px] text-muted-foreground/60 px-1.5 py-0.5 rounded bg-secondary/30">
                Analysis context loaded
              </span>
            )}
            {chatMessages.length > 0 && (
              <span className="text-[9px] text-muted-foreground/60">
                {chatMessages.length} message{chatMessages.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {showChat ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        {showChat && (
          <div className="border-t border-border/30">
            {/* Messages */}
            <div className="h-72 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground/40 font-medium">Ask anything about trading, ICT concepts, or your analysis</p>
                  <p className="text-[10px] text-muted-foreground/30 mt-1">
                    {report ? "Your current analysis is loaded as context" : "Run an analysis first for context-aware answers"}
                  </p>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary/30 border border-border/30 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="[&_strong]:text-primary [&_p]:mb-1.5 [&_ul]:pl-3 [&_ol]:pl-3 [&_li]:mb-0.5"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^- (.*$)/gim, '<li>$1</li>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-secondary/30 border border-border/30">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/30 p-3 flex gap-2">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask about ICT concepts, your analysis, trade ideas..."
                rows={1}
                className="flex-1 px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-xs focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatLoading}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Chat footer */}
            {chatMessages.length > 0 && (
              <div className="px-3 pb-2 flex justify-between items-center">
                <p className="text-[9px] text-muted-foreground/30">Uses GPT-4o-mini · ~$0.001 per message</p>
                <button
                  onClick={() => setChatMessages([])}
                  className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                >
                  Clear chat
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
