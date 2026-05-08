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
