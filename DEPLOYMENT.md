# Deploying PitchPilot on Render

This guide will help you deploy both the backend API and frontend on Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas**: Free MongoDB cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **GitHub Repository**: Push your code to GitHub

---

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pitchpilot.git
git push -u origin main
```

### 1.2 Update Environment Variables

Make sure your `.env` file has all required variables (don't commit this file - it's in `.gitignore`).

---

## Step 2: Deploy Backend API

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `pitchpilot`

### 2.2 Configure Backend Service

**Basic Settings:**
- **Name**: `pitchpilot-api`
- **Region**: Choose closest to you (e.g., `Oregon`)
- **Branch**: `main`
- **Root Directory**: Leave empty (root)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Add these in the Render dashboard (under "Environment"):

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pitchpilot?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
GMAIL_SENDER=your-email@gmail.com
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
```

**Important Notes:**
- `MONGO_URI`: Get this from MongoDB Atlas → Connect → Connect your application
- `JWT_SECRET`: Generate a random string (e.g., use `openssl rand -base64 32`)
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Gmail credentials: Use the same ones from your local `.env`

### 2.3 Deploy

Click **"Create Web Service"** and wait for deployment (usually 2-3 minutes).

**Note the URL**: You'll get something like `https://pitchpilot-api.onrender.com`

---

## Step 3: Deploy Frontend

### 3.1 Create New Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Select the repository: `pitchpilot`

### 3.2 Configure Frontend Service

**Basic Settings:**
- **Name**: `pitchpilot-web`
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Environment Variables:**
```
VITE_API_URL=https://pitchpilot-api.onrender.com/api
```

**Important**: Replace `pitchpilot-api.onrender.com` with your actual backend URL from Step 2.

**Note**: The frontend code has been updated to use `https://pitchpilot-api.onrender.com/api` as the default, so if you're using that exact backend URL, you don't need to set this variable. For local development, create a `client/.env` file with `VITE_API_URL=http://localhost:4000/api`.

### 3.3 Deploy

Click **"Create Static Site"** and wait for deployment.

**Note the URL**: You'll get something like `https://pitchpilot-web.onrender.com`

---

## Step 4: Update CORS Settings

### 4.1 Update Backend CORS

Edit `src/index.js` to allow your frontend domain:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://pitchpilot-web.onrender.com',
  credentials: true
};

app.use(cors(corsOptions));
```

Or for multiple environments:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://pitchpilot-web.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 4.2 Update MongoDB Atlas Whitelist

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allows all IPs - required for Render)
3. Or add Render's IP ranges (check Render docs)

---

## Step 5: Test Deployment

1. Visit your frontend URL: `https://pitchpilot-web.onrender.com`
2. Try signing up
3. Test email generation and sending

---

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `MONGO_URI` includes database name: `.../pitchpilot?retryWrites=true`

### Frontend can't connect to API
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Check browser console for errors

### MongoDB connection fails
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `MONGO_URI` format is correct
- Ensure database user has read/write permissions

### Gmail API errors
- Verify all Gmail credentials are set correctly
- Check refresh token hasn't expired
- Ensure OAuth consent screen is published (or add test users)

---

## Optional: Custom Domains

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain and follow DNS setup instructions

---

## Environment Variables Reference

### Backend Required:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `GEMINI_API_KEY` - Google Gemini API key (or OpenAI/OpenRouter)
- `GMAIL_CLIENT_ID` - Gmail OAuth client ID
- `GMAIL_CLIENT_SECRET` - Gmail OAuth client secret
- `GMAIL_REFRESH_TOKEN` - Gmail OAuth refresh token
- `GMAIL_SENDER` - Your Gmail address

### Frontend Required:
- `VITE_API_URL` - Backend API URL

---

## Cost

Render's free tier includes:
- 750 hours/month of web service time
- 100 GB bandwidth/month
- Automatic SSL certificates
- Auto-deploy from GitHub

For production, consider upgrading to paid plans for:
- No sleep (always-on services)
- More resources
- Better performance

---

## Quick Deploy Script

You can also use the `render.yaml` file for infrastructure-as-code:

1. In Render, go to **"New +"** → **"Blueprint"**
2. Connect your GitHub repo
3. Render will automatically create services from `render.yaml`

This is the easiest way to deploy everything at once!

