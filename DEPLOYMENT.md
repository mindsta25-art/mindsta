## Deploying to Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas database
- Paystack account (for payments)

### Environment Variables
Set these in Vercel dashboard (Settings → Environment Variables):

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PAYSTACK_SECRET_KEY=your_paystack_secret
FRONTEND_URL=https://your-app.vercel.app
```

### Deploy Steps

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Import this repository
   - Configure environment variables
   - Deploy

3. **Deploy via CLI**:
   ```bash
   vercel
   ```

### Project Structure
- `/frontend` - React frontend (Vite)
- `/backend` - Node.js/Express API
- `vercel.json` - Vercel configuration

### Build Commands
- Frontend: `npm run build` (in /frontend)
- Backend: Serverless functions (auto-detected)

### Notes
- Frontend will be served as static files
- Backend API will run as serverless functions
- All `/api/*` routes proxy to backend
- MongoDB connection uses connection pooling for serverless
