"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Users, Image as ImageIcon, X, BarChart3 } from "lucide-react"
import { FollowButton } from "@/components/follow-system"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { format } from "date-fns"
import { PnLCalendar } from "@/components/pnl-calendar"

interface UserProfileStats {
  totalTrades: number
  totalPnL: number
  winRate: number
  avgTrade: number
  tradesWithImages: number
  recentTrades: any[]
}

// Function to get mood color classes
const getMoodColorClasses = (mood: string) => {
  const moodColors: Record<string, { bg: string; text: string }> = {
    'calm': { bg: 'bg-green-500/10', text: 'text-green-600' },
    'confident': { bg: 'bg-blue-500/10', text: 'text-blue-600' },
    'excited': { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
    'happy': { bg: 'bg-pink-500/10', text: 'text-pink-600' },
    'anxious': { bg: 'bg-orange-500/10', text: 'text-orange-600' },
    'frustrated': { bg: 'bg-red-500/10', text: 'text-red-600' },
    'neutral': { bg: 'bg-gray-500/10', text: 'text-gray-600' },
    'focused': { bg: 'bg-purple-500/10', text: 'text-purple-600' },
    'grateful': { bg: 'bg-teal-500/10', text: 'text-teal-600' },
    'hopeful': { bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
    'motivated': { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    'relaxed': { bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
    'stressed': { bg: 'bg-rose-500/10', text: 'text-rose-600' },
    'tired': { bg: 'bg-slate-500/10', text: 'text-slate-600' }
  }
  
  const moodKey = mood?.toLowerCase()
  return moodColors[moodKey] || { bg: 'bg-purple-500/10', text: 'text-purple-600' }
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { entries, profiles, currentSpaceId, user } = useAppStore()
  const [userStats, setUserStats] = useState<UserProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [highlightedTradeId, setHighlightedTradeId] = useState<string | null>(null)

  const userId = params.userId as string
  const isOwnProfile = user?.id === userId

  console.log("[PROFILE] Debug info:", {
    userId,
    currentUserId: user?.id,
    isOwnProfile,
    user: user ? { id: user.id, username: user.username } : null
  })

  useEffect(() => {
    console.log("[PROFILE] Component loading with userId:", userId)
    console.log("[PROFILE] Available profiles:", profiles.length)
    console.log("[PROFILE] Current space ID:", currentSpaceId)
    
    if (!userId) return

    // Force load profiles if none are available (common in production)
    if (profiles.length === 0) {
      console.log("[PROFILE] No profiles available, attempting to force load...")
      const { forceLoadProfiles } = useAppStore.getState()
      forceLoadProfiles().then(() => {
        console.log("[PROFILE] Force loaded profiles, retrying user lookup...")
        const updatedProfiles = useAppStore.getState().profiles
        const userProfile = updatedProfiles.find(p => p.id === userId)
        console.log("[PROFILE] Found user profile after force load:", userProfile ? userProfile.username : "Not found")
        
        if (!userProfile) {
          setLoading(false)
          return
        }
        
        // Continue with user stats calculation...
        calculateUserStats(userProfile)
      })
      return
    }

    const userProfile = profiles.find(p => p.id === userId)
    console.log("[PROFILE] Found user profile:", userProfile ? userProfile.username : "Not found")
    
    if (!userProfile) {
      console.log("[PROFILE] User profile not found, setting loading to false")
      setLoading(false)
      return
    }

    calculateUserStats(userProfile)
  }, [userId, entries, profiles, currentSpaceId])

  const calculateUserStats = (userProfile: any) => {
    // Get all entries for this user in current space (if available)
    const userEntries = currentSpaceId ? (entries[currentSpaceId]?.filter(entry => entry.userId === userId) || []) : []
    console.log("[PROFILE] User entries found:", userEntries.length)
    
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
  }

  const userProfile = profiles.find(p => p.id === userId)

  // Handle trade click from calendar
  const handleTradeClick = (entry: any) => {
    setHighlightedTradeId(entry.id)
    
    // Close the calendar modal by clearing selectedDay
    const calendarElement = document.querySelector('[data-calendar-container]')
    if (calendarElement) {
      // Find and trigger the close button click
      const closeButton = calendarElement.querySelector('[data-calendar-close]')
      if (closeButton) {
        (closeButton as HTMLElement).click()
      }
    }
    
    // Scroll to the trade entry
    setTimeout(() => {
      const tradeElement = document.getElementById(`trade-${entry.id}`)
      if (tradeElement) {
        tradeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add highlight effect
        tradeElement.classList.add('ring-4', 'ring-primary/50', 'ring-offset-2')
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          tradeElement.classList.remove('ring-4', 'ring-primary/50', 'ring-offset-2')
          setHighlightedTradeId(null)
        }, 3000)
      }
    }, 100)
  }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="btn-3d p-3 hover:bg-secondary/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {userProfile.username}'s Trading Profile
            </h1>
            <p className="text-muted-foreground text-lg mt-1">@{userProfile.tag}</p>
          </div>
        </div>

        {/* Main Content Area */}
        {(() => {
          console.log("[PROFILE] Rendering decision:", {
            isOwnProfile,
            userId,
            currentUserId: user?.id,
            renderingOwnProfile: isOwnProfile
          })
          return isOwnProfile
        })() ? (
          /* Own Profile - Simplified Version */
          <div className="flex flex-col items-center text-center py-20">
            <div className="mb-8">
              <img
                src={getAvatarUrl(userProfile.username, userProfile.avatar, 128)}
                alt={userProfile.username}
                className="w-32 h-32 rounded-full border-4 border-white/20 shadow-lg"
              />
            </div>
            
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-2">{userProfile.username}</h2>
              <p className="text-muted-foreground text-xl">@{userProfile.tag}</p>
            </div>

            <div className="flex flex-col gap-3">
              <FollowButton userId={userId} />
              <button
                onClick={() => router.push(`/profile/${userId}/analytics`)}
                className="btn-3d flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-lg font-semibold"
              >
                <BarChart3 className="h-6 w-6" />
                Trade Analytics
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Profile Header */}
            <div className="glass-3d rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
              <img
                src={getAvatarUrl(userProfile.username, userProfile.avatar, 96)}
                alt={userProfile.username}
                className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg shrink-0"
              />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-3xl font-bold">{userProfile.username}</h2>
                <p className="text-muted-foreground text-lg">@{userProfile.tag}</p>
                {userProfile.bio && <p className="text-sm text-muted-foreground mt-2">{userProfile.bio}</p>}
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <FollowButton userId={userId} />
                <button
                  onClick={() => router.push(`/profile/${userId}/analytics`)}
                  className="btn-3d flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-bold"
                >
                  <BarChart3 className="h-4 w-4" />
                  Trade Analytics
                </button>
              </div>
            </div>

            {userStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass-3d lift-3d rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">Total</span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-3xl font-bold">{userStats.totalTrades}</p>
                  </div>
                </div>

                <div className="glass-3d lift-3d rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${userStats.totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-lg shrink-0`}>
                      <DollarSign className={`h-5 w-5 ${userStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">P&L</span>
                  </div>
                  <div className="mt-auto">
                    <p className={`text-3xl font-bold ${userStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {userStats.totalPnL >= 0 ? "+" : "-"}${Math.abs(userStats.totalPnL).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="glass-3d lift-3d rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">Win Rate</span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-3xl font-bold">{userStats.winRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="glass-3d lift-3d rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${userStats.avgTrade >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-lg shrink-0`}>
                      <Tag className={`h-5 w-5 ${userStats.avgTrade >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">Avg</span>
                  </div>
                  <div className="mt-auto">
                    <p className={`text-3xl font-bold ${userStats.avgTrade >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {userStats.avgTrade >= 0 ? "+" : "-"}${Math.abs(userStats.avgTrade).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:gap-8">
              <div className="flex-1 min-w-0">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Trading History</h2>
                  <p className="text-muted-foreground">Review recent trades and performance</p>
                </div>
                {userStats?.recentTrades.length === 0 ? (
                  <div className="glass-3d rounded-2xl p-12 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-semibold text-lg mb-3">No public trades available yet</p>
                        <p className="text-sm text-muted-foreground/70 max-w-md">
                          {userProfile.username} hasn&apos;t shared any trades publicly.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    <div className="absolute left-[7px] top-6 bottom-6 w-px bg-border hidden sm:block" />
                    {userStats?.recentTrades.map((entry: any) => (
                      <div key={entry.id} className="relative flex gap-4 mb-4">
                        <div className="hidden sm:flex flex-col items-center pt-6 z-10 shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 ${entry.profitLoss !== undefined ? (entry.profitLoss >= 0 ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500') : 'bg-muted border-border'}`} />
                        </div>
                        <div id={`trade-${entry.id}`} className={`flex-1 glass-3d lift-3d rounded-xl p-5 ${highlightedTradeId === entry.id ? 'ring-4 ring-primary/50 ring-offset-2' : ''}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-bold text-foreground">{userProfile.username}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            {entry.profitLoss !== undefined && (
                              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${entry.profitLoss >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                                {entry.profitLoss >= 0 ? "+" : ""}${Math.abs(entry.profitLoss).toFixed(2)}
                              </span>
                            )}
                            {entry.mentalState && (
                              <span className={`px-3 py-1 ${getMoodColorClasses(entry.mentalState).bg} ${getMoodColorClasses(entry.mentalState).text} rounded-lg text-sm font-medium`}>{entry.mentalState}</span>
                            )}
                            {entry.tradeType && (
                              <span className="px-3 py-1 text-primary rounded-lg text-sm font-semibold">{entry.tradeType.replace(/day-trade/gi, '').trim()}</span>
                            )}
                          </div>
                          <p className="text-foreground text-base mb-3 leading-relaxed">{entry.content}</p>
                          {entry.image && (
                            <div className="mb-3 relative group cursor-pointer" onClick={() => setEnlargedImage(entry.image)}>
                              <img src={entry.image} alt="Trade screenshot" className="w-full max-w-md rounded-lg border border-border/30" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            </div>
                          )}
                          {entry.tags?.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Tag className="h-3 w-3" />
                              <span>{entry.tags.slice(0, 3).join(", ")}{entry.tags.length > 3 ? ` +${entry.tags.length - 3}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full lg:w-[24rem] lg:shrink-0 mt-8 lg:mt-0">
                <div className="sticky top-10">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">P&L Calendar</h3>
                    <p className="text-sm text-muted-foreground">Daily performance overview</p>
                  </div>
                  <div className="transform scale-110 origin-top">
                    <PnLCalendar userId={userId} compact={false} onTradeClick={handleTradeClick} />
                  </div>
                  {userProfile.bio && (
                    <div className="mt-8">
                      <div className="glass-3d rounded-2xl p-6">
                        <h4 className="font-semibold mb-3 text-lg">About</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{userProfile.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {enlargedImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEnlargedImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setEnlargedImage(null)} className="absolute -top-2 -right-2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <img src={enlargedImage} alt="Enlarged trade screenshot" className="w-full h-full object-contain rounded-lg shadow-2xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}