"use client"

import { useState, useRef, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { Users } from "lucide-react"
import type { UserProfile } from "@/lib/types"

interface SpaceMembersTooltipProps {
  spaceId: string
  memberCount: number
  children: React.ReactNode
}

export function SpaceMembersTooltip({ spaceId, memberCount, children }: SpaceMembersTooltipProps) {
  const { getSpaceMembers } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [members, setMembers] = useState<UserProfile[]>([])
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Load members when tooltip opens
      const spaceMembers = getSpaceMembers(spaceId)
      setMembers(spaceMembers)
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, spaceId, getSpaceMembers])

  return (
    <div className="relative" ref={tooltipRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 glass rounded-xl border border-border shadow-xl z-50">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Space Members</span>
              <span className="text-xs text-muted-foreground">({memberCount})</span>
            </div>
          </div>

          <div className="p-2 max-h-48 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No members found
              </p>
            ) : (
              <div className="space-y-1">
                {members?.slice(0, 10)?.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img
                        src={getAvatarUrl(member.username || "user", member.avatar, 24)}
                        alt={member.username || "Member"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member.username || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {member.tradingStyle ? member.tradingStyle.replace("-", " ") : "Member"}
                      </p>
                    </div>
                  </div>
                ))}
                {members.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{members.length - 10} more members
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}