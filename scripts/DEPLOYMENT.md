# Wordle Pwincess Deployment Guide 💅

## Overview
- **Backend**: Railway (Node.js + Express)
- **Database**: Railway MySQL (already set up!)
- **Frontend**: Vercel (Angular)

## Prerequisites

### Install CLIs (optional but recommended)
```bash
# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel
```

---

## Step 1: Deploy Backend to Railway

### Option A: Using Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app) and log in
2. In your project, click **"+ New"** → **"GitHub Repo"**
3. Connect to your GitHub repo and select the `wordle-backend` folder
4. Railway will auto-detect it as a Node.js app

### Configure Environment Variables

In Railway, go to your backend service → **Variables** tab and add your MySQL credentials.
You can find these in Railway's MySQL service under **Connect** tab:

```
MYSQL_HOST=<your-railway-mysql-host>
MYSQL_PORT=<your-railway-mysql-port>
MYSQL_USER=root
MYSQL_PASSWORD=<your-railway-mysql-password>
MYSQL_DATABASE=railway
PORT=3000
```

**Note**: Railway auto-assigns PORT, but setting it doesn't hurt.

### Get Your Backend URL

After deployment, Railway gives you a URL like:
```
https://wordle-backend-production-xxxx.up.railway.app
```

Copy this URL - you'll need it for the frontend!

### Option B: Using Railway CLI

```bash
cd wordle-backend

# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

---

## Step 2: Update Frontend with Backend URL

Edit `wordleapp/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR_RAILWAY_BACKEND_URL'  // <-- Replace with actual URL
};
```

---

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Set the **Root Directory** to `wordleapp`
5. Vercel auto-detects Angular - just click **Deploy**!

### Option B: Using Vercel CLI

```bash
cd wordleapp

# Login
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

---

## Step 4: Configure CORS (if needed)

If you get CORS errors, update `wordle-backend/server.js`:

```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:4200'],
  credentials: true
}));
```

Then redeploy the backend.

---

## Database Commands

### Sync Local DB to Railway
```bash
cd scripts
./deploy-db.sh sync
```

### Just export local DB
```bash
./deploy-db.sh export
```

### Just import to Railway
```bash
./deploy-db.sh import
```

### Verify Railway DB
```bash
./deploy-db.sh verify
```

---

## Environment Variables Reference

### Backend (Railway)
| Variable | Description |
|----------|-------------|
| MYSQL_HOST | Railway MySQL host (from Connect tab) |
| MYSQL_PORT | Railway MySQL port (from Connect tab) |
| MYSQL_USER | Usually `root` |
| MYSQL_PASSWORD | Railway MySQL password (from Connect tab) |
| MYSQL_DATABASE | Usually `railway` |

### Frontend (Vercel)
No environment variables needed - the API URL is baked into the build.

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify all environment variables are set
- Make sure `package.json` has `"start": "node server.js"`

### Database connection failed
- Verify Railway MySQL is running
- Check the MySQL credentials in Railway dashboard
- Try connecting manually: `mysql -h <host> -P <port> -u root -p railway`

### CORS errors in browser
- Add your Vercel domain to CORS whitelist in backend
- Redeploy backend after changes

### Frontend shows blank page
- Check browser console for errors
- Verify the API URL in environment.prod.ts
- Make sure the backend is running and accessible

---

## Quick Commands Cheat Sheet

```bash
# Local development
cd wordleapp && ng serve          # Frontend: http://localhost:4200
cd wordle-backend && npm run dev  # Backend: http://localhost:3000

# Build frontend for production
cd wordleapp && ng build --configuration=production

# Database sync
cd scripts && ./deploy-db.sh sync
```

---

Slay queen! You're deployed! 👑💅
