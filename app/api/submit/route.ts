import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { appendSubmissionToSheet } from '@/lib/google'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...formData } = body

    if (!id) return NextResponse.json({ error: 'Missing application ID.' }, { status: 400 })

    const { error } = await supabase
      .from('guide_applications')
      .upsert({ id, ...formData, status: 'submitted', draft_step: null }, { onConflict: 'id' })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to save application.' }, { status: 500 })
    }

    // Log to Google Sheet (non-blocking — don't fail submission if Sheet write fails)
    appendSubmissionToSheet(formData).catch(err => console.error('Sheet append failed:', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
