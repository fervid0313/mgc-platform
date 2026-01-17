"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { UserPlus, Search, Check, X, Clock, Users, Loader2 } from "lucide-react"

export function AddFriend() {
  const {
    user,
    sendFriendRequest,
    getIncomingRequests,
    getOutgoingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<"add" | "requests">("add")
  const [searchInput, setSearchInput] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const incomingRequests = getIncomingRequests()
  const outgoingRequests = getOutgoingRequests()
  const totalPending = incomingRequests.length

  const handleSendRequest = async () => {
    if (!searchInput.trim()) return
    setIsLoading(true)
    setResult(null)

    try {
      const response = await sendFriendRequest(searchInput.trim())
      if (response.success) {
        setResult({ success: true, message: "Friend request sent!" })
        setSearchInput("")
      } else {
        setResult({ success: false, message: response.error || "Failed to send request" })
      }
    } catch (error) {
      setResult({ success: false, message: "An error occurred" })
    } finally {
      setIsLoading(false)
    }

    setTimeout(() => setResult(null), 3000)
  }

  const handleAccept = async (requestId: string) => {
    setIsLoading(true)
    await acceptFriendRequest(requestId)
    setIsLoading(false)
  }

  const handleReject = async (requestId: string) => {
    setIsLoading(true)
    await rejectFriendRequest(requestId)
    setIsLoading(false)
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/50 hover:bg-secondary transition-colors border border-border/50 icon-glow"
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Add Friend</span>
        {totalPending > 0 && (
          <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-primary text-primary-foreground rounded-full">
            {totalPending}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 glass rounded-xl border border-border/50 shadow-xl z-50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setTab("add")}
                className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                  tab === "add"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="h-3.5 w-3.5 inline mr-1.5" />
                Add Friend
              </button>
              <button
                onClick={() => setTab("requests")}
                className={`flex-1 px-4 py-3 text-xs font-medium transition-colors relative ${
                  tab === "requests"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5 inline mr-1.5" />
                Requests
                {totalPending > 0 && (
                  <span className="absolute top-2 right-4 w-4 h-4 text-[9px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {totalPending}
                  </span>
                )}
              </button>
            </div>

            <div className="p-4">
              {tab === "add" ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground">
                    Your tag:{" "}
                    <span className="font-mono text-foreground">
                      {user.username}#{user.tag}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Username#1234"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendRequest()}
                      disabled={isLoading}
                      className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendRequest}
                      disabled={isLoading}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
                    </button>
                  </div>
                  {result && (
                    <p className={`text-xs ${result.success ? "text-green-500" : "text-red-500"}`}>{result.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Incoming Requests */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Incoming ({incomingRequests.length})
                    </h4>
                    {incomingRequests.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 py-2">No incoming requests</p>
                    ) : (
                      <div className="space-y-2">
                        {incomingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium">{req.fromUsername}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">#{req.fromTag}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAccept(req.id)}
                                disabled={isLoading}
                                className="p-1.5 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={isLoading}
                                className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outgoing Requests */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Pending ({outgoingRequests.length})
                    </h4>
                    {outgoingRequests.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 py-2">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {outgoingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium">{req.toUsername}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">#{req.toTag}</p>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] text-amber-500">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
