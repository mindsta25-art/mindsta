# 🚀 Quick Start - Deploy to Vercel

## Prerequisites

- Vercel account ([Sign up free](https://vercel.com/signup))
- Vercel CLI installed: `npm install -g vercel`
- MongoDB Atlas database ready
- Git repository connected

## 🎯 Quick Deploy (3 Steps)

### Step 1: Deploy Backend

```powershell
cd backend
vercel --prod
```

**Copy the backend URL** (e.g., `https://mindsta-backend.vercel.app`)

### Step 2: Configure Backend Environment Variables

Go to Vercel Dashboard → Backend Project → Settings → Environment Variables

Add:
```
MONGODB_URI=your_mongodb_connection_string
VITE_JWT_SECRET=948c2c9d8a072c65d265ac2406f740acd6e7cafb5e5cf3bf35dd2f6a33afe6e4882c9ecf673c32fc8c0a783d76e63ba5c58a455a86991ef9e8180c2a29299b00
ALLOWED_ORIGINS=https://*.vercel.app
NODE_ENV=production
```

**Then redeploy:** `vercel --prod`

### Step 3: Deploy Frontend

```powershell
cd frontend
vercel --prod
```

**Copy the frontend URL** (e.g., `https://mindsta-app.vercel.app`)

### Step 4: Update Environment Variables

**Backend:**
Update `ALLOWED_ORIGINS` with your frontend URL:
```
ALLOWED_ORIGINS=https://mindsta-app.vercel.app,https://*.vercel.app
```

**Frontend:**
Add `VITE_API_URL`:
```
VITE_API_URL=https://mindsta-backend.vercel.app/api
```

**Redeploy both projects!**

## ✅ Done!

Visit your frontend URL and test the app.

## 📚 Detailed Guide

See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for complete instructions.

## 🆘 Quick Troubleshooting

**CORS Error?**
- Update `ALLOWED_ORIGINS` in backend environment variables
- Redeploy backend

**API not loading?**
- Check `VITE_API_URL` in frontend environment variables
- Verify backend is deployed and running

**Database error?**
- Check `MONGODB_URI` is correct
- Ensure MongoDB Atlas allows Vercel IPs (set to 0.0.0.0/0)

## 🔄 Automated Deploy

Use the PowerShell script:
```powershell
.\deploy-vercel.ps1
```
