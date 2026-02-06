"use client"

import { useState } from "react"
import { Calculator, DollarSign, Percent, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function RiskCalculator() {
  const [open, setOpen] = useState(false)
  const [accountSize, setAccountSize] = useState("")
  const [riskPercent, setRiskPercent] = useState("1")
  const [entryPrice, setEntryPrice] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")

  const account = parseFloat(accountSize) || 0
  const risk = parseFloat(riskPercent) || 0
  const entry = parseFloat(entryPrice) || 0
  const stop = parseFloat(stopLoss) || 0
  const tp = parseFloat(takeProfit) || 0

  const riskAmount = account * (risk / 100)
  const stopDistance = entry && stop ? Math.abs(entry - stop) : 0
  const positionSize = stopDistance > 0 ? Math.floor(riskAmount / stopDistance) : 0
  const potentialLoss = positionSize * stopDistance
  const tpDistance = entry && tp ? Math.abs(tp - entry) : 0
  const potentialProfit = positionSize * tpDistance
  const rMultiple = stopDistance > 0 && tpDistance > 0 ? (tpDistance / stopDistance) : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn-3d w-full justify-start" size="sm">
          <Calculator className="h-4 w-4 mr-2" />
          Risk Calculator
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] glass-3d border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Risk Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate position size based on your risk tolerance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Account Size
              </Label>
              <Input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                placeholder="50,000"
                className="bg-background/50 border-border h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Percent className="h-3 w-3" /> Risk %
              </Label>
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                placeholder="1"
                step="0.25"
                className="bg-background/50 border-border h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Entry Price</Label>
              <Input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="100.00"
                step="0.01"
                className="bg-background/50 border-border h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stop Loss</Label>
              <Input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="98.00"
                step="0.01"
                className="bg-background/50 border-border h-9 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Target className="h-3 w-3" /> Take Profit (optional)
              </Label>
              <Input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="106.00"
                step="0.01"
                className="bg-background/50 border-border h-9 text-sm"
              />
            </div>
          </div>

          {/* Results */}
          {account > 0 && entry > 0 && stop > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Position Size" value={`${positionSize} shares`} highlight />
                <ResultCard label="Risk Amount" value={`$${riskAmount.toFixed(2)}`} />
                <ResultCard label="Potential Loss" value={`-$${potentialLoss.toFixed(2)}`} negative />
                {tp > 0 && (
                  <ResultCard label="Potential Profit" value={`+$${potentialProfit.toFixed(2)}`} positive />
                )}
              </div>

              {rMultiple > 0 && (
                <div className="glass-3d rounded-xl p-3 text-center">
                  <span className="text-xs text-muted-foreground">Risk/Reward Ratio</span>
                  <p className={`text-2xl font-bold ${rMultiple >= 2 ? "text-green-500" : rMultiple >= 1 ? "text-yellow-500" : "text-red-500"}`}>
                    1:{rMultiple.toFixed(1)}R
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResultCard({
  label,
  value,
  highlight,
  positive,
  negative,
}: {
  label: string
  value: string
  highlight?: boolean
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/20"}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={`text-sm font-bold ${positive ? "text-green-500" : negative ? "text-red-500" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
