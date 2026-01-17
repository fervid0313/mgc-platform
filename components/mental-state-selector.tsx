"use client"

import type React from "react"

import type { MentalState } from "@/lib/types"
import { Brain, Target, Flame, AlertTriangle } from "lucide-react"

interface MentalStateSelectorProps {
  value: MentalState | undefined
  onChange: (state: MentalState) => void
}

const mentalStates: { value: MentalState; label: string; icon: React.ReactNode; color: string; description: string }[] =
  [
    {
      value: "calm",
      label: "Calm",
      icon: <Brain className="h-4 w-4" />,
      color: "text-green-500 border-green-500/30 bg-green-500/10",
      description: "Clear-headed and patient",
    },
    {
      value: "focused",
      label: "Focused",
      icon: <Target className="h-4 w-4" />,
      color: "text-blue-500 border-blue-500/30 bg-blue-500/10",
      description: "Locked in and disciplined",
    },
    {
      value: "aggressive",
      label: "Aggressive",
      icon: <Flame className="h-4 w-4" />,
      color: "text-red-500 border-red-500/30 bg-red-500/10",
      description: "High-risk tolerance",
    },
    {
      value: "fearful",
      label: "Fearful",
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-amber-500 border-amber-500/30 bg-amber-500/10",
      description: "Uncertain and hesitant",
    },
  ]

export function MentalStateSelector({ value, onChange }: MentalStateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        Current Mental State
      </label>
      <div className="grid grid-cols-2 gap-2">
        {mentalStates.map((state) => (
          <button
            key={state.value}
            onClick={() => onChange(state.value)}
            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
              value === state.value ? state.color : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {state.icon}
            <div className="text-left">
              <div className="text-xs font-bold">{state.label}</div>
              <div className="text-[10px] opacity-70">{state.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
