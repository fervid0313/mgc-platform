"use client"

import { useState, useEffect } from "react"
import { Bookmark, Plus, Trash2, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface TradeTemplate {
  id: string
  name: string
  symbol: string
  strategy: string
  timeframe: string
  direction: "long" | "short" | ""
  tags: string[]
  tradeType: string
  createdAt: string
}

const STORAGE_KEY = "mgc-trade-templates"

function loadTemplates(): TradeTemplate[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTemplates(templates: TradeTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

interface TradeTemplatesProps {
  onApply: (template: TradeTemplate) => void
}

export function TradeTemplates({ onApply }: TradeTemplatesProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<TradeTemplate[]>([])
  const [showCreate, setShowCreate] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [strategy, setStrategy] = useState("")
  const [timeframe, setTimeframe] = useState("")
  const [direction, setDirection] = useState<"long" | "short" | "">("")
  const [tradeType, setTradeType] = useState("day-trade")

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  const handleCreate = () => {
    if (!name.trim()) return
    const template: TradeTemplate = {
      id: `tpl-${Date.now()}`,
      name: name.trim(),
      symbol: symbol.trim(),
      strategy: strategy.trim(),
      timeframe: timeframe.trim(),
      direction,
      tags: [],
      tradeType,
      createdAt: new Date().toISOString(),
    }
    const updated = [...templates, template]
    setTemplates(updated)
    saveTemplates(updated)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const updated = templates.filter((t) => t.id !== id)
    setTemplates(updated)
    saveTemplates(updated)
  }

  const handleApply = (template: TradeTemplate) => {
    onApply(template)
    setOpen(false)
  }

  const resetForm = () => {
    setShowCreate(false)
    setName("")
    setSymbol("")
    setStrategy("")
    setTimeframe("")
    setDirection("")
    setTradeType("day-trade")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn-3d" size="sm">
          <Bookmark className="h-4 w-4 mr-1" />
          Templates
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] glass-3d border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Trade Templates
          </DialogTitle>
          <DialogDescription>
            Save common setups and apply them instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Template List */}
          {templates.length === 0 && !showCreate && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No templates yet. Create your first one!
            </div>
          )}

          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-background/30 hover:bg-background/50 transition-colors group"
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleApply(t)}>
                <p className="text-sm font-semibold truncate">{t.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t.symbol && <span>{t.symbol}</span>}
                  {t.direction && <span className="capitalize">{t.direction}</span>}
                  {t.strategy && <span>{t.strategy}</span>}
                  {t.timeframe && <span>{t.timeframe}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Create Form */}
          {showCreate ? (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">New Template</span>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ES Breakout Long"
                  className="bg-background/50 border-border h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Symbol</Label>
                  <Input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="ES, NQ, SPY..."
                    className="bg-background/50 border-border h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Strategy</Label>
                  <Input
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Breakout, Pullback..."
                    className="bg-background/50 border-border h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Timeframe</Label>
                  <Input
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="5m, 15m, 1h..."
                    className="bg-background/50 border-border h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Direction</Label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDirection(direction === "long" ? "" : "long")}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${
                        direction === "long" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      Long
                    </button>
                    <button
                      onClick={() => setDirection(direction === "short" ? "" : "short")}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${
                        direction === "short" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="btn-3d w-full"
                size="sm"
              >
                Save Template
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="btn-3d w-full"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Template
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
