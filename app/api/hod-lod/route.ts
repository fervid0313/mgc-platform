import { NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const SYSTEM_PROMPT = `You are an expert technical analyst specializing in intraday session analysis, smart money concepts, and liquidity dynamics. Analyze the provided market data to predict High of Day (HOD) and Low of Day (LOD) with precision.

SESSION DEFINITIONS:
- Asian Session: 6:00 PM – 3:00 AM EST (Low liquidity, accumulation/distribution)
- London Session: 3:00 AM – 11:00 AM EST (High liquidity, often sets daily extremes)
- NY AM Session: 8:00 AM – 12:00 PM EST (Peak volatility, smart money moves)
- NY PM Session: 12:00 PM – 5:00 PM EST (Liquidity draws, reversals, profit taking)

SMART MONEY CONCEPTS:
1. **Liquidity Zones**: Areas where stop losses and pending orders cluster
2. **Fair Value Gaps (FVG)**: Imbalances created by rapid price movements
3. **Order Block (OB)**: Last aggressive candle before significant move
4. **Break of Structure (BOS)**: Key level breaks indicating momentum shifts
5. **Liquidity Draws**: Price moves to grab liquidity before reversing

ANALYSIS APPROACH:
1. **Liquidity Mapping**: Identify where stops and liquidity pools exist
2. **Probability Zones**: High-probability areas based on confluence
3. **Turnaround Zones**: Areas likely to cause reversals
4. **Session Characteristics**: Typical smart money behavior per session
5. **Risk/Reward**: Favorable zones for institutional entries

OUTPUT FORMAT:
Return a JSON object with:
{
  "sessions": [
    {
      "name": "Asian",
      "status": "upcoming" | "active" | "passed",
      "highZone": "<precise price or range>",
      "lowZone": "<precise price or range>",
      "probability": <number 0-100>,
      "turnaroundZone": "<price level likely to cause reversal>",
      "liquidityDraw": "<area where liquidity will be grabbed>",
      "confluences": ["<factor1>", "<factor2>", "<factor3>"],
      "setsHOD": <boolean>,
      "setsLOD": <boolean>,
      "smartMoneyNotes": "<brief explanation of smart money expectations>"
    }
  ],
  "dailyHOD": {
    "price": "<specific price>",
    "probability": <number 0-100>,
    "session": "<session most likely>",
    "liquidityAbove": "<price level where stops sit above HOD>",
    "notes": "<why this level is significant>"
  },
  "dailyLOD": {
    "price": "<specific price>",
    "probability": <number 0-100>,
    "session": "<session most likely>",
    "liquidityBelow": "<price level where stops sit below LOD>",
    "notes": "<why this level is significant>"
  },
  "highProbabilityZones": [
    {
      "price": "<price level>",
      "type": "support" | "resistance" | "turnaround",
      "probability": <number 0-100>,
      "reason": "<why this zone is high probability>"
    }
  ],
  "liquidityAnalysis": {
    "majorLiquidityPools": ["<price1>", "<price2>", "<price3>"],
    "stopClusters": ["<area1>", "<area2>"],
    "institutionalLevels": ["<level1>", "<level2>"]
  },
  "summary": "<comprehensive analysis of expectations>"
}

IMPORTANT: Be precise with price levels. Provide specific numbers, not ranges. Focus on high-probability setups (70%+ confidence). Return ONLY the JSON. No markdown, no code blocks, no explanations outside the JSON.`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const market = searchParams.get("market") || "NQ100"

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Get current market data
    let currentPrice = 0
    let recentData = ""
    
    try {
      const marketRes = await fetch(`http://localhost:3000/api/market`)
      if (marketRes.ok) {
        const marketData = await marketRes.json()
        const item = marketData.find((m: any) => m.label === market)
        if (item) {
          currentPrice = item.price
          recentData = `Current Price: ${item.price}, Change: ${item.changePercent}%`
        }
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error)
    }

    // Get current time to determine session status
    const now = new Date()
    const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
    const hour = estTime.getHours()
    
    const sessionStatus = {
      Asian: hour < 3 || hour >= 18 ? "passed" : hour < 3 ? "upcoming" : "passed",
      London: hour >= 3 && hour < 11 ? (hour < 8 ? "active" : "passed") : hour < 3 ? "upcoming" : "passed",
      "NY AM": hour >= 8 && hour < 12 ? "active" : hour < 8 ? "upcoming" : "passed",
      "NY PM": hour >= 12 && hour < 17 ? "active" : hour < 12 ? "upcoming" : "passed"
    }

    const userPrompt = `SMART MONEY HOD/LOD ANALYSIS for ${market}

Current Data: ${recentData}
Time: ${estTime.toLocaleString()} EST (Hour: ${hour})
Current Price: ${currentPrice}

SMART MONEY ANALYSIS FRAMEWORK:
1. **Liquidity Mapping**: Where are the stop clusters and liquidity pools?
2. **Institutional Levels**: What levels would smart money target?
3. **Probability Assessment**: Focus on 70%+ confidence zones only
4. **Session Liquidity**: Each session has distinct liquidity characteristics
5. **Turnaround Zones**: Where will price draw liquidity before reversing?

LIQUIDITY CONSIDERATIONS:
- Asian Session: Low liquidity, accumulation zones, FVG fills
- London Session: High liquidity, institutional entries, BOS levels
- NY AM Session: Peak liquidity, stop hunts, momentum moves
- NY PM Session: Liquidity draws, reversals, profit taking

For each session, provide:
1. **Precise HOD/LOD levels** (specific prices, not ranges)
2. **Probability percentage** (focus on 70%+ confidence)
3. **Turnaround zones** where liquidity will be grabbed
4. **Smart money expectations** for that session
5. **High-probability zones** with specific price levels

Identify:
- **Daily HOD** with specific price and probability
- **Daily LOD** with specific price and probability  
- **Major liquidity pools** where stops cluster
- **High probability turnaround zones** (80%+ confidence)
- **Institutional entry/exit levels**

Focus on PRECISE price levels and HIGH PROBABILITY setups. Smart money operates at specific levels where liquidity concentrates.`

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      maxOutputTokens: 1024,
      temperature: 0.4,
    })

    let prediction
    try {
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      prediction = JSON.parse(cleaned)
    } catch (parseError) {
      console.error("[HOD-LOD] Failed to parse AI response:", result.text)
      return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      prediction,
      market,
      currentPrice,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[HOD-LOD] Error:", error)
    return NextResponse.json({ 
      error: error?.message || "Failed to generate HOD/LOD prediction" 
    }, { status: 500 })
  }
}
