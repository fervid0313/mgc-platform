"use client"

import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, X, Calendar, Tag } from "lucide-react"
import { useAppStore } from "@/lib/store"

interface PnLCalendarProps {
  userId: string
  compact?: boolean
  onTradeClick?: (entry: any) => void
}

interface DayDetails {
  date: Date
  totalPnL: number
  trades: number
  wins: number
  losses: number
  winRate: number
  avgTrade: number
  entries: any[]
}

export function PnLCalendar({ userId, compact = false, onTradeClick }: PnLCalendarProps) {
  const { entries, currentSpaceId } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayDetails | null>(null)
  
  // Get user's entries for current space
  const userEntries = currentSpaceId ? entries[currentSpaceId]?.filter(entry => entry.userId === userId) || [] : []
  
  // Group entries by date and calculate daily PnL
  const dailyPnL = useMemo(() => {
    const grouped: Record<string, { total: number; trades: number; wins: number; losses: number; entries: any[] }> = {}
    
    userEntries.forEach(entry => {
      const dateKey = format(new Date(entry.createdAt), "yyyy-MM-dd")
      const pnl = entry.profitLoss || 0
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { total: 0, trades: 0, wins: 0, losses: 0, entries: [] }
      }
      
      grouped[dateKey].total += pnl
      grouped[dateKey].trades += 1
      grouped[dateKey].entries.push(entry)
      if (pnl > 0) grouped[dateKey].wins += 1
      if (pnl < 0) grouped[dateKey].losses += 1
    })
    
    return grouped
  }, [userEntries])
  
  // Calendar navigation
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Calculate starting day of week offset
  const startDayOffset = getDay(monthStart)
  
  // Navigation functions
  const previousMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  
  // Get PnL for a specific day
  const getDayPnL = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd")
    return dailyPnL[dateKey] || null
  }
  
  // Get background color class for day cell based on PnL
  const getDayBackgroundClass = (pnl: number | null) => {
    if (!pnl) return 'bg-secondary/20'
    if (pnl > 0) return 'bg-green-500/20'
    if (pnl < 0) return 'bg-red-500/20'
    return 'bg-secondary/20'
  }
  
  // Get text color class for PnL value
  const getPnLTextColorClass = (pnl: number) => {
    if (pnl > 0) return 'text-green-700 dark:text-green-300'
    if (pnl < 0) return 'text-red-700 dark:text-red-300'
    return 'text-gray-700 dark:text-gray-300'
  }
  
  // Get border color for day cell
  const getDayBorderColor = (pnl: number | null) => {
    if (!pnl) return "border-border/30"
    if (pnl > 0) return "border-green-500/50"
    if (pnl < 0) return "border-red-500/50"
    return "border-border/30"
  }
  
  // Handle day click
  const handleDayClick = (day: Date) => {
    const dayData = getDayPnL(day)
    if (dayData && dayData.trades > 0) {
      const winRate = dayData.trades > 0 ? (dayData.wins / dayData.trades) * 100 : 0
      const avgTrade = dayData.trades > 0 ? dayData.total / dayData.trades : 0
      
      setSelectedDay({
        date: day,
        totalPnL: dayData.total,
        trades: dayData.trades,
        wins: dayData.wins,
        losses: dayData.losses,
        winRate,
        avgTrade,
        entries: dayData.entries
      })
    }
  }
  
  // Calculate month stats
  const monthStats = useMemo(() => {
    const monthEntries = userEntries.filter(entry => 
      isSameMonth(new Date(entry.createdAt), currentDate)
    )
    
    const profitable = monthEntries.filter(e => (e.profitLoss || 0) > 0)
    const totalPnL = monthEntries.reduce((sum, e) => sum + (e.profitLoss || 0), 0)
    const winRate = monthEntries.length > 0 ? (profitable.length / monthEntries.length) * 100 : 0
    
    return {
      trades: monthEntries.length,
      totalPnL,
      winRate,
      profitable: profitable.length
    }
  }, [userEntries, currentDate])
  
  const weekDays = compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return (
    <>
      <div className={`bg-secondary/20 rounded-xl p-4 border-2 border-white/20 shadow-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] ${compact ? 'text-xs' : ''}`} data-calendar-container>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-1.5 hover:bg-secondary/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className={`font-bold ${compact ? 'text-xs' : 'text-sm'} bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent`}>
              {format(currentDate, compact ? "MMM yyyy" : "MMMM yyyy")}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-secondary/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {!compact && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500/30 rounded-md"></div>
                <span className="font-medium">Profit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500/30 rounded-md"></div>
                <span className="font-medium">Loss</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Month Stats */}
        {!compact && monthStats.trades > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
            <div className="text-center p-2 bg-gradient-to-br from-background/50 to-background/30 rounded-lg border-2 border-white/20 backdrop-blur-sm">
              <div className="font-bold text-sm">{monthStats.trades}</div>
              <div className="text-muted-foreground font-medium text-xs">Trades</div>
            </div>
            <div className={`text-center p-2 bg-gradient-to-br from-background/50 to-background/30 rounded-lg border-2 border-white/20 backdrop-blur-sm ${monthStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <div className="font-bold text-sm flex items-center justify-center gap-1">
                {monthStats.totalPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                ${Math.abs(monthStats.totalPnL).toFixed(0)}
              </div>
              <div className="text-muted-foreground font-medium text-xs">P&L</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-background/50 to-background/30 rounded-lg border-2 border-white/20 backdrop-blur-sm">
              <div className="font-bold text-sm">{monthStats.winRate.toFixed(0)}%</div>
              <div className="text-muted-foreground font-medium text-xs">Win Rate</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-background/50 to-background/30 rounded-lg border-2 border-white/20 backdrop-blur-sm">
              <div className="font-bold text-sm">{monthStats.profitable}</div>
              <div className="text-muted-foreground font-medium text-xs">Wins</div>
            </div>
          </div>
        )}
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs text-muted-foreground font-bold p-1 uppercase tracking-wider border-b border-white/10"
            >
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDayOffset }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          
          {/* Calendar days */}
          {monthDays.map((day) => {
            const dayPnL = getDayPnL(day)
            const isToday = isSameDay(day, new Date())
            const hasTrades = dayPnL && dayPnL.trades > 0
            
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square border ${getDayBorderColor(dayPnL?.total)} ${getDayBackgroundClass(dayPnL?.total)} rounded-lg p-1 flex flex-col items-center justify-center transition-all duration-200 relative ${
                  isToday ? 'ring-2 ring-primary/60 shadow-lg' : ''
                } ${
                  hasTrades 
                    ? 'hover:bg-secondary/50 hover:scale-105 hover:shadow-md cursor-pointer' 
                    : 'cursor-default'
                }`}
                onClick={() => hasTrades && handleDayClick(day)}
              >
                <div className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                {dayPnL && (
                  <div className={`text-xs font-bold ${getPnLTextColorClass(dayPnL.total)} px-0.5 py-0.5 rounded-sm mt-0.5 shadow-sm border border-white/30`}>
                    ${Math.abs(dayPnL.total).toFixed(compact ? 0 : 0)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Summary */}
        {compact && monthStats.trades > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">{monthStats.trades} trades</span>
              <span className={`font-bold ${monthStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${monthStats.totalPnL >= 0 ? '+' : ''}{monthStats.totalPnL.toFixed(0)}
              </span>
            </div>
            <div className="text-muted-foreground font-medium">
              {monthStats.winRate.toFixed(0)}% win rate
            </div>
          </div>
        )}
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-32" data-calendar-modal>
          <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border-2 border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div>
                <h3 className="text-xl font-bold">
                  {format(selectedDay.date, "MMMM d, yyyy")}
                </h3>
                <p className="text-muted-foreground">Trading Performance Details</p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                data-calendar-close
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                <div className="bg-secondary/30 rounded-xl p-2 text-center border-2 border-white/20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <p className="text-sm font-bold">{selectedDay.trades}</p>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl p-2 text-center border-2 border-white/20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">P&L</span>
                    </div>
                    <p className={`text-sm font-bold flex items-center justify-center gap-1 ${
                      selectedDay.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {selectedDay.totalPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      ${Math.abs(selectedDay.totalPnL).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl p-2 text-center border-2 border-white/20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Win Rate</span>
                    </div>
                    <p className="text-sm font-bold">{selectedDay.winRate.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl p-2 text-center border-2 border-white/20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Avg</span>
                    </div>
                    <p className={`text-sm font-bold ${
                      selectedDay.avgTrade >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      ${Math.abs(selectedDay.avgTrade).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Win/Loss Breakdown */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="bg-green-500/10 rounded-xl p-2 border-2 border-green-500/30">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-semibold text-xs">Winning</span>
                    </div>
                    <p className="text-base font-bold text-green-600">{selectedDay.wins}</p>
                    <p className="text-xs text-green-600/70 text-center">
                      {selectedDay.trades > 0 ? ((selectedDay.wins / selectedDay.trades) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 rounded-xl p-2 border-2 border-red-500/30">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600 font-semibold text-xs">Losing</span>
                    </div>
                    <p className="text-base font-bold text-red-600">{selectedDay.losses}</p>
                    <p className="text-xs text-red-600/70 text-center">
                      {selectedDay.trades > 0 ? ((selectedDay.losses / selectedDay.trades) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Trades */}
              <div>
                <h4 className="text-lg font-bold mb-4">Individual Trades</h4>
                <div className="space-y-3">
                  {selectedDay.entries.map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className="bg-secondary/20 rounded-lg p-3 border-2 border-white/20 hover:bg-secondary/30 transition-colors cursor-pointer hover:shadow-md"
                      onClick={() => onTradeClick?.(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                          {entry.tradeType}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          (entry.profitLoss || 0) >= 0 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {(entry.profitLoss || 0) >= 0 ? "+" : ""}${Math.abs(entry.profitLoss || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{entry.content}</p>
                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          {entry.tags.slice(0, 3).join(", ")}
                          {entry.tags.length > 3 && `+${entry.tags.length - 3}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
