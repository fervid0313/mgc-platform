"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

export function QuickAddButton() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [pnl, setPnl] = useState("")
  const { addEntry } = useAppStore()
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!content.trim()) return
    const pl = pnl ? parseFloat(pnl) : undefined
    addEntry(content, [], "day-trade", isNaN(pl as number) ? undefined : pl)
    toast({ title: "Trade logged!" })
    setContent("")
    setPnl("")
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-6 lg:right-10 z-40 btn-3d w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all"
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-36 right-6 lg:right-10 z-40 glass-3d rounded-2xl p-4 w-72 space-y-3">
          <p className="text-xs font-bold">Quick Trade Entry</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you trade?"
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-primary/50"
            autoFocus
          />
          <input
            type="text"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="P&L (e.g. +50 or -20)"
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="w-full btn-3d px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Log Trade
          </button>
        </div>
      )}
    </>
  )
}
