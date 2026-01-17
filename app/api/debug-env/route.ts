import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    supabaseUrl: {
      exists: !!supabaseUrl,
      value: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : null,
      isValidUrl: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co')
    },
    supabaseKey: {
      exists: !!supabaseKey,
      length: supabaseKey?.length || 0,
      startsWith: supabaseKey?.substring(0, 10) + "..."
    },
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })
}