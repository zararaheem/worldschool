import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { upsertApplicationToSheet } from '@/lib/google'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const HARDCODED_ADMINS = [
  'tasha.arnold@alpha.school',
  'emily.lopez@alpha.school',
  'zara.raheem@alpha.school',
  'liam.stanton@alpha.school',
]

async function isAdmin(email: string | null): Promise<boolean> {
  if (!email) return false
  const e = email.toLowerCase().trim()
  if (HARDCODED_ADMINS.includes(e)) return true
  const { data } = await supabase.from('form_config').select('config').eq('id', 'admin_users').single()
  const emails: string[] = (data?.config as { emails?: string[] } | null)?.emails ?? []
  return emails.map(x => x.toLowerCase()).includes(e)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req.headers.get('x-admin-email')))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  if (!process.env.GOOGLE_SHEET_ID) {
    return NextResponse.json({ error: 'GOOGLE_SHEET_ID is not configured.' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const id = body?.id as string | undefined
  if (!id) return NextResponse.json({ error: 'Missing application id.' }, { status: 400 })

  const { data: app, error } = await supabase
    .from('guide_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !app) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
  }
  if (app.status === 'draft') {
    return NextResponse.json({ ok: true, skipped: 'draft' })
  }

  try {
    await upsertApplicationToSheet(app)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Sheet upsert failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sheet upsert failed.' }, { status: 500 })
  }
}
