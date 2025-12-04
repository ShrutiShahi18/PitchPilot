# Troubleshooting Guide

## Signup/Connection Errors

### Error: `ERR_CONNECTION_REFUSED`

This error means the frontend cannot connect to the backend API. Here are the most common causes and solutions:

#### 1. **Backend Not Running (Local Development)**

If you're running the frontend locally and trying to connect to a local backend:

**Solution:**
- Make sure the backend is running: `npm start` in the root directory
- Check that the backend is listening on `http://localhost:4000`
- Create a `client/.env` file with:
  ```
  VITE_API_URL=http://localhost:4000/api
  ```
- Restart your frontend dev server after creating/updating `.env`

#### 2. **Render Backend is Down**

If you're trying to connect to the deployed backend on Render:

**Solution:**
- Check Render dashboard: https://dashboard.render.com
- Verify the service is running (not sleeping)
- Check the service logs for errors
- Free tier services on Render sleep after 15 minutes of inactivity - they wake up on the first request (may take 30-60 seconds)

#### 3. **Wrong API URL**

**Solution:**
- Check the browser console for the API URL being used
- Verify `VITE_API_URL` in `client/.env` (for local) or Render environment variables (for production)
- Default URL is: `https://pitchpilot-api.onrender.com/api`

### Error: `500 Internal Server Error`

This means the backend is reachable but encountering an error. Common causes:

#### 1. **Database Connection Issue**

**Symptoms:**
- Error logs mention MongoDB connection
- Health check endpoint returns `database: disconnected`

**Solution:**
- Check MongoDB Atlas Network Access - ensure `0.0.0.0/0` is whitelisted
- Verify `MONGO_URI` in Render environment variables includes database name: `mongodb+srv://.../pitchpilot`
- Check MongoDB Atlas cluster is running (free tier may pause)
- See `MONGODB_SETUP.md` for detailed instructions

#### 2. **Missing Environment Variables**

**Symptoms:**
- Error logs mention missing configuration
- JWT_SECRET or other required vars not set

**Solution:**
- Check Render dashboard → Environment tab
- Ensure all required variables are set:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `NODE_ENV=production`
- For local development, check `.env` file in project root

#### 3. **User Already Exists (409 Conflict)**

**Symptoms:**
- Error: "User with this email already exists"

**Solution:**
- Try signing in instead of signing up
- Or use a different email address

## Debugging Steps

### 1. Check Backend Health

Visit the health check endpoint:
- Local: `http://localhost:4000/_health`
- Production: `https://pitchpilot-api.onrender.com/_health`

Expected response:
```json
{
  "status": "ok",
  "env": "production",
  "database": "connected"
}
```

### 2. Check Backend Logs

**Local:**
- Check terminal where `npm start` is running

**Render:**
- Go to Render dashboard → Your service → Logs tab
- Look for error messages, especially around:
  - Database connection
  - Missing environment variables
  - JWT_SECRET errors

### 3. Check Frontend Console

Open browser DevTools (F12) → Console tab:
- Look for API URL being used (should log on page load in dev mode)
- Check for CORS errors
- Check for network errors with details

### 4. Test API Directly

Use curl or Postman to test the signup endpoint:

```bash
# Local
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Production
curl -X POST https://pitchpilot-api.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

## Quick Fixes

### For Local Development

1. **Backend not starting:**
   ```bash
   cd /path/to/PitchPilot
   npm install
   npm start
   ```

2. **Frontend can't connect:**
   - Create `client/.env`:
     ```
     VITE_API_URL=http://localhost:4000/api
     ```
   - Restart frontend dev server

3. **Database connection:**
   - Check `.env` has correct `MONGO_URI`
   - Ensure MongoDB is running (if using local MongoDB)

### For Production (Render)

1. **Service sleeping:**
   - First request may take 30-60 seconds
   - Consider upgrading to paid tier for always-on service

2. **Database connection:**
   - Check MongoDB Atlas Network Access
   - Verify `MONGO_URI` in Render environment variables
   - Ensure database name is in URI: `/pitchpilot`

3. **Environment variables:**
   - Go to Render dashboard → Environment tab
   - Verify all required variables are set
   - Redeploy after adding/updating variables

## Still Having Issues?

1. Check the error message in the browser console
2. Check backend logs (Render dashboard or local terminal)
3. Verify all environment variables are set correctly
4. Test the health check endpoint
5. Try the API directly with curl/Postman

If the issue persists, check:
- `README.md` for setup instructions
- `DEPLOYMENT.md` for deployment-specific issues
- `MONGODB_SETUP.md` for database setup
