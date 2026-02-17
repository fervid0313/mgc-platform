import { NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

// Market-specific RSS feeds
const RSS_FEEDS: Record<string, string[]> = {
  NQ100: [
    "https://news.google.com/rss/search?q=Nasdaq+stock+market+futures&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search=q=NASDAQ+100+index+news&hl=en-US&gl=US&ceid=US:en"
  ],
  ES: [
    "https://news.google.com/rss/search?q=S%26P+500+futures+trading&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=ES+mini+futures+news&hl=en-US&gl=US&ceid=US:en"
  ],
  Gold: [
    "https://news.google.com/rss/search?q=gold+price+trading+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=XAU+USD+market+analysis&hl=en-US&gl=US&ceid=US:en"
  ],
  Silver: [
    "https://news.google.com/rss/search?q=silver+price+trading&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=XAG+USD+news&hl=en-US&gl=US&ceid=US:en"
  ],
  BTC: [
    "https://news.google.com/rss/search?q=bitcoin+BTC+price+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=cryptocurrency+bitcoin+trading&hl=en-US&gl=US&ceid=US:en"
  ],
  Oil: [
    "https://news.google.com/rss/search?q=crude+oil+price+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=WTI+oil+futures+trading&hl=en-US&gl=US&ceid=US:en"
  ],
  DXY: [
    "https://news.google.com/rss/search?q=US+dollar+index+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=DXY+dollar+strength&hl=en-US&gl=US&ceid=US:en"
  ],
  VIX: [
    "https://news.google.com/rss/search?q=VIX+volatility+index+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=market+fear+index+VIX&hl=en-US&gl=US&ceid=US:en"
  ],
  US10Y: [
    "https://news.google.com/rss/search?q=10+year+Treasury+yield+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=bond+yields+Treasury+10Y&hl=en-US&gl=US&ceid=US:en"
  ]
}

const SYSTEM_PROMPT = `You are an expert market analyst specializing in sentiment analysis. Analyze the provided news headlines and determine the overall market sentiment.

ANALYSIS FRAMEWORK:
1. **Overall Sentiment**: bullish, bearish, or neutral based on news tone
2. **Sentiment Score**: -100 (extremely bearish) to +100 (extremely bullish)
3. **Key Themes**: Extract 3-5 major themes/topics from the news
4. **Summary**: Brief 2-3 sentence summary of the market narrative

OUTPUT FORMAT:
Return a JSON object with:
{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": <number -100 to 100>,
  "summary": "<brief summary>",
  "keyThemes": ["<theme1>", "<theme2>", "<theme3>"]
}

IMPORTANT: Return ONLY the JSON. No markdown, no code blocks, no explanations outside the JSON.`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const market = searchParams.get("market") || "NQ100"

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Fetch news headlines
    const feeds = RSS_FEEDS[market] || RSS_FEEDS.NQ100
    const headlines: string[] = []

    for (const feed of feeds) {
      try {
        const response = await fetch(feed, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketBot/1.0)' }
        })
        if (response.ok) {
          const text = await response.text()
          // Simple regex to extract titles from RSS
          const titleMatches = text.match(/<title>(.*?)<\/title>/g) || []
          const titles = titleMatches
            .map(match => match.replace(/<\/?title>/g, ''))
            .filter(title => title && !title.includes('RSS') && title.length > 10)
            .slice(0, 5) // Take first 5 titles per feed
          headlines.push(...titles)
        }
      } catch (error) {
        console.error(`Failed to fetch feed ${feed}:`, error)
      }
    }

    if (headlines.length === 0) {
      return NextResponse.json({ 
        error: "No news data available" 
      }, { status: 404 })
    }

    // Analyze sentiment with AI
    const userPrompt = `Analyze the market sentiment for ${market} based on these recent news headlines:

${headlines.slice(0, 20).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Focus on:
- Overall market direction indicated by the news
- Key themes and topics driving market sentiment
- Confidence level in the sentiment assessment
- Any notable shifts in market narrative

Provide a concise sentiment analysis with a clear directional bias.`

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      maxOutputTokens: 500,
      temperature: 0.3,
    })

    let sentiment
    try {
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      sentiment = JSON.parse(cleaned)
    } catch (parseError) {
      console.error("[MARKET-NEWS] Failed to parse AI response:", result.text)
      return NextResponse.json({ error: "Failed to analyze sentiment" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sentiment,
      market,
      headlines: headlines.slice(0, 10), // Return some headlines for reference
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[MARKET-NEWS] Error:", error)
    return NextResponse.json({ 
      error: error?.message || "Failed to fetch market news" 
    }, { status: 500 })
  }
}
