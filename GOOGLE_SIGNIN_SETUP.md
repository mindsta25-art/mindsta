# 🔧 Quick Fix: Google Sign-In Setup

## Issue Found
Google OAuth credentials are not configured yet. The `.env` file has placeholder values that need to be replaced with actual credentials from Google Cloud Console.

## ✅ What I Fixed

1. **Bug Fix**: Fixed OTP generation error in auth.js (missing multiplication operator)
2. **Added Environment Variables**: Added Google OAuth template to `.env` file
3. **Improved Error Handling**: Better logging for Google OAuth callback

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**:
   - Click "Select a project" → "New Project"
   - Name: "Mindsta" → Create

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API" → Click → Enable

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   
5. **Configure OAuth Consent Screen** (if prompted):
   - User Type: **External**
   - App name: **Mindsta**
   - User support email: (your email)
   - Developer contact: (your email)
   - Click "Save and Continue"
   - Scopes: Skip (click "Save and Continue")
   - Test users: Add your email for testing
   - Click "Save and Continue"

6. **Create OAuth Client**:
   - Application type: **Web application**
   - Name: **Mindsta OAuth**
   
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   
   - Click "Create"
   - **COPY the Client ID and Client Secret** (you'll need these!)

### Step 2: Update .env File

Open `backend/.env` and replace the placeholder values:

```env
# Replace these lines (at the bottom of the file):
GOOGLE_CLIENT_ID=your_actual_client_id_from_google_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_google_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

**Example** (yours will be different):
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678ijkl
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Step 3: Restart Backend Server

```powershell
# Stop the current backend server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### Step 4: Test Google Sign-In

1. Go to http://localhost:5173/auth
2. Click "Sign in with Google" button
3. Select your Google account
4. Allow permissions
5. You'll be redirected and logged in! ✅

## 🐛 Troubleshooting

### Error: "Google OAuth not configured"
**Solution**: Make sure you've added the actual Client ID and Secret to `.env` file (not the placeholder text)

### Error: "Redirect URI mismatch"
**Solution**: In Google Cloud Console, verify the redirect URI is **exactly**:
```
http://localhost:3000/api/auth/google/callback
```

### Error: "Access blocked: This app's request is invalid"
**Solution**: 
1. Complete the OAuth consent screen configuration
2. Add your email as a test user
3. Make sure app is in "Testing" mode (not "Production")

### Error: "Invalid client"
**Solution**: Double-check your Client ID and Secret are copied correctly (no extra spaces)

### Still Not Working?
**Check backend console logs** - they will show:
- `[Passport] Google OAuth not configured` → Credentials not set
- `[Google OAuth] Authentication successful:` → OAuth working!
- `[Google OAuth Callback] Token generated` → Success!

## 📋 Checklist

- [ ] Created project in Google Cloud Console
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 Client ID
- [ ] Copied Client ID and Secret
- [ ] Updated `backend/.env` with actual credentials
- [ ] Added authorized origins (http://localhost:5173, http://localhost:3000)
- [ ] Added redirect URI (http://localhost:3000/api/auth/google/callback)
- [ ] Restarted backend server
- [ ] Tested Google Sign-In button

## ✨ What Happens After Setup

1. **User clicks "Sign in with Google"** → Redirects to Google login
2. **User selects account** → Google authenticates
3. **Google redirects back** → Backend creates/links account
4. **Frontend receives token** → User logged in automatically!
5. **Redirects to dashboard** → Ready to use!

---

**Need Help?** Check the backend console for detailed error messages!
