import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NOTIFY_EMAIL = 'zara.raheem@alpha.school'
const FROM_EMAIL   = 'applications@alphaworldschool.com'
const RESEND_KEY   = process.env.RESEND_API_KEY

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) {
    console.warn('[submit] RESEND_API_KEY not set — skipping email')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const txt = await res.text()
    console.error('[submit] Resend error:', res.status, txt)
  }
}

function buildAdminEmail(data: Record<string, unknown>) {
  const name   = (data.full_name as string) || 'Unknown'
  const email  = (data.email as string) || '—'
  const campus = (data.campus as string) || '—'
  const role   = (data.role_at_alpha as string) || '—'

  const builds = [
    ['Build 1 — Workshop Sprint', data.build1_link],
    ['Build 2 — Cohort Experience (design)', data.build2_design_link],
    ['Build 2 — Cohort Experience (video)', data.build2_video_link],
    ['Build 3 — The Video', data.build3_video_link],
    ['Build 4 — Language Tape (optional)', data.build4_language_link],
  ]

  const refs = [
    { n: 1, name: data.reference1_name, role: data.reference1_role, email: data.reference1_email },
    { n: 2, name: data.reference2_name, role: data.reference2_role, email: data.reference2_email },
  ]

  const acksMap = [
    'This is a job, not a vacation.',
    'Primary 24/7 caretaker for 5–7 students.',
    'Away for two international + one U.S. rotation.',
    "Upholding Alpha's three commitments in the field.",
    'Holding students AND self to high standards.',
    'First responder when things go wrong.',
    'Representing Alpha to communities and partners.',
    'Manager and HoS are aware of application.',
  ]

  const yesNo = (yn: unknown, detail: unknown) =>
    yn === 'Yes' ? `Yes — ${detail || '(no detail)'}` : yn || '—'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 24px; }
  .card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; max-width: 680px; margin: 0 auto; overflow: hidden; }
  .header { background: #0f172a; padding: 24px 32px; }
  .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
  .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px; }
  .badge { display: inline-block; background: #3b82f6; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 12px; }
  .body { padding: 28px 32px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
  .field span { font-size: 14px; color: #111827; }
  .full { grid-column: 1/-1; }
  .build { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
  .build.done { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .build.miss { background: #fef2f2; border: 1px solid #fecaca; }
  .build .dot { width: 8px; height: 8px; border-radius: 99px; flex-shrink: 0; }
  .build.done .dot { background: #22c55e; }
  .build.miss .dot { background: #ef4444; }
  .build label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .build a { font-size: 13px; color: #3b82f6; text-decoration: none; display: block; word-break: break-all; }
  .build span.miss { font-size: 13px; color: #9ca3af; font-style: italic; }
  .ref-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
  .ref-card strong { font-size: 14px; color: #111827; display: block; }
  .ref-card small { font-size: 12px; color: #6b7280; }
  .ack { display: flex; gap: 8px; align-items: flex-start; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 13px; }
  .ack.yes { background: #f0fdf4; color: #166534; }
  .ack.no  { background: #fef2f2; color: #991b1b; }
  .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; font-size: 12px; color: #9ca3af; }
</style></head>
<body>
<div class="card">
  <div class="header">
    <h1>New Guide Application</h1>
    <p>Alpha World School · Inaugural Cohort 2026–27</p>
    <span class="badge">New Submission</span>
  </div>
  <div class="body">

    <div class="section">
      <div class="section-title">Applicant</div>
      <div class="grid">
        <div class="field"><label>Full Name</label><span>${name}</span></div>
        <div class="field"><label>Email</label><span>${email}</span></div>
        <div class="field"><label>Campus</label><span>${campus}</span></div>
        <div class="field"><label>Role at Alpha</label><span>${role}</span></div>
        <div class="field"><label>Years at Alpha</label><span>${data.years_at_alpha || '—'}</span></div>
        <div class="field"><label>Phone</label><span>${data.phone || '—'}</span></div>
        <div class="field"><label>Direct Manager</label><span>${data.direct_manager || '—'}</span></div>
        <div class="field"><label>Dean of Parents / HoS</label><span>${data.head_of_school || '—'}</span></div>
        <div class="field full"><label>Languages Spoken</label><span>${data.languages_spoken || '—'}</span></div>
        <div class="field full"><label>International Travel</label><span>${yesNo(data.prior_international_travel_yn, data.prior_international_travel)}</span></div>
        <div class="field full"><label>Developing-World Experience</label><span>${yesNo(data.developing_world_experience_yn, data.developing_world_experience)}</span></div>
        <div class="field full"><label>Health Considerations</label><span>${yesNo(data.health_considerations_yn, data.health_considerations)}</span></div>
        <div class="field full"><label>Family Obligations</label><span>${yesNo(data.family_obligations_yn, data.family_obligations)}</span></div>
        <div class="field full"><label>Emergency Contact</label><span>${data.emergency_contact || '—'}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Builds</div>
      ${builds.map(([label, link]) => `
        <div class="build ${link ? 'done' : 'miss'}">
          <span class="dot"></span>
          <div>
            <label>${label}</label>
            ${link ? `<a href="${link}">${link}</a>` : `<span class="miss">Not submitted</span>`}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <div class="section-title">References</div>
      ${refs.map(r => `
        <div class="ref-card">
          <strong>Reference ${r.n}: ${r.name || 'Not filled'}</strong>
          <small>${r.role || ''} ${r.email ? `· <a href="mailto:${r.email}">${r.email}</a>` : ''}</small>
        </div>
      `).join('')}
      <div class="field" style="margin-top:10px"><label>Manager Endorsement</label><span>${data.manager_endorsement_status || '—'}</span></div>
      ${data.manager_endorsement_text ? `<div class="field" style="margin-top:8px"><label>Endorsement note</label><span>${data.manager_endorsement_text}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Acknowledgments</div>
      ${acksMap.map((txt, i) => {
        const checked = Boolean(data[`ack_${i+1}`])
        return `<div class="ack ${checked ? 'yes' : 'no'}">${checked ? '✓' : '✗'} ${txt}</div>`
      }).join('')}
      <div class="field" style="margin-top:12px"><label>Signature</label><span>${data.applicant_name || '—'}</span></div>
    </div>

  </div>
  <div class="footer">
    Submitted ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })} ·
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://worldschool-ten.vercel.app'}/admin" style="color:#3b82f6">Open Admin Panel</a>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const id = body.id as string
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Upsert to Supabase
  const { error: dbError } = await supabase
    .from('guide_applications')
    .upsert({ ...body, status: 'submitted' }, { onConflict: 'id' })

  if (dbError) {
    console.error('[submit] Supabase error:', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Send notification email to Zara
  const subject = `New Guide Application — ${(body.full_name as string) || 'Unknown'} · ${(body.campus as string) || 'Unknown campus'}`
  await sendEmail(NOTIFY_EMAIL, subject, buildAdminEmail(body))

  return NextResponse.json({ ok: true })
}
