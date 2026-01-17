"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Link2, Check } from "lucide-react"

export function InviteButton() {
  const { currentSpaceId, spaces } = useAppStore()
  const [copied, setCopied] = useState(false)
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  const handleCopy = async () => {
    const inviteLink = `https://midnight.app/join?s=${currentSpace?.name ? currentSpace.name.replace(/\s/g, "") : ""}`
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed bottom-8 left-6 z-30">
      <button
        onClick={handleCopy}
        className="glass p-4 rounded-2xl flex items-center gap-3 active:scale-90 transition-all border border-primary/30 hover:border-primary/50 group"
      >
        <div className="bg-primary p-1.5 rounded-lg">
          {copied ? (
            <Check className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Link2 className="h-4 w-4 text-primary-foreground" />
          )}
        </div>
        <span className="text-xs font-bold tracking-tight">{copied ? "Link Copied!" : "Invite to Space"}</span>
      </button>
    </div>
  )
}
