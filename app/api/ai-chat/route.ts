import { NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const CHAT_SYSTEM_PROMPT = `You are an expert trading assistant specializing in ICT (Inner Circle Trader) and Smart Money Concepts. You help traders understand market structure, price action, and trading psychology.

You are knowledgeable about:
- ICT concepts: FVGs, order blocks, breakers, mitigation blocks, liquidity pools, killzones, Judas swings, displacement, BOS/ChoCH
- Market sessions: Asia, London, New York (AM/PM)
- Multi-timeframe analysis: Weekly → Daily → 4H → 1H for bias, 30m/15m for execution zones, 5m/1m for entries
- Risk management, position sizing, and trading psychology
- Macroeconomic events and their impact on markets
- Futures, forex, and indices

Keep answers concise but thorough. Use trading terminology the user would expect. If the user provides analysis context, reference it in your answers.`

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, analysisContext } = body as {
      messages: ChatMessage[]
      analysisContext?: string
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured." },
        { status: 500 }
      )
    }

    // Build system prompt with optional analysis context
    let systemPrompt = CHAT_SYSTEM_PROMPT
    if (analysisContext) {
      systemPrompt += `\n\nThe trader currently has an active analysis report. Here is the context:\n\n${analysisContext}\n\nReference this analysis when answering questions about it.`
    }

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      maxOutputTokens: 1024,
    })

    return NextResponse.json({ reply: result.text })
  } catch (error: any) {
    console.error("[AI-CHAT] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Chat failed. Please try again." },
      { status: 500 }
    )
  }
}
