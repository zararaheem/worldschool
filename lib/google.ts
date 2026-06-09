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

const SHEET_TAB = 'Sheet1'

// ─── Per-applicant Drive export ───────────────────────────────────────

const FOLDER_MIME = 'application/vnd.google-apps.folder'

function bufferToStream(buf: Buffer): Readable {
  const s = new Readable()
  s.push(buf)
  s.push(null)
  return s
}

function escapeForDriveQuery(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string
): Promise<{ id: string; webViewLink: string }> {
  const safeName = escapeForDriveQuery(name)
  const q = `mimeType = '${FOLDER_MIME}' and name = '${safeName}' and '${parentId}' in parents and trashed = false`
  const existing = await drive.files.list({
    q,
    fields: 'files(id, webViewLink)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  const hit = existing.data.files?.[0]
  if (hit?.id) {
    return { id: hit.id, webViewLink: hit.webViewLink || `https://drive.google.com/drive/folders/${hit.id}` }
  }
  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: 'id, webViewLink',
  })
  if (!created.data.id) throw new Error(`Failed to create Drive folder: ${name}`)
  return {
    id: created.data.id,
    webViewLink: created.data.webViewLink || `https://drive.google.com/drive/folders/${created.data.id}`,
  }
}

async function upsertFileInFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  fileName: string,
  mimeType: string,
  content: Buffer
): Promise<void> {
  const safeName = escapeForDriveQuery(fileName)
  const q = `name = '${safeName}' and '${parentId}' in parents and trashed = false`
  const existing = await drive.files.list({ q, fields: 'files(id)', pageSize: 1 })
  const hit = existing.data.files?.[0]
  if (hit?.id) {
    await drive.files.update({
      fileId: hit.id,
      media: { mimeType, body: bufferToStream(content) },
    })
  } else {
    await drive.files.create({
      requestBody: { name: fileName, parents: [parentId] },
      media: { mimeType, body: bufferToStream(content) },
      fields: 'id',
    })
  }
}

const CSV_HEADERS = [
  'Application ID', 'Status', 'Submitted At', 'Updated At',
  'Full Name', 'Email', 'Phone', 'Role', 'Campus', 'Years at Alpha',
  'Manager', 'Head of School', 'Languages', 'International Travel',
  'Developing World', 'Health', 'Family Obligations', 'Emergency Contact',
  'Build 1 Focus Area', 'Build 1 Link',
  'Build 2 Constraint', 'Build 2 Design', 'Build 2 Video',
  'Build 3 Video', 'Build 4 Language',
  'Ref 1 Name', 'Ref 1 Role', 'Ref 1 Email', 'Ref 1 Phone',
  'Ref 2 Name', 'Ref 2 Role', 'Ref 2 Email', 'Ref 2 Phone',
  'Applicant Signature', 'Admin Notes',
]

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

function csvForApplication(app: Record<string, unknown>): string {
  const row = [
    app.id, app.status, app.created_at, app.updated_at,
    app.full_name, app.email, app.phone, app.role_at_alpha, app.campus, app.years_at_alpha,
    app.direct_manager, app.head_of_school, app.languages_spoken, app.prior_international_travel,
    app.developing_world_experience_yn === 'Yes' ? app.developing_world_experience : app.developing_world_experience_yn,
    app.health_considerations, app.family_obligations, app.emergency_contact,
    app.build1_focus_area, app.build1_link,
    app.build2_constraint, app.build2_design_link, app.build2_video_link,
    app.build3_video_link, app.build4_language_link,
    app.reference1_name, app.reference1_role, app.reference1_email, app.reference1_phone,
    app.reference2_name, app.reference2_role, app.reference2_email, app.reference2_phone,
    app.applicant_name, app.admin_notes,
  ]
  return [CSV_HEADERS.map(csvCell).join(','), row.map(csvCell).join(',')].join('\n')
}

function summaryForApplication(app: Record<string, unknown>): string {
  const linkLine = (label: string, value: unknown) => value ? `- **${label}:** ${value}` : `- **${label}:** _not submitted_`
  return [
    `# ${app.full_name || 'Unnamed applicant'}`,
    `**Application ID:** ${app.id}`,
    `**Status:** ${app.status}`,
    `**Submitted:** ${app.created_at}`,
    `**Last Updated:** ${app.updated_at}`,
    '',
    '## Contact',
    `- **Email:** ${app.email || '—'}`,
    `- **Phone:** ${app.phone || '—'}`,
    `- **Campus:** ${app.campus || '—'}`,
    `- **Role:** ${app.role_at_alpha || '—'}`,
    `- **Languages:** ${app.languages_spoken || '—'}`,
    '',
    '## Builds',
    linkLine(`Build 1${app.build1_focus_area ? ` (${app.build1_focus_area})` : ''}`, app.build1_link),
    linkLine(`Build 2 Design${app.build2_constraint ? ` (${app.build2_constraint})` : ''}`, app.build2_design_link),
    linkLine('Build 2 Video', app.build2_video_link),
    linkLine('Build 3 Video', app.build3_video_link),
    linkLine('Build 4 Language', app.build4_language_link),
    '',
    '## References',
    `- **Ref 1:** ${app.reference1_name || '—'}${app.reference1_role ? ` (${app.reference1_role})` : ''} — ${app.reference1_email || '—'}`,
    `- **Ref 2:** ${app.reference2_name || '—'}${app.reference2_role ? ` (${app.reference2_role})` : ''} — ${app.reference2_email || '—'}`,
    '',
    '## Admin Notes',
    String(app.admin_notes || '_(none)_'),
    '',
  ].join('\n')
}

function folderNameFor(app: Record<string, unknown>): string {
  const name = String(app.full_name || 'Unnamed').trim() || 'Unnamed'
  const shortId = String(app.id || '').slice(0, 8)
  return `${name} — ${shortId}`
}

export async function exportApplicationsToDrive(apps: Record<string, unknown>[]): Promise<{
  exported: number
  parentFolderUrl: string
  failures: { id: string; name: string; error: string }[]
}> {
  const parent = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!parent) throw new Error('Missing GOOGLE_DRIVE_FOLDER_ID.')

  const drive = google.drive({ version: 'v3', auth: getAuth() })
  const failures: { id: string; name: string; error: string }[] = []
  let exported = 0

  for (const app of apps) {
    try {
      const folder = await findOrCreateFolder(drive, parent, folderNameFor(app))
      await upsertFileInFolder(drive, folder.id, 'application.csv', 'text/csv', Buffer.from(csvForApplication(app), 'utf-8'))
      await upsertFileInFolder(drive, folder.id, 'summary.md', 'text/markdown', Buffer.from(summaryForApplication(app), 'utf-8'))
      exported++
    } catch (err) {
      failures.push({
        id: String(app.id || ''),
        name: String(app.full_name || ''),
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    exported,
    parentFolderUrl: `https://drive.google.com/drive/folders/${parent}`,
    failures,
  }
}

const SHEET_HEADERS = [
  'Application ID', 'Status', 'Submitted At', 'Last Updated',
  'Full Name', 'Email', 'Phone', 'Role', 'Campus', 'Years at Alpha',
  'Manager', 'Head of School', 'Languages', 'International Travel',
  'Developing World', 'Health', 'Family Obligations', 'Emergency Contact',
  'Build 1 Focus Area', 'Build 1 Link',
  'Build 2 Constraint', 'Build 2 Design', 'Build 2 Video',
  'Build 3 Video', 'Build 4 Language',
  'Ref 1 Name', 'Ref 1 Role', 'Ref 1 Email', 'Ref 1 Phone',
  'Ref 2 Name', 'Ref 2 Role', 'Ref 2 Email', 'Ref 2 Phone',
  'Applicant Signature', 'Admin Notes',
]

function rowFor(app: Record<string, unknown>): (string | number | null)[] {
  return [
    String(app.id ?? ''),
    String(app.status ?? ''),
    String(app.created_at ?? new Date().toISOString()),
    String(app.updated_at ?? new Date().toISOString()),
    app.full_name as string, app.email as string, app.phone as string,
    app.role_at_alpha as string, app.campus as string, app.years_at_alpha as string,
    app.direct_manager as string, app.head_of_school as string, app.languages_spoken as string,
    app.prior_international_travel as string,
    (app.developing_world_experience_yn === 'Yes' ? app.developing_world_experience : app.developing_world_experience_yn) as string,
    app.health_considerations as string, app.family_obligations as string, app.emergency_contact as string,
    app.build1_focus_area as string, app.build1_link as string,
    app.build2_constraint as string, app.build2_design_link as string, app.build2_video_link as string,
    app.build3_video_link as string, app.build4_language_link as string,
    app.reference1_name as string, app.reference1_role as string, app.reference1_email as string, app.reference1_phone as string,
    app.reference2_name as string, app.reference2_role as string, app.reference2_email as string, app.reference2_phone as string,
    app.applicant_name as string, (app.admin_notes as string) || '',
  ].map(v => v == null ? '' : v)
}

async function ensureHeader(sheets: ReturnType<typeof google.sheets>, sheetId: string) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_TAB}!1:1`,
  })
  const current = existing.data.values?.[0] || []
  const matches = current.length === SHEET_HEADERS.length && SHEET_HEADERS.every((h, i) => current[i] === h)
  if (!matches) {
    // Migrating to a new schema — clear any old data rows so old-format rows
    // don't sit alongside new ones in misaligned columns. The DB is the source
    // of truth; a Resync rebuilds everything.
    if (current.length > 0) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: `${SHEET_TAB}!A2:ZZ`,
      })
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [SHEET_HEADERS] },
    })
  }
}

async function findRowByAppId(sheets: ReturnType<typeof google.sheets>, sheetId: string, appId: string): Promise<number | null> {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_TAB}!A2:A`,
  })
  const ids = resp.data.values?.map(r => r[0]) || []
  const idx = ids.findIndex(v => v === appId)
  return idx === -1 ? null : idx + 2 // sheet rows are 1-indexed; +1 for header
}

export async function upsertApplicationToSheet(app: Record<string, unknown>): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return
  if (!app.id) throw new Error('upsertApplicationToSheet: missing app.id')

  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  await ensureHeader(sheets, sheetId)

  const row = rowFor(app)
  const rowNumber = await findRowByAppId(sheets, sheetId, String(app.id))

  if (rowNumber) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_TAB}!A${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })
  }
}

export async function bulkSyncApplicationsToSheet(apps: Record<string, unknown>[]): Promise<{ written: number }> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID env var.')

  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  await ensureHeader(sheets, sheetId)

  // Wipe data rows (keep header)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `${SHEET_TAB}!A2:ZZ`,
  })

  if (apps.length === 0) return { written: 0 }

  const rows = apps.map(rowFor)
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })
  return { written: rows.length }
}
