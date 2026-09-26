# ArchXperience

> **Interactive Architecture & Spatial Presentation Engine**  
> *Don’t just present the design. Let them experience it.*

ArchXperience turns static architectural slides and heavy PDF deliverables into interactive, navigable digital experiences.

---

## What It Does

Architects, landscape architects, and interior designers spend days crafting presentations that communicate through flat, passive slides. Stakeholders lose spatial context, floor plans remain detached from perspective renders, and technical material specifications get buried in appendix tables.

ArchXperience transforms those presentations into interactive digital journeys:
- Stakeholders tap hotspots directly on drawings to enter rooms and inspect structural specs.
- Interactive split sliders compare proposed schemes against existing site conditions in real time.
- The presentation maintains a canonical 1920×1080 spatial canvas that scales cleanly to any device.
- Designers publish client-ready presentations with zero software downloads or email attachment limits.

---

## Core Workflow

```
Describe
   ↓
Generate
   ↓
Review
   ↓
Improve
   ↓
Edit
   ↓
Publish
   ↓
Experience
```

1. **Describe**: Enter an architectural design brief, project category, target audience, and style.
2. **Generate**: AI synthesizes a structured presentation complete with spatial concepts, drawings, and starter hotspots.
3. **Review**: AEC Intelligence reviews the deck against 15 deterministic spatial standards and generates narrative critique.
4. **Improve**: AI Slide Assistant suggests non-destructive improvements with current vs. proposed diffs.
5. **Edit**: Refine typography, align elements, adjust z-indices, and add technical callouts in the 1920×1080 Studio.
6. **Publish**: Generate an immutable, client-ready link backed by Supabase cloud storage.
7. **Experience**: Clients, juries, or investors explore the spatial deck interactively at their own pace.

---

## Features

- **AI Presentation Generator**: Synthesizes 4–8 slide architectural decks with spatial narratives, concept pillars, and starter components via Gemini 2.5 Flash.
- **Interactive Studio**: Canonical 1920×1080 canvas with resize handles, rotation, 16px grid snapping, element alignment, z-ordering, and multi-selection.
- **Experience Review**: Comprehensive deck review combining rule-based deterministic layout checks with AI narrative critique.
- **AEC Intelligence**: 15 architectural rules verifying text readability, font scale, technical spec completeness, and drawing hotspot coverage.
- **AI Slide Improvement**: Proposes text phrasing and typography refinements with side-by-side diff previews, expected benefit explanations, and atomic undo/redo.
- **Hotspot Suggestions**: Automated advisor detects drawing boundaries and suggests technical callouts with structural specs and image overlays.
- **Technical Specification Normalization**: Structures raw material and structural descriptions into standardized architectural schedules.
- **Audience Tuner**: Tailors presentation tone and critique for three distinct AEC personas: *Client Pitch*, *Academic Jury*, and *Investor / Developer*.
- **Before / After Iteration Sliders**: Real-time fluid split comparison sliders comparing proposed designs with existing brownfield sites.
- **Public Interactive Viewer**: Dedicated full-screen client viewing mode with auto-hiding navigation, slide transitions, keyboard controls, and zero authoring clutter.
- **Cloud & Local Repository**: Seamless dual-engine architecture supporting both cloud Supabase PostgreSQL persistence and instant offline guest mode.

---

## Technology Stack

ArchXperience is built exclusively with production-grade modern web technologies:

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom architectural color palette (`#0C0E12`, `#14181E`, `#C8613E` terracotta)
- **Animation & Transitions**: Framer Motion
- **State Management**: Zustand (modular stores for auth, projects, editor transactions, and viewer)
- **Icons**: Lucide React
- **Cloud Infrastructure**: Supabase (PostgreSQL, Row-Level Security, Storage, Authentication)
- **Serverless AI**: Supabase Edge Functions (Deno runtime)
- **AI Model**: Google Gemini 2.5 Flash

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   ArchXperience Client                 │
│         (React 19 + TypeScript + Tailwind + Zustand)   │
└───────────────────────────┬────────────────────────────┘
                            │
               Repository Provider Abstraction
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  [ Cloud Workspace ]             [ Guest Workspace ]
Supabase Repository Pattern     LocalStorage Repository
            │                               │
            ├───────────────────────────────┤
            ▼                               ▼
    Supabase PostgreSQL             Browser LocalStorage
    Row-Level Security (RLS)        Zero-config sandbox
    presentation-assets Storage     Instant offline evaluation
            │
            ▼
┌────────────────────────────────────────────────────────┐
│               Supabase Edge Functions                  │
│       (Protected Deno runtime • Bearer Token Auth)     │
│   • generate-presentation                              │
│   • review-presentation                                │
│   • assist-slide                                       │
└───────────────────────────┬────────────────────────────┘
                            │ Server-Side Only
                            ▼
┌────────────────────────────────────────────────────────┐
│               Google Gemini 2.5 Flash                  │
│          (AEC Prompts + Structured JSON Output)        │
└────────────────────────────────────────────────────────┘
```

---

## Security & Isolation

1. **Zero Client Secret Exposure**: The `GEMINI_API_KEY` is maintained strictly within the Supabase Edge Function environment (`Deno.env.get("GEMINI_API_KEY")`). It is never present in frontend source code, client environment variables, or client build bundles.
2. **PostgreSQL Row-Level Security (RLS)**: Authenticated users can only read, write, update, and delete their own projects (`auth.uid() = user_id`).
3. **Public Viewer Access**: Public viewers query projects through a dedicated Postgres RLS policy that strictly checks `is_published = true`. Unpublished drafts are completely inaccessible to unauthenticated users.
4. **Protected Edge Functions**: All AI Edge Functions verify the user's `Authorization: Bearer <token>`. Unauthenticated requests immediately return HTTP 401 Unauthorized.
5. **Local Deterministic Guest Mode**: Guest users run deterministic architectural checks entirely client-side without sending data to external APIs.

---

## Running Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### 2. Clone and Install
```bash
git clone https://github.com/saidnayak/archxperience.git
cd archxperience
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

*(If running without Supabase, the application automatically launches in offline guest mode backed by LocalStorage).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Quality Validation
```bash
# Run linter
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment

### Frontend (Vercel / Netlify / Cloudflare Pages)
1. Link your git repository to your hosting provider.
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Backend & Edge Functions (Supabase)
1. Run the database migration script located at `supabase/migrations/20260915_phase6_schema.sql`.
2. Configure edge function secrets:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key
   ```
3. Deploy edge functions:
   ```bash
   npx supabase functions deploy generate-presentation
   npx supabase functions deploy review-presentation
   npx supabase functions deploy assist-slide
   ```

---

## License

ArchXperience is licensed under the MIT License.
