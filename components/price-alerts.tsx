"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import {
  Bell,
  BellOff,
  Plus,
  X,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react"

interface PriceAlert {
  id: string
  market: string
  type: "above" | "below" | "touch" | "break"
  price: number
  condition: "HOD" | "LOD" | "turnaround" | "liquidity" | "custom"
  message: string
  active: boolean
  triggered: boolean
  createdAt: string
  triggeredAt?: string
}

interface AlertHistory {
  id: string
  alertId: string
  market: string
  price: number
  condition: string
  triggeredAt: string
  acknowledged: boolean
}

const MARKETS = [
  { value: "NQ100", label: "NQ100" },
  { value: "ES", label: "ES" },
  { value: "Gold", label: "Gold" },
  { value: "Silver", label: "Silver" },
  { value: "BTC", label: "BTC" },
  { value: "Oil", label: "Oil" },
  { value: "DXY", label: "DXY" },
  { value: "VIX", label: "VIX" },
  { value: "US10Y", label: "US10Y" },
]

const ALERT_TYPES = [
  { value: "above", label: "Price Above", icon: TrendingUp },
  { value: "below", label: "Price Below", icon: TrendingDown },
  { value: "touch", label: "Price Touch", icon: Target },
  { value: "break", label: "Level Break", icon: AlertTriangle },
]

const CONDITIONS = [
  { value: "custom", label: "Custom Price" },
  { value: "HOD", label: "Daily High" },
  { value: "LOD", label: "Daily Low" },
  { value: "turnaround", label: "Turnaround Zone" },
  { value: "liquidity", label: "Liquidity Level" },
]

export function PriceAlerts() {
  const { isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])
  const [showAddAlert, setShowAddAlert] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [newAlert, setNewAlert] = useState({
    market: "NQ100",
    type: "above" as const,
    price: 0,
    condition: "custom" as const,
    message: "",
  })

  // Client-side mount
  useEffect(() => {
    setMounted(true)
    loadAlerts()
    loadAlertHistory()
    loadSettings()
    requestNotificationPermission()
  }, [])

  // Load saved data
  const loadAlerts = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-price-alerts")
      if (saved) setAlerts(JSON.parse(saved))
    } catch (error) {
      console.error("Failed to load alerts:", error)
    }
  }, [])

  const loadAlertHistory = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("mgc-alert-history")
      if (saved) setAlertHistory(JSON.parse(saved))
    } catch (error) {
      console.error("Failed to load alert history:", error)
    }
  }, [])

  const loadSettings = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const settings = JSON.parse(localStorage.getItem("mgc-alert-settings") || "{}")
      setSoundEnabled(settings.soundEnabled ?? true)
      setNotificationsEnabled(settings.notificationsEnabled ?? true)
    } catch (error) {
      console.error("Failed to load alert settings:", error)
    }
  }, [])

  // Save data
  const saveAlerts = useCallback((alerts: PriceAlert[]) => {
    localStorage.setItem("mgc-price-alerts", JSON.stringify(alerts))
  }, [])

  const saveAlertHistory = useCallback((history: AlertHistory[]) => {
    localStorage.setItem("mgc-alert-history", JSON.stringify(history))
  }, [])

  const saveSettings = useCallback(() => {
    localStorage.setItem("mgc-alert-settings", JSON.stringify({
      soundEnabled,
      notificationsEnabled,
    }))
  }, [soundEnabled, notificationsEnabled])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission()
      }
    }
  }, [])

  // Fetch current prices
  useEffect(() => {
    if (!mounted) return

    const fetchPrices = async () => {
      try {
        const response = await fetch("/api/market")
        if (response.ok) {
          const data = await response.json()
          const prices: Record<string, number> = {}
          data.forEach((item: any) => {
            prices[item.label] = item.price
          })
          setCurrentPrices(prices)
          checkAlerts(prices)
        }
      } catch (error) {
        console.error("Failed to fetch prices:", error)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [mounted])

  // Check alerts against current prices
  const checkAlerts = useCallback((prices: Record<string, number>) => {
    const now = new Date().toISOString()
    let alertsUpdated = false
    let historyUpdated = false

    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert => {
        if (alert.triggered || !alert.active) return alert

        const currentPrice = prices[alert.market]
        if (!currentPrice) return alert

        let shouldTrigger = false

        switch (alert.type) {
          case "above":
            shouldTrigger = currentPrice >= alert.price
            break
          case "below":
            shouldTrigger = currentPrice <= alert.price
            break
          case "touch":
            shouldTrigger = Math.abs(currentPrice - alert.price) < 0.01
            break
          case "break":
            shouldTrigger = Math.abs(currentPrice - alert.price) < 0.01
            break
        }

        if (shouldTrigger) {
          alertsUpdated = true
          triggerAlert(alert, currentPrice)
          return { ...alert, triggered: true, triggeredAt: now }
        }

        return alert
      })

      if (alertsUpdated) saveAlerts(updatedAlerts)
      return updatedAlerts
    })
  }, [])

  // Trigger alert
  const triggerAlert = useCallback((alert: PriceAlert, price: number) => {
    // Add to history
    const historyItem: AlertHistory = {
      id: Date.now().toString(),
      alertId: alert.id,
      market: alert.market,
      price,
      condition: `${alert.type} ${alert.price}`,
      triggeredAt: new Date().toISOString(),
      acknowledged: false,
    }

    setAlertHistory(prev => {
      const updated = [historyItem, ...prev.slice(0, 49)] // Keep last 50
      saveAlertHistory(updated)
      return updated
    })

    // Show notification
    if (notificationsEnabled && Notification.permission === "granted") {
      new Notification(`${alert.market} Alert`, {
        body: alert.message || `${alert.type} ${alert.price}`,
        icon: "/favicon.ico",
        tag: alert.id,
      })
    }

    // Play sound
    if (soundEnabled) {
      playAlertSound()
    }
  }, [notificationsEnabled, soundEnabled])

  // Play alert sound
  const playAlertSound = useCallback(() => {
    try {
      const audio = new Audio("/data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT")
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors
    } catch (error) {
      console.error("Failed to play alert sound:", error)
    }
  }, [])

  // Add new alert
  const addAlert = useCallback(() => {
    if (!newAlert.price || !newAlert.message) return

    const alert: PriceAlert = {
      id: Date.now().toString(),
      market: newAlert.market,
      type: newAlert.type,
      price: newAlert.price,
      condition: newAlert.condition,
      message: newAlert.message,
      active: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    }

    setAlerts(prev => {
      const updated = [...prev, alert]
      saveAlerts(updated)
      return updated
    })

    setShowAddAlert(false)
    setNewAlert({
      market: "NQ100",
      type: "above",
      price: 0,
      condition: "custom",
      message: "",
    })
  }, [newAlert])

  // Delete alert
  const deleteAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id)
      saveAlerts(updated)
      return updated
    })
  }, [])

  // Toggle alert
  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, active: !a.active } : a
      )
      saveAlerts(updated)
      return updated
    })
  }, [])

  // Acknowledge alert
  const acknowledgeAlert = useCallback((id: string) => {
    setAlertHistory(prev => {
      const updated = prev.map(h => 
        h.id === id ? { ...h, acknowledged: true } : h
      )
      saveAlertHistory(updated)
      return updated
    })
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    setAlertHistory([])
    saveAlertHistory([])
  }, [])

  if (!mounted) return null

  const activeAlerts = alerts.filter(a => a.active && !a.triggered)
  const recentHistory = alertHistory.filter(h => !h.acknowledged).slice(0, 5)

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-black">Price Alerts</span>
            {activeAlerts.length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                {activeAlerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              {notificationsEnabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setShowAddAlert(!showAddAlert)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Add Alert Form */}
        {showAddAlert && (
          <div className="p-3 bg-background/30 border border-border/30 rounded-lg mb-3">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newAlert.market}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, market: e.target.value }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                >
                  {MARKETS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as any }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                >
                  {ALERT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value as any }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                >
                  {CONDITIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={newAlert.price || ""}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
                />
              </div>
              <input
                type="text"
                placeholder="Alert message"
                value={newAlert.message}
                onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                className="w-full text-xs bg-background/50 border border-border/30 rounded px-2 py-1"
              />
              <div className="flex gap-2">
                <button
                  onClick={addAlert}
                  disabled={!newAlert.price || !newAlert.message}
                  className="flex-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Alert
                </button>
                <button
                  onClick={() => setShowAddAlert(false)}
                  className="text-xs text-muted-foreground/50 px-2 py-1 hover:text-muted-foreground/70"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Active Alerts</p>
            <div className="space-y-1">
              {activeAlerts.map(alert => {
                const AlertIcon = ALERT_TYPES.find(t => t.value === alert.type)?.icon || Bell
                const currentPrice = currentPrices[alert.market]
                const isNearTrigger = currentPrice && Math.abs(currentPrice - alert.price) / alert.price < 0.01

                return (
                  <div key={alert.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                    isNearTrigger ? "border-yellow-500/30 bg-yellow-500/5" : "border-border/20 bg-background/20"
                  }`}>
                    <AlertIcon className="h-3 w-3 text-muted-foreground/50" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-foreground/60">{alert.market}</span>
                        <span className="text-[8px] text-muted-foreground/40">{alert.type}</span>
                        <span className="text-[9px] font-bold text-primary">{alert.price}</span>
                        {currentPrice && (
                          <span className={`text-[8px] ${
                            currentPrice > alert.price ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {currentPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] text-muted-foreground/40 truncate">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className="text-muted-foreground/30 hover:text-muted-foreground/60"
                    >
                      <Bell className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-muted-foreground/30 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        {recentHistory.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1.5">Recent Alerts</p>
            <div className="space-y-1">
              {recentHistory.map(alert => (
                <div key={alert.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/20 bg-background/20">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-foreground/60">{alert.market}</span>
                      <span className="text-[8px] text-emerald-400">{alert.price}</span>
                      <span className="text-[8px] text-muted-foreground/40">{alert.condition}</span>
                    </div>
                    <p className="text-[8px] text-muted-foreground/40">
                      {new Date(alert.triggeredAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60"
                  >
                    Ack
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeAlerts.length === 0 && recentHistory.length === 0 && (
          <div className="text-center py-4">
            <Bell className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40">No alerts set</p>
            <p className="text-[8px] text-muted-foreground/30">Click + to add price alerts</p>
          </div>
        )}

        {/* Footer */}
        {alertHistory.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <span className="text-[8px] text-muted-foreground/40">
              {alertHistory.length} total alerts
            </span>
            <button
              onClick={clearHistory}
              className="text-[8px] text-muted-foreground/30 hover:text-red-400"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
