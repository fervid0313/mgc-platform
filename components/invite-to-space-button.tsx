"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { UserPlus, Copy, Mail, Link2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function InviteToSpaceButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { currentSpaceId, spaces, generateInviteLink, spaceInviteLinks } = useAppStore()
  
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const isPrivate = currentSpace?.isPrivate
  
  // Don't show button for global space or non-private spaces
  if (!isPrivate || currentSpaceId === "space-global") {
    return null
  }

  const handleGenerateLink = async () => {
    if (!email.trim()) {
      return
    }

    setIsGenerating(true)
    const link = await generateInviteLink(currentSpaceId!, email.trim(), message.trim())
    
    if (link) {
      setGeneratedLink(link)
      setEmail("")
      setMessage("")
    }
    
    setIsGenerating(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const sendEmail = (link: string, email: string, message?: string) => {
    const subject = `You're invited to join ${currentSpace?.name}`
    const body = message 
      ? `${message}\n\nJoin here: ${link}`
      : `You're invited to join my private space: ${currentSpace?.name}\n\nJoin here: ${link}`
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const myInviteLinks = spaceInviteLinks.filter(link => 
    link.space_id === currentSpaceId
  )

  return (
    <div className="mb-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite to Private Space
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite to {currentSpace?.name}</DialogTitle>
            <DialogDescription>
              Generate a secure invite link that only works for the specified email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!generatedLink ? (
              <>
                <div>
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="text-sm font-medium">
                    Message (optional)
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Join my private trading space..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerateLink} 
                    disabled={!email.trim() || isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate Invite Link"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Invite Link Generated</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    For: {email}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink)}
                      className="flex-1"
                    >
                      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendEmail(generatedLink, email, message)}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Send Email
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedLink(null)
                      setCopied(false)
                    }}
                  >
                    Generate Another Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Show existing invite links */}
      {myInviteLinks.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Your Invite Links</h4>
          {myInviteLinks.map((link) => (
            <Card key={link.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{link.email}</p>
                  {link.message && (
                    <p className="text-xs text-muted-foreground mt-1">{link.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {link.used ? (
                      <span className="text-green-600">✓ Used</span>
                    ) : new Date(link.expires_at) > new Date() ? (
                      <span>Expires {new Date(link.expires_at).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-red-600">Expired</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/invite/${link.token}`)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
