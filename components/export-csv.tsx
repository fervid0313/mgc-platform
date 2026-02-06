"use client"

import { useAppStore } from "@/lib/store"
import { Download } from "lucide-react"
import { format } from "date-fns"

export function ExportCSV() {
  const { entries, currentSpaceId, user } = useAppStore()

  const handleExport = () => {
    if (!currentSpaceId || !user) return
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    if (userEntries.length === 0) return

    const headers = ["Date", "Trade Type", "Symbol", "Direction", "Strategy", "Timeframe", "Entry Price", "Exit Price", "P&L", "Mental State", "Tags", "Content"]
    const rows = userEntries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((e) => [
        format(new Date(e.createdAt), "yyyy-MM-dd HH:mm"),
        e.tradeType || "",
        e.symbol || "",
        e.direction || "",
        e.strategy || "",
        e.timeframe || "",
        e.entryPrice?.toString() || "",
        e.exitPrice?.toString() || "",
        e.profitLoss?.toString() || "",
        e.mentalState || "",
        (e.tags || []).join("; "),
        `"${(e.content || "").replace(/"/g, '""')}"`,
      ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trades-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left hover:bg-secondary/50 rounded-xl transition-colors"
    >
      <Download className="h-4 w-4 shrink-0" />
      Export Trades to CSV
    </button>
  )
}
