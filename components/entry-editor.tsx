"use client"

import type React from "react"
import type { JournalEntry, MentalState } from "../lib/types"

import { useState, useRef, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { TrendingUp, TrendingDown, X, ImagePlus } from "lucide-react"
import Image from "next/image"
import { MentalStateSelector } from "./mental-state-selector"

const tradeTypes: { value: JournalEntry["tradeType"]; label: string }[] = [
  { value: "day-trade", label: "Day Trade" },
  { value: "swing", label: "Swing Trade" },
  { value: "investment", label: "Investment" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "general", label: "General" },
]

interface EntryEditorProps {
  entry: JournalEntry
  isOpen: boolean
  onClose: () => void
}

export function EntryEditor({ entry, isOpen, onClose }: EntryEditorProps) {
  const { updateEntry, currentSpaceId, spaces } = useAppStore()
  const [content, setContent] = useState("")
  const [tradeType, setTradeType] = useState<JournalEntry["tradeType"]>("general")
  const [profitLoss, setProfitLoss] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [mentalState, setMentalState] = useState<MentalState | undefined>(undefined)
  const [tags, setTags] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  // Initialize form with entry data when modal opens
  useEffect(() => {
    if (isOpen && entry) {
      setContent(entry.content || "")
      setTradeType(entry.tradeType || "general")
      setProfitLoss(entry.profitLoss?.toString() || "")
      setImage(entry.image || null)
      setMentalState(entry.mentalState || undefined)
      setTags(entry.tags?.join(", ") || "")
    }
  }, [isOpen, entry])

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
      alert("Please select your current mental state before updating")
      return
    }

    const pl = tradeType !== "general" && profitLoss ? Number.parseFloat(profitLoss) : undefined
    const tagArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
    
    updateEntry(entry.id, content, tagArray, tradeType, pl, image || undefined, mentalState)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "Enter" && e.metaKey) {
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold">Edit Entry</h3>
            <p className="text-muted-foreground text-sm">Update your trading journal entry</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Content */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Update your entry..."
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none h-32"
            />
          </div>

          {/* Mental State */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mental State</label>
            <MentalStateSelector value={mentalState} onChange={setMentalState} />
          </div>

          {/* Trade Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Entry Type</label>
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
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Profit/Loss</label>
              <div className="flex items-center gap-2">
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

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Image</label>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="edit-image-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
            >
              <ImagePlus className="h-4 w-4" />
              {image ? "Change Image" : "Add Image"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content || !content.trim() || !mentalState}
            className="bg-foreground text-background px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
