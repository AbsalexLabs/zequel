# Quick Start - Document & Profile Fixes

## ⚡ 30-Second Summary

Two features are now fully working:
1. **View Parsed Documents** - Click any uploaded PDF to see extracted text
2. **Live Profile Preview** - See exactly how your profile looks while editing

## 🚀 What You Need To Do

### Step 1: Database (Required First!)
Go to Supabase → SQL Editor → Copy & paste from `scripts/003_add_missing_columns.sql` → Click Run

### Step 2: Push Code
```bash
git add .
git commit -m "fix: Add document viewer and profile preview"
git push
```

### Step 3: Test

**Documents**:
- Upload a PDF
- Wait for "Parsed" status
- Click the document row
- See your extracted text ✓

**Profile**:
- Settings → Profile tab
- Upload avatar
- Type username and name
- See live preview ✓

## 📋 What's New

### Document Viewer
- View extracted PDF text in modal
- Copy text to clipboard
- See parsing status

### Profile Preview
- Real-time preview while editing
- See avatar, username, and name
- Validation errors highlighted
- Save with confidence

## 🆘 If Something Breaks

**"Column does not exist" error?**
→ You forgot Step 1 (run the SQL migration)

**Document won't show text?**
→ Wait for "Parsed" status before viewing

**Profile changes not saving?**
→ Check error messages below fields

**Avatar not uploading?**
→ Make sure image is < 2MB

## 📁 Key Files

| File | What It Does |
|------|-------------|
| `scripts/003_add_missing_columns.sql` | Database setup |
| `components/workspace/document-viewer.tsx` | View documents |
| `components/workspace/document-panel.tsx` | Document list |
| `app/settings/settings-client.tsx` | Profile settings |

## ✅ Verification

After deployment:
1. Upload a PDF and view extracted text
2. Edit profile and see live preview
3. Ask AI about documents in chat
4. Save changes and refresh page
5. Everything should persist

All done! 🎉
