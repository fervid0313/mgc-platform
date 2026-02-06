"use client"

import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { X, Camera, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { getAvatarUrl } from "@/lib/avatar-generator"

interface ProfileDetailsProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileDetails({ isOpen, onClose }: ProfileDetailsProps) {
  const { user, profiles, forceLoadProfiles } = useAppStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const profile = user ? profiles.find(p => p.id === user.id) : null

  if (!isOpen || !user || !profile) return null

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
          // Refresh profiles from server so the new avatar shows everywhere
          await forceLoadProfiles()
          alert('Profile picture updated!')
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
      <div className="glass-3d rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-xl font-bold">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Simplified */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                <img
                  src={getAvatarUrl(profile.username || "user", profile.avatar, 128)}
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
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Camera className="h-3 w-3" />
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
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{profile.username}</h3>
              <p className="text-muted-foreground text-lg">@{profile.tag}</p>
              {profile.bio && (
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </div>

            {/* Trade Analytics Button */}
            <button
              onClick={() => {
                onClose()
                router.push(`/analytics`)
              }}
              className="btn-3d flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-lg font-semibold w-full"
            >
              <BarChart3 className="h-6 w-6" />
              Trade Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
