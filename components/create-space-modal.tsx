"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { X, Lock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreateSpaceModalProps {
  open: boolean
  onClose: () => void
}

export function CreateSpaceModal({ open, onClose }: CreateSpaceModalProps) {
  const { createSpace } = useAppStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !name.trim()) return
    createSpace(name, description, isPrivate)
    setName("")
    setDescription("")
    setIsPrivate(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass relative w-full max-w-md rounded-3xl p-8 purple-glow">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Create New Space</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Space Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Day Trading Journal"
              className="bg-background/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space about?"
              className="bg-background/50 border-border resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  !isPrivate
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Globe className="h-5 w-5" />
                <span className="text-xs font-bold">Public</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  isPrivate
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Lock className="h-5 w-5" />
                <span className="text-xs font-bold">Private</span>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!name || !name.trim()}>
            Create Space
          </Button>
        </form>
      </div>
    </div>
  )
}
