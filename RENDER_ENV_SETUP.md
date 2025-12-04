# Render Environment Variables Setup

## Critical: Set NODE_ENV=production

Your health endpoint shows `env: "development"` which means `NODE_ENV` is not set correctly.

### How to Fix:

1. **Go to Render Dashboard:**
   - [dashboard.render.com](https://dashboard.render.com)
   - Select your backend service (`pitchpilot-api`)

2. **Go to Environment Tab:**
   - Click **"Environment"** in the left sidebar

3. **Add/Edit NODE_ENV:**
   - Click **"Add Environment Variable"** (if not exists)
   - Or click the edit icon next to existing `NODE_ENV`
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - Click **"Save Changes"**

4. **Service will auto-redeploy:**
   - Render will automatically restart your service
   - Wait 1-2 minutes for deployment

5. **Verify:**
   - Visit: `https://pitchpilot-api.onrender.com/_health`
   - Should now show: `"env": "production"`

---

## Required Environment Variables

### Must Have (for app to work):

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pitchpilot?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here
```

### Important for Features:

```
GEMINI_API_KEY=your-gemini-api-key
AI_PROVIDER=gemini
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
GMAIL_SENDER=your-email@gmail.com
FRONTEND_URL=https://your-frontend-url.onrender.com
```

---

## Quick Checklist

- [ ] `NODE_ENV=production` is set
- [ ] `MONGO_URI` includes database name (`/pitchpilot`)
- [ ] `JWT_SECRET` is set (generate with: `openssl rand -base64 32`)
- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] All required variables are set (no empty values)

---

## Generate JWT_SECRET

If you need to generate a secure JWT secret:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use online tool:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret
- Paste into Render as `JWT_SECRET` value

---

## After Setting Variables

1. Service will automatically redeploy
2. Check logs for any errors
3. Test health endpoint: `/_health`
4. Should show: `"env": "production"` and `"database": "connected"`

