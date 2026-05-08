import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToDrive } from '@/lib/google'

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const fileName = formData.get('fileName') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const name = fileName || file.name
    const mimeType = file.type || 'application/octet-stream'

    const url = await uploadFileToDrive(buffer, name, mimeType)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Drive upload error:', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
