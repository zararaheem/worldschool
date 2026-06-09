import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { upsertApplicationToSheet } from '@/lib/google'

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

    // Fetch the canonical row (with timestamps) and sync to the Sheet.
    const { data: saved } = await supabase
      .from('guide_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (saved) {
      upsertApplicationToSheet(saved).catch(err => console.error('Sheet upsert failed:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
