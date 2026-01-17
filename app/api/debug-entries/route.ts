import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Check if entries table exists and has data
    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('count')
      .limit(1)

    // Check actual entries
    const { data: actualEntries, error: actualError } = await supabase
      .from('entries')
      .select('id, content, pnl, image, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'entries')
      .order('ordinal_position')

    return NextResponse.json({
      success: true,
      entries_table: {
        exists: !entriesError,
        count: entriesData?.[0]?.count || 0,
        error: entriesError?.message
      },
      actual_entries: {
        count: actualEntries?.length || 0,
        sample: actualEntries?.map(e => ({
          id: e.id,
          has_content: !!e.content,
          content_preview: e.content ? e.content.substring(0, 50) + '...' : 'No content',
          has_pnl: e.pnl !== null,
          pnl_value: e.pnl,
          has_image: !!e.image,
          created_at: e.created_at
        })) || []
      },
      table_structure: tableInfo || [],
      errors: {
        entries: entriesError?.message,
        actual: actualError?.message,
        table: tableError?.message
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
