import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exportApplicationsToDrive } from '@/lib/google'

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

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req.headers.get('x-admin-email')))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return NextResponse.json({ error: 'GOOGLE_DRIVE_FOLDER_ID is not configured.' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined

  let query = supabase
    .from('guide_applications')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: true })
  if (ids && ids.length) query = query.in('id', ids)

  const { data: apps, error } = await query
  if (error) {
    console.error('Drive export fetch error:', error)
    return NextResponse.json({ error: 'Failed to load applications.' }, { status: 500 })
  }

  try {
    const result = await exportApplicationsToDrive(apps || [])
    return NextResponse.json(result)
  } catch (err) {
    console.error('Drive export failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Drive export failed.' }, { status: 500 })
  }
}
