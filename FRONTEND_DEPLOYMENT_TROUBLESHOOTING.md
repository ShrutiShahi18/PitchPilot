# Frontend Deployment Troubleshooting

## Issue: Can't See the Frontend at https://pitchpilotpitchpilot.onrender.com

### Step 1: Check if Service Exists

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Check if you have a **Static Site** service named `pitchpilotpitchpilot` or similar
3. If it doesn't exist, you need to create it (see Step 2)

### Step 2: Create/Configure Frontend Service

If the service doesn't exist:

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `ShrutiShahi18/PitchPilot`
3. Configure:
   - **Name**: `pitchpilotpitchpilot` (or any name you prefer)
   - **Region**: Same as backend (e.g., `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Step 3: Set Environment Variable

**Critical:** Set the API URL in Render dashboard:

1. Go to your frontend service → **Environment** tab
2. Add/Update:
   ```
   VITE_API_URL=https://pitchpilot-api.onrender.com/api
   ```
3. **Save** the changes

### Step 4: Check Service Status

1. Go to your frontend service in Render
2. Check the **Logs** tab for errors
3. Check the **Events** tab for deployment status

**Common Statuses:**
- **Live**: Service is running (may take 30-60 seconds to wake up if sleeping)
- **Sleeping**: Free tier service is sleeping (will wake on first request)
- **Build Failed**: Check logs for build errors
- **Deploy Failed**: Check logs for deployment errors

### Step 5: Common Issues & Fixes

#### Issue: "Service Sleeping" (Free Tier)

**Symptom:** First request takes 30-60 seconds, then works fine

**Fix:** This is normal for free tier. Wait for the service to wake up, or upgrade to paid tier for always-on service.

#### Issue: "Build Failed"

**Check logs for:**
- Missing dependencies
- Build errors
- Environment variable issues

**Fix:**
1. Check the **Logs** tab for specific error
2. Common fixes:
   - Ensure `VITE_API_URL` is set correctly
   - Check that `package.json` has all dependencies
   - Verify build command: `npm install && npm run build`

#### Issue: "Blank Page" or "404 Not Found"

**Possible causes:**
1. **Wrong Publish Directory**: Should be `dist` (not `client/dist`)
2. **Build didn't complete**: Check build logs
3. **Routing issue**: For React Router, you may need a `_redirects` file

**Fix for React Router (SPA routing):**

Create `client/public/_redirects` file:
```
/*    /index.html   200
```

Then rebuild and redeploy.

#### Issue: "Cannot connect to server"

**Symptom:** Frontend loads but shows connection error

**Fix:**
1. Verify `VITE_API_URL` is set in Render environment variables
2. Check backend is running and accessible
3. Verify CORS is configured correctly in backend

### Step 6: Verify Deployment

1. **Check Build Output:**
   - Go to service → **Logs** tab
   - Look for "Build successful" message
   - Verify `dist` folder was created

2. **Check Service URL:**
   - Service URL should be visible in Render dashboard
   - Click the URL to open in browser
   - Should see the PitchPilot signin/signup page

3. **Test Functionality:**
   - Try signing up
   - Check browser console (F12) for errors
   - Verify API calls are going to correct backend URL

### Step 7: Manual Build Test (Local)

To test if the build works locally:

```powershell
cd client
npm install
npm run build
```

Check if `client/dist` folder is created with:
- `index.html`
- `assets/` folder with JS and CSS files

If build fails locally, fix those errors first before deploying.

### Quick Checklist

- [ ] Frontend service exists in Render dashboard
- [ ] Service is set to "Static Site" type
- [ ] Root Directory is set to `client`
- [ ] Build Command is: `npm install && npm run build`
- [ ] Publish Directory is: `dist`
- [ ] `VITE_API_URL` environment variable is set
- [ ] Service status is "Live" (or waking up)
- [ ] No build errors in logs
- [ ] Backend CORS includes frontend URL

### Still Not Working?

1. **Check Render Logs:**
   - Go to service → **Logs** tab
   - Copy the error message
   - Look for specific build/deployment errors

2. **Check Browser Console:**
   - Open frontend URL in browser
   - Press F12 → Console tab
   - Look for JavaScript errors

3. **Verify Backend:**
   - Test backend health: `https://pitchpilot-api.onrender.com/_health`
   - Should return: `{"status":"ok",...}`

4. **Check Network Tab:**
   - F12 → Network tab
   - Reload page
   - Check if assets (JS, CSS) are loading
   - Check if API calls are being made

