"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight, BookOpen, BarChart3, Users, Wrench } from "lucide-react"

const ONBOARDING_KEY = "mgc-onboarding-done"

const STEPS = [
  { icon: BookOpen, title: "Journal Your Trades", desc: "Log every trade with P&L, mood, and screenshots. Build your track record." },
  { icon: BarChart3, title: "Track Your Stats", desc: "Switch to Statistics to see your equity curve, heatmap, risk metrics, and more." },
  { icon: Users, title: "Join the Community", desc: "Follow traders, climb the leaderboard, and find mentors in the Community tab." },
  { icon: Wrench, title: "Use Your Tools", desc: "Access risk calculator, CSV/PDF export, broker connect, and backup in the Tools widget." },
]

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setTimeout(() => setShow(true), 1500)
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(ONBOARDING_KEY, "1")
  }

  if (!show) return null

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={dismiss}>
      <div className="glass-3d rounded-2xl w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold">{current.title}</h3>
          <p className="text-sm text-muted-foreground">{current.desc}</p>

          <div className="flex gap-1.5 mt-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-6" : "bg-secondary/50"}`} />
            ))}
          </div>

          <div className="flex gap-3 w-full mt-2">
            {step < STEPS.length - 1 ? (
              <>
                <button onClick={dismiss} className="flex-1 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                  Skip
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 btn-3d flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                  Next <ArrowRight className="h-3 w-3" />
                </button>
              </>
            ) : (
              <button
                onClick={dismiss}
                className="w-full btn-3d px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
              >
                Get Started!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
