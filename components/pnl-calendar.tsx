"use client"

import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, X, Calendar, Tag, BarChart3, Target, Award } from "lucide-react"
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

interface TimePeriodSummary {
  period: string
  totalPnL: number
  trades: number
  wins: number
  losses: number
  winRate: number
  avgTrade: number
  bestDay: { date: Date; pnl: number } | null
  worstDay: { date: Date; pnl: number } | null
  profitableDays: number
  totalDays: number
}

interface WeeklyPnL {
  weekStart: Date
  weekEnd: Date
  weekNumber: number
  totalPnL: number
  trades: number
  wins: number
  losses: number
  winRate: number
  avgTrade: number
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
    
    console.log("[PnL CALENDAR] Processing entries:", {
      totalEntries: userEntries.length,
      currentSpaceId,
      userId,
      entries: userEntries.map(e => ({
        id: e.id,
        dateKey: format(new Date(e.createdAt), "yyyy-MM-dd"),
        pnl: e.profitLoss,
        createdAt: e.createdAt
      }))
    })
    
    console.log("[PnL CALENDAR] UserEntries changed, recalculating daily P&L...")
    
    userEntries.forEach(entry => {
      const dateKey = format(new Date(entry.createdAt), "yyyy-MM-dd")
      const pnl = entry.profitLoss || 0
      
      console.log("[PnL CALENDAR] Processing entry:", {
        id: entry.id,
        dateKey,
        pnl,
        profitLoss: entry.profitLoss,
        tradeType: entry.tradeType
      })
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { total: 0, trades: 0, wins: 0, losses: 0, entries: [] }
      }
      
      grouped[dateKey].total += pnl
      grouped[dateKey].trades += 1
      grouped[dateKey].entries.push(entry)
      if (pnl > 0) grouped[dateKey].wins += 1
      if (pnl < 0) grouped[dateKey].losses += 1
    })
    
    console.log("[PnL CALENDAR] Daily PnL grouped:", grouped)
    
    return grouped
  }, [userEntries, currentSpaceId, userId])

  // Calculate weekly P&L for individual weeks
  const weeklyPnL = useMemo(() => {
    console.log("[PnL CALENDAR] Weekly P&L - Recalculating weekly P&L...")
    const weeks: WeeklyPnL[] = []
    
    // Get all dates that have trades
    const datesWithTrades = Object.keys(dailyPnL)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime())
    
    console.log("[PnL CALENDAR] Weekly P&L - Dates with trades:", datesWithTrades.map(d => format(d, "yyyy-MM-dd")))
    console.log("[PnL CALENDAR] Weekly P&L - Daily PnL data:", dailyPnL)
    
    // Fallback: If no daily P&L data, create weekly from raw entries
    if (datesWithTrades.length === 0 && userEntries.length > 0) {
      console.log("[PnL CALENDAR] Weekly P&L - No daily P&L data, using fallback calculation with raw entries")
      
      // Debug: Show all entries first - SIMPLE VERSION
      console.log("[PnL CALENDAR] SIMPLE DEBUG - Total userEntries:", userEntries.length)
      console.log("[PnL CALENDAR] SIMPLE DEBUG - Raw entries:", userEntries)
      
      // Group entries by week directly
      const weekGroups: Record<string, WeeklyPnL> = {}
      
      userEntries.forEach((entry, index) => {
        console.log(`[PnL CALENDAR] Processing entry ${index}:`, {
          id: entry.id,
          createdAt: entry.createdAt,
          profitLoss: entry.profitLoss,
          userId: entry.userId,
          tradeType: entry.tradeType
        })
        
        const entryDate = new Date(entry.createdAt)
        const entryYear = entryDate.getFullYear()
        
        // Debug: Check if date is valid
        if (isNaN(entryDate.getTime())) {
          console.log("[PnL CALENDAR] Invalid date for entry:", entry.id, entry.createdAt)
          return
        }
        
        const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(entryDate, { weekStartsOn: 1 })
        const weekKey = format(weekStart, "yyyy-MM-dd")
        
        console.log("[PnL CALENDAR] Week calculation:", {
          entryDate: format(entryDate, "yyyy-MM-dd"),
          entryYear,
          weekStart: format(weekStart, "yyyy-MM-dd"),
          weekEnd: format(weekEnd, "yyyy-MM-dd"),
          weekKey
        })
        
        if (!weekGroups[weekKey]) {
          weekGroups[weekKey] = {
            weekStart,
            weekEnd,
            weekNumber: Math.ceil((entryDate.getTime() - startOfYear(entryDate).getTime()) / (7 * 24 * 60 * 60 * 1000)),
            totalPnL: 0,
            trades: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            avgTrade: 0
          }
          console.log("[PnL CALENDAR] Created new week group:", weekKey)
        }
        
        const pnl = entry.profitLoss || 0
        weekGroups[weekKey].totalPnL += pnl
        weekGroups[weekKey].trades += 1
        if (pnl > 0) weekGroups[weekKey].wins += 1
        if (pnl < 0) weekGroups[weekKey].losses += 1
        
        console.log("[PnL CALENDAR] Updated week totals:", {
          weekKey,
          totalPnL: weekGroups[weekKey].totalPnL,
          trades: weekGroups[weekKey].trades,
          addedPnl: pnl
        })
      })
      
      // Calculate win rates and avg trades
      Object.values(weekGroups).forEach(week => {
        week.winRate = week.trades > 0 ? (week.wins / week.trades) * 100 : 0
        week.avgTrade = week.trades > 0 ? week.totalPnL / week.trades : 0
      })
      
      const fallbackWeeks = Object.values(weekGroups)
        .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
        .slice(0, 8)
      
      // Check for Jan 19-25 week specifically (any year)
      const jan19Week = fallbackWeeks.find(week => {
        const weekStartStr = format(week.weekStart, "yyyy-MM-dd")
        const weekEndStr = format(week.weekEnd, "yyyy-MM-dd")
        return weekStartStr.includes("-01-20") && weekEndStr.includes("-01-26") || // Monday-Sunday
               weekStartStr.includes("-01-19") && weekEndStr.includes("-01-25") // Sunday-Saturday
      })
      
      // Check for any week that contains Jan 23
      const jan23Week = fallbackWeeks.find(week => {
        const weekStart = week.weekStart
        const weekEnd = week.weekEnd
        const jan23 = new Date(weekStart.getFullYear(), 0, 23) // Jan 23 of same year
        return jan23 >= weekStart && jan23 <= weekEnd
      })
      
      console.log("[PnL CALENDAR] Fallback weekly P&L data:", fallbackWeeks.map(w => ({
        weekNumber: w.weekNumber,
        weekStart: format(w.weekStart, "yyyy-MM-dd"),
        weekEnd: format(w.weekEnd, "yyyy-MM-dd"),
        totalPnL: w.totalPnL,
        trades: w.trades,
        isJan19Week: format(w.weekStart, "yyyy-MM-dd").includes("-01-20") || format(w.weekStart, "yyyy-MM-dd").includes("-01-19"),
        containsJan23: new Date(w.weekStart.getFullYear(), 0, 23) >= w.weekStart && new Date(w.weekStart.getFullYear(), 0, 23) <= w.weekEnd
      })))
      
      console.log("[PnL CALENDAR] Jan 19-25 week found:", !!jan19Week, jan19Week ? {
        weekStart: format(jan19Week.weekStart, "yyyy-MM-dd"),
        weekEnd: format(jan19Week.weekEnd, "yyyy-MM-dd"),
        totalPnL: jan19Week.totalPnL,
        trades: jan19Week.trades
      } : "Not found")
      
      console.log("[PnL CALENDAR] Week containing Jan 23 found:", !!jan23Week, jan23Week ? {
        weekStart: format(jan23Week.weekStart, "yyyy-MM-dd"),
        weekEnd: format(jan23Week.weekEnd, "yyyy-MM-dd"),
        totalPnL: jan23Week.totalPnL,
        trades: jan23Week.trades
      } : "Not found")
      
      return fallbackWeeks
    }
    
    if (datesWithTrades.length === 0) {
      console.log("[PnL CALENDAR] Weekly P&L - No dates with trades found and no entries")
      return weeks
    }
    
    // Group by week
    const weekGroups: Record<string, WeeklyPnL> = {}
    
    datesWithTrades.forEach(date => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const weekKey = format(weekStart, "yyyy-MM-dd")
      
      console.log("[PnL CALENDAR] Processing date:", format(date, "yyyy-MM-dd"), "Week start:", format(weekStart, "yyyy-MM-dd"))
      
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          weekStart,
          weekEnd: endOfWeek(date, { weekStartsOn: 1 }),
          weekNumber: Math.ceil((date.getTime() - startOfYear(date).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          totalPnL: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgTrade: 0
        }
        console.log("[PnL CALENDAR] Created new week group for:", weekKey, "Week number:", weekGroups[weekKey].weekNumber)
      }
      
      const dateKey = format(date, "yyyy-MM-dd")
      const dayData = dailyPnL[dateKey]
      
      console.log("[PnL CALENDAR] Day data for", dateKey, ":", dayData)
      
      if (dayData) {
        weekGroups[weekKey].totalPnL += dayData.total
        weekGroups[weekKey].trades += dayData.trades
        weekGroups[weekKey].wins += dayData.wins
        weekGroups[weekKey].losses += dayData.losses
        console.log("[PnL CALENDAR] Updated week totals for", weekKey, "PnL:", weekGroups[weekKey].totalPnL, "Trades:", weekGroups[weekKey].trades)
      }
    })
    
    // Calculate win rates and avg trades for each week
    Object.values(weekGroups).forEach(week => {
      week.winRate = week.trades > 0 ? (week.wins / week.trades) * 100 : 0
      week.avgTrade = week.trades > 0 ? week.totalPnL / week.trades : 0
    })
    
    const finalWeeks = Object.values(weekGroups)
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
      .slice(0, 8) // Show last 8 weeks
    
    console.log("[PnL CALENDAR] Final weekly P&L data:", finalWeeks.map(w => ({
      weekNumber: w.weekNumber,
      weekStart: format(w.weekStart, "yyyy-MM-dd"),
      weekEnd: format(w.weekEnd, "yyyy-MM-dd"),
      totalPnL: w.totalPnL,
      trades: w.trades
    })))
    
    return finalWeeks
  }, [dailyPnL, currentSpaceId, userId, userEntries])

  // Calculate time-based summaries
  const timeSummaries = useMemo(() => {
    const now = new Date()
    const summaries: TimePeriodSummary[] = []

    console.log("[PnL CALENDAR] Starting time summaries calculation")

    // Daily Summary (Today)
    const today = format(now, "yyyy-MM-dd")
    const todayData = dailyPnL[today]
    if (todayData) {
      const todaySummary = {
        period: "Today",
        totalPnL: todayData.total,
        trades: todayData.trades,
        wins: todayData.wins,
        losses: todayData.losses,
        winRate: todayData.trades > 0 ? (todayData.wins / todayData.trades) * 100 : 0,
        avgTrade: todayData.trades > 0 ? todayData.total / todayData.trades : 0,
        bestDay: { date: now, pnl: todayData.total },
        worstDay: { date: now, pnl: todayData.total },
        profitableDays: todayData.total > 0 ? 1 : 0,
        totalDays: 1
      }
      summaries.push(todaySummary)
      console.log("[PnL CALENDAR] Today summary:", todaySummary)
    }

    // Weekly Summary (Last 7 days)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    let weekTotal = 0, weekTrades = 0, weekWins = 0, weekLosses = 0, weekProfitableDays = 0
    let weekBest: { date: Date; pnl: number } | null = null
    let weekWorst: { date: Date; pnl: number } | null = null
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      const dateKey = format(date, "yyyy-MM-dd")
      const dayData = dailyPnL[dateKey]
      
      if (dayData && dayData.trades > 0) {
        weekTotal += dayData.total
        weekTrades += dayData.trades
        weekWins += dayData.wins
        weekLosses += dayData.losses
        if (dayData.total > 0) weekProfitableDays++
        
        // Best day = highest P&L (most positive)
        if (!weekBest || dayData.total > weekBest.pnl) {
          weekBest = { date, pnl: dayData.total }
        }
        // Worst day = lowest P&L (most negative)
        if (!weekWorst || dayData.total < weekWorst.pnl) {
          weekWorst = { date, pnl: dayData.total }
        }
      }
    }
    
    if (weekTrades > 0) {
      const weekSummary = {
        period: "This Week",
        totalPnL: weekTotal,
        trades: weekTrades,
        wins: weekWins,
        losses: weekLosses,
        winRate: (weekWins / weekTrades) * 100,
        avgTrade: weekTotal / weekTrades,
        bestDay: weekBest,
        worstDay: weekWorst,
        profitableDays: weekProfitableDays,
        totalDays: 7
      }
      summaries.push(weekSummary)
      console.log("[PnL CALENDAR] Week summary:", weekSummary)
    }

    // Monthly Summary (Current month)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    let monthTotal = 0, monthTrades = 0, monthWins = 0, monthLosses = 0, monthProfitableDays = 0
    let monthBest: { date: Date; pnl: number } | null = null
    let monthWorst: { date: Date; pnl: number } | null = null
    
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, "yyyy-MM-dd")
      const dayData = dailyPnL[dateKey]
      
      if (dayData && dayData.trades > 0) {
        monthTotal += dayData.total
        monthTrades += dayData.trades
        monthWins += dayData.wins
        monthLosses += dayData.losses
        if (dayData.total > 0) monthProfitableDays++
        
        if (!monthBest || dayData.total > monthBest.pnl) {
          monthBest = { date: new Date(d), pnl: dayData.total }
        }
        if (!monthWorst || dayData.total < monthWorst.pnl) {
          monthWorst = { date: new Date(d), pnl: dayData.total }
        }
      }
    }
    
    if (monthTrades > 0) {
      const monthSummary = {
        period: "This Month",
        totalPnL: monthTotal,
        trades: monthTrades,
        wins: monthWins,
        losses: monthLosses,
        winRate: (monthWins / monthTrades) * 100,
        avgTrade: monthTotal / monthTrades,
        bestDay: monthBest,
        worstDay: monthWorst,
        profitableDays: monthProfitableDays,
        totalDays: Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
      summaries.push(monthSummary)
      console.log("[PnL CALENDAR] Month summary:", monthSummary)
    }

    // Yearly Summary (Current year)
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)
    let yearTotal = 0, yearTrades = 0, yearWins = 0, yearLosses = 0, yearProfitableDays = 0
    let yearBest: { date: Date; pnl: number } | null = null
    let yearWorst: { date: Date; pnl: number } | null = null
    
    for (let d = new Date(yearStart); d <= yearEnd; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, "yyyy-MM-dd")
      const dayData = dailyPnL[dateKey]
      
      if (dayData && dayData.trades > 0) {
        yearTotal += dayData.total
        yearTrades += dayData.trades
        yearWins += dayData.wins
        yearLosses += dayData.losses
        if (dayData.total > 0) yearProfitableDays++
        
        if (!yearBest || dayData.total > yearBest.pnl) {
          yearBest = { date: new Date(d), pnl: dayData.total }
        }
        if (!yearWorst || dayData.total < yearWorst.pnl) {
          yearWorst = { date: new Date(d), pnl: dayData.total }
        }
      }
    }
    
    if (yearTrades > 0) {
      const yearSummary = {
        period: "This Year",
        totalPnL: yearTotal,
        trades: yearTrades,
        wins: yearWins,
        losses: yearLosses,
        winRate: (yearWins / yearTrades) * 100,
        avgTrade: yearTotal / yearTrades,
        bestDay: yearBest,
        worstDay: yearWorst,
        profitableDays: yearProfitableDays,
        totalDays: Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
      summaries.push(yearSummary)
      console.log("[PnL CALENDAR] Year summary:", yearSummary)
    }

    console.log("[PnL CALENDAR] Final summaries:", summaries)
    return summaries
  }, [dailyPnL])
  
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
      <div className={`bg-secondary/20 rounded-xl p-3 border-2 border-white/20 shadow-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] ${compact ? 'text-xs' : 'text-sm'}`} data-calendar-container>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-secondary/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <h3 className={`font-bold ${compact ? 'text-xs' : 'text-sm'} bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent`}>
              {format(currentDate, compact ? "MMM yyyy" : "MMMM yyyy")}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-secondary/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-3 w-3" />
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
          <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
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

        {/* Time-Based Summary - Vertical Layout */}
        {!compact && timeSummaries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-3 w-3 text-primary" />
              <h3 className="font-bold text-xs bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                P&L Summary
              </h3>
            </div>
            
            <div className="space-y-2">
              {timeSummaries.map((summary) => (
                <div 
                  key={summary.period}
                  className={`bg-gradient-to-br from-background/50 to-background/30 rounded-lg p-3 border-2 border-white/20 backdrop-blur-sm ${
                    summary.totalPnL >= 0 ? 'ring-1 ring-green-500/30' : 'ring-1 ring-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {summary.period}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        summary.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className={`font-bold text-lg flex items-center gap-1 ${
                      summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {summary.totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      ${Math.abs(summary.totalPnL).toFixed(0)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{summary.trades}</div>
                      <div className="text-muted-foreground text-xs">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{summary.winRate.toFixed(0)}%</div>
                      <div className="text-muted-foreground text-xs">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">${Math.abs(summary.avgTrade).toFixed(0)}</div>
                      <div className="text-muted-foreground text-xs">Avg Trade</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{summary.profitableDays}</div>
                      <div className="text-muted-foreground text-xs">Winning Days</div>
                    </div>
                  </div>
                  
                  {summary.bestDay && summary.period !== "Today" && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Award className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground text-xs">Best Day:</span>
                        <span className="text-green-600 font-medium text-xs">
                          ${summary.bestDay.pnl >= 0 ? '+' : ''}{summary.bestDay.pnl.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly P&L Section */}
        {!compact && weeklyPnL.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3 w-3 text-primary" />
              <h3 className="font-bold text-xs bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Weekly P&L
              </h3>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {weeklyPnL.map((week) => (
                <div 
                  key={week.weekStart.toISOString()}
                  className={`bg-gradient-to-br from-background/50 to-background/30 rounded-lg p-3 border-2 border-white/20 backdrop-blur-sm ${
                    week.totalPnL >= 0 ? 'ring-1 ring-green-500/30' : 'ring-1 ring-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Week {week.weekNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d")}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        week.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className={`font-bold text-lg flex items-center gap-1 ${
                      week.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {week.totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      ${Math.abs(week.totalPnL).toFixed(0)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{week.trades}</div>
                      <div className="text-muted-foreground text-xs">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{week.winRate.toFixed(0)}%</div>
                      <div className="text-muted-foreground text-xs">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">${Math.abs(week.avgTrade).toFixed(0)}</div>
                      <div className="text-muted-foreground text-xs">Avg Trade</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{week.wins}</div>
                      <div className="text-muted-foreground text-xs">Wins</div>
                    </div>
                  </div>
                </div>
              ))}
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
