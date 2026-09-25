import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPTS = {
  improve_slide: `You are a Senior Architectural Presentation Designer assisting in refining a presentation slide.
Your goal is to propose non-destructive, granular improvements to text clarity, typography hierarchy, and interactive engagement.
Output valid JSON matching schema:
{
  "slideId": "...",
  "rationale": "1-2 sentence strategy explanation",
  "suggestedChanges": [
    {
      "id": "change-1",
      "elementId": "...",
      "action": "modify_text" | "adjust_typography" | "convert_to_card" | "add_element",
      "description": "...",
      "currentValue": "...",
      "proposedValue": "...",
      "proposedElement": { ... }
    }
  ]
}
Never invent fake certifications. Preserve the designer's intent. Output pure JSON.`,

  suggest_hotspots: `You are an Architectural Spatial Information Architect.
Analyze the architectural visual (floor plan, section, or render) and propose 2 to 4 interactive hotspots.
Coordinates MUST be "relativeX" and "relativeY" normalized between 0.10 and 0.90 relative to the image bounding box.
Include 2-3 conceptual specs per hotspot.
Output valid JSON matching schema:
{
  "targetElementId": "...",
  "hotspots": [
    {
      "title": "Architectural Feature",
      "description": "Spatial and technical function",
      "relativeX": 0.35,
      "relativeY": 0.42,
      "specs": [{ "label": "Dimension / Spec", "value": "Target Value" }],
      "targetSlideRef": "slide-4"
    }
  ]
}
Output pure JSON only.`,

  normalize_specs: `You are an Architectural Technical Writer.
Extract 3 to 5 standardized specification pairs from the unstructured text.
Standardize labels (e.g. "Primary Material", "Structural Core", "Thermal Transmittance (U-value)", "Finish", "Acoustic Target").
Label unverified metrics as "Conceptual Target" or "Design Intent".
Output valid JSON matching schema:
{
  "elementId": "...",
  "originalText": "...",
  "specs": [{ "label": "...", "value": "..." }]
}`,

  tone_suggestions: `You are an Architectural Communications Director.
Evaluate the presentation's alignment with the target audience (Client, Academic Jury, Investor, Public, Design Team).
Propose actionable adaptations and slide-specific advice.
Output valid JSON matching schema:
{
  "audience": "...",
  "overallFit": "...",
  "observations": ["...", "..."],
  "recommendations": [
    {
      "slideId": "...",
      "slideTitle": "...",
      "advice": "...",
      "sampleRefinement": {
        "elementId": "...",
        "original": "...",
        "proposed": "..."
      }
    }
  ]
}`,
};

const SCHEMAS = {
  improve_slide: {
    type: "OBJECT",
    properties: {
      slideId: { type: "STRING" },
      rationale: { type: "STRING" },
      suggestedChanges: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            elementId: { type: "STRING" },
            action: {
              type: "STRING",
              enum: ["modify_text", "adjust_typography", "convert_to_card", "add_element"],
            },
            description: { type: "STRING" },
            currentValue: { type: "STRING" },
            proposedValue: { type: "STRING" },
          },
          required: ["id", "action", "description"],
        },
      },
    },
    required: ["slideId", "rationale", "suggestedChanges"],
  },

  suggest_hotspots: {
    type: "OBJECT",
    properties: {
      targetElementId: { type: "STRING" },
      hotspots: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
            relativeX: { type: "NUMBER" },
            relativeY: { type: "NUMBER" },
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
            targetSlideRef: { type: "STRING" },
            targetSlideId: { type: "STRING" },
          },
          required: ["title", "description", "relativeX", "relativeY", "specs"],
        },
      },
    },
    required: ["targetElementId", "hotspots"],
  },

  normalize_specs: {
    type: "OBJECT",
    properties: {
      elementId: { type: "STRING" },
      originalText: { type: "STRING" },
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
    },
    required: ["elementId", "specs"],
  },

  tone_suggestions: {
    type: "OBJECT",
    properties: {
      audience: { type: "STRING" },
      overallFit: { type: "STRING" },
      observations: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
      recommendations: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            slideId: { type: "STRING" },
            slideTitle: { type: "STRING" },
            advice: { type: "STRING" },
            sampleRefinement: {
              type: "OBJECT",
              properties: {
                elementId: { type: "STRING" },
                original: { type: "STRING" },
                proposed: { type: "STRING" },
              },
            },
          },
          required: ["slideId", "slideTitle", "advice"],
        },
      },
    },
    required: ["audience", "overallFit", "observations", "recommendations"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required for AI Assistant. Please sign in.",
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

    // 2. Secret Check
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: {
            code: "AI_UNAVAILABLE",
            message: "AI assistance service is temporarily unconfigured.",
          },
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse Body & Validate Action
    const body = await req.json();
    const action = body.action as keyof typeof SYSTEM_PROMPTS;

    if (!action || !SYSTEM_PROMPTS[action]) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: `Invalid action. Must be one of: ${Object.keys(SYSTEM_PROMPTS).join(", ")}`,
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Construct Prompt according to action
    let userPrompt = "";
    if (action === "improve_slide") {
      const { projectContext = {}, slide = {}, deterministicIssues = [] } = body;
      userPrompt = `Propose non-destructive design and text improvements for this slide:

PROJECT CONTEXT:
- Title: "${projectContext.title || "Untitled"}"
- Typology: ${projectContext.category || "Architecture"}
- Audience: ${projectContext.audience || "Client"}
- Brief: "${projectContext.description || ""}"

SLIDE DATA:
- Slide ID: "${slide.id}"
- Slide Title: "${slide.title}"
- Elements:
${JSON.stringify(slide.elements || [], null, 2)}

LOCAL QUALITY WARNINGS:
${JSON.stringify(deterministicIssues, null, 2)}

Provide concise architectural text improvements and typography refinements. Return structured JSON.`;
    } else if (action === "suggest_hotspots") {
      const { projectContext = {}, slide = {}, targetElement = {}, availableSlides = [] } = body;
      userPrompt = `Suggest 2 to 4 interactive architectural hotspots for this visual element:

PROJECT CONTEXT:
- Title: "${projectContext.title || ""}"
- Typology: ${projectContext.category || "Architecture"}
- Brief: "${projectContext.description || ""}"

ACTIVE SLIDE: "${slide.title}"
TARGET VISUAL ELEMENT:
- Element ID: "${targetElement.id}"
- Alt / Role: "${targetElement.content?.alt || targetElement.content?.imageRole || "Architectural Drawing"}"
- Caption: "${targetElement.content?.caption || ""}"
- Dimensions: width=${targetElement.width}, height=${targetElement.height}

OTHER AVAILABLE SLIDES FOR NAVIGATION:
${availableSlides.map((s: any) => `- "${s.title}" (ID: ${s.id})`).join("\n")}

Return 2-4 hotspots with normalized relativeX and relativeY (0.1 to 0.9) and 2-3 conceptual specs. Return structured JSON.`;
    } else if (action === "normalize_specs") {
      const { elementId, rawText } = body;
      userPrompt = `Convert this unstructured architectural/material text into standardized specification pairs:
ELEMENT ID: "${elementId}"
RAW TEXT:
"""
${String(rawText).trim()}
"""

Extract 3 to 5 clean { label, value } pairs. Label unverified values as "Conceptual Target". Return structured JSON.`;
    } else if (action === "tone_suggestions") {
      const { targetAudience, projectContext = {}, slides = [] } = body;
      userPrompt = `Advise how to adapt this presentation for target audience: "${targetAudience}".

PROJECT: "${projectContext.title}" (${projectContext.category})
SLIDES SUMMARY:
${slides.map((s: any, idx: number) => `Slide ${idx + 1}: "${s.title}" - ${(s.elements || []).map((e: any) => e.type).join(", ")}`).join("\n")}

Provide specific recommendations and sample text refinements. Return structured JSON.`;
    }

    // 5. Call Gemini 2.5 Flash
    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPTS[action] }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SCHEMAS[action],
        temperature: 0.3,
      },
    };

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let geminiData: any = null;
    let lastStatus = 502;

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (res.ok) {
        geminiData = await res.json();
        break;
      } else {
        lastStatus = res.status;
        if (res.status === 429) {
          return new Response(
            JSON.stringify({
              error: {
                code: "RATE_LIMITED",
                message: "AI assistance rate limit reached. Please wait a moment.",
              },
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!geminiData) {
      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to generate AI assistance recommendations.",
          },
        }),
        { status: lastStatus || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawContentText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedData = JSON.parse(rawContentText);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[assist-slide] Uncaught exception:", err);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred during slide assistance.",
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
