"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import type { ImportedTrade } from "@/lib/types"
import {
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileText,
  TrendingUp,
} from "lucide-react"
import { format } from "date-fns"

interface ImportQueueProps {
  onPrefill: (trade: ImportedTrade) => void
}

export function ImportQueue({ onPrefill }: ImportQueueProps) {
  const { importedTrades, loadImportedTrades, dismissImportedTrade } = useAppStore()

  useEffect(() => {
    loadImportedTrades()
  }, [loadImportedTrades])

  if (importedTrades.length === 0) return null

  return (
    <div className="glass-3d rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Imported Trades</h3>
          <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
            {importedTrades.length} pending
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {importedTrades.map((trade) => (
          <ImportedTradeRow
            key={trade.id}
            trade={trade}
            onPost={() => onPrefill(trade)}
            onDismiss={() => dismissImportedTrade(trade.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ImportedTradeRow({
  trade,
  onPost,
  onDismiss,
}: {
  trade: ImportedTrade
  onPost: () => void
  onDismiss: () => void
}) {
  const isProfit = (trade.pnl ?? 0) >= 0

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/30 hover:bg-background/50 transition-colors group">
      {/* Direction indicator */}
      <div className={`p-1.5 rounded-lg ${trade.direction === "long" ? "bg-green-500/10" : "bg-red-500/10"}`}>
        {trade.direction === "long" ? (
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
      </div>

      {/* Trade info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{trade.symbol}</span>
          <span className="text-xs text-muted-foreground capitalize">{trade.direction}</span>
          {trade.quantity && (
            <span className="text-xs text-muted-foreground">x{trade.quantity}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trade.entryPrice && trade.exitPrice && (
            <span>{trade.entryPrice.toFixed(2)} → {trade.exitPrice.toFixed(2)}</span>
          )}
          {trade.closedAt && (
            <span>{format(new Date(trade.closedAt), "MMM d, h:mm a")}</span>
          )}
          <span className="capitalize text-muted-foreground/60">{trade.broker}</span>
        </div>
      </div>

      {/* P&L */}
      {trade.pnl !== undefined && (
        <span className={`text-sm font-bold ${isProfit ? "text-green-500" : "text-red-500"}`}>
          {isProfit ? "+" : ""}${trade.pnl.toFixed(2)}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPost}
          className="btn-3d p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          title="Post to journal"
        >
          <TrendingUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDismiss}
          className="btn-3d p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
