"use client"

import { useState, useEffect } from "react"
import { X, Keyboard } from "lucide-react"

const shortcuts = [
  { keys: ["Ctrl", "Enter"], description: "Post journal entry" },
  { keys: ["?"], description: "Toggle this shortcuts panel" },
  { keys: ["Ctrl", "K"], description: "Focus search" },
  { keys: ["Ctrl", "/"], description: "Toggle sidebar" },
  { keys: ["Esc"], description: "Close modals / lightbox" },
  { keys: ["←", "→"], description: "Navigate lightbox images" },
]

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="glass-3d rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => (
                  <span key={ki}>
                    <kbd className="px-2 py-1 text-[10px] font-bold bg-secondary/50 border border-border rounded-md">{k}</kbd>
                    {ki < s.keys.length - 1 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-4">Press <kbd className="px-1.5 py-0.5 bg-secondary/50 border border-border rounded text-[9px] font-bold">?</kbd> to toggle</p>
      </div>
    </div>
  )
}
