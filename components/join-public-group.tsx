"use client"

import { useState, useRef, useEffect } from "react"
import { Users, ShoppingBag, TrendingUp, LineChart, PiggyBank, MoreHorizontal, ChevronDown } from "lucide-react"
import { useAppStore } from "@/lib/store"

const PUBLIC_GROUPS = [
  {
    id: "group-ecommerce",
    name: "e-Commerce",
    description: "Online stores & dropshipping",
    icon: ShoppingBag,
  },
  {
    id: "group-brand-scaling",
    name: "Brand Scaling",
    description: "Grow your brand",
    icon: TrendingUp,
  },
  {
    id: "group-day-trading",
    name: "Day Trading",
    description: "Intraday strategies",
    icon: LineChart,
  },
  {
    id: "group-investments",
    name: "Investments",
    description: "Long-term plays",
    icon: PiggyBank,
  },
  {
    id: "group-other",
    name: "Other",
    description: "General topics",
    icon: MoreHorizontal,
  },
]

export function JoinPublicGroup() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { spaces, createSpace, setCurrentSpace } = useAppStore()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleJoinGroup = (group: (typeof PUBLIC_GROUPS)[0]) => {
    console.log("[JoinGroup] Attempting to join:", group.name)
    console.log("[JoinGroup] Current spaces:", spaces.map(s => s.name))

    const existingSpace = spaces.find((s) => s.name === group.name)
    if (existingSpace) {
      console.log("[JoinGroup] Space already exists, switching to:", existingSpace.id)
      setCurrentSpace(existingSpace.id)
    } else {
      console.log("[JoinGroup] Creating new space:", group.name)
      createSpace(group.name, group.description, false)
    }
    setIsOpen(false)
  }

  const isJoined = (groupName: string) => {
    return spaces.some((s) => s.name === groupName)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
      >
        <Users className="h-3.5 w-3.5" />
        <span>Join Public Group</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 glass rounded-xl border border-border shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted-foreground">Join groups and add friends to build your community.</p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {PUBLIC_GROUPS.map((group) => {
              const Icon = group.icon
              const joined = isJoined(group.name)

              return (
                <button
                  key={group.id}
                  onClick={() => handleJoinGroup(group)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    joined ? "bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${joined ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">{group.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                  </div>
                  {joined && (
                    <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                      Joined
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
