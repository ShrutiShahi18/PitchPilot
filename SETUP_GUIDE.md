# PitchPilot Setup Guide

## Requirements

Before starting, make sure the following are installed:

- Node.js (v18+ recommended)
- MongoDB
- Git
- Gmail account for API integration

---

# 1. Clone the Project

```bash
git clone <your-repository-url>
cd pitchpilot
```

---

# 2. Install Dependencies

## Frontend

```bash
cd client
npm install
```

## Backend

```bash
cd ../server
npm install
```

---

# 3. Configure Environment Variables

Create a `.env` file inside the `server` folder.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REFRESH_TOKEN=your_google_refresh_token

EMAIL_USER=your_email@gmail.com
```

---

# 4. Start MongoDB

If using local MongoDB:

```bash
mongod
```

Or use MongoDB Atlas cloud database.

---

# 5. Run the Backend

Inside the `server` folder:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

---

# 6. Run the Frontend

Inside the `client` folder:

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# 7. Gmail API Setup

## Enable Gmail API

1. Go to Google Cloud Console
2. Create a project
3. Enable Gmail API
4. Configure OAuth Consent Screen
5. Create OAuth Credentials

---

## Add Credentials

Copy credentials into your `.env` file.

---

# 8. Features Included

- AI-powered cold email generation
- Gmail sending integration
- Campaign management
- Lead management
- Responsive SaaS dashboard
- Modern dark-mode UI
- MERN stack architecture

---

# 9. Production Deployment

Recommended platforms:

## Frontend
- Vercel
- Netlify

## Backend
- Render
- Railway

## Database
- MongoDB Atlas

---

# 10. Troubleshooting

## Port already in use

Change the port inside `.env`.

---

## Gmail authentication issue

Recheck:
- OAuth credentials
- Refresh token
- Gmail API permissions

---

## MongoDB connection error

Verify:
- MongoDB service is running
- Atlas IP whitelist
- Correct connection string

---

# Tech Stack

- React.js
- Node.js
- Express.js
- MongoDB
- Tailwind CSS
- Gmail API
- JWT Authentication

---

# Support

This package includes source code access and setup documentation for the PitchPilot platform.
