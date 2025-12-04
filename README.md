## PitchPilot (MERN) – AI-Powered HR Cold Emailer

> 🚀 **Live Demo:** [https://pitchpilot-web.onrender.com]((https://pitchpilot-ii5s.onrender.com))  
> 📡 **API:** [https://pitchpilot-api.onrender.com]((https://pitchpilot-api.onrender.com))  
> 📦 **Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step Render deployment guide.

PitchPilot is an end-to-end MERN starter that shows recruiters you can automate real outbound workflows:

- **User authentication** (JWT-based signup/signin)
- **JD-aware AI generation** (OpenAI / OpenRouter / Gemini)
- **Gmail API sending + reply tracking**
- **Auto follow-ups with LinkedIn personalization**
- **Visually polished React dashboard (Tailwind-ready)**
- **Multi-user support** - each user has their own leads, campaigns, and credentials

---

### 1. Stack & Features

| Layer     | Tech                                             | Notes |
|-----------|--------------------------------------------------|-------|
| Frontend  | React + Vite + Tailwind (you already installed)  | Dashboard, JD composer, inbox tracker |
| Backend   | Node + Express + MongoDB + Mongoose              | REST API + schedulers |
| AI        | OpenAI or OpenRouter (Claude)                    | Switch via `AI_PROVIDER` |
| Email     | Gmail API (OAuth2)                               | Sending + reply sync |
| Extras    | LinkedIn scrape via Cheerio, cron follow-ups     | Helps personalize tone |

Main endpoints:

- `POST /api/auth/signup` – Create new user account
- `POST /api/auth/signin` – Login user
- `GET /api/auth/me` – Get current user (protected)
- `POST /api/emails/generate` – JD + LinkedIn → AI draft (protected)
- `POST /api/emails/send` – send via Gmail; logs events (protected)
- `POST /api/emails/sync-replies` – fetch recent Gmail replies (protected)
- `CRUD /api/leads`, `/api/campaigns`, `/api/campaigns/:id/steps` (all protected)

**Note:** All endpoints except `/api/auth/signup` and `/api/auth/signin` require authentication via JWT token in the `Authorization: Bearer <token>` header.

---

### 2. Setup

1. **Install dependencies**
   ```powershell
   cd C:\Users\dell\OneDrive\Desktop\PitchPilot
   npm install
   cd client
   npm install
   ```

2. **Environment variables**

   Create `.env` in the repo root (same folder as `package.json`). Example:
   ```
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

   **Note:** Users can also configure their own Gmail credentials and AI API keys in their profile (stored in the User model).

   - Use Google OAuth Playground to generate `refresh_token`
   - `GMAIL_SENDER` must match the authorized Gmail account

3. **Run services**
   ```powershell
   # terminal 1 – backend
   npm run dev

   # terminal 2 – frontend
   cd client
   npm run dev
   ```

   Backend defaults to `http://localhost:4000`, Vite dev server to `http://localhost:5173`.

4. **Using the App**
   - **Sign Up**: Navigate to `http://localhost:5173/signup` (or click "Sign Up" on the signin page)
   - **Sign In**: Use your credentials to access the dashboard
   - **Dashboard**: All leads, campaigns, and emails are now user-specific
   - **User Credentials**: Users can configure their own Gmail OAuth credentials and AI API keys in their profile (future feature)

   **Note:** The first time you use the app, you'll need to sign up. All data (leads, campaigns, emails) is isolated per user.

---

### 3. Troubleshooting

**Duplicate Key Error (409) on Lead Creation:**
If you see `E11000 duplicate key error` when creating leads, you may have an old database index. Run:
```powershell
npm run fix-indexes
```
This will remove the old unique index on `email` and ensure only the compound index on `email + user` exists.

---

### 4. Gmail OAuth quick guide

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Desktop or Web)
3. Add Playground redirect `https://developers.google.com/oauthplayground`
4. In Playground:
   - Select Gmail API → `.../gmail.send` + `.../gmail.modify`
   - Exchange code for tokens
   - Copy **refresh token** and client details into `.env`

---

### 5. Frontend TODOs (Tailwind-ready)

- Landing hero showing JD input + AI preview card
- Campaign board with glassmorphic cards (status, lead counts)
- Inbox tracker with status chips (waiting, replied, follow-up due)
- Sequence timeline (Day 0 / Day 2...) with draggable cards
- Settings drawer for Gmail + AI credentials (optional)

Backend + API layer are ready; you can now focus on Tailwind styling for the React app to make it “recruiter portfolio” ready.

