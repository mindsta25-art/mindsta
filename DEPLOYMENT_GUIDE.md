# 🚀 Mindsta App — Deployment Guide

## Overview
- **Frontend** → Vercel (`https://mindsta33.vercel.app`)
- **Backend** → Render (`https://mindsta-backend2.onrender.com`)
- **Database** → MongoDB Atlas

---

## 1. Deploy Frontend to Vercel

### Option A — Deploy from root (recommended, already configured)

A `vercel.json` at the project root sets `buildCommand` and `outputDirectory` correctly.

```bash
# From the repo root
vercel --prod
```

### Option B — Deploy from frontend/ subdirectory

```bash
cd frontend
vercel --prod
```

### Vercel Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://mindsta-backend2.onrender.com/api` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Your Paystack **live** public key (`pk_live_...`) |
| `VITE_JWT_SECRET` | Same JWT secret as backend |
| `VITE_NODE_ENV` | `production` |

> ⚠️ **`VITE_PAYSTACK_PUBLIC_KEY`** is currently a placeholder in `.env.production`. Replace it with your real live key from the Paystack dashboard.

---

## 2. Deploy Backend to Render

### Auto-deploy with render.yaml

A `render.yaml` is included at the repo root. Render will auto-detect it when you connect the repo.

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Render will read `render.yaml` and configure the service automatically
4. Set all `sync: false` environment variables manually in the Render dashboard (see table below)

### Render Environment Variables (set manually in dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Auto-set by render.yaml |
| `MONGODB_URI` | `mongodb+srv://mindsta_gmailcom:mindsta123@minsta-cluster...` | From MongoDB Atlas |
| `JWT_SECRET` | `948c2c9d8a072c65d...` | Your JWT secret |
| `VITE_JWT_SECRET` | Same as `JWT_SECRET` | Server validates this variable name |
| `PAYSTACK_SECRET_KEY` | `sk_test_943e6c...` or live key | Switch to live key for production |
| `PAYSTACK_CALLBACK_URL` | `https://mindsta33.vercel.app/payment/callback` | Auto-set |
| `ALLOWED_ORIGINS` | `https://mindsta33.vercel.app` | Auto-set |
| `FRONTEND_URL` | `https://mindsta33.vercel.app` | Auto-set |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://mindsta-backend2.onrender.com/api/auth/google/callback` | Auto-set |
| `EMAIL_USER` | `danielenuabanosa@gmail.com` | Gmail address |
| `EMAIL_PASSWORD` | `svwf rdge zvug twsf` | Gmail App Password |
| `EMAIL_HOST` | `smtp.gmail.com` | Auto-set |
| `EMAIL_PORT` | `587` | Auto-set |
| `EMAIL_FROM` | `Mindsta <noreply@mindsta.com>` | Auto-set |

---

## 3. Google OAuth Setup

For Google Sign-In to work in production, update your **Google Cloud Console** OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Edit your OAuth 2.0 Client
3. Add to **Authorized redirect URIs**:
   ```
   https://mindsta-backend2.onrender.com/api/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://mindsta33.vercel.app
   https://mindsta-backend2.onrender.com
   ```
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render dashboard

---

## 4. Paystack Setup

1. Log into [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Copy your **Live Public Key** (`pk_live_...`) → set as `VITE_PAYSTACK_PUBLIC_KEY` in Vercel
4. Copy your **Live Secret Key** (`sk_live_...`) → set as `PAYSTACK_SECRET_KEY` in Render
5. Under **Webhooks**, add:
   ```
   https://mindsta-backend2.onrender.com/api/payments/webhook
   ```

---

## 5. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Under **Network Access**, allow Render's IP or use `0.0.0.0/0` (allow all)
3. Confirm `MONGODB_URI` connection string is set in Render dashboard

---

## 6. Post-Deployment Checklist

- [ ] Frontend builds successfully on Vercel (`tsc && vite build` passes)
- [ ] Backend health check returns 200: `https://mindsta-backend2.onrender.com/api/health`
- [ ] User sign-up and OTP email works
- [ ] Google Sign-In works (OAuth redirect completes)
- [ ] Paystack payment flow works
- [ ] Admin dashboard accessible
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` replaced with real live key

---

## 7. Common Issues

### Frontend shows blank page
- Verify `vercel.json` rewrite rule is present (already set)
- Check Vercel build logs for TypeScript errors

### Backend 500 errors on Render
- Check Render logs: `MONGODB_URI` and `VITE_JWT_SECRET` must be set or server exits
- Run health check: `https://mindsta-backend2.onrender.com/api/health`

### CORS errors
- Ensure `ALLOWED_ORIGINS` on Render includes `https://mindsta33.vercel.app`

### Render cold starts
- Render free tier spins down after 15 min of inactivity; first request after sleep takes ~30s
- Upgrade to a paid plan to keep the service always-on
