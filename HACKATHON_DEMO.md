# ArchXperience — Hackathon Pitch & Demonstration Guide

> **Core Message:**  
> *"Don’t just present the design. Let them experience it."*

---

## 1. 30-Second Pitch

> "Architects and designers spend hours creating presentations that communicate through static slides. ArchXperience turns those presentations into interactive experiences. You describe a project and AI generates the presentation structure, AEC Intelligence reviews it, the designer can improve and edit it in Studio, and then publish it as a client-facing interactive experience. Instead of asking people to look at another slide deck, ArchXperience lets them explore the design."

---

## 2. 60-Second Pitch

> "Every architectural presentation faces the same fundamental challenge: buildings are three-dimensional, living, tactile spaces, but we present them through 100-page static PDF decks. Clients lose spatial orientation, floor plans are disconnected from perspective renders, and technical engineering specifications get buried in unread appendix tables.
>
> ArchXperience changes how spatial design is communicated. With ArchXperience, an architect describes a design brief, and AI generates a structured, multi-slide interactive presentation on a canonical 1920×1080 artboard. Our AEC Intelligence Engine inspects layout density, font readability, and technical completeness, while suggesting non-destructive slide refinements. 
>
> Designers retain complete creative control in Studio to position clickable hotspots on plans, configure before-and-after renovation sliders, and normalize material schedules. When ready, one click publishes a shareable web experience. Clients, academic juries, and developers don't just passively look at slides—they explore the design."

---

## 3. 3-Minute Live Demo Script

| Timing | Screen / Action | Spoken Demonstration Narrative |
|---|---|---|
| **0:00 – 0:30** | **Landing Page** (`/`) | *"Welcome to ArchXperience. Today, architecture pitches rely on static slide decks that fail to convey space. Here on our landing page, you see the difference immediately: our interactive teaser lets you tap structural hotspots on a timber pavilion, and slide between an existing industrial site and proposed civic space."* |
| **0:30 – 1:00** | **Dashboard & AI Generation** (`/dashboard`) | *Click 'Generate with AI'.* *"In our creative workspace, an architect describes a brief—for example, a mass-timber community library in Portland. AI synthesizes a structured presentation complete with spatial concepts, daylit floor plans, and sustainability specs. Or, start directly with our curated architectural frameworks."* |
| **1:00 – 1:45** | **Studio Editor & AEC Review** (`/editor/...`) | *Open 'Green Horizon Community Library' & click 'Experience Review'.* *"Here in Studio on our canonical 1920×1080 canvas, we run Experience Review. Notice our hybrid intelligence: 15 deterministic architectural checks audit font scale and density instantly, while Gemini provides executive narrative critique. We can switch between Client, Jury, and Investor personas using the Audience Tuner."* |
| **1:45 – 2:15** | **Slide Assistant & Hotspots** | *Click 'Improve Slide', inspect Diff, Apply, then Ctrl+Z.* *"When we open Slide Assistant, it proposes concrete text and typography refinements with a Current vs. Proposed diff and expected benefits. It's completely non-destructive: apply changes atomically, and hit Ctrl+Z to revert instantly. Hotspot Advisor suggests technical pin placements directly onto our floor plans."* |
| **2:15 – 2:45** | **Preview & Publishing** (`/preview/...`) | *Click 'Preview'.* *"Now we switch from Creator mode to Stakeholder mode. In Preview, creator tools vanish. The presentation is immersive. We tap hotspot [01] to reveal the glulam timber engineering sheet, tap [04] to view the rainwater courtyard, and drag our Before/After slider to demonstrate the site's carbon transformation."* |
| **2:45 – 3:00** | **Public Share & Wrap-Up** | *Click 'Share / Publish'.* *"With one click, we publish an immutable link. The client receives a clean URL that opens smoothly on laptop or tablet with zero software to install. Don't just present the design. Let them experience it."* |

---

## 4. The Problem

1. **Passive Disconnection**: Stakeholders passively watch slides rather than actively engaging with spaces.
2. **Spatial Fragmentation**: 2D floor plans, 3D renderings, and specifications are presented in silos, forcing viewers to mentally assemble the building.
3. **Information Loss**: Critical material data, U-values, acoustic ratings, and embodied carbon metrics are buried in text-heavy footnotes.
4. **Delivery Friction**: 100MB PDF email attachments, broken presentation links, and version control chaos during high-stakes pitches.

---

## 5. The Solution

ArchXperience is a purpose-built spatial presentation platform:
- **Interactive Canvases**: 1920×1080 canonical presentation viewport maintaining architectural drawing proportions.
- **Direct Hotspots**: Clickable room markers, facade callouts, and structural pins linked to technical data sheets.
- **Split Comparison Sliders**: Dynamic side-by-side inspection of existing vs. proposed design schemes.
- **Client-Ready Web Delivery**: Shareable public link requiring zero downloads or account creation for viewers.

---

## 6. Why ArchXperience Is Different

| Feature | Generic Presentation Software (Keynote/Slides) | Generic AI Pitch Tools | ArchXperience |
|---|---|---|---|
| **Spatial Model** | Flat linear slides | Generic text boxes & bullet cards | Canonical 1920×1080 artboard with spatial coordinate system |
| **Architectural Context** | None | Generic business slide templates | Purpose-built AEC layouts, floor plans, specs, & comparison blocks |
| **Interactive Callouts** | Hyperlinks / external tabs | None | Native interactive hotspots with slide-over technical info sheets |
| **Design Comparisons** | Two adjacent pictures | None | Real-time draggable split comparison sliders |
| **Design Review** | Spellcheck only | Generic summary rewrite | 15 deterministic AEC rules + persona audience tuning |
| **Creative Control** | Manual formatting | AI overwrites entire slide | Non-destructive suggestions, diff preview, atomic undo/redo |

---

## 7. Architecture

```
Frontend (React 19 + TypeScript + Vite + Tailwind + Zustand)
       │
       ▼
Repository Abstraction Layer
       ├──► LocalStorage (Guest Mode • Offline Sandbox)
       └──► Supabase Cloud
             ├──► PostgreSQL (Normalized tables: projects, slides, elements)
             ├──► Row-Level Security (RLS)
             └──► presentation-assets Bucket (Scoped media storage)
                     │
                     ▼
       Supabase Edge Functions (Deno Runtime • Bearer Auth)
             ├──► generate-presentation
             ├──► review-presentation
             └──► assist-slide
                     │
                     ▼
       Google Gemini 2.5 Flash (Structured Spatial Output)
```

---

## 8. AI Usage in ArchXperience

AI is integrated as an architectural co-pilot, not a generic conversational chatbot:
1. **Presentation Generation**: Synthesizes complete multi-slide narrative structures from design briefs, generating structured element coordinates, imagery roles, and spatial themes.
2. **Slide Assistant**: Proposes text phrasing and typography scale refinements tailored to 1920×1080 viewing distance.
3. **Hotspot Advisor**: Analyzes architectural drawings to propose coordinate pin placements for key spatial zones.
4. **Specification Normalizer**: Extracts unstructured technical notes and organizes them into standardized architectural spec cards (U-values, materials, fire ratings, embodied carbon).
5. **Audience Tone Tuner**: Re-evaluates presentation phrasing across three distinct stakeholder mindsets:
   - *Client*: Focus on usability, daylight, comfort, and project narrative.
   - *Academic Jury*: Focus on architectural theory, tectonic rigor, and spatial concept.
   - *Investor / Developer*: Focus on floor area efficiency, phase feasibility, and long-term asset value.

---

## 9. AEC Intelligence: Deterministic vs. AI

To ensure complete reliability, ArchXperience divides review into two complementary engines:

### Deterministic Rule Engine (Available offline in Guest Mode)
- **Zero API Quota / Zero Latency**: Executes client-side against the project tree.
- **15 Architectural Quality Thresholds**:
  1. Title slide presence and project metadata completeness.
  2. Canvas element count within readable bounds (prevents cluttered slides).
  3. Typography scale verification (minimum font sizes for 1920×1080 viewing distance).
  4. Text density checks (prevents overlong paragraphs).
  5. Drawing hotspot coverage (warns if floor plans have zero interactive callouts).
  6. Material specification completeness (verifies U-values, carbon, and finish callouts).
  7. Design iteration comparison availability.
  8. Clear call-to-action on concluding slide.

### AI Narrative Critique (Cloud Authenticated)
- Contextual evaluation of architectural prose, concept cohesion, and stakeholder persuasion.
- Executive summary synthesis and targeted strategic suggestions.

---

## 10. Example Judging Questions & Concise Answers

### Q: "Why not just use Figma or Google Slides?"
> **A:** *"Figma is built for UI design, and Google Slides is built for linear bullet points. Neither understands architectural spatial communication. In ArchXperience, interactive floor plan hotspots, before/after split sliders, and technical specification cards are native primitives. Furthermore, our AEC Intelligence audits presentations against real architectural standards rather than generic grammar checks."*

### Q: "How do you protect API keys and user data?"
> **A:** *"The frontend never touches the Gemini API key. All AI generation, review, and slide improvement requests route through authenticated Supabase Edge Functions with Bearer token validation. Multi-tenant data is protected at the database level with PostgreSQL Row-Level Security, and public presentations are strictly isolated by publication status."*

### Q: "Can the AI accidentally ruin my design?"
> **A:** *"Never. All AI suggestions are strictly non-destructive. The Slide Assistant presents side-by-side Before vs. Proposed diffs and requires explicit architect confirmation. Every applied suggestion is tracked as an atomic transaction in our undo/redo stack—hitting Ctrl+Z instantly restores the original state."*

### Q: "What happens if a user is offline or doesn't have an account?"
> **A:** *"ArchXperience features a full local-first fallback. Anyone can click 'Continue as Guest Architect' to build, edit, and inspect presentations in browser LocalStorage. Deterministic AEC quality checks run locally with zero cloud dependencies."*

### Q: "How does the audience tuner work?"
> **A:** *"Architects present the exact same building to different stakeholders. A developer cares about cost and net-to-gross efficiency; an academic jury cares about tectonic integrity; a client cares about natural light and wellbeing. Audience Tuner adjusts the critique and tone suggestions to match that exact audience."*
