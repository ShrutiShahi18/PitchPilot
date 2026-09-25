# PitchPilot — AI-Powered HR Cold Emailer

### 🎥 Video Demonstration

https://github.com/user-attachments/assets/ea6c5a47-c9f4-4e45-a123-55f6a6471a29

> 🚀 **Live Demo:** [https://pitchpilotpitchpilot.onrender.com](https://pitchpilotpitchpilot.onrender.com)  
> 📡 **API:** [https://pitchpilot-api.onrender.com](https://pitchpilot-api.onrender.com)  
> 📦 **Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step Render deployment guide.

![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?style=flat)
![OpenAI](https://img.shields.io/badge/OpenAI-AI-412991?style=flat&logo=openai&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail_API-OAuth2-EA4335?style=flat&logo=gmail&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![Render](https://img.shields.io/badge/Render-Live_Deployment-46E3B7?style=flat&logo=render&logoColor=black)

PitchPilot started as a simple idea: take some of the repetitive work out of cold outreach for job hunting.

You can create leads, generate emails from a job description and LinkedIn information, send messages through Gmail, and keep track of replies and follow-ups from one place. The app also supports campaigns, so outreach can be organized instead of being handled one email at a time.

The main goal of the project is to connect the pieces of an outbound workflow rather than just generate an email and stop there.

---

## What PitchPilot does

### Account and authentication

PitchPilot has JWT-based signup and signin. Protected API routes use the token from the `Authorization: Bearer <token>` header.

Each user's leads, campaigns, and email-related data are kept separate.

### AI email generation

The email generator uses a job description together with LinkedIn information to create a more relevant draft instead of starting from a generic template.

The project can work with:

- OpenAI
- OpenRouter
- Gemini

The active provider is selected through `AI_PROVIDER`.

### Gmail integration

PitchPilot connects to Gmail through OAuth2.

It can:

- send outreach emails
- record send events
- sync recent replies

The project also includes support for follow-up sequences and LinkedIn-based personalization.

### Campaigns and leads

Leads and campaigns are managed through the API, including campaign steps.

This makes it possible to organize outreach around a sequence instead of keeping everything as isolated emails.

### Frontend

The React + Vite dashboard is built around the main workflow:

- leads
- campaigns
- email generation
- inbox/reply tracking
- follow-up activity

---

## Stack

| Part | Technology |
|---|---|
| Frontend | React, Vite, Tailwind |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT |
| AI | OpenAI, OpenRouter, Gemini |
| Email | Gmail API, OAuth2 |
| Personalization | Cheerio |
| Scheduling | Cron-based follow-ups |
| Deployment | Render |

---

## API

The API is organized around authentication, email generation, sending, leads, and campaigns.

### Authentication

```text
POST /api/auth/signup
POST /api/auth/signin
GET  /api/auth/me
```

`/api/auth/signup` and `/api/auth/signin` are public.

The other protected routes require:

```text
Authorization: Bearer <token>
```

### Email workflow

```text
POST /api/emails/generate
POST /api/emails/send
POST /api/emails/sync-replies
```

`/api/emails/generate` takes job-description and LinkedIn information and returns an AI-generated draft.

`/api/emails/send` sends through Gmail and records the event.

`/api/emails/sync-replies` checks Gmail for recent replies.

### Leads and campaigns

```text
CRUD /api/leads
CRUD /api/campaigns
CRUD /api/campaigns/:id/steps
```

These routes are protected and scoped to the authenticated user.

---

## Running locally

### 1. Install dependencies

From the repository root:

```powershell
npm install

cd client
npm install
```

### 2. Add environment variables

Create a `.env` file in the repository root.

Example:

```env
NODE_ENV=development
PORT=4000

MONGO_URI=mongodb://127.0.0.1:27017/pitchpilot

AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=or-...

GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxx
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=1//0example
GMAIL_SENDER=you@yourdomain.com

JWT_SECRET=your-secret-key-change-in-production
```

Keep real credentials out of Git.

For Gmail OAuth, the project uses the Google OAuth Playground to obtain a refresh token. The Gmail sender should match the authorized account.

### 3. Start the backend

From the repository root:

```powershell
npm run dev
```

The backend runs on:

```text
http://localhost:4000
```

### 4. Start the frontend

In another terminal:

```powershell
cd client
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

---

## Using PitchPilot

The basic flow is:

```text
Create account
      ↓
Add leads
      ↓
Add campaign / campaign steps
      ↓
Generate a personalized email
      ↓
Send through Gmail
      ↓
Track events and replies
      ↓
Run follow-ups
```

The first time you use the app, create an account and sign in. Lead, campaign, and email data is associated with the logged-in user.

Users can also configure Gmail credentials and AI API keys in their profile; the profile-based credential flow is described in the project as a future feature.

---

## Gmail OAuth setup

PitchPilot uses Gmail OAuth2 for sending and reply syncing.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth 2.0 credentials.
3. Add the Google OAuth Playground redirect URI:

```text
https://developers.google.com/oauthplayground
```

4. In OAuth Playground, select the Gmail API scopes needed by the app, including:

```text
.../gmail.send
.../gmail.modify
```

5. Exchange the authorization code for tokens.
6. Put the client details and refresh token into your environment variables.

The sender address in `GMAIL_SENDER` should be the Gmail account that authorized the OAuth flow.

---

## Troubleshooting

### `E11000 duplicate key error` when creating a lead

This can happen when an older MongoDB index is still present.

Run:

```powershell
npm run fix-indexes
```

That removes the old unique email index and keeps the intended compound `email + user` index.

---

## Project structure

```text
PitchPilot/
├── client/          # React + Vite frontend
├── server/          # Express API, models, auth, mail, schedulers
├── .env
├── package.json
└── DEPLOYMENT.md
```

The frontend and backend are separate apps, with the React client talking to the Express API.

---

## Live deployment

The current public deployment is on Render:

**Frontend**

https://pitchpilotpitchpilot.onrender.com

**API**

https://pitchpilot-api.onrender.com

For the deployment-specific setup, use [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Current limitations / next improvements

PitchPilot is functional, but there are still pieces that would be natural next steps for a fuller production version:

- finish the Tailwind-based landing page and polish the dashboard further
- add the campaign board and richer inbox tracking UI
- add the sequence timeline with draggable steps
- finish the settings experience for Gmail and AI credentials
- move from demo-oriented deployment settings to production secrets and infrastructure
- add a real payment layer if Pro subscriptions are taken beyond the demo state

---

## Why I built it

PitchPilot is mainly an experiment in connecting AI with a workflow that is actually useful.

Generating text is the easy part. The interesting part is everything around it: authentication, data isolation, Gmail OAuth, reply tracking, campaigns, follow-ups, and keeping the different pieces of the system connected through an API.
