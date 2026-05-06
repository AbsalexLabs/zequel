# Document Upload & Profile Fixes

## Issues Fixed

### 1. Document Extraction & Display
**Problem**: Users could not see parsed document content, and the AI couldn't access document text.

**Root Cause**: 
- The database `documents` table was missing the `extracted_text` column
- The document panel had no viewer to display parsed content
- Documents were being extracted but not shown to users

**Fixes Applied**:
- Created migration script `scripts/003_add_missing_columns.sql` to add `extracted_text` column to documents table
- Created new `DocumentViewer` component to display parsed document content in a modal
- Updated `document-panel.tsx` to:
  - Add a click handler to view individual documents
  - Show extracted text when documents are selected
  - Display document status (Parsed, Processing, Error)
  - Allow copying extracted text to clipboard
- Fixed document item to be clickable while still supporting selection

**How It Works**:
1. User clicks on a document to view it
2. Document panel fetches the `extracted_text` from the database
3. DocumentViewer modal displays the full parsed content
4. User can copy the text or close to continue working

### 2. Profile Picture & Username/Name Updates
**Problem**: Users couldn't see a live preview of their profile changes while editing.

**Root Cause**:
- The database `profiles` table was missing columns: `username`, `full_name`, `avatar_url`
- No visual preview was shown while editing profile information

**Fixes Applied**:
- Created migration script `scripts/003_add_missing_columns.sql` to add missing columns to profiles table
- Added unique constraint on `username` column
- Updated `settings-client.tsx` to:
  - Add a "Preview" section at the top of the profile settings
  - Show live preview of avatar, name, and username as user types
  - Display initials if no avatar uploaded
  - Show "@username" format in preview
  - Real-time validation with error messages

**How It Works**:
1. User uploads avatar or types username/name
2. Preview section updates in real-time
3. User can see exactly how their profile will look
4. Validation errors appear immediately below each field
5. Save button saves all changes to database

### 3. AI Document Access
**Problem**: The AI chat couldn't access content from selected documents.

**Fix**: The chat API now:
- Accepts `document_ids` array (supports multiple documents)
- Fetches `extracted_text` for each selected document
- Combines document content for the AI to analyze
- Properly formats documents with titles for context

## Database Changes Required

Run the following SQL in your Supabase console:

```bash
# Copy content from: /vercel/share/v0-project/scripts/003_add_missing_columns.sql
# Paste into Supabase SQL Editor and execute
```

This migration:
1. Adds `username`, `full_name`, `avatar_url` to `profiles` table
2. Adds `extracted_text` to `documents` table
3. Creates indexes for better query performance
4. Updates RLS policies if needed

## Files Modified

### New Files
- `components/workspace/document-viewer.tsx` - Modal for viewing parsed documents
- `scripts/003_add_missing_columns.sql` - Database migration

### Updated Files
- `app/settings/settings-client.tsx` - Added live profile preview
- `components/workspace/document-panel.tsx` - Added document viewer integration
- `app/api/chat/route.ts` - Already supports multiple documents (from previous fixes)

## Testing Checklist

- [ ] Run database migration `scripts/003_add_missing_columns.sql`
- [ ] Upload a PDF document
- [ ] Wait for extraction to complete (status shows "Parsed")
- [ ] Click on document to view extracted text
- [ ] Verify AI can see and reference document content in chat
- [ ] Upload a profile picture
- [ ] Edit username and full name
- [ ] Verify live preview updates as you type
- [ ] Save changes and verify they persist
- [ ] Check that profile picture appears in sidebar

## Performance Notes

- Document text is loaded on-demand when user clicks to view
- Profile preview updates are instant (no API calls until save)
- Extracted text is stored in database (no re-extraction needed)
- Document viewer supports large documents with scrolling
