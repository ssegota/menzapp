# Google OAuth Setup Guide for MarendApp

This guide walks you through creating a Google Cloud OAuth 2.0 Client ID and configuring it for MarendApp's "Sign in with Google" feature.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project dropdown** at the top-left (next to "Google Cloud")
3. Click **New Project**
4. Enter a project name (e.g., `MarendApp`)
5. Click **Create**
6. Make sure the new project is selected in the dropdown

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

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Google button doesn't appear | Check that `VITE_GOOGLE_CLIENT_ID` is set in `client/.env` and restart the dev server |
| "Error 403: access_denied" | The user is not in the test users list (see Step 2.6) |
| "Error 400: redirect_uri_mismatch" | Add `http://localhost:5173` to both Authorized JS origins AND redirect URIs |
| "idpiframe_initialization_failed" | Make sure third-party cookies are enabled in your browser, or try in an incognito window |
| Login succeeds but no user in app | Check the server console for errors in the `/api/auth/google` endpoint |
