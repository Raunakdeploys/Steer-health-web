# Steer Evidence Studio - Render Deployment Guide

## Render Optimization & Memory Management
To deploy successfully on Render (including free tier 512MB RAM constraints):

1. **Build Configuration**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start` (runs `tsx server.ts`)
   - Node Version: Node 20+

2. **Memory Optimization**:
   - `vite.config.ts` utilizes `rollupOptions` manual chunking (`vendor`, `firebase`, `pdf`) to keep individual bundle sizes small and prevent OOM (Out Of Memory) errors during Vite builds.
   - Esbuild minification ensures fast, low-overhead compilation.

3. **Environment Variables on Render**:
   - `PORT`: `3000` (or automatically assigned by Render)
   - `GEMINI_API_KEY`: Your Google GenAI API key
   - `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc. (if using Firebase backend)
   - `DATABASE_URL`: PostgreSQL connection string (if using SQL backend)
