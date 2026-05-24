# Google OAuth Setup Guide for MarendApp

This guide walks you through creating a Google Cloud OAuth 2.0 Client ID and configuring it for MarendApp's "Sign in with Google" feature.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project dropdown** at the top-left (next to "Google Cloud")
3. Click **New Project**
4. Enter a project name (e.g., `MarendApp`)
5. Click **Create**
6. Make sure the new project is selected in the dropdown

## Domain Restriction (unipu.hr)

Google login is hard-restricted to accounts in the `unipu.hr` Google
Workspace. The backend verifies the `hd` (hosted domain) claim Google signs
into every ID token — anyone signing in with a personal `@gmail.com` or any
other Workspace domain gets a 403 with the message:

> Google prijava je dozvoljena samo s unipu.hr računom - zatražite podatke za
> login od administratora.

The frontend also passes `hosted_domain="unipu.hr"` to the Google account
picker as a UX hint, but the actual gate is the backend `hd` check in
[server/index.js](server/index.js) — never trust the client.

If you need to widen or change the allowed domain, edit both:
- the `hd !== 'unipu.hr'` check in `app.post('/api/auth/google', …)` in
  [server/index.js](server/index.js)
- the `hosted_domain="unipu.hr"` prop on `<GoogleLogin>` in
  [client/src/components/Login.jsx](client/src/components/Login.jsx)

## Step 2: Configure the OAuth Consent Screen

Before creating credentials, you need to set up the consent screen that users will see when signing in.

1. In the left sidebar, go to **APIs & Services → OAuth consent screen**
2. Click **Get Started** (or **Configure Consent Screen**)
3. Fill in the required fields:
   - **App name**: `MarendApp`
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
4. Click **Save and Continue**
5. On the **Scopes** page:
   - Click **Add or Remove Scopes**
   - Select `email`, `profile`, and `openid`
   - Click **Update** → **Save and Continue**
6. On the **Test users** page:
   - While in "Testing" mode, only listed test users can sign in
   - Click **Add Users** and add the Gmail addresses you want to test with
   - Click **Save and Continue**
7. Click **Back to Dashboard**

> **Note:** While the app is in "Testing" status, only the test users you added can log in. To allow anyone to sign in, you'll need to click **Publish App** on the consent screen page. For internal/university use, "Testing" mode with added users is fine.

## Step 3: Create OAuth 2.0 Client ID

1. In the left sidebar, go to **APIs & Services → Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. For **Application type**, select **Web application**
4. Set the **Name** to `MarendApp Web Client`
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:5173` (for local development)
   - Your production URL if you have one (e.g., `https://marendapp.example.com`)
6. Under **Authorized redirect URIs**, click **+ Add URI** and add:
   - `http://localhost:5173` (for local development)
7. Click **Create**

## Step 4: Copy Your Client ID

After creating the client, a dialog will appear showing your:
- **Client ID** — looks like: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret** — you do NOT need this for this integration

Copy the **Client ID**.

## Step 5: Configure MarendApp

### Frontend (client)

Create a file `client/.env` with your Client ID:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### Backend (server)

Create a file `server/.env` with the same Client ID:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

> **Important:** The `.env` files are gitignored and should never be committed to version control. The `.env.example` files in each directory show the required format.

## Step 6: Test It

1. Start the app with `make run`
2. On the login page, you should see a **"Sign in with Google"** button
3. Click it — a Google popup will appear
4. Sign in with one of the test users you added in Step 2
5. You should be logged in and redirected to the user dashboard

## Step 7: Deploying to Production (Fly.io)

On Fly.io the Express server serves both the API **and** the React bundle
from the same origin (e.g. `https://menzapp.fly.dev`). This makes the OAuth
setup simpler than a split deploy: there's only one URL to register with
Google, and no CORS configuration to think about.

These steps assume the app is already deployed to Fly.io — see the
"Deployment" section of [README.md](README.md) for the initial Fly setup.

### 7.1 Update Google authorized origins

In the Google Cloud Console (**APIs & Services → Credentials → your OAuth
client**), add your Fly URL to both lists. The site already exists at
`https://menzapp.fly.dev` (replace with your actual app URL if different).

**Authorized JavaScript origins**
- `http://localhost:5173` *(local dev)*
- `https://menzapp.fly.dev`
- `https://<your-custom-domain>` *(only if you've added one in Fly)*

**Authorized redirect URIs**
- Same URLs as above

Click **Save**. Changes can take a few minutes to propagate.

### 7.2 Set the backend secret on Fly.io

The backend needs the Client ID to verify tokens Google returns to the
frontend. Set it as a Fly secret (these are runtime env vars, encrypted at
rest):

```bash
flyctl secrets set GOOGLE_CLIENT_ID=<your-client-id> --app menzapp
```

Fly automatically rolls the machines to pick up the new secret.

### 7.3 Rebuild the frontend with the Client ID

The frontend reads `VITE_GOOGLE_CLIENT_ID` from `import.meta.env` — Vite
**bakes this value into the JS bundle at build time**. A Fly secret alone
isn't enough: you have to pass it as a Docker build arg so the
`npm run build` step inside the image picks it up.

```bash
flyctl deploy --app menzapp --build-arg VITE_GOOGLE_CLIENT_ID=<your-client-id>
```

Without `--build-arg`, the Google button stays hidden because the bundled
client sees `VITE_GOOGLE_CLIENT_ID` as `undefined` and the conditional in
[client/src/components/Login.jsx](client/src/components/Login.jsx)
(`{googleClientId && (...)}`) skips rendering it.

> **Tip:** to avoid retyping the Client ID, export it in your shell first:
> ```bash
> export GOOGLE_CLIENT_ID=<your-client-id>
> flyctl secrets set GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID --app menzapp
> flyctl deploy --app menzapp --build-arg VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
> ```

### 7.4 Verify

1. Open `https://menzapp.fly.dev` in a browser.
2. The Google sign-in button should appear on the login page.
3. Click it → Google popup → log in with a test user (from Step 2.6).
4. In DevTools → Network, you should see
   `POST https://menzapp.fly.dev/api/auth/google` return
   `{success: true, user: ...}`.
5. You should be logged in and land on the user dashboard.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Google button doesn't appear in dev | Check that `VITE_GOOGLE_CLIENT_ID` is set in `client/.env` and restart the Vite dev server |
| Google button doesn't appear in prod | You set the Fly secret but forgot `--build-arg VITE_GOOGLE_CLIENT_ID=...` on `flyctl deploy`. The frontend bundle was built without the ID. |
| "Error 403: access_denied" | The user is not in the test users list (see Step 2.6) |
| "Error 400: redirect_uri_mismatch" | Add the current site URL to both Authorized JS origins AND redirect URIs in Google Console |
| "idpiframe_initialization_failed" | Make sure third-party cookies are enabled in your browser, or try in an incognito window |
| Login succeeds but no user in app | Check `flyctl logs --app menzapp` for errors from the `/api/auth/google` endpoint |
| `401 Nevažeći Google token` from backend | The `GOOGLE_CLIENT_ID` secret on Fly doesn't match the one used to build the frontend (or isn't set). Both must be the same Client ID. Logs will show `Wrong recipient, payload audience != requiredAudience`. |
| `403 Google prijava je dozvoljena samo s unipu.hr računom…` | User signed in with a non-`unipu.hr` Google account. Either add them to the Workspace or use the administrator username/password login (link under the Google button). |
