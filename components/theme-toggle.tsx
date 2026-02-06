"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [mode, setMode] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const saved = localStorage.getItem("mgc-color-mode") as "dark" | "light" | null
    if (saved) {
      setMode(saved)
      document.documentElement.setAttribute("data-mode", saved)
    }
  }, [])

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark"
    setMode(next)
    localStorage.setItem("mgc-color-mode", next)
    if (next === "light") {
      document.documentElement.setAttribute("data-mode", "light")
    } else {
      document.documentElement.removeAttribute("data-mode")
    }
  }

  return (
    <button
      onClick={toggle}
      className="btn-3d p-2 rounded-xl hover:bg-secondary/50 transition-colors"
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mode === "dark" ? (
        <Sun className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}
