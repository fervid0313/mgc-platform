"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi } from "lucide-react"

const OFFLINE_QUEUE_KEY = "mgc-offline-queue"

export function getOfflineQueue(): any[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]") } catch { return [] }
}

export function addToOfflineQueue(action: any) {
  const queue = getOfflineQueue()
  queue.push({ ...action, queuedAt: new Date().toISOString() })
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3000)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const interval = setInterval(() => {
      setQueueCount(getOfflineQueue().length)
    }, 2000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!showBanner && isOnline) return null

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 ${
      isOnline ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
    }`}>
      {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {isOnline
        ? `Back online${queueCount > 0 ? ` · ${queueCount} queued actions syncing...` : ""}`
        : `You're offline${queueCount > 0 ? ` · ${queueCount} actions queued` : " · Changes will be saved locally"}`
      }
    </div>
  )
}
