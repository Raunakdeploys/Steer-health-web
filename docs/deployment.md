# Steer Evidence Studio — Production Deployment Guide

This guide details the deployment procedure for **Steer Evidence Studio** on cloud hosting platforms including **Render**, **Google Cloud Run**, and standalone VPS containers.

---

## 1. Quick Deployment on Render

### Step 1: Create a Web Service on Render
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your repository: `Raunakdeploys/Steer-health-web`.
4. Configure the service settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free or Starter (>= 512MB RAM)

### Step 2: Configure Environment Variables
In the Render Service Settings, under the **Environment** tab, add:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production Express mode and static bundle serving |
| `PORT` | `10000` (Render defaults to variable `$PORT`) | Server automatically binds to `0.0.0.0:$PORT` |
| `GEMINI_API_KEY` | `AIzaSy...` | Required for AI paper extraction and studio content generation |
| `FIREBASE_PROJECT_ID` | `gen-lang-client-0652918589` | Project ID for cloud persistence |

*(Note: Baseline deterministic fallbacks and localStorage persistence operate automatically even if external API keys are omitted or temporarily unavailable.)*

---

## 2. Pre-Configured Deployment Features

The codebase has already been engineered to handle all common deployment hurdles:

1. **Host Header Protection (`allowedHosts`)**:
   - In `vite.config.ts`: `server.allowedHosts: true as const` and `preview.allowedHosts: true as const`.
   - In `server.ts`: `createViteServer({ server: { allowedHosts: true } })`.
   - Result: No `Blocked request. This host is not allowed` errors on `*.onrender.com` or custom domains.

2. **TypeScript Engine in Production (`tsx`)**:
   - `tsx` is listed under `dependencies` in `package.json`, ensuring `npm start` (`tsx server.ts`) runs without missing binary errors after production pruning.

3. **Dynamic Port Binding**:
   - The server binds cleanly to `process.env.PORT || 3000` on `0.0.0.0`, satisfying both local dev (`3000`) and cloud platform port allocations (Render uses random ports like `10000`).

4. **Production Asset Serving**:
   - `server.ts` checks if `dist/index.html` exists. When deployed in production, Express serves pre-built static assets from `dist/` and falls back to SPA routing for client navigation.

---

## 3. Health Checks & Verification

- **Health Check Endpoint:** `GET /api/health`
  ```bash
  curl https://steer-health-web-3.onrender.com/api/health
  ```
  Expected Response:
  ```json
  {
    "status": "ok",
    "hasApiKey": true,
    "timestamp": "2026-10-18T..."
  }
  ```

- **Acceptance Test Execution:**
  ```bash
  npm test
  ```
  Runs all 24 automated acceptance and failure-injection tests.

---

## 4. Production Checklist

- [x] Dependencies installed (`npm install`)
- [x] TypeScript type checking passed (`npm run lint` / `tsc --noEmit`)
- [x] Production bundle compiled (`npm run build` generates `dist/`)
- [x] All 24 acceptance tests passing (`npx tsx src/tests/run-all-tests.ts`)
- [x] Host allowlist configured for Render domains
- [x] Email-keyed database persistence enabled with resilient offline fallback
- [x] Health check route responding at `/api/health`
