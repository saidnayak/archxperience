# ArchXperience — Architectural Presentation Engine

> **Phase 8: AEC Intelligence Engine Complete**  
> *AEC Design Critique + Deterministic Layout Checks + Slide Assistant + Hotspot Advisor + Specification Normalizer + Audience Tone Tuner*

ArchXperience is a presentation platform crafted specifically for architects, urban designers, and spatial studios. It pairs dynamic visual storytelling (interactive hotspots, before/after renovation sliders, aspect-ratio locked slides, and fullscreen presentation modes) with a resilient hybrid cloud/local repository architecture.

---

## Architecture Overview

```
                          ┌────────────────────────────┐
                          │   ArchXperience Client     │
                          │ (React 19 + TypeScript)   │
                          └─────────────┬──────────────┘
                                        │
                         Repository Provider Abstraction
                                        │
               ┌────────────────────────┴────────────────────────┐
               ▼                                                 ▼
      [ Cloud Workspace ]                              [ Guest Workspace ]
   SupabaseProjectRepository                        LocalStorageProjectRepository
               │                                                 │
   ┌───────────┴───────────┐                         ┌───────────┴───────────┐
   │ PostgreSQL Normalized │                         │ Browser LocalStorage  │
   │ Row-Level Security    │                         │ Instant offline access│
   │ presentation-assets   │                         │ Zero-config sandbox   │
   └───────────────────────┘                         └───────────────────────┘
```

### Core Tenets of Phase 6:
1. **Zero Exposure of Secret Keys**: ArchXperience exclusively uses anonymous / public client keys (`VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`). All authorization and data isolation is enforced at the database level using PostgreSQL Row-Level Security (`auth.uid() = user_id`).
2. **Normalized Relational Schema**: Projects, slides, and individual canvas elements are stored in relational tables (`profiles`, `projects`, `slides`, `elements`) with foreign keys, cascading deletes, and indexed query paths, rather than fragile opaque JSON blobs.
3. **Scoped Asset Storage**: Media uploads are validated (MIME type + 15MB architectural render cap) and stored in the `presentation-assets` bucket under strict path ownership (`{user_id}/{project_id}/{filename}`).
4. **Resilient Offline / Guest Mode**: Users without a Supabase account or offline developers can click **"Continue as Guest Architect"** to launch a full-featured local repository backed by `localStorage` and client-side data URLs.
5. **Real Cloud Publishing**: Projects can be published with unique, immutable share slugs. Public viewer routes (`/view/:shareSlug`) require no authentication, query only published projects, and instantaneously revoke viewer access when unpublished.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- A **Supabase** project (free or pro tier at [supabase.com](https://supabase.com))

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url> archxperience
cd archxperience
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project parameters:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

> ⚠️ **SECURITY WARNING**: Never put `service_role` keys into `.env` or client code. The frontend only requires the public anon key.

### 4. Database Setup & Migrations
ArchXperience includes a single, idempotent SQL migration that provisions the tables, constraints, triggers, indexes, and RLS policies.

1. Navigate to your Supabase Dashboard: **SQL Editor**.
2. Open [`supabase/migrations/20260915_phase6_schema.sql`](./supabase/migrations/20260915_phase6_schema.sql).
3. Copy and execute the script.

The migration configures:
- **`public.profiles`**: Automatically populated upon user sign-up via trigger on `auth.users`.
- **`public.projects`**: Architectural presentation metadata, aspect ratio, theme, and publication slug.
- **`public.slides`**: Slides with ordering index, background colors, custom images, transitions, and notes.
- **`public.elements`**: Canvas elements (headings, body copy, images, before/after comparisons, hotspots, floor plan badges, stat cards) with relational foreign key to slides.
- **RLS Policies**: Full tenant isolation for authenticated users + public read policy for published projects and their slides/elements.
- **Storage Policies**: Scoped bucket configuration for `presentation-assets`.

### 5. Storage Bucket Configuration
The migration automatically creates and configures the `presentation-assets` bucket. If creating manually via Supabase Dashboard:
- Bucket Name: `presentation-assets`
- Public: `true` (to allow public viewers to see project assets)
- File size limit: `15MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/svg+xml, image/gif, image/avif`

---

## Normalized Database Schema

```
┌──────────────────┐       1:N       ┌──────────────────┐
│ auth.users       ├────────────────►│ public.profiles  │
└────────┬─────────┘                 └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       1:N       ┌──────────────────┐       1:N       ┌──────────────────┐
│ public.projects  ├────────────────►│ public.slides    ├────────────────►│ public.elements  │
└──────────────────┘                 └──────────────────┘                 └──────────────────┘
```

| Table | Primary Key | Foreign Key | Purpose |
|---|---|---|---|
| `profiles` | `id` (UUID) | `id -> auth.users.id` | Studio profile, architect name, avatar |
| `projects` | `id` (UUID) | `user_id -> auth.users.id` | Presentation metadata, share slug, publishing state |
| `slides` | `id` (UUID) | `project_id -> projects.id` | Slide sequence, backgrounds, transitions, notes |
| `elements` | `id` (UUID) | `slide_id -> slides.id` | Hotspots, before/after sliders, images, text, cards |

---

## Row-Level Security (RLS) Model

All tables have RLS enabled. Security rules enforce:
- **Owner Access**: Authenticated users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` rows matching `auth.uid() = user_id`.
- **Cascading Integrity**: Slide and Element modifications verify project ownership via subquery:
  ```sql
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = slides.project_id
    AND projects.user_id = auth.uid()
  )
  ```
- **Public Published Read**: Anyone (authenticated or anonymous) can view projects, slides, and elements if and only if `projects.is_published = true`:
  ```sql
  CREATE POLICY "Public can view published projects"
    ON public.projects FOR SELECT
    USING (is_published = true);
  ```
- **Storage Isolation**: Assets in `presentation-assets` can only be uploaded, updated, or deleted if the path begins with the authenticated user's ID (`auth.uid()::text = (storage.foldername(name))[1]`).

---

## Publishing Workflow

1. In the Dashboard or Editor, open the **Publish Modal**.
2. ArchXperience verifies that the presentation contains at least one slide.
3. Upon confirming, `is_published` is set to `true` and an immutable public link is generated:
   ```
   https://studio.archxperience.com/view/{share-slug}
   ```
4. Public viewers access `/view/:shareSlug` without logging in.
5. If the project is unpublished, `is_published` becomes `false`. The public route instantaneously updates to display a clean **"Presentation Unavailable"** architectural screen.

---

## Development Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite development server at `http://localhost:5173` |
| `npm run build` | Compiles TypeScript and builds production distribution (`dist/`) |
| `npm run preview` | Serves production build locally |
| `npm run lint` | Fast linter validation using `oxlint` |

---

## Architectural Presentation Feature Matrix

- **Interactive Hotspots**: Link spatial markers directly to interior renderings, annotations, or target slides with smooth auto-navigation.
- **Before / After Renovation Sliders**: Interactive split-view sliders comparing original site conditions against proposed designs.
- **Fixed Aspect Ratio Presentations**: 16:9 widescreen canvas with auto-scaling and responsive letterboxing.
- **Keyboard Shortcuts**: Arrow keys / Space for slide navigation, `F` for fullscreen presentation mode, `Ctrl+Z` / `Ctrl+Y` for undo/redo.
- **Multi-Tenant Protection**: Switching accounts automatically purges active stores, preventing any cross-user data leakage.

---

## Phase 7: AI-Powered ArchXperience Presentation Generator

ArchXperience features a dedicated architectural presentation generation engine:
> *"Describe your design. ArchXperience builds the interactive presentation."*

### 1. Architecture & Execution Model

```
                    Dashboard / Editor
                           │
                    AIGenerateModal
                           │
                       ai-service
                           │ (Authenticated Bearer JWT)
                Supabase Edge Function
              (/generate-presentation)
                           │
                Google Gemini 2.5 Flash
               (Strict JSON Schema Mode)
                           │
                 Structured JSON result
                           │
                   Validation layer
                           │
                    Post-processing
             (UUIDs, Refs, Assets, Bounds)
                           │
                   Project Domain Object
                           │
                     useProjectStore
                      /          \
               Cloud Repo      Local Repo
```

### 2. Security & API Secret Handling
- **Server-Side API Key**: The `GEMINI_API_KEY` is maintained strictly within the Supabase Edge Function environment (`Deno.env.get("GEMINI_API_KEY")`).
- **Zero Frontend Exposure**: No `VITE_GEMINI_API_KEY` exists in client builds, browser network bundles, or repository source code.
- **JWT Authorization**: The Edge Function rejects unauthenticated callers with HTTP 401. Only verified cloud workspace accounts can consume generation quota.
- **Guest-Mode Protection**: In local/guest mode, users are informed that cloud authentication is required for AI generation and offered a 1-click fallback to pre-built AEC Starter Templates or sign-in.

### 3. Deploying the Supabase Edge Function
To deploy the generative function to your Supabase project:
```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your Supabase Project
npx supabase link --project-ref your-project-ref

# 3. Configure the Gemini API Secret (Server-Side)
npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# 4. Deploy the Edge Function
npx supabase functions deploy generate-presentation
```

### 4. Curated Architectural Asset System
To prevent AI from hallucinating broken or untrusted image links:
- The generative model outputs **semantic image roles** (e.g. `hero_exterior`, `interior_library`, `floor_plan`, `material_timber`, `material_concrete`, `courtyard`, `before_site`, `after_design`).
- The post-processing engine resolves roles to verified high-resolution CDN assets in `AEC_IMAGE_PRESETS`.
- Protocol sanitization strictly enforces `https://` and rejects `javascript:`, `data:`, or external script injection.

### 5. Semantic Linking & Canonical 1920×1080 Layout
- **Internal Navigation**: Buttons and hotspots use semantic references (e.g. `targetSlideRef: "slide-floorplan"`). The post-processor assigns valid UUIDs and binds interactive target slide IDs automatically.
- **Canvas Geometry**: Elements are mapped to the canonical 1920×1080 coordinate system with safe margins (120–1800 X, 80–980 Y) and deterministic collision relaxation.
- **AEC Factual Safety**: System instructions strictly enforce conceptual design language, prohibiting fabricated legal certifications, fake approvals, or false compliance claims.

---

## Phase 8: AEC Intelligence Engine

Phase 8 elevates ArchXperience from a generative tool to an intelligent architectural co-pilot. Rather than a generic conversational chatbot, the AEC Intelligence Engine provides domain-tailored critique, non-destructive editing assistance, layout quality assurance, spatial hotspot suggestions, specification structuring, and tone tuning.

### 1. Hybrid Intelligence Architecture

```
                          ┌────────────────────────┐
                          │   Presentation Canvas  │
                          │   (Active Project)     │
                          └───────────┬────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   [ Deterministic Engine ]                     [ Gemini 2.5 Flash Cloud ]
   100% Client-Side Rules                       Secure Supabase Edge Functions
   - Zero-latency analysis                      - Bearer JWT Authenticated
   - Text density & typography                  - Deep AEC narrative critique
   - Overlaps & margin bounding                 - Granular slide copy proposals
   - Orphan slides & broken links               - Contextual hotspot positions
   - Visual drawing inspection                  - Spec key-value extraction
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                         [ Non-Destructive Review ]
                         - Before / Proposed diffs
                         - Selective item apply
                         - "Apply All" transaction
                         - 100% Undo/Redo (Ctrl+Z)
```

### 2. Core Capabilities

#### A. Experience Review & AEC Design Critique
- **Hybrid Review Pipeline**: Merges deterministic layout audits with LLM-powered narrative critique.
- **Structured Sections**:
  - *Summary & Strengths*: High-level architectural narrative evaluation and AEC presentation strengths.
  - *Identified Issues*: Categorized findings (Layout, Typography, Storytelling, AEC Content, Accessibility) with severity tags (`critical`, `warning`, `suggestion`).
  - *Presentation Strategy*: Actionable advice on pacing, narrative flow, and visual balance.
  - *Adaptive AEC Health Checklist*: Dynamic evaluation tailored to project typology (Architecture, Interior Design, Urban Design, Landscape).
- **Inspect on Canvas**: Clicking any slide-specific issue automatically navigates the editor directly to that slide.

#### B. Deterministic Layout & Readability Engine
Runs entirely client-side with zero network calls and sub-second execution:
- **Slide Text Density**: Flags slides exceeding 120 words for presentation readability.
- **Single-Slide Word Count Overload**: Flags slides exceeding 250 words.
- **Excessive Bullet Points**: Detects lists with more than 6 items.
- **Hierarchy Inversion**: Identifies subtitles or body text styled larger than headings.
- **Element Overlaps**: Computes bounding box intersections between text and visual elements.
- **Canvas Edge Margins**: Enforces a 40px safe buffer around the 1920×1080 canonical canvas.
- **Broken Navigation Links**: Validates target slide IDs for button and hotspot elements.
- **Orphan Slides**: Warns when slides cannot be reached sequentially or via links.
- **Missing Closing CTA**: Checks if the final slide lacks contact info or a forward action.
- **Visual Drawings Without Hotspots**: Flags floor plans and axonometric diagrams that lack interactive hotspots.

#### C. Slide Assistant ("Improve This Slide")
- Non-destructive side drawer accessible from the Editor Properties Panel.
- Proposes targeted refinements: concise copy, improved architectural terminology, typography adjustments, and conversion of dense text into structured info cards.
- **Interactive Diff Cards**: Displays current text alongside proposed text with reasoning.
- **Selective or Batch Application**: Apply individual suggestions or click **"Apply All"** wrapped in an atomic Zustand transaction (`startTransaction()` / `commitTransaction()`).
- Instant `Ctrl+Z` undo to revert all applied changes in a single step.

#### D. AI Hotspot Advisor
- Analyzes visual drawings (floor plans, site sections, elevations) and recommends 2–4 architectural pins with conceptual technical callouts.
- **In-Canvas Live Preview**: Pins appear directly on the 1920×1080 canvas as dashed pulsing markers with hover tooltips before being permanently added.
- **Action Banner**: Floating overlay provides `[Apply Hotspots]` and `[Cancel]` buttons.
- Applied hotspots are mapped from normalized coordinates (0..1) to canvas coordinates and added transaction-safely.

#### E. Specification Normalizer
- Extracts unstructured architectural notes, material descriptions, and dimensions into presentation-ready `{ label, value }` pairs.
- Modal interface allows architects to review, edit, add, or remove specifications before inserting them as structured cards.

#### F. Audience Tone Tuner
- Tailors presentation narrative to five AEC personas:
  1. **Client Pitch**: Emphasizes emotional storytelling, experiential qualities, lifestyle value, and budget stewardship.
  2. **Academic Jury**: Emphasizes conceptual rigor, spatial theory, typological precedent, and contextual rationale.
  3. **Investor / Developer**: Emphasizes square-footage efficiency, ROI, phased delivery, and risk mitigation.
  4. **Public Consultation**: Emphasizes community impact, accessibility, pedestrian circulation, and sustainability.
  5. **Design / Consultant Team**: Emphasizes MEP coordination, structural grids, tolerances, and detail construction.

### 3. Edge Functions & Deployment

Phase 8 introduces two secure Supabase Edge Functions:

| Function | Endpoint | Description |
|---|---|---|
| `review-presentation` | `/functions/v1/review-presentation` | Performs deep AEC narrative critique, category-adapted checklist, and strategic recommendations. |
| `assist-slide` | `/functions/v1/assist-slide` | Handles `improve_slide`, `suggest_hotspots`, `normalize_specs`, and `tone_suggestions`. |

Deploy with the Supabase CLI:
```bash
# Deploy Phase 8 intelligence functions
npx supabase functions deploy review-presentation
npx supabase functions deploy assist-slide
```

### 4. Transaction Safety & Non-Destructive Principles
1. **AI Proposes, User Disposes**: The AI engine never mutates presentation state autonomously or silently. Every proposal must be explicitly accepted by the user.
2. **Atomic Undo/Redo**: All multi-element edits are wrapped in `useProjectStore.getState().startTransaction()` and `commitTransaction()`. A single press of `Ctrl+Z` cleanly reverts all modified elements to their exact pre-AI state.
3. **Graceful Degradation**: If offline or running in guest mode, deterministic checks and local fallbacks continue to function smoothly without crashing.
