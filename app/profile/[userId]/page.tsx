"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Users, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"

interface UserProfileStats {
  totalTrades: number
  totalPnL: number
  winRate: number
  avgTrade: number
  tradesWithImages: number
  recentTrades: any[]
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { entries, profiles, currentSpaceId } = useAppStore()
  const [userStats, setUserStats] = useState<UserProfileStats | null>(null)
  const [loading, setLoading] = useState(true)

  const userId = params.userId as string

  useEffect(() => {
    if (!userId || !currentSpaceId) return

    const userProfile = profiles.find(p => p.id === userId)
    if (!userProfile) {
      setLoading(false)
      return
    }

    // Get all entries for this user in current space
    const userEntries = entries[currentSpaceId]?.filter(entry => entry.userId === userId) || []
    
    // Calculate stats
    const profitableTrades = userEntries.filter(entry => (entry.profitLoss || 0) > 0)
    const totalPnL = userEntries.reduce((sum, entry) => sum + (entry.profitLoss || 0), 0)
    const winRate = userEntries.length > 0 ? (profitableTrades.length / userEntries.length) * 100 : 0
    const avgTrade = userEntries.length > 0 ? totalPnL / userEntries.length : 0
    const tradesWithImages = userEntries.filter(entry => entry.image).length

    // Sort entries by date (most recent first)
    const sortedEntries = [...userEntries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setUserStats({
      totalTrades: userEntries.length,
      totalPnL,
      winRate,
      avgTrade,
      tradesWithImages,
      recentTrades: sortedEntries
    })

    setLoading(false)
  }, [userId, entries, profiles, currentSpaceId])

  const userProfile = profiles.find(p => p.id === userId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
          <p className="text-muted-foreground mb-4">This user profile doesn't exist or isn't available in your current space.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{userProfile.username}'s Trading Profile</h1>
            <p className="text-muted-foreground">@{userProfile.tag}</p>
          </div>
        </div>

        {/* Stats Overview */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Trades</span>
              </div>
              <p className="text-2xl font-bold">{userStats.totalTrades}</p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total P&L</span>
              </div>
              <p className={`text-2xl font-bold flex items-center gap-2 ${
                userStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {userStats.totalPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                ${Math.abs(userStats.totalPnL).toFixed(2)}
              </p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-2xl font-bold">{userStats.winRate.toFixed(1)}%</p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Trade</span>
              </div>
              <p className={`text-2xl font-bold ${
                userStats.avgTrade >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ${Math.abs(userStats.avgTrade).toFixed(2)}
              </p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">With Images</span>
              </div>
              <p className="text-2xl font-bold">{userStats.tradesWithImages}</p>
            </div>
          </div>
        )}

        {/* Recent Trades */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Trading History</h2>
          
          {userStats?.recentTrades.length === 0 ? (
            <div className="bg-secondary/30 rounded-xl p-8 text-center border border-border/50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-2">No public trades available yet</p>
                  <p className="text-sm text-muted-foreground/70">
                    {userProfile.username} hasn't shared any trades publicly, or there are no trades in your current space.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {userStats?.recentTrades.map((entry) => (
                <div key={entry.id} className="bg-secondary/30 rounded-xl p-6 border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                          {entry.tradeType}
                        </span>
                        {entry.profitLoss !== undefined && (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            entry.profitLoss >= 0 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {entry.profitLoss >= 0 ? "+" : ""}${Math.abs(entry.profitLoss).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-foreground mb-3">{entry.content}</p>
                      
                      {/* Display image if present */}
                      {entry.image && (
                        <div className="mb-4">
                          <div className="relative group">
                            <img
                              src={entry.image}
                              alt="Trade screenshot"
                              className="w-full max-w-md rounded-lg border border-border/30 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.open(entry.image, '_blank')}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="text-sm text-muted-foreground flex items-center gap-2"><ImageIcon class="h-4 w-4" />Image failed to load</div>';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Click image to view full size
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.createdAt), "MMM d, yyyy")}
                        </span>
                        {entry.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {entry.tags.slice(0, 3).join(", ")}
                            {entry.tags.length > 3 && `+${entry.tags.length - 3}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
