"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Users, Key, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function JoinPrivateSpaceButton() {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinResult, setJoinResult] = useState<"success" | "error" | null>(null)
  const [spaceName, setSpaceName] = useState<string | null>(null)
  
  const { joinSpaceViaInviteLink, spaces } = useAppStore()

  const handleJoinSpace = async () => {
    if (!token.trim()) {
      return
    }

    setIsJoining(true)
    setJoinResult(null)
    
    const success = await joinSpaceViaInviteLink(token.trim())
    
    if (success) {
      setJoinResult("success")
      // Try to find the space name (this is approximate since we don't get it back from the function)
      setSpaceName("Private Space")
      setToken("")
      setTimeout(() => {
        setOpen(false)
        setJoinResult(null)
      }, 2000)
    } else {
      setJoinResult("error")
    }
    
    setIsJoining(false)
  }

  const extractTokenFromUrl = (url: string) => {
    // Extract token from URLs like http://localhost:3000/invite/abc123
    const match = url.match(/\/invite\/(.+)$/);
    return match ? match[1] : url;
  }

  const handleTokenChange = (value: string) => {
    // Auto-extract token if they paste a full URL
    const extractedToken = extractTokenFromUrl(value);
    setToken(extractedToken);
  }

  return (
    <div className="mb-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Join Private Space
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join Private Space</DialogTitle>
            <DialogDescription>
              Enter an invite token or link to join a private space.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="text-sm font-medium">
                Invite Token or Link
              </label>
              <Input
                id="token"
                placeholder="abc123def456... or full invite link"
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="mt-1"
                disabled={isJoining}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can paste the full invite link or just the token
              </p>
            </div>
            
            {joinResult === "success" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Successfully joined {spaceName}!
                </span>
              </div>
            )}
            
            {joinResult === "error" && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">
                  Invalid or expired invite link
                </span>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isJoining}>
                Cancel
              </Button>
              <Button 
                onClick={handleJoinSpace} 
                disabled={!token.trim() || isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Space"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
