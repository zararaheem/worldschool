import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req.headers.get('x-admin-email')))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return NextResponse.json({ configured: false })
  return NextResponse.json({
    configured: true,
    url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
  })
}
