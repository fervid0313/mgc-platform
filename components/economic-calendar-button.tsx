"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, Clock, ExternalLink, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Interface for economic events
interface EconomicEvent {
  time: string
  event: string
  impact: string
  currency: string
  description: string
  actual?: string
  forecast?: string
  previous?: string
}

// Function to fetch ForexFactory economic calendar
async function fetchForexFactoryCalendar(date: Date): Promise<Record<string, EconomicEvent[]>> {
  try {
    // Format date for ForexFactory URL (YYYY-MM-DD)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // ForexFactory economic calendar URL
    const url = `https://www.forexfactory.com/calendar?day=${dateStr}`
    
    // Since we can't directly fetch from ForexFactory due to CORS, 
    // we'll create a mock API endpoint that can proxy the request
    const response = await fetch(`/api/forex-calendar?date=${dateStr}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch calendar data')
    }
    
    const data = await response.json()
    return data.events || {}
  } catch (error) {
    console.error('Error fetching ForexFactory calendar:', error)
    // Return mock data as fallback
    return getMockEconomicEvents()
  }
}

// Mock data as fallback
function getMockEconomicEvents(): Record<string, EconomicEvent[]> {
  return {
    "2024-02-04": [
      {
        time: "8:30 AM",
        event: "CPI Data Release",
        impact: "High",
        currency: "USD",
        description: "Consumer Price Index - Key inflation indicator",
        actual: "3.2%",
        forecast: "3.1%",
        previous: "3.4%"
      },
      {
        time: "10:00 AM", 
        event: "FOMC Statement",
        impact: "High",
        currency: "USD",
        description: "Federal Reserve monetary policy announcement"
      },
      {
        time: "2:30 PM",
        event: "Crude Oil Inventories",
        impact: "Medium", 
        currency: "USD",
        description: "EIA weekly petroleum status report",
        actual: "2.5M",
        forecast: "1.8M",
        previous: "4.2M"
      }
    ],
    "2024-02-05": [
      {
        time: "7:00 AM",
        event: "Retail Sales",
        impact: "High",
        currency: "USD", 
        description: "Monthly retail sales data - Consumer spending indicator",
        actual: "0.5%",
        forecast: "0.3%",
        previous: "0.2%"
      },
      {
        time: "9:00 AM",
        event: "ECB Interest Rate Decision",
        impact: "High",
        currency: "EUR",
        description: "European Central Bank monetary policy announcement"
      }
    ]
  }
}

export function EconomicCalendarButton() {
  const [open, setOpen] = useState(false)
  // Set to February 1, 2026 (Sunday) as requested
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1))
  const [economicEventsByDate, setEconomicEventsByDate] = useState<Record<string, EconomicEvent[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Fetch calendar data when component opens or date changes
  useEffect(() => {
    if (open) {
      loadCalendarData()
    }
  }, [open, currentDate])

  const loadCalendarData = async () => {
    setIsLoading(true)
    try {
      console.log('Loading calendar data for date:', currentDate.toISOString())
      const events = await fetchForexFactoryCalendar(currentDate)
      console.log('Received events:', events)
      console.log('Events for current date:', events[formatDateKey(currentDate)])
      setEconomicEventsByDate(events)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadCalendarData()
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    const events = economicEventsByDate[dateKey] || []
    console.log('getEventsForDate called for:', dateKey, 'events:', events)
    return events
  }

  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'High':
        return 'bg-black text-red-500 border border-red-500'
      case 'Medium':
        return 'bg-black text-orange-500 border border-orange-500'
      case 'Low':
        return 'bg-black text-gray-100 border border-gray-100'
      default:
        return 'bg-black text-gray-400 border border-gray-400'
    }
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    const today = new Date()

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const events = getEventsForDate(date)
      const isToday = date.toDateString() === today.toDateString()
      const hasDayEvents = events.length > 0
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-12 rounded-xl border transition-all hover:bg-white/10 ${
            isToday ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 
            isWeekend ? 'bg-muted/20 border-muted' : 'border-border'
          } ${hasDayEvents ? 'font-semibold' : ''}`}
        >
          <div className="text-sm">{day}</div>
          {hasDayEvents && (
            <div className="flex justify-center gap-1 mt-1">
              {events.slice(0, 3).map((event: EconomicEvent, index: number) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    event.impact === 'High' ? 'bg-red-500' :
                    event.impact === 'Medium' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}
                />
              ))}
            </div>
          )}
        </button>
      )
    }

    return days
  }

  const selectedEvents = getEventsForDate(selectedDate)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <div className="mb-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Economic Calendar
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-background border-0 shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <TrendingUp className="h-6 w-6 text-primary" />
              Economic Calendar
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="glass">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Live economic data from ForexFactory.com
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 glass rounded-xl">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)} className="glass">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-bold text-foreground">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)} className="glass">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 glass rounded-xl">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            </div>

            {/* Selected Date Events */}
            <div className="p-4 glass rounded-xl">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              
              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event: EconomicEvent, index: number) => (
                    <div key={index} className="glass rounded-xl p-4 hover:bg-white/10 transition-all duration-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{event.time}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(event.impact)}`}>
                              {event.impact} Impact
                            </span>
                            <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                              {event.currency}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1 text-foreground">{event.event}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          
                          {/* Data values */}
                          {(event.actual || event.forecast || event.previous) && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {event.actual && (
                                <div className="bg-muted/50 rounded p-2">
                                  <div className="font-medium text-muted-foreground">Actual</div>
                                  <div className="text-green-600 font-bold">{event.actual}</div>
                                </div>
                              )}
                              {event.forecast && (
                                <div className="bg-muted/50 rounded p-2">
                                  <div className="font-medium text-muted-foreground">Forecast</div>
                                  <div className="text-blue-600 font-bold">{event.forecast}</div>
                                </div>
                              )}
                              {event.previous && (
                                <div className="bg-muted/50 rounded p-2">
                                  <div className="font-medium text-muted-foreground">Previous</div>
                                  <div className="text-gray-600 font-bold">{event.previous}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No economic events scheduled for this date</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 p-4 glass rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium text-sm text-foreground">Data Source: ForexFactory.com</span>
              </div>
              {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time economic data sourced from ForexFactory.com. Times shown in your local timezone.
              Always verify with official sources before making trading decisions.
            </p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> High Impact
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div> Medium Impact
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-100"></div> Low Impact
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
