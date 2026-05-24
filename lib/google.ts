import { google } from 'googleapis'
import { Readable } from 'stream'

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Missing Google service account credentials.')
  const jwt = new google.auth.JWT()
  jwt.fromJSON({ type: 'service_account', client_email: email, private_key: key })
  jwt.scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
  return jwt
}

function getGmailAuth(impersonate: string) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Missing Google service account credentials.')
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: impersonate,
  })
}

function encodeRfc822Base64Url(message: string): string {
  return Buffer.from(message, 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildMimeMessage({ from, to, subject, text, html }: {
  from: string; to: string; subject: string; text: string; html: string
}): string {
  const boundary = `boundary_${Date.now().toString(36)}`
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
  ].join('\r\n')
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return `${headers}\r\n${body}`
}

export async function sendNudgeEmail({ to, name, resumeUrl }: {
  to: string; name: string; resumeUrl: string
}): Promise<void> {
  const sendAs = process.env.GMAIL_SEND_AS
  if (!sendAs) throw new Error('Missing GMAIL_SEND_AS env var.')

  const firstName = (name || '').trim().split(/\s+/)[0] || 'there'
  const subject = 'A quick nudge on your Alpha World School guide application'
  const text = [
    `Hi ${firstName},`,
    '',
    "We noticed you started your Alpha World School guide application but haven't finished it yet. Your builds are the heart of the application — we'd love to see what you make.",
    '',
    `Pick up where you left off: ${resumeUrl}`,
    '',
    "Applications are reviewed on a rolling basis — we'd love yours by June 1, 2026.",
    '',
    'Questions? Just reply to this email, or write us at worldschool@alpha.school.',
    '',
    '— The Alpha World School team',
  ].join('\n')
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;">
    <p>Hi ${firstName},</p>
    <p>We noticed you started your Alpha World School guide application but haven't finished it yet. Your builds are the heart of the application — we'd love to see what you make.</p>
    <p style="margin:24px 0;"><a href="${resumeUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-weight:700;">Pick up where you left off</a></p>
    <p style="color:#4b5563;font-size:14px;">Or paste this link in your browser: <a href="${resumeUrl}">${resumeUrl}</a></p>
    <p>Applications are reviewed on a rolling basis — we'd love yours by <strong>June 1, 2026</strong>.</p>
    <p style="color:#4b5563;font-size:14px;">Questions? Just reply to this email, or write us at <a href="mailto:worldschool@alpha.school">worldschool@alpha.school</a>.</p>
    <p style="color:#6b7280;font-size:13px;margin-top:32px;">— The Alpha World School team</p>
  </body></html>`

  const raw = encodeRfc822Base64Url(buildMimeMessage({ from: sendAs, to, subject, text, html }))
  const gmail = google.gmail({ version: 'v1', auth: getGmailAuth(sendAs) })
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) throw new Error('Missing GOOGLE_DRIVE_FOLDER_ID.')

  const drive = google.drive({ version: 'v3', auth: getAuth() })

  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
  })

  // Make file readable by anyone with the link
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`
}

export async function appendSubmissionToSheet(form: Record<string, unknown>): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return

  const sheets = google.sheets({ version: 'v4', auth: getAuth() })

  // Ensure header row exists
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1:A1',
  })

  if (!existing.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Submitted At', 'Full Name', 'Email', 'Phone', 'Role', 'Campus', 'Years at Alpha',
          'Manager', 'Head of School', 'Languages', 'International Travel',
          'Developing World', 'Health', 'Family Obligations', 'Emergency Contact',
          'Build 1 Focus Area', 'Build 1 Link',
          'Build 2 Constraint', 'Build 2 Design', 'Build 2 Video',
          'Build 3 Video', 'Build 4 Language',
          'Ref 1 Name', 'Ref 1 Role', 'Ref 1 Email', 'Ref 1 Phone',
          'Ref 2 Name', 'Ref 2 Role', 'Ref 2 Email', 'Ref 2 Phone',
          'Applicant Signature',
        ]],
      },
    })
  }

  const row = [
    new Date().toISOString(),
    form.full_name, form.email, form.phone, form.role_at_alpha, form.campus, form.years_at_alpha,
    form.direct_manager, form.head_of_school, form.languages_spoken,
    form.prior_international_travel,
    form.developing_world_experience_yn === 'Yes' ? form.developing_world_experience : form.developing_world_experience_yn,
    form.health_considerations, form.family_obligations, form.emergency_contact,
    form.build1_focus_area, form.build1_link,
    form.build2_constraint, form.build2_design_link, form.build2_video_link,
    form.build3_video_link, form.build4_language_link,
    form.reference1_name, form.reference1_role, form.reference1_email, form.reference1_phone,
    form.reference2_name, form.reference2_role, form.reference2_email, form.reference2_phone,
    form.applicant_name,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}
