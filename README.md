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
