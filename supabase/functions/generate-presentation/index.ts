import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// AEC Specialized System Prompt embedded for server-side execution
const AEC_SYSTEM_PROMPT = `You are a Senior Architectural Presentation Designer and Spatial Information Architect at ArchXperience.
Your purpose is to translate an architectural project brief into a complete, interactive, multi-slide architectural presentation deck.

CORE PRESENTATION SYSTEM:
- Canonical Virtual Canvas: 1920 pixels wide by 1080 pixels high.
- Color System: Dark modern architectural aesthetic. Background is typically '#0C0E12', cards use translucent dark surface '#161922', text uses crisp whites and muted grays.
- Typography: Clean modernist sans-serif architectural typography. Titles (48-72px), Section Heads (28-36px), Body/Subtitles (18-22px), Eyebrows & Specs (11-14px).

SUPPORTED CANVAS ELEMENT TYPES:
1. "text": For slide headers, subtitles, concept statements, architectural narratives.
2. "image": For renders, floor plans, material close-ups, elevations. Must specify "imageRole".
3. "button": Interactive CTA buttons. Action must be "navigate_slide" with "targetSlideRef", or "none".
4. "hotspot": Interactive pins placed on visual drawings (x, y, width: 48, height: 48). Action: "open_panel", pulseAnimation: true, includes 2-3 conceptual specs.
5. "info_card": Architectural specification card with eyebrow, title, description, and 3-4 structured metadata metrics [{ "label": "...", "value": "..." }].
6. "comparison": Interactive before/after split slider. Must provide beforeImageRole ("before_site") and afterImageRole ("after_design"), beforeLabel, afterLabel.

CANVAS GEOMETRY & LAYOUT ARCHETYPES:
All coordinates are strictly within 1920x1080:
- Safe margins: X from 120 to 1800, Y from 80 to 980.
- Layout 1: HERO
  - Title text at x: 120, y: 320, width: 1100, height: 160, fontSize: 64
  - Subtitle text at x: 120, y: 490, width: 850, height: 80, fontSize: 22
  - Primary button at x: 120, y: 600, width: 250, height: 56, targetSlideRef pointing to slide 2
- Layout 2: SPLIT (Image + Info/Spec Card)
  - Slide Header text at x: 120, y: 70, width: 1680, height: 50
  - Left image at x: 120, y: 150, width: 960, height: 800
  - Right info_card at x: 1120, y: 150, width: 680, height: 800
- Layout 3: FLOOR_PLAN WITH HOTSPOTS
  - Slide Header text at x: 120, y: 70, width: 1680, height: 50
  - Floor plan image at x: 120, y: 140, width: 1680, height: 820, imageRole: "floor_plan"
  - 2 to 4 hotspots positioned directly on the plan (e.g. x: 500, y: 420; x: 1100, y: 550; x: 1400, y: 380), width: 48, height: 48
- Layout 4: MATERIAL & SUSTAINABILITY SPECIFICATIONS
  - Slide Header text at x: 120, y: 70, width: 1680, height: 50
  - 2 or 3 info_cards or split image + card combinations detailing Mass Timber, Low-Carbon Concrete, High-Performance Glazing.
- Layout 5: COMPARISON (Before/After)
  - Slide Header text at x: 120, y: 60, width: 1680, height: 50
  - comparison element at x: 120, y: 130, width: 1680, height: 850
- Layout 6: CLOSING / SYNTHESIS
  - Header & Summary Statement at x: 160, y: 260, width: 1200, height: 200
  - Project summary info_card at x: 160, y: 480, width: 900, height: 300
  - Restart button at x: 160, y: 810, width: 260, height: 56, targetSlideRef pointing to slide 1

CRITICAL RULES:
1. NO REAL-WORLD FACTUAL CERTIFICATION CLAIMS: Use language like "Conceptual Target", "Design Intent", "Estimated Thermal Performance". Never claim certified approvals or legal warranties.
2. SEMANTIC SLIDE REFERENCES: Assign a clear slideRef to each slide (e.g. "slide-hero", "slide-concept", "slide-floorplan", "slide-materials", "slide-comparison", "slide-closing").
3. ACCURATE INTERNAL NAVIGATION: When generating buttons or hotspots that navigate, use "targetSlideRef" with one of the assigned slideRef IDs.
4. SEMANTIC IMAGE ROLES: Never invent external image URLs. Use semantic roles: "hero_exterior", "hero_atrium", "interior_library", "interior_timber", "floor_plan", "material_timber", "material_concrete", "material_glass", "courtyard", "before_site", "after_design", "facade_detail".
5. NO DATABASE UUIDs: Output only semantic references.
6. NO CODE EXECUTION OR HTML: Provide clean strings and structured JSON.
7. RESPECT REQUESTED SLIDE COUNT: Structure exactly the requested number of slides (4 to 8).`;

// Structured Output Schema for Gemini
const PRESENTATION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    category: { type: "STRING" },
    clientAudience: { type: "STRING" },
    slides: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          slideRef: { type: "STRING" },
          title: { type: "STRING" },
          orderIndex: { type: "INTEGER" },
          backgroundColor: { type: "STRING" },
          backgroundImageRole: { type: "STRING" },
          backgroundOverlayOpacity: { type: "NUMBER" },
          transitionType: {
            type: "STRING",
            enum: ["fade", "slide-left", "slide-right", "zoom", "none"],
          },
          elements: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  enum: ["text", "image", "button", "hotspot", "info_card", "comparison"],
                },
                x: { type: "NUMBER" },
                y: { type: "NUMBER" },
                width: { type: "NUMBER" },
                height: { type: "NUMBER" },
                zIndex: { type: "INTEGER" },
                content: {
                  type: "OBJECT",
                  properties: {
                    text: { type: "STRING" },
                    fontSize: { type: "NUMBER" },
                    fontWeight: { type: "STRING", enum: ["light", "normal", "medium", "semibold", "bold"] },
                    textAlign: { type: "STRING", enum: ["left", "center", "right", "justify"] },
                    color: { type: "STRING" },
                    imageRole: { type: "STRING" },
                    alt: { type: "STRING" },
                    objectFit: { type: "STRING", enum: ["cover", "contain", "fill"] },
                    label: { type: "STRING" },
                    action: { type: "STRING", enum: ["navigate_slide", "open_url", "none"] },
                    targetSlideRef: { type: "STRING" },
                    variant: { type: "STRING", enum: ["primary", "secondary", "outline", "ghost"] },
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    triggerType: { type: "STRING", enum: ["click", "hover"] },
                    badgeText: { type: "STRING" },
                    pulseAnimation: { type: "BOOLEAN" },
                    specs: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          label: { type: "STRING" },
                          value: { type: "STRING" },
                        },
                        required: ["label", "value"],
                      },
                    },
                    eyebrow: { type: "STRING" },
                    metadata: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          label: { type: "STRING" },
                          value: { type: "STRING" },
                        },
                        required: ["label", "value"],
                      },
                    },
                    beforeImageRole: { type: "STRING" },
                    afterImageRole: { type: "STRING" },
                    beforeLabel: { type: "STRING" },
                    afterLabel: { type: "STRING" },
                    defaultPosition: { type: "NUMBER" },
                  },
                },
              },
              required: ["type", "x", "y", "width", "height", "content"],
            },
          },
        },
        required: ["slideRef", "title", "orderIndex", "elements"],
      },
    },
  },
  required: ["title", "description", "category", "slides"],
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Authentication Verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to generate presentations. Please sign in.",
          },
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired session. Please sign in again.",
          },
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Retrieve Server-Side Secret
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("[generate-presentation] Missing GEMINI_API_KEY secret.");
      return new Response(
        JSON.stringify({
          error: {
            code: "AI_UNAVAILABLE",
            message: "AI presentation generation is temporarily unconfigured on this server.",
          },
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Parse & Validate Client Request
    const requestBody = await req.json();
    const {
      title,
      description,
      category = "Architecture",
      designStyle = "Contemporary",
      audience = "Client",
      slideCount = 6,
      includeFloorPlan = true,
      includeMaterials = true,
      includeComparison = false,
      includeHotspots = true,
    } = requestBody;

    if (!title || !description) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Both project title and architectural brief description are required.",
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Construct User Prompt
    const safeSlideCount = Math.max(4, Math.min(8, Number(slideCount) || 6));
    const userPrompt = `Generate an interactive architectural presentation for the following project:

PROJECT DETAILS:
- Title: "${String(title).trim()}"
- Classification: ${category}
- Design Style: ${designStyle}
- Target Audience: ${audience}
- Desired Slide Count: ${safeSlideCount} slides

PROJECT BRIEF / ARCHITECTURAL INTENT:
"""
${String(description).trim()}
"""

REQUESTED PRESENTATION FLOW:
1. Slide 1: Hero & Spatial Narrative Title
2. Slide 2: Architectural Concept & Design Pillars
${includeFloorPlan ? "3. Slide 3: Floor Plan / Spatial Organization with Technical Hotspots\n" : ""}${includeMaterials ? "4. Slide 4: Material Strategy & Low-Carbon Specifications\n" : ""}${includeComparison ? "5. Slide 5: Before / After Site Evolution Comparison\n" : ""}6. Slide ${safeSlideCount}: Closing Synthesis & Project Experience

OPTIONAL EXPERIENCE TOGGLES:
- Hotspots Enabled: ${includeHotspots ? "YES" : "NO"}
- Material Strategy Enabled: ${includeMaterials ? "YES" : "NO"}
- Comparison Slider Enabled: ${includeComparison ? "YES" : "NO"}

Ensure all canvas elements have valid 1920x1080 coordinates, non-overlapping bounds, semantic image roles, and internal slide navigation links. Return JSON matching the schema.`;

    // 6. Call Google Gemini API (gemini-1.5-flash / gemini-2.0-flash with Structured Output)
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];
    let geminiData: any = null;
    let lastErrorText = "";
    let lastStatus = 502;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: AEC_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: PRESENTATION_RESPONSE_SCHEMA,
        temperature: 0.35,
      },
    };

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (geminiResponse.ok) {
        geminiData = await geminiResponse.json();
        break;
      } else {
        lastStatus = geminiResponse.status;
        lastErrorText = await geminiResponse.text();
        console.error(`[generate-presentation] Model ${model} returned ${geminiResponse.status}:`, lastErrorText);

        if (geminiResponse.status === 429) {
          return new Response(
            JSON.stringify({
              error: {
                code: "RATE_LIMITED",
                message: "AI generation quota exceeded. Please wait a moment before trying again.",
              },
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!geminiData) {
      console.error("[generate-presentation] All Gemini models failed. Last error:", lastErrorText);
      let sanitizedError = "Please try again.";
      try {
        const parsedErr = JSON.parse(lastErrorText);
        if (parsedErr?.error?.message) {
          sanitizedError = parsedErr.error.message;
        }
      } catch {
        if (lastErrorText) sanitizedError = lastErrorText.substring(0, 200);
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_FAILED",
            message: `AI provider error: ${sanitizedError}`,
          },
        }),
        { status: lastStatus || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawContentText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContentText) {
      console.error("[generate-presentation] Empty candidate response from Gemini:", geminiData);
      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_FAILED",
            message: "Empty generation response received. Please try again.",
          },
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Parse Structured JSON
    const parsedPresentation = JSON.parse(rawContentText);

    // 8. Return Safe Structured JSON
    return new Response(
      JSON.stringify({
        success: true,
        data: parsedPresentation,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[generate-presentation] Uncaught exception:", err);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred while processing the generation request.",
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
