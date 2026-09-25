import { supabase, isSupabaseConfigured } from "../supabase";
import type { Project, Slide, ImageElement, HotspotElement } from "../../types";
import type {
  SlideImprovementResponse,
  HotspotSuggestionResponse,
  SuggestedHotspot,
  SpecificationSuggestion,
  AudienceSuggestion,
  IssueItem,
} from "./intelligence-types";
import { generateUuid } from "../utils";

/**
 * Requests granular, non-destructive design and text improvements for a slide.
 */
export async function requestSlideImprovement(
  project: Project,
  slide: Slide,
  deterministicIssues: IssueItem[] = []
): Promise<SlideImprovementResponse> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Cloud Workspace required for AI Slide Assistant. Please sign in.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Authentication required. Please sign in to ArchXperience Cloud.");
  }

  const payload = {
    action: "improve_slide",
    projectContext: {
      title: project.title,
      category: project.category || "Architecture",
      audience: project.settings?.theme || "Client",
      description: project.description || "",
    },
    slide: {
      id: slide.id,
      title: slide.title,
      elements: slide.elements.map((el) => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        content: el.content,
      })),
    },
    deterministicIssues: deterministicIssues.filter((i) => i.slideId === slide.id),
  };

  const { data, error } = await supabase.functions.invoke("assist-slide", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error || !data?.data) {
    throw new Error(error?.message || "Failed to generate slide improvements.");
  }

  return data.data as SlideImprovementResponse;
}

/**
 * Requests 2 to 4 interactive hotspot recommendations for a selected visual element.
 */
export async function requestHotspotSuggestions(
  project: Project,
  slide: Slide,
  targetImage: ImageElement
): Promise<HotspotSuggestionResponse> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Cloud Workspace required for AI Hotspot Advisor. Please sign in.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Authentication required. Please sign in to ArchXperience Cloud.");
  }

  const payload = {
    action: "suggest_hotspots",
    projectContext: {
      title: project.title,
      category: project.category || "Architecture",
      description: project.description || "",
    },
    slide: {
      id: slide.id,
      title: slide.title,
    },
    targetElement: {
      id: targetImage.id,
      width: targetImage.width,
      height: targetImage.height,
      content: targetImage.content,
    },
    availableSlides: project.slides.map((s) => ({ id: s.id, title: s.title })),
  };

  const { data, error } = await supabase.functions.invoke("assist-slide", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error || !data?.data) {
    throw new Error(error?.message || "Failed to generate hotspot recommendations.");
  }

  return data.data as HotspotSuggestionResponse;
}

/**
 * Converts suggested normalized hotspots into production-grade CanvasElement (HotspotElement) instances.
 * Accurately calculates 1920x1080 canvas coordinates and clamps them to the image boundary.
 */
export function convertSuggestedHotspotsToElements(
  suggestedHotspots: SuggestedHotspot[],
  targetImage: ImageElement,
  slideId: string,
  availableSlides: Slide[]
): HotspotElement[] {
  const slideIdMap = new Map<string, string>();
  availableSlides.forEach((s, idx) => {
    slideIdMap.set(s.id, s.id);
    slideIdMap.set(`slide-${idx + 1}`, s.id);
    slideIdMap.set(String(idx + 1), s.id);
  });

  return suggestedHotspots.map((h, idx) => {
    // Relative coordinates normalized to 0..1
    const relX = Math.max(0.05, Math.min(0.95, Number(h.relativeX) || 0.5));
    const relY = Math.max(0.05, Math.min(0.95, Number(h.relativeY) || 0.5));

    // Calculate canvas pixel position
    const rawX = Math.round(targetImage.x + relX * targetImage.width);
    const rawY = Math.round(targetImage.y + relY * targetImage.height);

    // Clamp within image bounds ensuring 48x48 icon stays completely inside
    const minX = targetImage.x + 8;
    const maxX = Math.max(minX, targetImage.x + targetImage.width - 56);
    const minY = targetImage.y + 8;
    const maxY = Math.max(minY, targetImage.y + targetImage.height - 56);

    const clampedX = Math.max(minX, Math.min(maxX, rawX));
    const clampedY = Math.max(minY, Math.min(maxY, rawY));

    // Resolve target slide reference if present
    let resolvedTargetId: string | undefined = undefined;
    if (h.targetSlideId && slideIdMap.has(h.targetSlideId)) {
      resolvedTargetId = slideIdMap.get(h.targetSlideId);
    } else if (h.targetSlideRef && slideIdMap.has(h.targetSlideRef.toLowerCase())) {
      resolvedTargetId = slideIdMap.get(h.targetSlideRef.toLowerCase());
    }

    const action = resolvedTargetId ? "navigate_slide" : "open_panel";

    return {
      id: generateUuid(),
      slideId,
      type: "hotspot",
      x: clampedX,
      y: clampedY,
      width: 48,
      height: 48,
      zIndex: (targetImage.zIndex || 10) + 1 + idx,
      content: {
        title: h.title || "Architectural Callout",
        description: h.description || "Spatial and technical feature.",
        triggerType: "click",
        action,
        targetSlideId: resolvedTargetId,
        badgeText: h.badgeText || String(idx + 1).padStart(2, "0"),
        pulseAnimation: true,
        specs: Array.isArray(h.specs) ? h.specs : [],
      },
    };
  });
}

/**
 * Normalizes unstructured technical notes into clean { label, value } specification pairs.
 */
export async function requestSpecNormalization(
  elementId: string,
  rawText: string
): Promise<SpecificationSuggestion> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Cloud Workspace required. Please sign in.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Authentication required. Please sign in.");
  }

  const payload = {
    action: "normalize_specs",
    elementId,
    rawText,
  };

  const { data, error } = await supabase.functions.invoke("assist-slide", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error || !data?.data) {
    throw new Error(error?.message || "Failed to normalize specifications.");
  }

  return data.data as SpecificationSuggestion;
}

/**
 * Evaluates presentation alignment for specific audience personas (Client, Academic Jury, Investor, etc.).
 */
export async function requestAudienceTuning(
  project: Project,
  targetAudience: string
): Promise<AudienceSuggestion> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Cloud Workspace required. Please sign in.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error("Authentication required. Please sign in.");
  }

  const payload = {
    action: "tone_suggestions",
    targetAudience,
    projectContext: {
      title: project.title,
      category: project.category,
    },
    slides: project.slides.map((s, idx) => ({
      id: s.id,
      title: s.title || `Slide ${idx + 1}`,
      elements: s.elements.map((e) => ({ type: e.type, content: e.content })),
    })),
  };

  const { data, error } = await supabase.functions.invoke("assist-slide", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error || !data?.data) {
    throw new Error(error?.message || "Failed to evaluate audience alignment.");
  }

  return data.data as AudienceSuggestion;
}
