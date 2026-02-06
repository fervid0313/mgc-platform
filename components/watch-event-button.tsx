"use client"

import { useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

interface WatchEventButtonProps {
  event: {
    time: string
    event: string
    impact: string
    date: string
  }
}

export function WatchEventButton({ event }: WatchEventButtonProps) {
  const { user, watchedEvents, watchEvent, unwatchEvent } = useAppStore()
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const fingerprint = `${event.date}|${event.event}|${event.time}`
  const isWatched = watchedEvents.some((w) => w.eventFingerprint === fingerprint)

  const handleWatch = async (leadMinutes: 1 | 5 | 15) => {
    setLoading(true)
    try {
      await watchEvent(fingerprint, event.event, event.time, event.date, event.impact as "High" | "Medium" | "Low", leadMinutes)
      toast({
        title: "Event watched",
        description: `You’ll be alerted ${leadMinutes} minute${leadMinutes > 1 ? "s" : ""} before ${event.event}`,
      })
    } catch {
      toast({
        title: "Failed to watch event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnwatch = async () => {
    setLoading(true)
    try {
      await unwatchEvent(fingerprint)
      toast({
        title: "Event unwatched",
        description: `You will no longer receive alerts for ${event.event}`,
      })
    } catch {
      toast({
        title: "Failed to unwatch event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isWatched) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnwatch}
        disabled={loading}
        className="text-xs gap-1"
      >
        <BellOff className="h-3 w-3" />
        Watching
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="text-xs gap-1">
          <Bell className="h-3 w-3" />
          Watch
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void handleWatch(15)}>
          Alert 15m before
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleWatch(5)}>
          Alert 5m before
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleWatch(1)}>
          Alert 1m before
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
