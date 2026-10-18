# Steer Evidence Studio — Architectural Blueprint

## 1. Executive Summary

**Steer Evidence Studio** is an enterprise-grade scientific evidence translation and content studio. It ingests complex biomedical papers, enforces strict epistemic modesty and provenance tracking across every factual claim, and publishes certified multi-format social assets (Instagram Carousels, Static Posts, and Reels Storyboards) without hallucination or overstatement.

---

## 2. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SCIENTIFIC INGESTION PIPELINE                   │
│                                                                        │
│   [PDF Upload / DOI / PubMed]                                          │
│              │                                                         │
│              ▼                                                         │
│   [PDF.js Page Slicer & Layout Parser]                                 │
│              │                                                         │
│              ▼                                                         │
│   [Passage Anchor Engine] ─── Verbatim Text + Section + Page Number     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EVIDENCE & CLAIM EXTRACTION                     │
│                                                                        │
│   [Gemini AI / Deterministic Fallback Extractor]                       │
│              │                                                         │
│              ├─► Claim Formulation (What did the study actually find?)  │
│              ├─► Population Boundary (e.g. "32 young trained males")   │
│              ├─► Study Design Classification (RCT vs Cohort vs In-Vitro│
│              └─► Verbatim Source Passage Linking                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                12-RULE AUTOMATED SCIENTIFIC VALIDATION ENGINE          │
│                                                                        │
│   Rule 1: Evidence Linkage (Orphan claims blocked)                     │
│   Rule 2: Page Reference Validity (Out-of-range pages blocked)         │
│   Rule 3: Verbatim Quotation Reconciliation (Fails if unverified)      │
│   Rule 4: Numerical & Metric Consistency (Stat mismatch detector)      │
│   Rule 5: Denominator & Timeframe Completeness                         │
│   Rule 6: Study Design & Causal Inference (Blocks observational causal)│
│   Rule 7: Population Boundary & Generalizability                       │
│   Rule 8: Study Limitations Preservation                               │
│   Rule 9: Epistemic Modesty (Blocks "proves", "always", "guaranteed")  │
│   Rule 10: Conflicting Evidence Passage Reconciliation                 │
│   Rule 11: Safety Policy (Blocks miracle cures, prescription drug push)│
│   Rule 12: Source OCR & Readability Check (Blocks unreadable scans)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     INVESTIGATION & EDITORIAL DESK                     │
│                                                                        │
│   Human-in-the-Loop Review:                                            │
│   - Approve / Reject / Flag claims                                     │
│   - Edit claim text and certainty qualifiers                           │
│   - Reactive Downstream Invalidation Engine (Tags affected slides)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CONTENT STUDIO MULTI-FORMAT ENGINE                 │
│                                                                        │
│   ┌─────────────────────┐ ┌────────────────────┐ ┌───────────────────┐  │
│   │ Instagram Carousel  │ │ 1080x1080 Static   │ │ 9:16 Video Reel   │  │
│   │ 5-7 Slide Storyline │ │ Editorial Graphic  │ │ Timed Storyboard  │  │
│   │ - Hook / Findings   │ │ - Bold Headline    │ │ - Visual directions│ │
│   │ - Evidence Stamps   │ │ - Primary Stat     │ │ - Spoken voiceover│  │
│   │ - Limitations Slide │ │ - Source Citation  │ │ - 26s pacing cues │  │
│   │ - Action Takeaway   │ │ - Plain Caption    │ │ - Study outro     │  │
│   └─────────────────────┘ └────────────────────┘ └───────────────────┘  │
│                                   │                                    │
│   Dual-Language Mode: English & Hinglish Vernacular Support            │
│   Downstream Guard: Blocks generation if unapproved claims are present │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  PERSISTENCE, AUDIT & EXPORT LAYER                     │
│                                                                        │
│   Firestore Keyed by Email (`users/{email}/[papers|claims|studio]`)    │
│   Local Cache Fallback (Zero data loss even in offline mode)           │
│   Export: Full JSON Audit Log + Formatted Markdown Submission Packet   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Subsystems

### 3.1. Scientific Ingestion & Optical Analysis
- **Parser:** Uses a multi-tiered PDF text layout parser (`src/utils/pdfExtractor.ts`).
- **Chunking:** Extracts individual pages and segments them into semantic sections (`Abstract`, `Introduction`, `Methods`, `Results`, `Discussion`, `Limitations`).
- **Scanned Detection:** Detects pages with low character counts or unparsable binary streams, assigning `extraction_status: 'NO_TEXT'` or `'LOW_CONFIDENCE'`.

### 3.2. Claim Ledger & 12-Rule Verification Engine
- Every claim is treated as a verifiable atomic thesis.
- The verification engine (`src/utils/validationEngine.ts`) executes synchronously across all claims whenever an intake occurs or an edit is saved.
- Claims receive an automated status:
  - `READY_FOR_HUMAN_REVIEW` (All checks pass, awaiting editor sign-off)
  - `FLAGGED` (Warnings found, such as missing timeframes or broad wording)
  - `BLOCKED` (Severe violations: unlinked evidence, miracle cures, or statistical contradiction)
  - `HUMAN_APPROVED` (Explicitly verified by human reviewer)
  - `REJECTED` (Disqualified by reviewer)

### 3.3. Downstream Invalidation & Propagation Engine
- Managed by `src/utils/impactAnalysis.ts`.
- When an editor changes a claim's text, status, or evidence links, the impact analysis engine recursively checks all carousels, static posts, and reels.
- Any deliverable containing the modified claim is flagged with `NEEDS_REREVIEW` and an alert banner is rendered in the Studio.

### 3.4. Dual-Mode Multi-Format Content Studio
- **Carousel:** Supports Instagram 4:5 and 1:1 formats with interactive slide dragging, mobile simulator preview, and slide-level evidence badges.
- **Static Post:** Editorial square card designed for high readability with clinical qualification footnotes.
- **Reel Script:** Formatted 9:16 vertical video director script with spoken dialogue, visual directions, duration timestamps, and citations.
- **Hinglish Vernacular Engine:** Provides accessible Indian-English translation for key findings and captions to reach broader audiences without diluting scientific precision.

---

## 4. Multi-Tenant Data & Security Architecture

1. **Email-Keyed Tenant Partitioning:**
   - User identity is extracted from authentication headers (`req.user.email` or `userKey`).
   - Firestore paths: `users/{user_email}/papers/{paper_id}`, `users/{user_email}/claims/{claim_id}`, `users/{user_email}/deliverables`.
   - Complete isolation between users; no shared data pollution.

2. **Offline-First Resilience:**
   - Both backend and frontend include automatic fallbacks.
   - If Firestore or Cloud SQL credentials are unconfigured or temporarily unreachable, client-side LocalStorage preserves the workspace and baseline clinical papers are served without application crashes.

3. **Cloud & Host Configuration:**
   - Server binds on `0.0.0.0:${PORT}` (supporting port 3000 in dev and Render's variable `$PORT`).
   - `vite.config.ts` and `server.ts` configure `allowedHosts: true` to prevent origin-blocking across Render subdomains (`*.onrender.com`).
