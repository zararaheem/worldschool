import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNudgeEmail } from '@/lib/google'

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
  const adminEmail = req.headers.get('x-admin-email')
  if (!(await isAdmin(adminEmail))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined

  let query = supabase
    .from('guide_applications')
    .select('id, full_name, email, nudge_count')
    .eq('status', 'draft')
    .not('email', 'is', null)
    .neq('email', '')
  if (ids && ids.length) query = query.in('id', ids)

  const { data: drafts, error } = await query
  if (error) {
    console.error('Nudge fetch error:', error)
    return NextResponse.json({ error: 'Failed to load drafts.' }, { status: 500 })
  }

  const origin = process.env.APP_BASE_URL || req.headers.get('origin') || ''
  if (!origin) return NextResponse.json({ error: 'Cannot determine base URL.' }, { status: 500 })

  const results = await Promise.allSettled(
    (drafts || []).map(async (d) => {
      const resumeUrl = `${origin}/?token=${encodeURIComponent(d.id)}`
      await sendNudgeEmail({ to: d.email, name: d.full_name || '', resumeUrl })
      await supabase
        .from('guide_applications')
        .update({
          last_nudged_at: new Date().toISOString(),
          nudge_count: ((d as { nudge_count?: number }).nudge_count ?? 0) + 1,
        })
        .eq('id', d.id)
      return d.id
    })
  )

  const sent: string[] = []
  const failed: { id: string; email: string; error: string }[] = []
  results.forEach((r, i) => {
    const d = (drafts || [])[i]
    if (r.status === 'fulfilled') sent.push(d.id)
    else failed.push({ id: d.id, email: d.email, error: r.reason instanceof Error ? r.reason.message : String(r.reason) })
  })

  return NextResponse.json({ sent: sent.length, failed: failed.length, failures: failed })
}
