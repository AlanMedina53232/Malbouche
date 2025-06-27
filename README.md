# Malbouche Backend Deployment Guide

This guide explains how to deploy the Malbouche backend to Render using a monorepo structure where the backend is inside the `backend` folder.

## Steps to Deploy Backend on Render

1. **Connect GitHub Repository**

   - Log in to your Render account.
   - Click on **New** > **Web Service**.
   - Connect your GitHub repository containing both frontend and backend.

2. **Configure Web Service**

   - **Name:** Choose a name for your backend service (e.g., `malbouche-backend`).
   - **Branch:** Select the branch to deploy (e.g., `main`).
   - **Root Directory:** Set this to `backend` to deploy only the backend folder.
   - **Build Command:** Use `npm install` to install dependencies.
   - **Start Command:** Use `npm start` to start the backend server.
   - **Environment:** Select Node.js.

3. **Set Environment Variables**

   - Add all necessary environment variables from your `.env` file, including:
     - `FIREBASE_CREDENTIALS` (as a JSON string)
     - `JWT_SECRET`
     - Any other variables your backend requires.

4. **Deploy**

   - Click **Create Web Service**.
   - Render will build and deploy your backend.
   - Monitor the build logs for any errors.

5. **Update Frontend**

   - Update your frontend app to use the Render backend URL instead of your local IP.

---
