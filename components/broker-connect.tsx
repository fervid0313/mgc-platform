"use client"

import { useState, useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"
import type { BrokerType } from "@/lib/types"
import {
  Link2,
  Unlink,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  X,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const BROKERS: { id: BrokerType; name: string; description: string; hasAPI: boolean }[] = [
  {
    id: "tradovate",
    name: "Tradovate",
    description: "Import trades via CSV export",
    hasAPI: false,
  },
  {
    id: "projectx",
    name: "Project X",
    description: "Import trades via CSV export",
    hasAPI: false,
  },
]

export function BrokerConnect() {
  const [open, setOpen] = useState(false)
  const {
    linkedAccounts,
    loadLinkedAccounts,
    connectBroker,
    disconnectBroker,
    syncBrokerTrades,
    importCSV,
    loadImportedTrades,
  } = useAppStore()

  useEffect(() => {
    if (open) {
      loadLinkedAccounts()
      loadImportedTrades()
    }
  }, [open, loadLinkedAccounts, loadImportedTrades])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn-3d w-full justify-start" size="sm">
          <Link2 className="h-4 w-4 mr-2" />
          Link Trading Account
        </Button>
      </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] glass-3d border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Trading Accounts
            </DialogTitle>
            <DialogDescription>
              Connect your broker to auto-import trades as pre-filled journal entries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {BROKERS.map((broker) => {
              const linked = linkedAccounts.find((a) => a.broker === broker.id && a.isActive)

              return (
                <BrokerCard
                  key={broker.id}
                  broker={broker}
                  linked={!!linked}
                  lastSynced={linked?.lastSyncedAt}
                  environment={linked?.environment}
                  onConnect={connectBroker}
                  onDisconnect={disconnectBroker}
                  onSync={syncBrokerTrades}
                  onImportCSV={importCSV}
                />
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
  )
}

function BrokerCard({
  broker,
  linked,
  lastSynced,
  environment,
  onConnect,
  onDisconnect,
  onSync,
  onImportCSV,
}: {
  broker: { id: BrokerType; name: string; description: string; hasAPI: boolean }
  linked: boolean
  lastSynced?: Date | null
  environment?: string
  onConnect: (broker: BrokerType, username: string, password: string, env: "demo" | "live") => Promise<{ success: boolean; error?: string }>
  onDisconnect: (broker: BrokerType) => Promise<boolean>
  onSync: (broker: BrokerType) => Promise<{ success: boolean; imported?: number; error?: string }>
  onImportCSV: (file: File, broker: BrokerType) => Promise<{ success: boolean; imported?: number; error?: string }>
}) {
  const [expanded, setExpanded] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [env, setEnv] = useState<"demo" | "live">("demo")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const handleConnect = async () => {
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setMessage(null)
    const result = await onConnect(broker.id, username, password, env)
    if (result.success) {
      setMessage({ type: "success", text: `${broker.name} connected!` })
      setUsername("")
      setPassword("")
      setExpanded(false)
    } else {
      setMessage({ type: "error", text: result.error || "Connection failed" })
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true)
    await onDisconnect(broker.id)
    setMessage(null)
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)
    const result = await onSync(broker.id)
    if (result.success) {
      setMessage({ type: "success", text: `Synced ${result.imported || 0} new trades` })
    } else {
      setMessage({ type: "error", text: result.error || "Sync failed" })
    }
    setSyncing(false)
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMessage(null)
    const result = await onImportCSV(file, broker.id)
    if (result.success) {
      setMessage({ type: "success", text: `Imported ${result.imported || 0} trades from CSV` })
    } else {
      setMessage({ type: "error", text: result.error || "Import failed" })
    }
    setLoading(false)
    if (csvInputRef.current) csvInputRef.current.value = ""
  }

  return (
    <div className="glass-3d rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${linked ? "bg-green-500" : "bg-muted-foreground/30"}`} />
          <div>
            <h4 className="font-semibold text-sm">{broker.name}</h4>
            <p className="text-xs text-muted-foreground">{broker.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {linked && broker.hasAPI && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-3d p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              title="Sync trades"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            </button>
          )}

          {linked ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="btn-3d p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
              title="Disconnect"
            >
              <Unlink className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-3d p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {linked && lastSynced && (
        <p className="text-xs text-muted-foreground">
          Last synced: {new Date(lastSynced).toLocaleString()} ({environment})
        </p>
      )}

      {/* CSV upload for Project X (always available when connected or expanding) */}
      {!broker.hasAPI && (linked || expanded) && (
        <div className="pt-2 border-t border-white/10">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="btn-3d w-full"
            onClick={() => csvInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload CSV
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Export your trade history from {broker.name} as CSV and upload it here.
          </p>
        </div>
      )}

      {/* Connect form for API brokers */}
      {expanded && !linked && broker.hasAPI && (
        <div className="pt-2 border-t border-white/10 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`${broker.name} username`}
              className="bg-background/50 border-border h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background/50 border-border h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Environment</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setEnv("demo")}
                className={`btn-3d flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  env === "demo" ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground"
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setEnv("live")}
                className={`btn-3d flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  env === "live" ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground"
                }`}
              >
                Live
              </button>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            disabled={loading || !username.trim() || !password.trim()}
            className="btn-3d w-full"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
