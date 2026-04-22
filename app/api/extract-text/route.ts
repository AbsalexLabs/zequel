import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processAIRequest } from '@/lib/ai/model-service'
import { getSystemSettings, isFileUploadsEnabled, getMaxFileSize } from '@/lib/settings/system-settings'
// @ts-expect-error - pdf-parse has no types
import pdfParse from 'pdf-parse'

// Allowed file types
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, filePath } = body

    // Check if file uploads are enabled (from system settings)
    const uploadsEnabled = await isFileUploadsEnabled()
    if (!uploadsEnabled) {
      return NextResponse.json({ 
        error: 'File uploads are temporarily disabled. Please try again later.' 
      }, { status: 503 })
    }

    // Process through security layer (auth only for extract - validation is simpler)
    const authResult = await processAIRequest('extract', body, { skipValidation: true })
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
    }

    const { user } = authResult.data as { user: { id: string } }

    if (!documentId || !filePath) {
      return NextResponse.json({ error: 'Missing documentId or filePath' }, { status: 400 })
    }

    // Validate file extension
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ 
        error: 'File type not allowed. Only PDF, TXT, and MD files are supported.' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Check file size (from system settings)
    const maxFileSize = await getMaxFileSize()
    if (fileData.size > maxFileSize) {
      const settings = await getSystemSettings()
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${settings.max_file_size_mb}MB.` 
      }, { status: 400 })
    }

    let extractedText = ''
    let pageCount = 0

    // Extract text based on file type
    if (ext === '.pdf') {
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const parsed = await pdfParse(buffer)
      extractedText = parsed.text?.trim() || ''
      pageCount = parsed.numpages || 0
    } else {
      // Plain text or markdown
      extractedText = await fileData.text()
      pageCount = 1
    }

    // Update the document record
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extractedText,
        page_count: pageCount,
        status: extractedText ? 'parsed' : 'error',
      })
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pageCount,
      textLength: extractedText.length,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 })
  }
}
