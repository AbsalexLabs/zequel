# Deployment Instructions - Document & Profile Fixes

## Step-by-Step Deployment

### Step 1: Update Database Schema
This is the **critical first step** that must be done before anything else.

1. Go to your Supabase project: https://app.supabase.com
2. Open the SQL Editor
3. Click "New Query"
4. Open the file: `scripts/003_add_missing_columns.sql` from your project
5. Copy the entire SQL content
6. Paste into the Supabase SQL Editor
7. Click the **Run** button (or press Ctrl+Enter)
8. Wait for the query to complete successfully

**What This Does**:
- Adds `username`, `full_name`, `avatar_url` columns to `profiles` table
- Adds `extracted_text` column to `documents` table  
- Creates database indexes for better performance
- Ensures RLS policies are properly configured

### Step 2: Deploy Application Code
After the database migration completes:

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: Add document viewer and profile preview"
   git push origin [branch-name]
   ```

2. Vercel will automatically redeploy your application

### Step 3: Test the Features

**Test Document Upload & Viewing**:
1. Navigate to the workspace
2. Click "Upload Document" to upload a PDF
3. Wait for the document status to show "Parsed"
4. Click on the document row to open the viewer
5. Verify you can see the extracted text
6. Try the "Copy Text" button

**Test Profile Updates**:
1. Go to Settings → Profile tab
2. Upload a profile picture by clicking the avatar
3. Type a username (e.g., "john_doe")
4. Type a full name (e.g., "John Doe")
5. Verify the preview updates in real-time
6. Click "Save Changes"
7. Refresh the page and verify changes persist
8. Check that your profile appears in the document panel sidebar

**Test AI Document Access**:
1. Upload a document and wait for parsing
2. Create a new conversation
3. Select the document by clicking the checkbox
4. Type a message asking about the document
5. Verify the AI can access and reference the document content

## Troubleshooting

### Issue: "Column does not exist" error
**Solution**: The database migration didn't run. Make sure to run the SQL from step 1 first.

### Issue: Avatar not uploading
**Solution**: 
1. Check that Supabase storage bucket "avatars" exists
2. Verify storage RLS policies allow authenticated users to upload
3. Try with a smaller image file (< 2MB)

### Issue: Document text not showing
**Solution**:
1. Check document status - it must be "Parsed"
2. Verify the document was fully uploaded before clicking view
3. Check the browser console for any errors
4. Re-upload the document if extraction failed

### Issue: Profile changes not saving
**Solution**:
1. Verify you're logged in
2. Check for validation errors (red text below fields)
3. Check browser console for API errors
4. Ensure internet connection is stable

## Monitoring

After deployment, monitor these items:

1. **Storage Usage**: Check Supabase storage dashboard for avatar uploads
2. **Database Performance**: Monitor extracted_text column for large documents
3. **Error Logs**: Check browser console and Supabase logs for any issues
4. **User Feedback**: Document issues users report

## Rollback Instructions (If Needed)

If you need to rollback the changes:

1. Revert the database migration by running:
```sql
-- Drop new columns (data will be lost)
ALTER TABLE public.documents DROP COLUMN IF EXISTS extracted_text;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS username;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
```

2. Redeploy the previous version of the application

## Performance Considerations

- **Document Viewer**: Text is loaded on-demand (doesn't impact initial page load)
- **Profile Preview**: Updates happen locally (no API calls until save)
- **Indexes**: Created for faster username lookups and document searches
- **Storage**: Avatars are stored separately from database (optimal for scaling)

## Future Enhancements

Consider implementing these features in the future:

1. **Full-Text Search**: Use the extracted_text index for document search
2. **Document Thumbnails**: Generate and cache PDF thumbnails
3. **Profile Analytics**: Track profile view counts and engagement
4. **Batch Processing**: Process multiple documents in parallel
5. **Document Versioning**: Store document edit history
