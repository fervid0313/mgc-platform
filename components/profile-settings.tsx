"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { X, Camera, Save, User, AtSign, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { UserProfile } from "@/lib/types"

interface ProfileSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
  const { user, getProfile, updateProfile } = useAppStore()
  const profile = user ? getProfile(user.id) : null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    username: profile?.username || user?.username || "",
    bio: profile?.bio || "",
    tradingStyle: profile?.tradingStyle || "",
    avatar: profile?.avatar || user?.avatar || "",
    socialLinks: {
      twitter: profile?.socialLinks?.twitter || "",
      discord: profile?.socialLinks?.discord || "",
      instagram: profile?.socialLinks?.instagram || "",
      telegram: profile?.socialLinks?.telegram || "",
      youtube: profile?.socialLinks?.youtube || "",
    },
  })

  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.trim()) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, avatar: event.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateProfile({
      username: formData.username.trim(),
      bio: formData.bio.trim(),
      tradingStyle: formData.tradingStyle as UserProfile["tradingStyle"],
      avatar: formData.avatar,
      socialLinks: formData.socialLinks,
    })

    setSaving(false)
    onClose()
  }

  const copyTag = () => {
    if (user && user.username && user.username.trim()) {
      navigator.clipboard.writeText(`${user.username}#${user.tag}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass rounded-t-2xl px-6 py-4 flex justify-between items-center border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-secondary border-2 border-primary/30 overflow-hidden">
                {formData.avatar ? (
                  <img
                    src={formData.avatar || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <p className="text-xs text-muted-foreground">Click to upload a photo</p>
          </div>

          {/* Unique Tag Display */}
          {user && (
            <div className="flex items-center justify-center gap-2 p-3 bg-secondary/30 rounded-xl border border-border/50">
              <span className="text-sm text-muted-foreground">Your tag:</span>
              <span className="font-mono font-bold text-foreground">
                {user.username || "user"}#{user.tag || "0000"}
              </span>
              <button
                onClick={copyTag}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                title="Copy tag"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              className="bg-secondary/50 border-border/50"
            />
            <p className="text-[10px] text-muted-foreground">Your tag number stays the same when you change username</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself"
              rows={3}
              className="bg-secondary/50 border-border/50 resize-none"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Specialty</label>
            <select
              value={formData.tradingStyle}
              onChange={(e) => setFormData((prev) => ({ ...prev, tradingStyle: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select your specialty</option>
              <option value="day-trader">Day Trader</option>
              <option value="swing-trader">Swing Trader</option>
              <option value="investor">Investor</option>
              <option value="ecommerce">E-commerce</option>
            </select>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">Social Connections</label>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  value={formData.socialLinks.twitter}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                    }))
                  }
                  placeholder="X (Twitter) username"
                  className="flex-1 bg-secondary/50 border-border/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">DC</span>
                </div>
                <Input
                  value={formData.socialLinks.discord}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, discord: e.target.value },
                    }))
                  }
                  placeholder="Discord username"
                  className="flex-1 bg-secondary/50 border-border/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">IG</span>
                </div>
                <Input
                  value={formData.socialLinks.instagram}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                    }))
                  }
                  placeholder="Instagram username"
                  className="flex-1 bg-secondary/50 border-border/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">TG</span>
                </div>
                <Input
                  value={formData.socialLinks.telegram}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, telegram: e.target.value },
                    }))
                  }
                  placeholder="Telegram username"
                  className="flex-1 bg-secondary/50 border-border/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">YT</span>
                </div>
                <Input
                  value={formData.socialLinks.youtube}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value },
                    }))
                  }
                  placeholder="YouTube channel"
                  className="flex-1 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !formData.username || !formData.username.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
