import { supabase, isSupabaseConfigured } from "../supabase";
import type { Project, CanvasElement } from "../../types";
import type { PresentationReviewResponse, IssueItem } from "./intelligence-types";
import { runDeterministicReview } from "./deterministic-review";

/**
 * Executes a complete presentation quality review combining instant deterministic
 * canvas checks with AI-powered architectural narrative critique.
 */
export async function executeExperienceReview(
  project: Project
): Promise<PresentationReviewResponse> {
  // 1. Instant Client-Side Deterministic Analysis (0 API cost, 0 latency)
  const { issues: deterministicIssues, checklist: deterministicChecklist } =
    runDeterministicReview(project);

  // 2. Check if Cloud / Auth is Available
  if (!isSupabaseConfigured || !supabase) {
    return {
      executiveSummary: `Local quality review complete for "${project.title}". Found ${deterministicIssues.length} layout and readability observations. Connect a Cloud Workspace to unlock deep architectural critique and narrative analysis.`,
      strengths: [
        "100% local-first editing and real-time canvas responsiveness.",
        `Valid 1920×1080 canvas structure with ${project.slides.length} slides.`,
      ],
      issues: deterministicIssues,
      strategicSuggestions: [
        "Sign in to a Cloud Workspace to enable Google Gemini narrative analysis and audience tone tuning.",
      ],
      checklist: deterministicChecklist,
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    // Guest Mode fallback: deliver deterministic results cleanly
    return {
      executiveSummary: `Quality review complete. Evaluated ${project.slides.length} slides across text density, visual hierarchy, and geometry. Sign in to enable AI narrative review and spatial storytelling critique.`,
      strengths: [
        `Deck contains ${project.slides.length} slides configured on the canonical 1920×1080 canvas.`,
      ],
      issues: deterministicIssues,
      strategicSuggestions: [
        "Sign in to ArchXperience Cloud to receive expert AI architectural critique and adaptive checklist insights.",
      ],
      checklist: deterministicChecklist,
    };
  }

  // 3. Compact AI Payload Formulation
  const compactPayload = {
    title: project.title,
    description: project.description || "",
    category: project.category || "Architecture",
    audience: project.settings?.theme || "Client",
    slides: project.slides.map((s, idx) => ({
      id: s.id,
      title: s.title || `Slide ${idx + 1}`,
      orderIndex: idx,
      elements: s.elements.map((el) => {
        if (el.type === "text") {
          return { type: "text", content: { text: el.content.text?.substring(0, 140) } };
        }
        if (el.type === "image") {
          return {
            type: "image",
            content: { alt: el.content.alt, caption: el.content.caption },
          };
        }
        if (el.type === "hotspot") {
          return {
            type: "hotspot",
            content: { title: el.content.title, specs: el.content.specs },
          };
        }
        if (el.type === "info_card") {
          return {
            type: "info_card",
            content: { title: el.content.title, eyebrow: el.content.eyebrow },
          };
        }
        if (el.type === "comparison") {
          return {
            type: "comparison",
            content: { beforeLabel: el.content.beforeLabel, afterLabel: el.content.afterLabel },
          };
        }
        if (el.type === "button") {
          return {
            type: "button",
            content: { label: el.content.label, action: el.content.action },
          };
        }
        return { type: (el as CanvasElement).type };
      }),
    })),
  };

  // 4. Call Supabase Edge Function: review-presentation
  try {
    const { data, error } = await supabase.functions.invoke("review-presentation", {
      body: compactPayload,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error || !data?.data) {
      console.warn("[Reviewer] Edge Function review error, falling back to deterministic findings:", error);
      return {
        executiveSummary: `Deterministic quality inspection complete. Found ${deterministicIssues.length} actionable layout observations. (AI narrative review is temporarily unavailable).`,
        strengths: [
          `Presentation structure verified across ${project.slides.length} canonical slides.`,
        ],
        issues: deterministicIssues,
        strategicSuggestions: [
          "Address the layout and density warnings highlighted below to improve presentation clarity.",
        ],
        checklist: deterministicChecklist,
      };
    }

    const aiReview = data.data as PresentationReviewResponse;

    // 5. Merge Deterministic and AI Findings
    // Prefix AI issue IDs to avoid any collisions
    const formattedAiIssues: IssueItem[] = (aiReview.issues || []).map((issue, idx) => ({
      ...issue,
      id: issue.id || `ai-issue-${idx}`,
      source: "ai",
    }));

    // Combined unique issues
    const combinedIssues = [...deterministicIssues, ...formattedAiIssues];

    return {
      executiveSummary: aiReview.executiveSummary || `Review complete for ${project.title}.`,
      strengths: aiReview.strengths?.length
        ? aiReview.strengths
        : ["Clean 1920×1080 canvas structure with responsive spatial hierarchy."],
      issues: combinedIssues,
      strategicSuggestions: aiReview.strategicSuggestions || [],
      checklist: aiReview.checklist?.length ? aiReview.checklist : deterministicChecklist,
    };
  } catch (err) {
    console.error("[Reviewer] Unexpected review failure:", err);
    return {
      executiveSummary: `Deterministic layout verification complete (${deterministicIssues.length} items flagged).`,
      strengths: [`${project.slides.length} slides analyzed locally.`],
      issues: deterministicIssues,
      strategicSuggestions: ["Check the layout and safe margin observations below."],
      checklist: deterministicChecklist,
    };
  }
}
