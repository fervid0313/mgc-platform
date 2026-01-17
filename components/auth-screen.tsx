"use client"

import type React from "react"
import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function AuthScreen() {
  const { login, signup, resetPassword } = useAppStore()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let success: boolean
      if (isLogin) {
        success = await login(email, password)
        if (!success) {
          setError("Invalid email or password. Please try again or create an account.")
        }
      } else {
        success = await signup(email, password, username)
        if (!success) {
          setError("Email already exists or invalid details. Please try again.")
        }
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first.")
      return
    }

    setError("")
    setLoading(true)

    try {
      const result = await resetPassword(email.trim())
      if (result.success) {
        setResetEmailSent(true)
        setError("")
      } else {
        setError(result.error || "Failed to send reset email.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="font-extrabold tracking-tight text-6xl text-foreground italic mb-2">MGS</h1>
          <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase mb-3">
            Mind · Grind · Scale
          </p>
          <p className="text-muted-foreground text-sm">A collaborative journal for traders & entrepreneurs</p>
        </div>

        <div className="glass rounded-3xl p-8 glow">
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                isLogin ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                !isLogin ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="TraderPro"
                  className="bg-background/50 border-border"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-background/50 border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background/50 border-border"
                required
              />
            </div>

            {error && <p className="text-destructive text-sm text-center">{error}</p>}

            {resetEmailSent && (
              <p className="text-green-500 text-sm text-center">
                Password reset email sent! Check your inbox.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>

            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 mt-2"
              >
                Forgot your password?
              </button>
            )}
          </form>

          <p className="text-center text-muted-foreground text-xs mt-6">
            {isLogin ? "Don't have an account? Sign up above." : "Create your journal account to get started."}
          </p>
          <p className="mt-4 text-center text-muted-foreground/70 text-xs italic">Philippians 4:13</p>
        </div>

        <p className="mt-12 text-center text-muted-foreground text-sm">
          Log your trades. Track your growth. Grow with your circle.
        </p>
      </div>
    </div>
  )
}
