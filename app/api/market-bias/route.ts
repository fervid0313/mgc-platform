import { NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const BIAS_PROMPT = `You are a macro market analyst. Given the current market data below, determine a directional BIAS for each instrument for the upcoming trading session.

Use the following to determine bias for EACH instrument:
- **Price action**: Is it up or down today? How significant is the move?
- **Correlations**: How do correlated instruments confirm or contradict? (e.g., DXY up = bearish for gold/indices, bonds down = yields up = potentially bearish for equities, BTC risk-on/risk-off signal)
- **Macro context**: Based on the current market environment, interest rate regime, and recent trends
- **Intermarket analysis**: Bonds, yields, gold, and equities relationships

For each instrument, respond with EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
[
  { "label": "NQ100", "bias": "bullish", "confidence": 72, "reason": "one short sentence" },
  { "label": "ES", "bias": "bearish", "confidence": 65, "reason": "one short sentence" },
  ...
]

Valid bias values: "bullish", "bearish", "neutral"
Confidence: 50-95 (be realistic, never 100)
Reason: MAX 10 words

IMPORTANT: Return ONLY the JSON array. No other text.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { marketData } = body

    if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
      return NextResponse.json({ error: "Market data required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const marketSummary = marketData
      .map((m: any) => `${m.label}: $${m.price} (${m.change >= 0 ? "+" : ""}${m.changePercent.toFixed(2)}%)`)
      .join("\n")

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: BIAS_PROMPT },
        {
          role: "user",
          content: `Current market data:\n${marketSummary}\n\nProvide bias predictions for each instrument.`,
        },
      ],
      maxOutputTokens: 512,
    })

    // Parse the JSON response
    let biases
    try {
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      biases = JSON.parse(cleaned)
    } catch {
      console.error("[MARKET-BIAS] Failed to parse response:", result.text)
      return NextResponse.json({ error: "Failed to parse bias predictions" }, { status: 500 })
    }

    return NextResponse.json({
      biases,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[MARKET-BIAS] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Bias prediction failed" },
      { status: 500 }
    )
  }
}
