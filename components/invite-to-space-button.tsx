"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { UserPlus, X, Check, XCircle } from "lucide-react"
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
  const [isInviting, setIsInviting] = useState(false)
  
  const { currentSpaceId, spaces, inviteToSpace, spaceInvitations, acceptSpaceInvitation, declineSpaceInvitation } = useAppStore()
  
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const isPrivate = currentSpace?.isPrivate
  
  // Don't show button for global space or non-private spaces
  if (!isPrivate || currentSpaceId === "space-global") {
    return null
  }

  const handleInvite = async () => {
    if (!email.trim()) {
      return
    }

    setIsInviting(true)
    const success = await inviteToSpace(currentSpaceId!, email.trim(), message.trim())
    
    if (success) {
      setEmail("")
      setMessage("")
      setOpen(false)
    }
    
    setIsInviting(false)
  }

  const pendingInvitations = spaceInvitations.filter(inv => 
    inv.space_id === currentSpaceId && inv.status === "pending"
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
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite to {currentSpace?.name}</DialogTitle>
            <DialogDescription>
              Send an invitation to join this private space via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
                onClick={handleInvite} 
                disabled={!email.trim() || isInviting}
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{invitation.invitee_email}</p>
                  {invitation.message && (
                    <p className="text-xs text-muted-foreground mt-1">{invitation.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    From {invitation.inviter?.username}#{invitation.inviter?.tag}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acceptSpaceInvitation(invitation.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => declineSpaceInvitation(invitation.id)}
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="h-3 w-3" />
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
