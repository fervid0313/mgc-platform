"use client"

import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { X, Camera, User, Calendar, Tag, TrendingUp, TrendingDown, DollarSign, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { getAvatarUrl } from "@/lib/avatar-generator"

interface ProfileDetailsProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileDetails({ isOpen, onClose }: ProfileDetailsProps) {
  const { user, profiles, entries, currentSpaceId } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const profile = user ? profiles.find(p => p.id === user.id) : null

  if (!isOpen || !user || !profile) return null

  // Get user's entries for current space
  const userEntries = currentSpaceId ? entries[currentSpaceId]?.filter(entry => entry.userId === user.id) || [] : []
  
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name?.trim()) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    setUploading(true)
    
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        
        // Update profile with new avatar
        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            avatar: base64,
          }),
        })

        // Handle the response
        let responseOk = response.ok
        let errorData = null
        let responseText = ''

        try {
          // Always try to get the response text first
          responseText = await response.text()
          console.log('[AVATAR FRONTEND] Raw response:', responseText)
          
          if (!responseOk) {
            // Try to parse as JSON
            try {
              errorData = JSON.parse(responseText)
            } catch (parseError) {
              console.error('[AVATAR FRONTEND] Failed to parse error response:', parseError)
              errorData = { error: responseText || 'Unknown server error' }
            }
          }
        } catch (textError) {
          console.error('[AVATAR FRONTEND] Failed to get response text:', textError)
          errorData = { error: 'Failed to read server response' }
        }

        if (responseOk) {
          // Show success message
          alert('Profile picture updated successfully!')
          // Close the modal first
          onClose()
          // Then reload after a short delay to show the updated avatar
          setTimeout(() => {
            window.location.reload()
          }, 500)
        } else {
          console.error('[AVATAR FRONTEND] Upload failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            responseText
          })
          alert(`Failed to upload avatar: ${errorData?.error || errorData?.details || 'Unknown error'}`)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-xl font-bold">Profile Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Profile Info */}
          <div className="flex items-center gap-6 mb-8">
            {/* Avatar with Upload */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-border/50">
                <img
                  src={getAvatarUrl(profile.username || "user", profile.avatar, 96)}
                  alt={profile.username || "Profile"}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors border-2 border-background shadow-lg disabled:opacity-50"
                title="Change profile picture"
              >
                {uploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{profile.username}</h3>
              <p className="text-muted-foreground mb-2">@{profile.tag}</p>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mb-2">{profile.bio}</p>
              )}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {profile.tradingStyle?.replace("-", " ") || "Member"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Trades</span>
              </div>
              <p className="text-2xl font-bold">{userEntries.length}</p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total P&L</span>
              </div>
              <p className={`text-2xl font-bold flex items-center gap-2 ${
                totalPnL >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {totalPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                ${Math.abs(totalPnL).toFixed(2)}
              </p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Trade</span>
              </div>
              <p className={`text-2xl font-bold ${
                avgTrade >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ${Math.abs(avgTrade).toFixed(2)}
              </p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">With Images</span>
              </div>
              <p className="text-2xl font-bold">{tradesWithImages}</p>
            </div>
          </div>

          {/* Recent Trades */}
          <div>
            <h4 className="text-xl font-bold mb-4">Your Trading History</h4>
            
            {sortedEntries.length === 0 ? (
              <div className="bg-secondary/30 rounded-xl p-8 text-center border border-border/50">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium mb-2">No trades yet</p>
                    <p className="text-sm text-muted-foreground/70">
                      Start journaling your trades to see your trading history here.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedEntries.map((entry) => (
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
                              {(() => {
                              try {
                                return entry.tags.slice(0, 3).join(", ")
                              } catch (e) {
                                return ''
                              }
                            })()}
                              {(() => {
                                try {
                                  return entry.tags.length > 3 ? `+${entry.tags.length - 3}` : ''
                                } catch (e) {
                                  return ''
                                }
                              })()}
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
    </div>
  )
}
