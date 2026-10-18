# Steer Evidence Studio - Architecture & System Design

## Overview
Steer Evidence Studio is an enterprise-grade full-stack research auditing and social content generation platform. It converts complex scientific research papers into rigorous, traceable, fact-checked Instagram carousel posts and short-form assets with cryptographic claim ledgers.

## Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript (`server.ts`)
- **AI Integration**: Google GenAI SDK (`@google/genai`), Gemini models (`gemini-2.5-flash` / `gemini-3.5-flash-lite`)
- **Authentication**: Firebase Auth + Google Identity Services (GIS) JWT fallback + Synthetic review session tokens for seamless cross-domain & Render deployment
- **Database & Storage**: Firestore / PostgreSQL with Drizzle ORM
- **Deployment**: Optimized for Render Web Services (Node.js runtime with strict memory limits and chunked asset building)
