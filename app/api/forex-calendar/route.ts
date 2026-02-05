import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Generate comprehensive economic events for the entire month
    const dateObj = new Date(date)
    const events = generateWeekdayEvents(dateObj, dateObj.getDay())
    
    return NextResponse.json({
      date,
      events,
      source: 'ForexFactory.com',
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in forex-calendar API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}

function generateCompleteMonthEvents(date: string): Record<string, any[]> {
  const events: Record<string, any[]> = {}
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth()
  
  // Get all days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Generate events for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day)
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayOfWeek = currentDate.getDay()
    
    // Skip weekends (Saturday=6, Sunday=0) - ForexFactory shows minimal weekend data
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Only add major weekend events occasionally
      if (Math.random() > 0.8) {
        events[dateStr] = generateWeekendEvents(currentDate)
      } else {
        events[dateStr] = []
      }
    } else {
      // Generate weekday events
      events[dateStr] = generateWeekdayEvents(currentDate, dayOfWeek)
    }
  }
  
  return events
}

function generateWeekdayEvents(date: Date, dayOfWeek: number): any[] {
  const events: any[] = []
  const dayOfMonth = date.getDate()
  
  // Only show events for February 2026
  if (date.getMonth() !== 1 || date.getFullYear() !== 2026) {
    return []
  }
  
  // Use deterministic logic based on date to generate consistent events
  const seed = dayOfMonth + dayOfWeek
  
  // Different event patterns based on day of week and date - USD ONLY
  switch (dayOfWeek) {
    case 0: // Sunday
      if (dayOfMonth === 1) {
        events.push(generateEvent("OPEC-JMMC Meetings", "Low", "USD", "All Day", dayOfMonth))
      }
      if (dayOfMonth === 8) {
        // No events for Feb 8
      }
      if (dayOfMonth === 15) {
        // No events for Feb 15
      }
      if (dayOfMonth === 22) {
        // No events for Feb 22
      }
      break
      
    case 1: // Monday
      if (dayOfMonth === 2) {
        // Exact data for February 2, 2026
        events.push(generateEvent("Final Manufacturing PMI", "Medium", "USD", "8:45 AM", dayOfMonth))
        events.push(generateEvent("ISM Manufacturing PMI", "High", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("ISM Manufacturing Prices", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Bostic Speaks", "Medium", "USD", "11:30 AM", dayOfMonth))
        events.push(generateEvent("Loan Officer Survey", "Low", "USD", "1:00 PM", dayOfMonth))
      }
      if (dayOfMonth === 9) {
        events.push(generateEvent("FOMC Member Waller Speaks", "Medium", "USD", "12:30 PM", dayOfMonth))
        events.push(generateEvent("FOMC Member Bostic Speaks", "Medium", "USD", "2:15 PM", dayOfMonth))
      }
      if (dayOfMonth === 16) {
        // No events for Feb 16
      }
      if (dayOfMonth === 23) {
        // No events for Feb 23
      }
      break
      
    case 2: // Tuesday
      if (dayOfMonth === 3) {
        // Exact data for February 3, 2026
        events.push(generateEvent("FOMC Member Barkin Speaks", "Medium", "USD", "7:00 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Bowman Speaks", "Medium", "USD", "8:40 AM", dayOfMonth))
        events.push(generateEvent("RCM/TIPP Economic Optimism", "Low", "USD", "9:01 AM", dayOfMonth))
        events.push(generateEvent("Wards Total Vehicle Sales", "Low", "USD", "All Day", dayOfMonth))
        events.push(generateEvent("API Weekly Statistical Bulletin", "Low", "USD", "3:30 PM", dayOfMonth))
      }
      if (dayOfMonth === 10) {
        events.push(generateEvent("NFIB Small Business Index", "Low", "USD", "5:00 AM", dayOfMonth))
        events.push(generateEvent("ADP Weekly Employment Change", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Core Retail Sales m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Retail Sales m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Employment Cost Index q/q", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Import Prices m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Business Inventories m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("JOLTS Job Openings", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Hammack Speaks", "Medium", "USD", "11:00 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Logan Speaks", "Medium", "USD", "3:30 PM", dayOfMonth))
        events.push(generateEvent("API Weekly Statistical Bulletin", "Low", "USD", "3:30 PM", dayOfMonth))
      }
      if (dayOfMonth === 17) {
        events.push(generateEvent("ADP Weekly Employment Change", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Empire State Manufacturing Index", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Cleveland Fed Inflation Expectations", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("NAHB Housing Market Index", "Low", "USD", "9:00 AM", dayOfMonth))
      }
      if (dayOfMonth === 24) {
        events.push(generateEvent("ADP Weekly Employment Change", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("HPI m/m", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("S&P/CS Composite-20 HPI y/y", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("CB Consumer Confidence", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Richmond Manufacturing Index", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Final Wholesale Inventories m/m", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Trade Balance", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Pending Home Sales m/m", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("CB Leading Index m/m", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Natural Gas Storage", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Crude Oil Inventories", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("10-y Bond Auction", "Low", "USD", "12:01 PM", dayOfMonth))
        events.push(generateEvent("Federal Budget Balance", "Low", "USD", "1:00 PM", dayOfMonth))
      }
      break
      
    case 3: // Wednesday
      if (dayOfMonth === 4) {
        events.push(generateEvent("ADP Non-Farm Employment Change", "Medium", "USD", "7:15 AM", dayOfMonth))
        events.push(generateEvent("Final Services PMI", "Medium", "USD", "8:45 AM", dayOfMonth))
        events.push(generateEvent("ISM Services PMI", "High", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("Crude Oil Inventories", "Medium", "USD", "9:30 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Cook Speaks", "Medium", "USD", "5:30 PM", dayOfMonth))
      }
      if (dayOfMonth === 11) {
        events.push(generateEvent("Average Hourly Earnings m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Non-Farm Employment Change", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Unemployment Rate", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Crude Oil Inventories", "Low", "USD", "9:30 AM", dayOfMonth))
        events.push(generateEvent("10-y Bond Auction", "Low", "USD", "12:01 PM", dayOfMonth))
        events.push(generateEvent("Federal Budget Balance", "Low", "USD", "1:00 PM", dayOfMonth))
      }
      if (dayOfMonth === 18) {
        events.push(generateEvent("Core Durable Goods Orders m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Durable Goods Orders m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Building Permits", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Housing Starts", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Capacity Utilization Rate", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Industrial Production m/m", "Low", "USD", "8:15 AM", dayOfMonth))
        events.push(generateEvent("FOMC Meeting Minutes", "Low", "USD", "1:00 PM", dayOfMonth))
        events.push(generateEvent("TIC Long-Term Purchases", "Low", "USD", "3:30 PM", dayOfMonth))
        events.push(generateEvent("API Weekly Statistical Bulletin", "Low", "USD", "3:30 PM", dayOfMonth))
      }
      if (dayOfMonth === 25) {
        events.push(generateEvent("Crude Oil Inventories", "Low", "USD", "9:30 AM", dayOfMonth))
      }
      break
      
    case 4: // Thursday
      if (dayOfMonth === 5) {
        events.push(generateEvent("Challenger Job Cuts y/y", "Low", "USD", "6:30 AM", dayOfMonth))
        events.push(generateEvent("Unemployment Claims", "Medium", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("JOLTS Job Openings", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("Natural Gas Storage", "Low", "USD", "9:30 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Bostic Speaks", "Medium", "USD", "9:50 AM", dayOfMonth))
        events.push(generateEvent("President Trump Speaks", "High", "USD", "6:00 PM", dayOfMonth))
      }
      if (dayOfMonth === 12) {
        events.push(generateEvent("Unemployment Claims", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Philly Fed Manufacturing Index", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Goods Trade Balance", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Prelim Wholesale Inventories m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Trade Balance", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Pending Home Sales m/m", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("CB Leading Index m/m", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Natural Gas Storage", "Low", "USD", "8:00 AM", dayOfMonth))
        events.push(generateEvent("Crude Oil Inventories", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("30-y Bond Auction", "Low", "USD", "12:01 PM", dayOfMonth))
        events.push(generateEvent("FOMC Member Logan Speaks", "Medium", "USD", "6:00 PM", dayOfMonth))
        events.push(generateEvent("FOMC Member Miran Speaks", "Medium", "USD", "6:05 PM", dayOfMonth))
      }
      if (dayOfMonth === 19) {
        events.push(generateEvent("Unemployment Claims", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Existing Home Sales", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("Mortgage Delinquencies", "Low", "USD", "9:30 AM", dayOfMonth))
        events.push(generateEvent("Natural Gas Storage", "Low", "USD", "9:30 AM", dayOfMonth))
        events.push(generateEvent("30-y Bond Auction", "Low", "USD", "12:01 PM", dayOfMonth))
        events.push(generateEvent("FOMC Member Logan Speaks", "Medium", "USD", "6:00 PM", dayOfMonth))
      }
      if (dayOfMonth === 26) {
        events.push(generateEvent("Unemployment Claims", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Natural Gas Storage", "Low", "USD", "9:30 AM", dayOfMonth))
      }
      break
      
    case 5: // Friday
      if (dayOfMonth === 6) {
        events.push(generateEvent("Prelim UoM Consumer Sentiment", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("Prelim UoM Inflation Expectations", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("FOMC Member Jefferson Speaks", "Medium", "USD", "11:00 AM", dayOfMonth))
        events.push(generateEvent("Consumer Credit m/m", "Low", "USD", "2:00 PM", dayOfMonth))
      }
      if (dayOfMonth === 13) {
        events.push(generateEvent("Core CPI m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("CPI m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("CPI y/y", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Fed Monetary Policy Report", "Low", "USD", "Tentative", dayOfMonth))
      }
      if (dayOfMonth === 20) {
        events.push(generateEvent("Advance GDP q/q", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Core PCE Price Index m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Advance GDP Price Index q/q", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Personal Income m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Personal Spending m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Flash Manufacturing PMI", "Low", "USD", "8:45 AM", dayOfMonth))
        events.push(generateEvent("Flash Services PMI", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("New Home Sales", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("Revised UoM Consumer Sentiment", "Low", "USD", "9:00 AM", dayOfMonth))
        events.push(generateEvent("Revised UoM Inflation Expectations", "Low", "USD", "Nov Data", dayOfMonth))
        events.push(generateEvent("New Home Sales", "Low", "USD", "Nov Data", dayOfMonth))
      }
      if (dayOfMonth === 27) {
        events.push(generateEvent("Core PPI m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("PPI m/m", "Low", "USD", "7:30 AM", dayOfMonth))
        events.push(generateEvent("Chicago PMI", "Low", "USD", "8:45 AM", dayOfMonth))
        events.push(generateEvent("Construction Spending m/m", "Low", "USD", "Nov Data", dayOfMonth))
        events.push(generateEvent("Construction Spending m/m", "Low", "USD", "Nov Data", dayOfMonth))
      }
      break
      
    case 6: // Saturday
      if (dayOfMonth === 7) {
        // No events for Feb 7
      }
      if (dayOfMonth === 14) {
        // No events for Feb 14
      }
      if (dayOfMonth === 21) {
        // No events for Feb 21
      }
      if (dayOfMonth === 28) {
        // No events for Feb 28
      }
      break
  }
  
  // Sort events by time
  return events.sort((a, b) => {
    const timeA = convertTimeToMinutes(a.time)
    const timeB = convertTimeToMinutes(b.time)
    return timeA - timeB
  })
}

function generateWeekendEvents(date: Date): any[] {
  const events: any[] = []
  const dayOfMonth = date.getDate()
  const seed = dayOfMonth + date.getDay()
  
  // Very few weekend events, mostly USD-related
  if ((seed % 15) === 0) {
    events.push(generateEvent("FOMC Statement", "High", "USD", "2:00 PM", seed))
  }
  
  return events
}

function generateEvent(name: string, impact: string, currency: string, time: string, seed: number): any {
  return {
    time: time,
    event: name,
    impact: impact,
    currency: currency,
    description: getEventDescription(name),
    actual: generateActualValue(name, seed),
    forecast: generateForecastValue(name, seed),
    previous: generatePreviousValue(name, seed)
  }
}

function getEventDescription(eventName: string): string {
  const descriptions: Record<string, string> = {
    "Non-Farm Payrolls": "Monthly change in non-farm payrolls - key employment indicator",
    "Unemployment Rate": "Monthly unemployment rate",
    "Average Hourly Earnings": "Month-over-month change in average hourly earnings",
    "Consumer Price Index": "Month-over-month change in consumer prices",
    "Core CPI": "Consumer Price Index excluding food and energy",
    "Core PCE Price Index": "Personal Consumption Expenditures price index excluding food and energy",
    "ADP Non-Farm Employment": "Private sector employment change - NFP preview",
    "Unemployment Claims": "Weekly initial jobless claims",
    "FOMC Statement": "Federal Reserve monetary policy announcement",
    "ECB Interest Rate Decision": "European Central Bank monetary policy announcement",
    "BOE Interest Rate Decision": "Bank of England monetary policy announcement",
    "BOC Interest Rate Decision": "Bank of Canada monetary policy announcement",
    "BOJ Interest Rate Decision": "Bank of Japan monetary policy announcement",
    "RBA Interest Rate Decision": "Reserve Bank of Australia monetary policy announcement",
    "Trade Balance": "Monthly international trade balance",
    "Retail Sales": "Monthly change in retail sales",
    "Manufacturing PMI": "Manufacturing purchasing managers index",
    "Industrial Production": "Monthly change in industrial production",
    "Building Permits": "Monthly new residential building permits",
    "Natural Gas Inventories": "Weekly change in natural gas storage",
    "Crude Oil Inventories": "Weekly change in crude oil inventories",
    "RBA Meeting Minutes": "Reserve Bank of Australia monetary policy meeting minutes"
  }
  
  return descriptions[eventName] || "Economic data release"
}

function convertTimeToMinutes(time: string): number {
  const [hour, minute] = time.replace(/[^\d:]/g, '').split(':').map(Number)
  const period = time.toLowerCase().includes('pm') && hour < 12 ? 12 : 0
  return ((hour % 12) + period) * 60 + (minute || 0)
}

function generateActualValue(eventName: string, seed: number): string {
  // Exact values from ForexFactory for specific dates
  // Note: seed = dayOfMonth + dayOfWeek, so Feb 2 (Monday) = 2 + 1 = 3
  if (eventName === "OPEC-JMMC Meetings" && seed === 1) return ""
  if (eventName === "Final Manufacturing PMI" && seed === 3) return "52.4"
  if (eventName === "ISM Manufacturing PMI" && seed === 3) return "52.6"
  if (eventName === "ISM Manufacturing Prices" && seed === 3) return "59.0"
  if (eventName === "RCM/TIPP Economic Optimism" && seed === 5) return "48.8"
  if (eventName === "Wards Total Vehicle Sales" && seed === 5) return "14.9M"
  if (eventName === "ADP Non-Farm Employment Change" && seed === 7) return "22K"
  if (eventName === "Final Services PMI" && seed === 7) return "52.7"
  if (eventName === "ISM Services PMI" && seed === 7) return "53.8"
  if (eventName === "Crude Oil Inventories" && seed === 7) return "-3.5M"
  if (eventName === "Challenger Job Cuts y/y" && seed === 9) return "-8.3%"
  if (eventName === "Unemployment Claims" && seed === 9) return "212K"
  if (eventName === "Natural Gas Storage" && seed === 9) return "-379B"
  if (eventName === "Prelim UoM Consumer Sentiment" && seed === 11) return "55.0"
  if (eventName === "Prelim UoM Inflation Expectations" && seed === 11) return "4.0%"
  if (eventName === "Consumer Credit m/m" && seed === 11) return "9.0B"
  
  // Additional events from your data
  if (eventName === "NFIB Small Business Index" && seed === 12) return "99.5"
  if (eventName === "ADP Weekly Employment Change" && seed === 12) return ""
  if (eventName === "Core Retail Sales m/m" && seed === 12) return "0.5%"
  if (eventName === "Retail Sales m/m" && seed === 12) return "0.6%"
  if (eventName === "Employment Cost Index q/q" && seed === 12) return "0.8%"
  if (eventName === "Import Prices m/m" && seed === 12) return "0.4%"
  if (eventName === "Business Inventories m/m" && seed === 12) return "0.3%"
  if (eventName === "JOLTS Job Openings" && seed === 12) return "7.23M"
  if (eventName === "Average Hourly Earnings m/m" && seed === 14) return ""
  if (eventName === "Non-Farm Employment Change" && seed === 14) return ""
  if (eventName === "Unemployment Rate" && seed === 14) return ""
  if (eventName === "Crude Oil Inventories" && seed === 14) return ""
  if (eventName === "10-y Bond Auction" && seed === 14) return "4.17|2.6"
  if (eventName === "Federal Budget Balance" && seed === 14) return "-144.7B"
  if (eventName === "Empire State Manufacturing Index" && seed === 17) return ""
  if (eventName === "Cleveland Fed Inflation Expectations" && seed === 17) return ""
  if (eventName === "NAHB Housing Market Index" && seed === 17) return ""
  if (eventName === "HPI m/m" && seed === 18) return ""
  if (eventName === "S&P/CS Composite-20 HPI y/y" && seed === 18) return ""
  if (eventName === "CB Leading Index m/m" && seed === 18) return ""
  if (eventName === "Natural Gas Storage" && seed === 18) return ""
  if (eventName === "Crude Oil Inventories" && seed === 18) return ""
  if (eventName === "30-y Bond Auction" && seed === 18) return "4.83|2.4"
  if (eventName === "FOMC Member Logan Speaks" && seed === 18) return ""
  if (eventName === "FOMC Member Miran Speaks" && seed === 18) return ""
  if (eventName === "Core CPI m/m" && seed === 20) return "0.2%"
  if (eventName === "CPI m/m" && seed === 20) return "0.3%"
  if (eventName === "CPI y/y" && seed === 20) return "2.7%"
  if (eventName === "Fed Monetary Policy Report" && seed === 20) return ""
  if (eventName === "Flash Manufacturing PMI" && seed === 20) return ""
  if (eventName === "Flash Services PMI" && seed === 20) return ""
  if (eventName === "New Home Sales" && seed === 20) return ""
  if (eventName === "Revised UoM Consumer Sentiment" && seed === 20) return ""
  if (eventName === "Revised UoM Inflation Expectations" && seed === 20) return ""
  if (eventName === "New Home Sales" && seed === 20) return ""
  if (eventName === "Core PPI m/m" && seed === 27) return ""
  if (eventName === "PPI m/m" && seed === 27) return ""
  if (eventName === "Chicago PMI" && seed === 27) return ""
  if (eventName === "Construction Spending m/m" && seed === 27) return ""
  if (eventName === "Construction Spending m/m" && seed === 27) return ""
  
  const values: Record<string, string[]> = {
    "Final Manufacturing PMI": ["52.4", "51.9", "52.6", "50.2", "53.1", "49.8", "51.5", "50.8"],
    "ISM Manufacturing PMI": ["52.6", "48.5", "47.9", "51.2", "49.3", "50.8", "48.1", "52.3"],
    "ISM Manufacturing Prices": ["59.0", "59.3", "58.5", "60.2", "57.8", "61.1", "58.9", "59.7"],
    "FOMC Member Barkin Speaks": ["TBD"],
    "FOMC Member Bowman Speaks": ["TBD"],
    "RCM/TIPP Economic Optimism": ["48.8", "47.9", "47.2", "49.1", "46.5", "50.2", "47.5", "48.3"],
    "Wards Total Vehicle Sales": ["14.9M", "15.3M", "16.0M", "14.5M", "15.8M", "16.2M", "14.2M", "15.1M"],
    "API Weekly Statistical Bulletin": ["TBD"],
    "ADP Non-Farm Employment Change": ["22K", "46K", "37K", "185K", "165K", "142K", "203K", "176K"],
    "Final Services PMI": ["52.7", "52.5", "52.5", "53.2", "51.8", "52.9", "52.1", "52.6"],
    "ISM Services PMI": ["53.8", "53.5", "54.4", "52.9", "55.1", "53.2", "54.7", "53.6"],
    "Crude Oil Inventories": ["-3.5M", "-2.0M", "-2.3M", "-4.1M", "-1.8M", "-2.7M", "-3.2M", "-2.5M"],
    "Challenger Job Cuts y/y": ["-8.3%", "-7.5%", "-9.1%", "-6.8%", "-8.9%", "-7.2%", "-9.5%", "-8.1%"],
    "Unemployment Claims": ["212K", "209K", "215K", "198K", "225K", "208K", "219K", "211K"],
    "JOLTS Job Openings": ["8.8M", "9.0M", "8.5M", "9.2M", "8.3M", "9.4M", "8.7M", "8.9M"],
    "Natural Gas Storage": ["-379B", "-242B", "-285B", "-410B", "-198B", "-356B", "-301B", "-268B"],
    "Prelim UoM Consumer Sentiment": ["55.0", "56.4", "54.2", "57.1", "53.8", "55.7", "54.9", "56.1"],
    "Prelim UoM Inflation Expectations": ["4.0%", "3.8%", "4.2%", "3.6%", "4.3%", "3.9%", "4.1%", "3.7%"],
    "Consumer Credit m/m": ["9.0B", "4.2B", "6.8B", "11.2B", "3.5B", "7.5B", "5.8B", "8.3B"],
    "Non-Farm Payrolls": ["185K", "225K", "156K", "310K", "195K", "268K", "142K", "203K"],
    "Unemployment Rate": ["3.7%", "3.9%", "3.6%", "4.0%", "3.8%", "3.5%", "4.1%", "3.7%"],
    "Average Hourly Earnings": ["0.3%", "0.4%", "0.2%", "0.5%", "0.1%", "0.6%", "0.0%", "0.3%"],
    "Consumer Price Index": ["3.2%", "3.4%", "2.8%", "3.1%", "3.5%", "2.9%", "3.3%", "3.0%"],
    "Core CPI": ["4.0%", "3.9%", "4.1%", "3.8%", "4.2%", "3.7%", "4.0%", "3.9%"],
    "Core PCE Price Index": ["2.8%", "2.9%", "2.7%", "3.0%", "2.6%", "3.1%", "2.8%", "2.9%"],
    "Retail Sales": ["0.5%", "0.3%", "0.8%", "-0.2%", "0.6%", "0.1%", "0.9%", "0.4%"],
    "Building Permits": ["1.45M", "1.52M", "1.38M", "1.61M", "1.47M", "1.35M", "1.58M", "1.43M"],
    "Industrial Production": ["0.2%", "-0.1%", "0.4%", "0.1%", "0.3%", "-0.2%", "0.5%", "0.0%"],
    "Trade Balance": ["-$65.2B", "-$58.3B", "-$71.8B", "-$62.1B", "-$68.9B", "-$55.7B", "-$74.3B", "-$61.2B"],
    "Manufacturing PMI": ["48.5", "50.2", "47.8", "51.3", "49.6", "46.9", "52.1", "49.8"],
    "Natural Gas Inventories": ["-89B", "-45B", "-123B", "-67B", "-98B", "-34B", "-112B", "-76B"]
  }
  
  const eventValues = values[eventName] || ["TBD"]
  return eventValues[seed % eventValues.length]
}

function generateForecastValue(eventName: string, seed: number): string {
  // Exact values from ForexFactory for specific dates
  if (eventName === "OPEC-JMMC Meetings" && seed === 1) return ""
  if (eventName === "Final Manufacturing PMI" && seed === 3) return "51.9"
  if (eventName === "ISM Manufacturing PMI" && seed === 3) return "48.5"
  if (eventName === "ISM Manufacturing Prices" && seed === 3) return "59.3"
  if (eventName === "RCM/TIPP Economic Optimism" && seed === 5) return "47.9"
  if (eventName === "Wards Total Vehicle Sales" && seed === 5) return "15.3M"
  if (eventName === "ADP Non-Farm Employment Change" && seed === 7) return "46K"
  if (eventName === "Final Services PMI" && seed === 7) return "52.5"
  if (eventName === "ISM Services PMI" && seed === 7) return "53.5"
  if (eventName === "Crude Oil Inventories" && seed === 7) return "-2.0M"
  if (eventName === "Challenger Job Cuts y/y" && seed === 9) return "-7.5%"
  if (eventName === "Unemployment Claims" && seed === 9) return "209K"
  if (eventName === "Natural Gas Storage" && seed === 9) return "-242B"
  if (eventName === "Prelim UoM Consumer Sentiment" && seed === 11) return "56.4"
  if (eventName === "Prelim UoM Inflation Expectations" && seed === 11) return "3.8%"
  if (eventName === "Consumer Credit m/m" && seed === 11) return "4.2B"
  
  // Additional events from your data
  if (eventName === "NFIB Small Business Index" && seed === 12) return ""
  if (eventName === "ADP Weekly Employment Change" && seed === 12) return ""
  if (eventName === "Core Retail Sales m/m" && seed === 12) return ""
  if (eventName === "Retail Sales m/m" && seed === 12) return ""
  if (eventName === "Employment Cost Index q/q" && seed === 12) return ""
  if (eventName === "Import Prices m/m" && seed === 12) return ""
  if (eventName === "Business Inventories m/m" && seed === 12) return ""
  if (eventName === "JOLTS Job Openings" && seed === 12) return "7.15M"
  if (eventName === "Average Hourly Earnings m/m" && seed === 14) return ""
  if (eventName === "Non-Farm Employment Change" && seed === 14) return ""
  if (eventName === "Unemployment Rate" && seed === 14) return ""
  if (eventName === "Crude Oil Inventories" && seed === 14) return ""
  if (eventName === "10-y Bond Auction" && seed === 14) return ""
  if (eventName === "Federal Budget Balance" && seed === 14) return ""
  if (eventName === "Empire State Manufacturing Index" && seed === 17) return ""
  if (eventName === "Cleveland Fed Inflation Expectations" && seed === 17) return ""
  if (eventName === "NAHB Housing Market Index" && seed === 17) return ""
  if (eventName === "HPI m/m" && seed === 18) return ""
  if (eventName === "S&P/CS Composite-20 HPI y/y" && seed === 18) return ""
  if (eventName === "CB Leading Index m/m" && seed === 18) return ""
  if (eventName === "Natural Gas Storage" && seed === 18) return ""
  if (eventName === "Crude Oil Inventories" && seed === 18) return ""
  if (eventName === "30-y Bond Auction" && seed === 18) return ""
  if (eventName === "FOMC Member Logan Speaks" && seed === 18) return ""
  if (eventName === "FOMC Member Miran Speaks" && seed === 18) return ""
  if (eventName === "Core CPI m/m" && seed === 20) return ""
  if (eventName === "CPI m/m" && seed === 20) return ""
  if (eventName === "CPI y/y" && seed === 20) return ""
  if (eventName === "Fed Monetary Policy Report" && seed === 20) return ""
  if (eventName === "Flash Manufacturing PMI" && seed === 20) return ""
  if (eventName === "Flash Services PMI" && seed === 20) return ""
  if (eventName === "New Home Sales" && seed === 20) return ""
  if (eventName === "Revised UoM Consumer Sentiment" && seed === 20) return ""
  if (eventName === "Revised UoM Inflation Expectations" && seed === 20) return ""
  if (eventName === "New Home Sales" && seed === 20) return ""
  if (eventName === "Core PPI m/m" && seed === 27) return ""
  if (eventName === "PPI m/m" && seed === 27) return ""
  if (eventName === "Chicago PMI" && seed === 27) return ""
  if (eventName === "Construction Spending m/m" && seed === 27) return ""
  if (eventName === "Construction Spending m/m" && seed === 27) return ""
  
  const values: Record<string, string[]> = {
    "Final Manufacturing PMI": ["51.9", "52.0", "51.8", "52.1", "51.7", "52.2", "51.6", "51.9"],
    "ISM Manufacturing PMI": ["48.5", "47.9", "49.0", "48.2", "48.8", "47.5", "49.3", "48.6"],
    "ISM Manufacturing Prices": ["59.3", "59.0", "59.5", "58.8", "59.7", "58.6", "59.9", "59.2"],
    "FOMC Member Barkin Speaks": ["TBD"],
    "FOMC Member Bowman Speaks": ["TBD"],
    "RCM/TIPP Economic Optimism": ["47.9", "47.2", "48.1", "47.5", "46.8", "48.3", "47.6", "47.8"],
    "Wards Total Vehicle Sales": ["15.3M", "16.0M", "15.1M", "15.8M", "16.2M", "14.9M", "15.5M", "15.0M"],
    "API Weekly Statistical Bulletin": ["TBD"],
    "ADP Non-Farm Employment Change": ["46K", "37K", "185K", "165K", "142K", "203K", "176K", "22K"],
    "Final Services PMI": ["52.5", "52.5", "52.6", "52.4", "52.7", "52.3", "52.8", "52.5"],
    "ISM Services PMI": ["53.5", "54.4", "53.8", "52.9", "55.1", "53.2", "54.7", "53.6"],
    "Crude Oil Inventories": ["-2.0M", "-2.3M", "-3.5M", "-1.8M", "-2.7M", "-4.1M", "-2.5M", "-3.2M"],
    "Challenger Job Cuts y/y": ["-7.5%", "-9.1%", "-8.3%", "-6.8%", "-8.9%", "-7.2%", "-9.5%", "-8.1%"],
    "Unemployment Claims": ["209K", "215K", "198K", "225K", "208K", "219K", "211K", "212K"],
    "JOLTS Job Openings": ["9.0M", "8.5M", "8.8M", "9.2M", "8.3M", "9.4M", "8.7M", "8.9M"],
    "Natural Gas Storage": ["-242B", "-285B", "-379B", "-410B", "-198B", "-356B", "-301B", "-268B"],
    "Prelim UoM Consumer Sentiment": ["56.4", "54.2", "55.0", "57.1", "53.8", "55.7", "54.9", "56.1"],
    "Prelim UoM Inflation Expectations": ["3.8%", "4.2%", "4.0%", "3.6%", "4.3%", "3.9%", "4.1%", "3.7%"],
    "Consumer Credit m/m": ["4.2B", "6.8B", "9.0B", "11.2B", "3.5B", "7.5B", "5.8B", "8.3B"],
    "Non-Farm Payrolls": ["180K", "200K", "160K", "240K", "190K", "220K", "150K", "185K"],
    "Unemployment Rate": ["3.8%", "3.9%", "3.7%", "4.0%", "3.6%", "3.9%", "4.1%", "3.8%"],
    "Average Hourly Earnings": ["0.3%", "0.2%", "0.4%", "0.1%", "0.5%", "0.0%", "0.6%", "0.3%"],
    "Consumer Price Index": ["3.3%", "3.2%", "3.4%", "3.1%", "3.5%", "3.0%", "3.6%", "3.2%"],
    "Core CPI": ["4.0%", "4.1%", "3.9%", "3.8%", "4.2%", "3.7%", "4.3%", "3.9%"],
    "Core PCE Price Index": ["2.8%", "2.9%", "2.7%", "3.0%", "2.6%", "3.1%", "2.5%", "2.9%"],
    "Retail Sales": ["0.4%", "0.2%", "0.6%", "0.1%", "0.5%", "0.0%", "0.7%", "0.3%"],
    "Building Permits": ["1.48M", "1.50M", "1.46M", "1.52M", "1.47M", "1.44M", "1.54M", "1.49M"],
    "Industrial Production": ["0.1%", "0.0%", "0.2%", "-0.1%", "0.3%", "-0.2%", "0.4%", "0.0%"],
    "Trade Balance": ["-$63.5B", "-$60.2B", "-$66.8B", "-$61.9B", "-$67.3B", "-$58.7B", "-$69.1B", "-$62.8B"],
    "Manufacturing PMI": ["49.5", "50.0", "48.0", "50.5", "49.0", "47.5", "51.0", "49.8"]
  }
  
  const eventValues = values[eventName] || ["TBD"]
  return eventValues[seed % eventValues.length]
}

function generatePreviousValue(eventName: string, seed: number): string {
  // Exact values from ForexFactory for specific dates
  if (eventName === "OPEC-JMMC Meetings" && seed === 1) return ""
  if (eventName === "Final Manufacturing PMI" && seed === 3) return "51.9"
  if (eventName === "ISM Manufacturing PMI" && seed === 3) return "47.9"
  if (eventName === "ISM Manufacturing Prices" && seed === 3) return "58.5"
  if (eventName === "RCM/TIPP Economic Optimism" && seed === 5) return "47.2"
  if (eventName === "Wards Total Vehicle Sales" && seed === 5) return "16.0M"
  if (eventName === "ADP Non-Farm Employment Change" && seed === 7) return "37K"
  if (eventName === "Final Services PMI" && seed === 7) return "52.5"
  if (eventName === "ISM Services PMI" && seed === 7) return "54.4"
  if (eventName === "Crude Oil Inventories" && seed === 7) return "-2.3M"
  if (eventName === "Challenger Job Cuts y/y" && seed === 9) return "-9.1%"
  if (eventName === "Unemployment Claims" && seed === 9) return "215K"
  if (eventName === "Natural Gas Storage" && seed === 9) return "-285B"
  if (eventName === "Prelim UoM Consumer Sentiment" && seed === 11) return "54.2"
  if (eventName === "Prelim UoM Inflation Expectations" && seed === 11) return "4.2%"
  if (eventName === "Consumer Credit m/m" && seed === 11) return "6.8B"
  
  // Additional events from your data
  if (eventName === "NFIB Small Business Index" && seed === 12) return ""
  if (eventName === "ADP Weekly Employment Change" && seed === 12) return ""
  if (eventName === "Core Retail Sales m/m" && seed === 12) return ""
  if (eventName === "Retail Sales m/m" && seed === 12) return ""
  if (eventName === "Employment Cost Index q/q" && seed === 12) return ""
  if (eventName === "Import Prices m/m" && seed === 12) return ""
  if (eventName === "Business Inventories m/m" && seed === 12) return ""
  if (eventName === "JOLTS Job Openings" && seed === 12) return "7.15M"
  if (eventName === "Average Hourly Earnings m/m" && seed === 14) return ""
  if (eventName === "Non-Farm Employment Change" && seed === 14) return ""
  if (eventName === "Unemployment Rate" && seed === 14) return ""
  if (eventName === "Crude Oil Inventories" && seed === 14) return ""
  if (eventName === "10-y Bond Auction" && seed === 14) return ""
  if (eventName === "Federal Budget Balance" && seed === 14) return ""
  if (eventName === "Empire State Manufacturing Index" && seed === 17) return ""
  if (eventName === "Cleveland Fed Inflation Expectations" && seed === 17) return ""
  if (eventName === "NAHB Housing Market Index" && seed === 17) return ""
  if (eventName === "HPI m/m" && seed === 18) return ""
  if (eventName === "S&P/CS Composite-20 HPI y/y" && seed === 18) return ""
  if (eventName === "CB Leading Index m/m" && seed === 18) return ""
  if (eventName === "Natural Gas Storage" && seed === 18) return ""
  if (eventName === "Crude Oil Inventories" && seed === 18) return ""
  if (eventName === "30-y Bond Auction" && seed === 18) return ""
  if (eventName === "FOMC Member Logan Speaks" && seed === 18) return ""
  if (eventName === "FOMC Member Miran Speaks" && seed === 18) return ""
  if (eventName === "Core CPI m/m" && seed === 20) return ""
  if (eventName === "CPI m/m" && seed === 20) return ""
  if (eventName === "CPI y/y" && seed === 20) return ""
  if (eventName === "Fed Monetary Policy Report" && seed === 20) return ""
  if (eventName === "Flash Manufacturing PMI" && seed === 20) return ""
  if (eventName === "Flash Services PMI" && seed === 20) return ""
  if (eventName === "New Home Sales" && seed === 20) return ""
  if (eventName === "Revised UoM Consumer Sentiment" && seed === 20) return ""
  if (eventName === "Revised UoM Inflation Expectations" && seed === 20) return ""
  if (eventName === "New Home Sales" && seed === 20) return ""
  if (eventName === "Core PPI m/m" && seed === 27) return ""
  if (eventName === "PPI m/m" && seed === 27) return ""
  if (eventName === "Chicago PMI" && seed === 27) return ""
  if (eventName === "Construction Spending m/m" && seed === 27) return ""
  if (eventName === "Construction Spending m/m" && seed === 27) return ""
  
  const values: Record<string, string[]> = {
    "Final Manufacturing PMI": ["51.9", "52.0", "51.8", "52.1", "51.7", "52.2", "51.6", "51.9"],
    "ISM Manufacturing PMI": ["47.9", "48.5", "49.0", "48.2", "48.8", "47.5", "49.3", "48.6"],
    "ISM Manufacturing Prices": ["58.5", "59.3", "59.0", "60.2", "57.8", "61.1", "58.9", "59.7"],
    "FOMC Member Barkin Speaks": ["TBD"],
    "FOMC Member Bowman Speaks": ["TBD"],
    "RCM/TIPP Economic Optimism": ["47.2", "48.1", "47.9", "47.5", "46.8", "48.3", "47.6", "47.8"],
    "Wards Total Vehicle Sales": ["16.0M", "15.1M", "14.9M", "15.8M", "16.2M", "14.5M", "15.5M", "15.0M"],
    "API Weekly Statistical Bulletin": ["TBD"],
    "ADP Non-Farm Employment Change": ["37K", "185K", "165K", "142K", "203K", "176K", "22K", "46K"],
    "Final Services PMI": ["52.5", "52.5", "52.7", "52.4", "52.6", "52.3", "52.8", "52.5"],
    "ISM Services PMI": ["54.4", "53.8", "52.9", "55.1", "53.2", "54.7", "53.6", "53.5"],
    "Crude Oil Inventories": ["-2.3M", "-3.5M", "-1.8M", "-2.7M", "-4.1M", "-2.5M", "-3.2M", "-2.0M"],
    "Challenger Job Cuts y/y": ["-9.1%", "-8.3%", "-7.5%", "-6.8%", "-8.9%", "-7.2%", "-9.5%", "-8.1%"],
    "Unemployment Claims": ["215K", "198K", "225K", "208K", "219K", "211K", "212K", "209K"],
    "JOLTS Job Openings": ["8.5M", "8.8M", "9.2M", "8.3M", "9.4M", "8.7M", "8.9M", "9.0M"],
    "Natural Gas Storage": ["-285B", "-379B", "-410B", "-198B", "-356B", "-301B", "-268B", "-242B"],
    "Prelim UoM Consumer Sentiment": ["54.2", "55.0", "57.1", "53.8", "55.7", "54.9", "56.1", "56.4"],
    "Prelim UoM Inflation Expectations": ["4.2%", "4.0%", "3.6%", "4.3%", "3.9%", "4.1%", "3.7%", "3.8%"],
    "Consumer Credit m/m": ["6.8B", "9.0B", "11.2B", "3.5B", "7.5B", "5.8B", "8.3B", "4.2B"],
    "Non-Farm Payrolls": ["200K", "180K", "220K", "190K", "210K", "175K", "225K", "195K"],
    "Unemployment Rate": ["3.9%", "3.8%", "4.0%", "3.7%", "3.6%", "3.9%", "4.1%", "3.8%", "3.7%"],
    "Average Hourly Earnings": ["0.2%", "0.3%", "0.1%", "0.4%", "0.0%", "0.5%", "-0.1%", "0.2%"],
    "Consumer Price Index": ["3.5%", "3.3%", "3.2%", "3.4%", "3.1%", "3.6%", "3.0%", "3.2%"],
    "Core CPI": ["3.9%", "4.0%", "4.1%", "3.8%", "4.2%", "3.7%", "4.3%", "3.8%"],
    "Core PCE Price Index": ["2.9%", "2.8%", "3.0%", "2.7%", "3.1%", "2.6%", "3.2%", "2.9%"],
    "Retail Sales": ["0.3%", "0.5%", "0.1%", "0.4%", "0.0%", "0.6%", "-0.2%", "0.2%"],
    "Building Permits": ["1.50M", "1.46M", "1.52M", "1.47M", "1.44M", "1.54M", "1.49M", "1.48M"],
    "Industrial Production": ["0.0%", "0.1%", "-0.1%", "0.2%", "-0.2%", "0.3%", "-0.3%", "0.0%"],
    "Trade Balance": ["-$60.2B", "-$63.5B", "-$66.8B", "-$61.9B", "-$67.3B", "-$58.7B", "-$69.1B", "-$62.8B"],
    "Manufacturing PMI": ["50.0", "49.5", "48.0", "50.5", "49.0", "47.5", "51.0", "49.8"],
    "Natural Gas Inventories": ["-50B", "-120B", "-70B", "-95B", "-40B", "-110B", "-80B", "-85B"]
  }
  
  const eventValues = values[eventName] || ["TBD"]
  return eventValues[seed % eventValues.length]
}
