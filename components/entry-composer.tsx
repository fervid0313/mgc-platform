"use client"

import type React from "react"
import type { JournalEntry, MentalState } from "../lib/types"

import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { TrendingUp, TrendingDown, ChevronDown, ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { MentalStateSelector } from "./mental-state-selector"

const tradeTypes: { value: JournalEntry["tradeType"]; label: string }[] = [
  { value: "day-trade", label: "Day Trade" },
  { value: "swing", label: "Swing Trade" },
  { value: "investment", label: "Investment" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "general", label: "General" },
]

export function EntryComposer() {
  const { addEntry, currentSpaceId, spaces } = useAppStore()
  const [content, setContent] = useState("")
  const [tradeType, setTradeType] = useState<JournalEntry["tradeType"]>("general")
  const [profitLoss, setProfitLoss] = useState("")
  const [showOptions, setShowOptions] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [mentalState, setMentalState] = useState<MentalState | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = () => {
    if (!content || !content.trim()) return
    if (!mentalState) {
      alert("Please select your current mental state before posting")
      setShowOptions(true)
      return
    }

    const pl = tradeType !== "general" && profitLoss ? Number.parseFloat(profitLoss) : undefined
    addEntry(content, [], tradeType, pl, image || undefined, mentalState)

    setContent("")
    setProfitLoss("")
    setShowOptions(false)
    setImage(null)
    setMentalState(undefined)
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
    <div className="glass rounded-[2rem] p-6 mb-10 vibe-glow border border-white/10">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          tradeType === "general"
            ? `What's on your mind today? Emotions, habits, reflections...`
            : `Log your ${tradeType ? tradeType.replace("-", " ") : "trade"} in ${currentSpace?.name || "this space"}...`
        }
        className="w-full bg-transparent border-none outline-none text-base font-medium placeholder:text-muted-foreground resize-none h-24 mb-4"
      />

      {image && (
        <div className="relative mb-4 inline-block">
          <div className="relative rounded-xl overflow-hidden border border-border">
            <Image
              src={image || "/placeholder.svg"}
              alt="Trade proof"
              width={300}
              height={200}
              className="max-h-48 w-auto object-contain"
            />
          </div>
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>
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

          {/* Photo Upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-xl border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
            >
              <ImagePlus className="h-4 w-4" />
              {image ? "Change Photo" : "Add Photo"}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {tradeType !== "general" ? "Attach proof of your trade" : "Add an image to your entry"}
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
            className="bg-foreground text-background px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Entry
          </button>
        </div>
      </div>
    </div>
  )
}
