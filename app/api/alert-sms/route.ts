import { NextResponse } from "next/server"

// Twilio config (add these to your .env.local)
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER
const adminPhone = process.env.ADMIN_PHONE

export async function POST(req: Request) {
  try {
    if (!accountSid || !authToken || !twilioPhone || !adminPhone) {
      console.warn("[alert-sms] Missing Twilio env vars, skipping SMS")
      return NextResponse.json({ ok: true, skipped: true })
    }

    const body = await req.json()
    const { error, stack, url, timestamp } = body

    const message = `🚨 MGC Platform Error\n${error}\nURL: ${url}\nTime: ${timestamp}`

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: adminPhone,
          From: twilioPhone,
          Body: message,
        }),
      }
    )

    if (!twilioRes.ok) {
      const txt = await twilioRes.text()
      console.error("[alert-sms] Twilio error:", txt)
      return NextResponse.json({ ok: false, error: txt }, { status: 500 })
    }

    console.log("[alert-sms] SMS sent successfully")
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[alert-sms] Unexpected error:", e)
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 })
  }
}
