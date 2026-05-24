# MarendApp

MarendApp is a web application for managing and ordering meals (menus) in a canteen or similar dining facility. It features a React frontend and an Express Node.js backend.

## Project Structure and Files

### Backend (`/server`)
- `server/index.js`: The main Express server file. It provides REST API endpoints (`/api/menus`, `/api/orders`, `/api/login`, etc.) and serves the built frontend files. It reads and writes application state using `data.json`. It also includes a middleware to mock time based on the `x-mock-time` header from the frontend.
- `server/data.json`: A JSON file acting as a simple file-based database. It stores the users, daily menus, user orders, and global application settings.
- `server/package.json`: Contains the Node.js project configuration and dependencies for the backend, such as `express`, `cors`, and `nodemon`.

### Frontend (`/client`)
- `client/src/main.jsx`: The JavaScript entry point for the React application.
- `client/src/App.jsx`: The root React component. It initializes the application, handles state for the logged-in user and mocked time, and routes users to either the User Dashboard or Admin Dashboard depending on their credentials and role.
- `client/src/components/AdminDashboard.jsx`: The dashboard panel for administrators. It provides functionality for adding, editing, and deleting menus for specific dates and meal slots (e.g., morning, afternoon). It also allows admins to manage existing orders (such as marking them as picked up or archiving non-collected ones) and editing application scheduling settings.
- `client/src/components/UserDashboard.jsx`: The dashboard for regular users. It displays available menus for different dates and allows users to place food orders.
- `client/src/components/Login.jsx`: A login component that authenticates users against the mock user database located in the backend.
- `client/src/components/TimeWidget.jsx`: A developer/testing widget rendering a clock that allows the application's perceived time to be artificially changed. This ensures time-sensitive elements can be thoroughly verified.
- `client/src/index.css` & `client/src/App.css`: Global and application-wide CSS stylesheets.
- `client/package.json`: Contains Vite build configurations and React dependencies.

## How to Run

### Automated Setup (Recommended)
You can easily install dependencies and run both the frontend and backend servers together using the included Makefile.

1. **Install dependencies** for both the frontend and backend:
   ```bash
   make install
   ```
2. **Run the application**:
   ```bash
   make run
   ```
The frontend will automatically run on its default port (usually `http://localhost:5173`) and the backend API will start on `http://localhost:3000`.

### Manual Setup

If you prefer to run the components separately:

1. **Backend Server**
   ```bash
   cd server
   npm install
   node index.js
   ```

2. **Frontend Development Server**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Deployment (Fly.io / Render)

The app is packaged as a single container: the Express server serves the API
*and* the built React bundle from `client/dist`. Configuration lives in
`Dockerfile`, `fly.toml`, and `render.yaml` at the repo root.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | server | Port to listen on (defaults to 3000). |
| `DATA_DIR` | server | Directory holding `data.json`. Point at a persistent volume in prod. |
| `GOOGLE_CLIENT_ID` | server | Google OAuth — required for `/api/auth/google`. |
| `VITE_API_BASE_URL` | client (build-time) | Leave empty for same-origin deploys; set for split frontend/backend. |
| `VITE_GOOGLE_CLIENT_ID` | client (build-time) | Same Google OAuth client ID, baked into the bundle. |

### Fly.io

```bash
fly launch --no-deploy                      # if app doesn't yet exist
fly volumes create marendapp_data --region fra --size 1
fly secrets set GOOGLE_CLIENT_ID=... VITE_GOOGLE_CLIENT_ID=...
fly deploy
```

Note: `VITE_*` vars are baked into the JS bundle at build time. To pass them
into the Docker build, run:
```bash
fly deploy --build-arg VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
```

### Render.com

Push this branch, then in the Render dashboard pick **New → Blueprint** and
select this repo. Render reads `render.yaml`. After the first deploy, set
`GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in the service's Environment
tab (they're marked `sync: false` so Render prompts for them).

### Persistent data

`data.json` lives in `DATA_DIR`. On first boot, if no `data.json` exists at
that path, the server seeds it from the copy bundled in the image (so the
default admin user exists). Subsequent restarts read/write the volume copy.
