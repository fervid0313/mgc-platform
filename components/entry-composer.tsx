"use client"

import type React from "react"
import type { JournalEntry, MentalState, ImportedTrade } from "../lib/types"

import { useState, useRef, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { TrendingUp, TrendingDown, ChevronDown, ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { MentalStateSelector } from "./mental-state-selector"
import { TradeTemplates } from "./trade-templates"
import { TagAutocomplete } from "./tag-autocomplete"
import { useToast } from "@/hooks/use-toast"
import type { TradeTemplate } from "./trade-templates"

const tradeTypes: { value: JournalEntry["tradeType"]; label: string }[] = [
  { value: "day-trade", label: "Day Trade" },
  { value: "swing", label: "Swing Trade" },
  { value: "investment", label: "Investment" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "general", label: "General" },
]

interface EntryComposerProps {
  prefillTrade?: ImportedTrade | null
  onPrefillConsumed?: () => void
}

export function EntryComposer({ prefillTrade, onPrefillConsumed }: EntryComposerProps = {}) {
  const { addEntry, currentSpaceId, spaces, dismissImportedTrade } = useAppStore()
  const { toast } = useToast()
  const draftKey = `mgc-draft-${currentSpaceId || "default"}`
  const [content, setContent] = useState(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem(draftKey) || ""
  })
  const [tradeType, setTradeType] = useState<JournalEntry["tradeType"]>("general")
  const [profitLoss, setProfitLoss] = useState("")
  const [showOptions, setShowOptions] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [mentalState, setMentalState] = useState<MentalState | undefined>(undefined)
  const [symbol, setSymbol] = useState("")
  const [strategy, setStrategy] = useState("")
  const [timeframe, setTimeframe] = useState("")
  const [direction, setDirection] = useState<"long" | "short" | "">("")
  const [entryPrice, setEntryPrice] = useState("")
  const [exitPrice, setExitPrice] = useState("")
  const [riskAmount, setRiskAmount] = useState("")
  const [rMultiple, setRMultiple] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (content.trim()) {
      localStorage.setItem(draftKey, content)
    } else {
      localStorage.removeItem(draftKey)
    }
  }, [content, draftKey])

  // Pre-fill from imported trade
  useEffect(() => {
    if (prefillTrade) {
      const dir = prefillTrade.direction === "long" ? "Long" : prefillTrade.direction === "short" ? "Short" : ""
      const pnlStr = prefillTrade.pnl !== undefined ? (prefillTrade.pnl >= 0 ? "+" : "") + `$${Math.abs(prefillTrade.pnl).toFixed(2)}` : ""
      setContent(`${prefillTrade.symbol} ${dir} | ${pnlStr}`.trim())
      setTradeType("day-trade")
      if (prefillTrade.pnl !== undefined) setProfitLoss(String(prefillTrade.pnl))
      if (prefillTrade.symbol) setSymbol(prefillTrade.symbol)
      if (prefillTrade.direction) setDirection(prefillTrade.direction)
      if (prefillTrade.entryPrice) setEntryPrice(String(prefillTrade.entryPrice))
      if (prefillTrade.exitPrice) setExitPrice(String(prefillTrade.exitPrice))
      setShowOptions(true)
      // Mark trade as posted in DB
      dismissImportedTrade(prefillTrade.id)
      onPrefillConsumed?.()
    }
  }, [prefillTrade])

  const handleApplyTemplate = (template: TradeTemplate) => {
    if (template.symbol) setSymbol(template.symbol)
    if (template.strategy) setStrategy(template.strategy)
    if (template.timeframe) setTimeframe(template.timeframe)
    if (template.direction) setDirection(template.direction)
    if (template.tradeType) setTradeType(template.tradeType as any)
    setShowOptions(true)
  }

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 4) {
      alert("Maximum 4 images per entry")
      return
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is over 5MB limit`)
        continue
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!content || !content.trim()) return
    if (!mentalState) {
      alert("Please select your current mental state before posting")
      setShowOptions(true)
      return
    }

    const pl = tradeType !== "general" && profitLoss ? Number.parseFloat(profitLoss) : undefined
    const toOptionalNumber = (v: string) => {
      const trimmed = v.trim()
      if (!trimmed) return undefined
      const n = Number.parseFloat(trimmed)
      return Number.isFinite(n) ? n : undefined
    }

    const trade = {
      symbol: symbol.trim() || undefined,
      strategy: strategy.trim() || undefined,
      timeframe: timeframe.trim() || undefined,
      direction: direction || undefined,
      entryPrice: toOptionalNumber(entryPrice),
      exitPrice: toOptionalNumber(exitPrice),
      riskAmount: toOptionalNumber(riskAmount),
      rMultiple: toOptionalNumber(rMultiple),
    }

    const shouldIncludeTrade = Object.values(trade).some((v) => v !== undefined)
    addEntry(content, selectedTags, tradeType, pl, images.length > 0 ? images : undefined, mentalState, shouldIncludeTrade ? trade : undefined)
    toast({ title: "Entry posted", description: "Your journal entry has been published." })

    setContent("")
    localStorage.removeItem(draftKey)
    setProfitLoss("")
    setShowOptions(false)
    setImages([])
    setMentalState(undefined)
    setSymbol("")
    setStrategy("")
    setTimeframe("")
    setDirection("")
    setEntryPrice("")
    setExitPrice("")
    setRiskAmount("")
    setRMultiple("")
    setSelectedTags([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit()
    }
  }

  return (
    <div className="glass-3d lift-3d press-3d rounded-[2rem] p-6 mb-10 border border-white/10">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          tradeType === "general"
            ? `What's on your mind today? Emotions, habits, reflections...`
            : `Log your ${tradeType?.replace("-", " ") || "trade"} in ${currentSpace?.name || "this space"}...`
        }
        className="w-full bg-transparent border-none outline-none text-base font-medium placeholder:text-muted-foreground resize-none h-24 mb-4"
      />

      {images.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative inline-block">
              <div className="relative rounded-xl overflow-hidden border border-border">
                <Image
                  src={img}
                  alt={`Trade proof ${i + 1}`}
                  width={200}
                  height={150}
                  className="max-h-36 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expandable options */}
      {showOptions && (
        <div className="space-y-4 mb-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <MentalStateSelector value={mentalState} onChange={setMentalState} />

          {/* Trade Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entry Type</label>
            <div className="flex flex-wrap gap-2">
              {tradeTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setTradeType(type.value)
                    if (type.value === "general") {
                      setProfitLoss("")
                    }
                  }}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                    tradeType === type.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Quality Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tags</label>
            <div className="flex flex-wrap gap-2">
              {["A+ Setup", "B Setup", "Revenge Trade", "FOMO", "Overtraded", "Followed Plan", "Break Even", "Scaled In", "Early Exit", "Let It Run", "News Play", "Breakout", "Pullback", "Reversal", "Trend", "Range"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    selectedTags.includes(tag)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            <TagAutocomplete
              selectedTags={selectedTags}
              onAdd={(tag) => setSelectedTags((prev) => prev.includes(tag) ? prev : [...prev, tag])}
              onRemove={(tag) => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
            />
          </div>

          {/* P/L Input */}
          {tradeType !== "general" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                {profitLoss && Number.parseFloat(profitLoss) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : profitLoss && Number.parseFloat(profitLoss) < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <span className="text-muted-foreground text-xs">P/L</span>
                )}
                <input
                  type="number"
                  value={profitLoss}
                  onChange={(e) => setProfitLoss(e.target.value)}
                  placeholder="Enter profit/loss"
                  className="flex-1 bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {tradeType !== "general" && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trade Details</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="Symbol (e.g. SPY)"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
                <input
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  placeholder="Strategy"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
                <input
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  placeholder="Timeframe (e.g. 5m)"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection(direction === "long" ? "" : "long")}
                    className={`flex-1 text-[10px] font-bold px-3 py-2 rounded-xl border transition-all ${
                      direction === "long" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection(direction === "short" ? "" : "short")}
                    className={`flex-1 text-[10px] font-bold px-3 py-2 rounded-xl border transition-all ${
                      direction === "short" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    Short
                  </button>
                </div>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="Entry price"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="Exit price"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value)}
                  placeholder="Risk ($)"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  value={rMultiple}
                  onChange={(e) => setRMultiple(e.target.value)}
                  placeholder="R multiple"
                  className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 4}
              className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-xl border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-40"
            >
              <ImagePlus className="h-4 w-4" />
              {images.length > 0 ? `Add More (${images.length}/4)` : "Add Photos"}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {tradeType !== "general" ? "Attach proof of your trade" : "Up to 4 images per entry"}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{
                backgroundColor: "rgb(var(--theme-accent-rgb))",
                boxShadow: "0 0 8px rgb(var(--theme-accent-rgb))",
              }}
            />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Live Node</span>
          </div>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Options
            <ChevronDown className={`h-3 w-3 transition-transform ${showOptions ? "rotate-180" : ""}`} />
          </button>
          <TradeTemplates onApply={handleApplyTemplate} />
        </div>
        <div className="flex items-center gap-3">
          {mentalState && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                mentalState === "calm"
                  ? "text-green-500"
                  : mentalState === "focused"
                    ? "text-blue-500"
                    : mentalState === "aggressive"
                      ? "text-red-500"
                      : "text-amber-500"
              }`}
            >
              {mentalState}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content || !content.trim()}
            className="btn-3d bg-foreground text-background px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Entry
          </button>
          <span className="text-[9px] text-muted-foreground/40 hidden sm:inline">⌘+Enter</span>
        </div>
      </div>
    </div>
  )
}
