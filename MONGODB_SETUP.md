# MongoDB Atlas Setup for Render Deployment

## ⚠️ URGENT: IP Whitelist Error Fix

**Error:** "Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted."

**Solution:** Add `0.0.0.0/0` to MongoDB Atlas Network Access (allows all IPs - required for Render).

---

## Step 1: Fix Network Access (DO THIS FIRST!)

1. **Go to MongoDB Atlas:**
   - Visit: [cloud.mongodb.com](https://cloud.mongodb.com/)
   - Log in to your account

2. **Navigate to Network Access:**
   - Click **"Network Access"** in the left sidebar (under "Security")
   - NOT "Database Access" - that's for users

3. **Add IP Address:**
   - Click the green **"Add IP Address"** button
   - You'll see two options:
     - **"Add Current IP Address"** - Don't use this (only allows your current IP)
     - **"Allow Access from Anywhere"** - **USE THIS ONE!**
   - Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` which allows ALL IP addresses

4. **Confirm:**
   - Click **"Confirm"** button
   - You should see `0.0.0.0/0` appear in your IP whitelist

5. **Wait for Propagation:**
   - **IMPORTANT:** Wait 2-3 minutes for changes to take effect
   - MongoDB Atlas needs time to update network rules globally

6. **Verify:**
   - Your IP list should show: `0.0.0.0/0` with status "Active"
   - If it shows "Pending", wait a bit longer

**Why:** Render's IP addresses change, so you need to allow all IPs (`0.0.0.0/0`) for Render deployments.

---

### Step 2: Verify Your Connection String

**Format:**
```
mongodb+srv://username:password@cluster-name.mongodb.net/pitchpilot?retryWrites=true&w=majority
```

**Important parts:**
- `username:password` - Your MongoDB Atlas database user credentials
- `cluster-name` - Your cluster name (e.g., `cluster0.xxxxx`)
- `/pitchpilot` - **Database name** (required!)
- `?retryWrites=true&w=majority` - Connection options

**How to get it:**
1. MongoDB Atlas → Your Cluster
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. **Add database name** after `.net/` → `.net/pitchpilot`

---

### Step 3: Add to Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service (`pitchpilot-api`)
3. Go to **"Environment"** tab
4. Add/Edit `MONGO_URI`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pitchpilot?retryWrites=true&w=majority
   ```
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

### Step 4: Check Cluster Status

1. MongoDB Atlas → Your Cluster
2. Verify cluster is **"Running"** (not paused)
3. Free tier clusters pause after inactivity
4. If paused, click **"Resume"** and wait 1-2 minutes

---

### Step 5: Verify Database User

1. MongoDB Atlas → **"Database Access"**
2. Check your database user exists
3. User should have **"Read and write to any database"** permissions
4. If needed, create a new user:
   - Click **"Add New Database User"**
   - Choose **"Password"** authentication
   - Username: `pitchpilot-user` (or your choice)
   - Password: Generate secure password
   - Database User Privileges: **"Read and write to any database"**
   - Click **"Add User"**

---

### Step 6: Test Connection

After updating Render environment variables:

1. Check Render logs for connection status
2. Visit: `https://your-api.onrender.com/_health`
3. Should return: `{"status":"ok","env":"production"}`

---

## Common Issues

### Issue: "Connection timeout"
**Fix:**
- Add `0.0.0.0/0` to Network Access
- Wait 2-3 minutes after adding
- Verify cluster is running

### Issue: "Authentication failed"
**Fix:**
- Check username/password in `MONGO_URI`
- Verify database user exists and has permissions
- Make sure password doesn't have special characters that need URL encoding

### Issue: "ENOTFOUND" error
**Fix:**
- Check cluster name in connection string
- Verify cluster is running (not paused)
- Check MongoDB Atlas service status

### Issue: "Database name missing"
**Fix:**
- Ensure connection string includes `/pitchpilot` before `?`
- Format: `...mongodb.net/pitchpilot?retryWrites=true...`

---

## Example Connection String

**Before (missing database name):**
```
mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**After (correct):**
```
mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/pitchpilot?retryWrites=true&w=majority
```

Notice the `/pitchpilot` added before the `?`.

---

## Quick Checklist

- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] Cluster is running (not paused)
- [ ] Database user exists with read/write permissions
- [ ] `MONGO_URI` in Render includes database name (`/pitchpilot`)
- [ ] Connection string format is correct
- [ ] Password in connection string is URL-encoded if needed
- [ ] Render service has been redeployed after env var changes

---

## Still Not Working?

1. **Check Render Logs:**
   - Render Dashboard → Your Service → Logs
   - Look for MongoDB connection errors
   - Copy the exact error message

2. **Test Connection String Locally:**
   - Use MongoDB Compass or `mongosh`
   - Try connecting with the same connection string
   - If it works locally but not on Render, it's likely a Network Access issue

3. **Verify Environment Variable:**
   - Render Dashboard → Environment
   - Check `MONGO_URI` is set (not empty)
   - No extra spaces or quotes
   - Value is correct

4. **Contact Support:**
   - If all else fails, check MongoDB Atlas status page
   - Or Render support for deployment issues

