# Troubleshooting 500 Errors on Render

## Common Causes of 500 Errors

### 1. **MongoDB Connection Issues** (Most Common)

**Symptoms:**
- 500 error on signup/signin
- Error logs show "MongoDB connection failed"

**Solutions:**

1. **Check MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (allows all IPs - required for Render)
   - Wait 1-2 minutes for changes to propagate

2. **Verify MONGO_URI in Render:**
   - Go to Render Dashboard → Your Service → Environment
   - Check `MONGO_URI` is set correctly
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/pitchpilot?retryWrites=true&w=majority`
   - Must include database name (`/pitchpilot`)

3. **Check MongoDB Atlas Cluster Status:**
   - Ensure cluster is running (not paused)
   - Free tier clusters pause after inactivity

### 2. **Missing Environment Variables**

**Check in Render Dashboard → Environment:**

Required variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Random string (generate with: `openssl rand -base64 32`)
- `NODE_ENV=production`
- `PORT=10000` (or let Render set it)

Optional but recommended:
- `GEMINI_API_KEY` - For AI features
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER` - For email sending

### 3. **Check Render Logs**

1. Go to Render Dashboard → Your Service → Logs
2. Look for error messages
3. Common errors:
   - `MongoServerError` - Database issue
   - `JWT_SECRET not set` - Missing env var
   - `Cannot find module` - Missing dependency

### 4. **Database Not Connected**

**Check connection status:**
- Visit: `https://your-api.onrender.com/_health`
- Should return: `{"status":"ok","env":"production"}`

**If database is not connected:**
- Check Render logs for MongoDB connection errors
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas Network Access

### 5. **Debug Endpoint**

Visit: `https://your-api.onrender.com/_debug/env`

This shows:
- Environment variables status
- AI provider configuration
- Gmail configuration

**Note:** Remove this endpoint in production for security.

## Quick Debugging Steps

1. **Check Render Logs:**
   ```
   Render Dashboard → Your Service → Logs
   ```

2. **Test Health Endpoint:**
   ```
   curl https://your-api.onrender.com/_health
   ```

3. **Test Debug Endpoint:**
   ```
   curl https://your-api.onrender.com/_debug/env
   ```

4. **Check MongoDB Connection:**
   - Verify `MONGO_URI` in Render environment
   - Check MongoDB Atlas Network Access
   - Test connection string in MongoDB Compass

5. **Verify Environment Variables:**
   - All required vars are set
   - No typos in variable names
   - Values are correct (no extra spaces)

## Common Error Messages

### "MongoServerError: connection timeout"
- **Fix:** Add `0.0.0.0/0` to MongoDB Atlas Network Access

### "JWT_SECRET not set"
- **Fix:** Add `JWT_SECRET` environment variable in Render

### "Cannot find module"
- **Fix:** Check `package.json` includes all dependencies
- Rebuild service in Render

### "Database connection error"
- **Fix:** Check `MONGO_URI` format and MongoDB Atlas settings

## Still Having Issues?

1. Check Render service logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test MongoDB connection string separately
4. Check if service is sleeping (free tier limitation)
5. Try redeploying the service

