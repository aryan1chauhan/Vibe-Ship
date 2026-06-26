# CrunchAI — Deployment Guide
## Getting a Live Google Cloud URL (Free, No Card)

---

## The Honest Situation

Antigravity and AI Studio both deploy to **Cloud Run**, which requires a GCP billing account (needs a card). Since you have no card, here are two real options:

| Option | Card needed? | Satisfies "Google Cloud"? | Effort |
|---|---|---|---|
| **Firebase Hosting + App Hosting** | ❌ No | ✅ Yes (Firebase is Google) | Medium |
| **Antigravity → Cloud Run** | ✅ Yes (family member) | ✅ Yes | Easy |

**Recommendation**: Try Firebase first. If it fails, ask a family member to verify one account for you — ₹0 is charged, it's identity verification only.

---

## Option A — Firebase App Hosting (Free, No Card)

Firebase App Hosting natively supports Next.js and deploys to Google's infrastructure. The Spark (free) plan does not require a credit card.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This opens Google OAuth in your browser. Sign in with your Google account.

### Step 3: Initialize Firebase in your project

```bash
cd crunchai
firebase init hosting
```

When prompted:
- **What do you want to use as your public directory?** → `.next`
- **Configure as a single-page app?** → `No`
- **Set up automatic builds with GitHub?** → `No` (for now)

### Step 4: Add a `firebase.json` config for Next.js

Replace your `firebase.json` with:

```json
{
  "hosting": {
    "public": ".next/static",
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 5: Build and deploy

```bash
npm run build
firebase deploy --only hosting
```

Firebase will give you a URL like:
```
https://crunchai-xxxxx.web.app
```

**That's your submission URL.**

### Step 6: Set environment variables

For Firebase App Hosting (if you use the full App Hosting feature instead of just static hosting):

```bash
firebase apphosting:secrets:set GEMINI_API_KEY
firebase apphosting:secrets:set SUPABASE_SERVICE_ROLE_KEY
```

Public vars go in `apphosting.yaml`:

```yaml
env:
  - variable: NEXT_PUBLIC_SUPABASE_URL
    value: "your_supabase_url"
  - variable: NEXT_PUBLIC_SUPABASE_ANON_KEY
    value: "your_supabase_anon_key"
  - variable: NEXT_PUBLIC_APP_URL
    value: "https://crunchai-xxxxx.web.app"
```

---

## Option B — Antigravity → Cloud Run (Best if card available)

This is the cleanest path and what the hackathon explicitly mentions.

### Step 1: Download Antigravity

Go to the Google Developers site and download Antigravity IDE for Windows.

### Step 2: Open your project

Open the `crunchai` folder in Antigravity.

### Step 3: Install the Cloud Run MCP Server

1. In the Agent Manager panel, click the `...` menu
2. Select **MCP Store**
3. Search for **Cloud Run**
4. Click **Install**
5. Enter your Google Cloud Project ID when prompted

### Step 4: Ask Antigravity to deploy

Type this in the Agent Manager:

```
Deploy this Next.js application to Google Cloud Run. 
Set the following environment variables:
- GEMINI_API_KEY=<your_key>
- SUPABASE_SERVICE_ROLE_KEY=<your_key>
- NEXT_PUBLIC_SUPABASE_URL=<your_url>
- NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
- NEXT_PUBLIC_APP_URL=<will be set after deploy>
```

Antigravity will generate a Dockerfile, build, and deploy to Cloud Run. Review and accept each step.

### Step 5: Get your URL

After deployment, Antigravity shows the Cloud Run service URL:
```
https://crunchai-xxxxxxxxxx-uc.a.run.app
```

Update `NEXT_PUBLIC_APP_URL` to this URL and redeploy.

---

## After Deployment (Both Options)

### Update Supabase OAuth redirect URLs

Go to Supabase → Authentication → URL Configuration:

```
Site URL: https://your-live-url.com
Redirect URLs: https://your-live-url.com/auth/callback
```

### Update Google OAuth

Go to Google Cloud Console → APIs → Credentials → your OAuth client:

Add to **Authorized redirect URIs**:
```
https://your-live-url.com/auth/callback
```

### Test the full flow end to end

```
1. Open the live URL
2. Sign in with Google
3. Add a task: "Submit project by June 29 2pm"
4. Watch the AgentThinkingLog fire
5. See the sprint plan generated
6. Mark a session as missed → verify auto-replan fires
7. Check the Dashboard brief loads
```

If all 7 steps work, you're ready to submit.

---

## Submission Checklist

```
□ Live URL is publicly accessible
□ Google OAuth works on the live URL
□ Supabase redirect URLs updated
□ Agent planning works end-to-end on live URL
□ Auto-replan fires on session miss
□ URL stays live until evaluation ends
□ GitHub repo is public with README
□ Google Doc is shared with "anyone with link"
□ BlockseBlock submission done before June 29, 2 PM
```
