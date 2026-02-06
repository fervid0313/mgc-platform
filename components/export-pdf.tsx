"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { calculateTraderStats } from "@/lib/achievements"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export function ExportPDF() {
  const { entries, currentSpaceId, user, spaces } = useAppStore()

  const handleExport = () => {
    if (!currentSpaceId || !user) return
    const spaceEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    if (spaceEntries.length === 0) return

    const stats = calculateTraderStats(spaceEntries)
    const space = spaces.find((s) => s.id === currentSpaceId)

    const sorted = [...spaceEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const html = `
<!DOCTYPE html>
<html>
<head>
<title>MGS Journal Export - ${format(new Date(), "MMM d, yyyy")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 40px; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin: 24px 0 12px; border-bottom: 2px solid #111; padding-bottom: 4px; }
  .subtitle { color: #666; font-size: 11px; margin-bottom: 24px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
  .stat-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
  .green { color: #16a34a; }
  .red { color: #dc2626; }
  .entry { border: 1px solid #eee; border-radius: 8px; padding: 12px; margin-bottom: 8px; page-break-inside: avoid; }
  .entry-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .entry-date { color: #888; font-size: 10px; }
  .entry-type { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #555; }
  .entry-content { margin-bottom: 6px; }
  .entry-meta { display: flex; gap: 12px; flex-wrap: wrap; }
  .entry-tag { font-size: 9px; background: #f3f4f6; padding: 2px 8px; border-radius: 10px; color: #555; }
  .pnl { font-weight: 700; font-size: 13px; }
  .trade-details { font-size: 10px; color: #666; margin-top: 4px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>MGS Trading Journal</h1>
<p class="subtitle">${space?.name || "Journal"} &bull; ${user.username} &bull; Exported ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>

<h2>Performance Summary</h2>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-label">Total P&L</div><div class="stat-value ${stats.totalPnL >= 0 ? "green" : "red"}">${stats.totalPnL >= 0 ? "+" : ""}$${Math.abs(stats.totalPnL).toFixed(2)}</div></div>
  <div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value">${stats.totalWins + stats.totalLosses > 0 ? Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100) : 0}%</div></div>
  <div class="stat-card"><div class="stat-label">Total Trades</div><div class="stat-value">${stats.totalEntries}</div></div>
  <div class="stat-card"><div class="stat-label">Best Streak</div><div class="stat-value">${stats.bestWinStreak}</div></div>
  <div class="stat-card"><div class="stat-label">Avg Win</div><div class="stat-value green">$${stats.avgWin.toFixed(2)}</div></div>
  <div class="stat-card"><div class="stat-label">Avg Loss</div><div class="stat-value red">-$${stats.avgLoss.toFixed(2)}</div></div>
  <div class="stat-card"><div class="stat-label">Green Days</div><div class="stat-value">${stats.greenDays}</div></div>
  <div class="stat-card"><div class="stat-label">Journal Streak</div><div class="stat-value">${stats.journalStreak}d</div></div>
</div>

<h2>Journal Entries (${sorted.length})</h2>
${sorted.map((e) => {
  const pnl = e.profitLoss !== undefined
    ? `<span class="pnl ${e.profitLoss >= 0 ? "green" : "red"}">${e.profitLoss >= 0 ? "+" : ""}$${Math.abs(e.profitLoss).toLocaleString()}</span>`
    : ""
  const hasTradeDetails = e.symbol || e.direction || e.entryPrice || e.exitPrice || e.strategy
  const trade = hasTradeDetails
    ? `<div class="trade-details">${[
        e.symbol && `Symbol: ${e.symbol}`,
        e.direction && `Direction: ${e.direction}`,
        e.entryPrice && `Entry: ${e.entryPrice}`,
        e.exitPrice && `Exit: ${e.exitPrice}`,
        e.strategy && `Strategy: ${e.strategy}`,
      ].filter(Boolean).join(" &bull; ")}</div>`
    : ""
  const tags = (e.tags || []).map((t) => `<span class="entry-tag">#${t}</span>`).join("")
  return `<div class="entry">
    <div class="entry-header">
      <span class="entry-type">${e.tradeType?.replace("-", " ") || "general"}${e.mentalState ? ` &bull; ${e.mentalState}` : ""}</span>
      <span class="entry-date">${format(new Date(e.createdAt), "MMM d, yyyy h:mm a")}</span>
    </div>
    <div class="entry-content">${e.content || ""}</div>
    ${trade}
    <div class="entry-meta">${pnl}${tags ? `<div>${tags}</div>` : ""}</div>
  </div>`
}).join("")}

</body>
</html>`

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  return (
    <Button variant="outline" className="btn-3d w-full justify-start" size="sm" onClick={handleExport}>
      <FileDown className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  )
}
