# Deploy Both Frontend and Backend on Vercel

This guide will help you deploy both the frontend and backend of the Mindsta app on Vercel.

## 🎯 Deployment Strategy

We'll deploy **two separate Vercel projects**:
1. **Backend API** (Node.js/Express as serverless functions)
2. **Frontend** (React/Vite static site)

---

## 📦 Part 1: Deploy Backend to Vercel

### Step 1: Prepare Backend for Vercel

✅ **Already Done:**
- Created `backend/vercel.json` for Vercel configuration
- Modified `backend/server/index.js` to export the Express app
- Made server conditional (won't start in serverless environment)

### Step 2: Deploy Backend to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Navigate to backend folder
cd backend

# Login to Vercel
vercel login

# Deploy backend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? mindsta-backend (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No

# After first deployment, deploy to production:
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. **Root Directory**: Set to `backend`
4. **Framework Preset**: Other
5. **Build Command**: Leave empty or `npm install`
6. **Output Directory**: Leave empty
7. Click **Deploy**

### Step 3: Configure Backend Environment Variables

After deploying, add these environment variables in Vercel dashboard:

Go to: **Project Settings** → **Environment Variables**

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
VITE_JWT_SECRET=948c2c9d8a072c65d265ac2406f740acd6e7cafb5e5cf3bf35dd2f6a33afe6e4882c9ecf673c32fc8c0a783d76e63ba5c58a455a86991ef9e8180c2a29299b00
ALLOWED_ORIGINS=https://your-frontend-app.vercel.app,https://*.vercel.app
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

**Important:** After adding environment variables, **redeploy** the backend!

### Step 4: Note Your Backend URL

After deployment, Vercel will give you a URL like:
```
https://mindsta-backend.vercel.app
```

**Copy this URL** - you'll need it for the frontend!

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

You have two options:

**Option A: Set in Vercel Dashboard (Recommended)**

1. Deploy frontend first (see Step 2)
2. Then add environment variable in Vercel dashboard:
   ```
   VITE_API_URL=https://mindsta-backend.vercel.app/api
   ```
3. Redeploy

**Option B: Update .env.production File**

Edit `frontend/.env.production`:

```env
# Replace Railway URL with your Vercel backend URL
VITE_API_URL=https://mindsta-backend.vercel.app/api
```

### Step 2: Deploy Frontend to Vercel

**Option A: Using Vercel CLI**

```bash
# Navigate to frontend folder
cd frontend

# Deploy frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? mindsta-app (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No

# Deploy to production:
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository (or create new project)
3. **Root Directory**: Set to `frontend`
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build` (auto-detected)
6. **Output Directory**: `dist` (auto-detected)
7. **Install Command**: `npm install` (auto-detected)
8. Click **Deploy**

### Step 3: Configure Frontend Environment Variables

Go to: **Project Settings** → **Environment Variables**

Add these for **Production** environment:

```env
VITE_API_URL=https://mindsta-backend.vercel.app/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_live_public_key
VITE_JWT_SECRET=948c2c9d8a072c65d265ac2406f740acd6e7cafb5e5cf3bf35dd2f6a33afe6e4882c9ecf673c32fc8c0a783d76e63ba5c58a455a86991ef9e8180c2a29299b00
VITE_NODE_ENV=production
```

**Important:** After adding environment variables, **redeploy** the frontend!

---

## 🔄 Part 3: Update CORS Settings

### Update Backend ALLOWED_ORIGINS

After you know your frontend URL (e.g., `https://mindsta-app.vercel.app`):

1. Go to backend Vercel project
2. Settings → Environment Variables
3. Update `ALLOWED_ORIGINS`:
   ```
   https://mindsta-app.vercel.app,https://*.vercel.app
   ```
4. Redeploy backend

---

## ✅ Part 4: Verify Deployment

### Test Backend API

```bash
# Test health endpoint
curl https://mindsta-backend.vercel.app/api/health

# Should return something like:
# {"status":"ok","message":"API is running"}
```

### Test Frontend

1. Visit your frontend URL: `https://mindsta-app.vercel.app`
2. Open browser DevTools (F12) → Console
3. Look for API configuration logs
4. Try logging in
5. Check StudentHome page loads without errors

### Common Issues & Fixes

#### ❌ CORS Error
**Fix:** Update `ALLOWED_ORIGINS` in backend environment variables

#### ❌ "Failed to load student information"
**Fix:** Check `VITE_API_URL` is set correctly in frontend environment variables

#### ❌ 404 on API routes
**Fix:** Ensure `vercel.json` routes are configured correctly in backend

#### ❌ Environment variables not working
**Fix:** Make sure you **redeploy** after adding/changing environment variables

#### ❌ MongoDB connection error
**Fix:** Check `MONGODB_URI` is correct and MongoDB Atlas allows Vercel IPs (set to 0.0.0.0/0)

---

## 🚀 Part 5: Continuous Deployment

### Auto-Deploy on Git Push

**For Backend:**
1. Go to backend project in Vercel
2. Settings → Git
3. Connect your repository
4. Set **Root Directory** to `backend`
5. Production Branch: `main`

**For Frontend:**
1. Go to frontend project in Vercel
2. Settings → Git
3. Connect your repository
4. Set **Root Directory** to `frontend`
5. Production Branch: `main`

Now every push to `main` will auto-deploy both projects!

---

## 📊 Monitoring & Logs

### View Logs

**Backend Logs:**
- Dashboard → Your Backend Project → Deployments → [Latest] → Function Logs

**Frontend Logs:**
- Dashboard → Your Frontend Project → Deployments → [Latest] → Build Logs

### Performance Monitoring

- Check response times in Function logs
- Monitor error rates
- Set up Vercel Analytics (optional)

---

## 💰 Pricing Notes

### Vercel Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function executions (100GB-hours)
- Perfect for development and moderate production use

### Considerations:
- Serverless functions have **10-second execution limit** on free tier
- Backend cold starts may be slower than Railway
- If you need longer execution times, consider Vercel Pro ($20/month)

---

## 🔒 Security Checklist

- ✅ MONGODB_URI is set in environment variables (not in code)
- ✅ JWT_SECRET is set in environment variables
- ✅ CORS is configured with specific origins
- ✅ Rate limiting is enabled in backend
- ✅ Helmet security headers are configured
- ✅ Paystack keys are in environment variables

---

## 📝 Quick Reference

### Backend Vercel URL Structure
```
https://mindsta-backend.vercel.app/api/auth/login
https://mindsta-backend.vercel.app/api/students/:userId
https://mindsta-backend.vercel.app/api/lessons
```

### Frontend Vercel URL
```
https://mindsta-app.vercel.app
```

### Deployment Commands

```bash
# Deploy backend to production
cd backend && vercel --prod

# Deploy frontend to production
cd frontend && vercel --prod

# Check deployment status
vercel ls
```

---

## 🆘 Need Help?

1. Check Vercel deployment logs for errors
2. Verify all environment variables are set
3. Test API endpoints directly with curl/Postman
4. Check browser console for frontend errors
5. Review [Vercel Documentation](https://vercel.com/docs)

---

**Last Updated:** January 8, 2026  
**Status:** ✅ Ready for Deployment
