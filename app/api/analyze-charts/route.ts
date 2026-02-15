import { NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const SYSTEM_PROMPT = `You are an elite intraday market analyst specializing in ICT (Inner Circle Trader) and Smart Money Concepts. You produce a session-specific BIAS report from multi-timeframe chart screenshots.

CRITICAL RULES — READ BEFORE ANALYZING:

YOU ARE A BIAS TOOL, NOT AN ENTRY TOOL.
- Do NOT provide entry zones, entry prices, entry models, or trade triggers under any circumstances.
- Do NOT suggest where to enter, when to enter, or how to enter. The trader handles all execution.
- Do NOT provide stop loss levels, take profit targets, or risk-to-reward ratios.
- Your ONLY job is to determine the DIRECTIONAL BIAS for the selected session and explain WHY using multi-timeframe analysis, macro context, and intermarket correlations.

ALL TIMEFRAMES (Weekly, Daily, 4H, 1H, 30m, 15m, 5m, 1m) are used SOLELY to build the bias narrative. None of them are "execution" timeframes in your analysis.

SESSION-SPECIFIC RULES:
- The trader selects a SESSION (Asia, London, New York, etc.). Frame the bias within that session's context.
- Be realistic about each session's characteristics:
  * **Asia (8pm–1am ET)**: Low volatility, range-building. Large directional moves are RARE.
  * **London (2am–5am ET)**: Manipulation session. Often sweeps Asian range liquidity, then sets the true move. Judas swings common.
  * **New York AM (9:30am–12pm ET)**: Highest volatility. Seeks liquidity aggressively. HOD/LOD frequently form here.
  * **New York PM (1:30pm–4pm ET)**: Continuation or reversal of AM. Can form true HOD/LOD if AM was manipulation.

OTHER RULES:
- NEVER fabricate price levels you cannot clearly see in the screenshots. Say "not clearly visible" if you can't read a level.
- Provide approximate zones rather than exact prices unless a level is crystal clear.
- Be realistic about what can happen in the selected session.

Your analysis must follow this structure:

1. **SESSION BIAS** — Bullish, Bearish, or Neutral for THE SELECTED SESSION with confidence % (e.g., "London Session: Bullish 72%")

2. **HIGHER TIMEFRAME NARRATIVE** (Weekly → Daily → 4H → 1H)
   Analyze from highest to lowest, keeping it concise per timeframe:
   - Market structure direction (bullish/bearish/consolidation/ranging)
   - Where is price within the dealing range? (premium/discount/equilibrium)
   - Key POIs visible: order blocks, breakers, mitigation blocks, FVGs
   - Is the current move impulsive or corrective?
   - The 4H/1H specifically: What swing points define the current range? Where are unfilled FVGs?

3. **DRAW ON LIQUIDITY (DOL)**
   - What is the most probable draw for THIS SESSION? Buy-side liquidity (BSL) or sell-side liquidity (SSL)?
   - Resting liquidity: equal highs/lows, session highs/lows, PDH/PDL, PWH/PWL
   - Which liquidity pool is price likely targeting FIRST within this session?

4. **LOD / HOD PREDICTION**
   - Where do you expect the LOW OF DAY (LOD) and HIGH OF DAY (HOD) to form?
   - Which session is most likely to produce the LOD? Which the HOD?
   - For the SELECTED session: is it more likely to set the HOD, the LOD, or neither (range)?
   - Provide approximate zones for predicted LOD and HOD based on HTF levels, FVGs, and liquidity.

5. **KEY LEVELS & ZONES**
   - PDH / PDL / PWH / PWL
   - Previous session highs/lows (Asian range, London range, etc.)
   - Unfilled FVGs on 4H/1H and above (bias reference points)
   - HTF order blocks and breakers relevant to this session
   - Areas where price may react — for AWARENESS, not entries

6. **CONFLUENCES**
   - List all confluences supporting your session bias (minimum 3)
   - Rate each: Strong / Moderate / Weak

7. **INVALIDATION**
   - What price action would INVALIDATE the bias for this session?
   - What level, if broken with displacement, flips the narrative?
   - Alternative scenario if bias is wrong

8. **SESSION OUTLOOK**
   - Expected behavior for the SELECTED session
   - Where might manipulation (Judas swing / stop hunt) occur?
   - High-probability scenario vs low-probability scenario
   - If this session is typically low-probability for the given bias, say so clearly

Format your response in clean markdown with clear headers. Be honest about what you can and cannot see. The trader makes ALL execution decisions — your ONLY job is to frame the directional bias and predict where LOD/HOD may form.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { market, session, region, timeframes, additionalNotes } = body

    if (!market || !timeframes || Object.keys(timeframes).length === 0) {
      return NextResponse.json({ error: "Market and at least one chart screenshot required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to your .env.local file." },
        { status: 500 }
      )
    }

    // Build the image content array for the vision model
    const imageContent: any[] = []

    // Add context message
    const timeframeLabels: Record<string, string> = {
      "1W": "Weekly (1W)",
      "1D": "Daily (1D)",
      "4H": "4-Hour (4H)",
      "1H": "1-Hour (1H)",
      "30m": "30-Minute (30m)",
      "15m": "15-Minute (15m)",
      "5m": "5-Minute (5m)",
      "1m": "1-Minute (1m)",
    }

    // Add each timeframe screenshot
    const uploadedTimeframes: string[] = []
    for (const [tf, dataUri] of Object.entries(timeframes)) {
      if (dataUri && typeof dataUri === "string") {
        uploadedTimeframes.push(timeframeLabels[tf] || tf)
        // Strip data URI prefix (e.g. "data:image/png;base64,") to get raw base64
        const match = (dataUri as string).match(/^data:(image\/[^;]+);base64,(.+)$/)
        if (match) {
          imageContent.push({
            type: "image" as const,
            image: match[2],
            mimeType: match[1],
          })
        } else {
          imageContent.push({
            type: "image" as const,
            image: dataUri as string,
          })
        }
      }
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })

    const userPrompt = `Analyze the following ${market} charts for the upcoming ${session} session (${region} region).

**Date:** ${dateStr}
**Time:** ${timeStr}
**Market:** ${market}
**Session:** ${session}
**Region:** ${region}

**Charts provided** (in order from highest to lowest timeframe):
${uploadedTimeframes.map((tf, i) => `${i + 1}. ${tf}`).join("\n")}

${additionalNotes ? `**Trader's Notes:** ${additionalNotes}` : ""}

Analyze each chart screenshot in order. Identify market structure, FVGs, liquidity pools, order blocks, and any other ICT/SMC concepts visible. Then synthesize everything into a comprehensive bias report with specific levels and a clear trade plan.`

    const result = await generateText({
      model: openai("gpt-4o"),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...imageContent,
          ],
        },
      ],
      maxOutputTokens: 4096,
    })

    return NextResponse.json({
      analysis: result.text,
      market,
      session,
      region,
      timeframesAnalyzed: uploadedTimeframes,
      generatedAt: now.toISOString(),
    })
  } catch (error: any) {
    console.error("[ANALYZE] Error:", error)

    if (error?.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Check your OPENAI_API_KEY in .env.local." },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Analysis failed. Please try again." },
      { status: 500 }
    )
  }
}
