"use client"

import { Palette } from "lucide-react"

export function ThemeSelector() {
  return (
    <div className="relative">
      <button
        className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors icon-glow cursor-default"
        title="Monochrome theme"
      >
        <Palette className="h-4 w-4" />
      </button>
    </div>
  )
}
