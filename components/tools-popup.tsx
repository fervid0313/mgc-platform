"use client"

import { useState } from "react"
import { Wrench, Calculator, FileDown, Link2, X } from "lucide-react"
import { RiskCalculator } from "./risk-calculator"
import { ExportPDF } from "./export-pdf"
import { ExportCSV } from "./export-csv"
import { DataBackup } from "./data-backup"
import { BrokerConnect } from "./broker-connect"
import { Watchlist } from "./watchlist"

export function ToolsPopup() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-3d p-2.5 rounded-xl hover:bg-secondary/50 transition-colors"
        title="Tools"
      >
        <Wrench className="h-5 w-5 text-muted-foreground" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popup */}
          <div className="absolute top-full right-0 mt-2 z-50 w-72 glass-3d rounded-2xl p-4 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold">Tools</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <BrokerConnect />
              <ExportPDF />
              <ExportCSV />
              <RiskCalculator />
              <Watchlist />
              <DataBackup />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
