"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const { isAuthenticated, isLoading, joinSpaceViaInviteLink, initializeAuth, spaces } = useAppStore()
  const [joining, setJoining] = useState(false)
  const [joinResult, setJoinResult] = useState<"success" | "error" | null>(null)
  const [spaceName, setSpaceName] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Redirect to login with return URL
      router.push(`/auth?returnUrl=/invite/${token}`)
    }
  }, [isAuthenticated, isLoading, router, token])

  useEffect(() => {
    if (isAuthenticated) {
      initializeAuth()
    }
  }, [isAuthenticated, initializeAuth])

  const handleJoinSpace = async () => {
    if (!token) return
    
    setJoining(true)
    const success = await joinSpaceViaInviteLink(token)
    
    if (success) {
      setJoinResult("success")
      setSpaceName("Private Space") // We'll just use a generic name
      // Redirect after a delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } else {
      setJoinResult("error")
    }
    
    setJoining(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in or create an account to join this private space.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push(`/auth?returnUrl=/invite/${token}`)}>
              Sign In to Join
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
          <CardTitle>
            {joinResult === "success" ? "Successfully Joined!" : "Join Private Space"}
          </CardTitle>
          <CardDescription>
            {joinResult === "success" 
              ? `You've successfully joined ${spaceName || "the private space"}!`
              : "You've been invited to join a private trading space."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {joinResult === null && (
            <>
              <p className="text-sm text-muted-foreground">
                Click below to accept the invitation and join the space.
              </p>
              <Button 
                onClick={handleJoinSpace} 
                disabled={joining}
                className="w-full"
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Space"
                )}
              </Button>
            </>
          )}
          
          {joinResult === "success" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to your space in a moment...
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="w-full"
              >
                Go to Space Now
              </Button>
            </div>
          )}
          
          {joinResult === "error" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-red-600">
                <XCircle className="h-8 w-8" />
              </div>
              <p className="text-sm text-red-600">
                This invite link is invalid, expired, or has already been used.
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="w-full"
              >
                Back to App
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
