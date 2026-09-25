import type { Project, Slide, CanvasElement } from "../../types";
import type { RawGeneratedProject, RawGeneratedSlide, RawGeneratedElement, AIGenerationRequest } from "./types";
import { generateUuid } from "../utils";
import { resolveImageRole } from "./asset-presets";

/**
 * Checks if two bounding boxes have significant overlapping intersection.
 */
function hasOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 10
): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

/**
 * Deterministically relaxes overlapping element bounding boxes on the 1920x1080 canvas.
 * Hotspots on images are intentionally positioned on top of the image so they are excluded
 * from collision separation against background images.
 */
function resolveCollisions(elements: RawGeneratedElement[]): RawGeneratedElement[] {
  const result: RawGeneratedElement[] = elements.map((el) => ({ ...el }));

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const elA = result[i];
      const elB = result[j];

      // Hotspots are designed to sit on top of images
      if (elA.type === "hotspot" || elB.type === "hotspot") continue;
      // Large background visuals or comparisons shouldn't collide with overlying text
      if (elA.type === "image" && elA.width > 1200) continue;
      if (elB.type === "image" && elB.width > 1200) continue;

      if (hasOverlap(elA, elB)) {
        // Deterministically nudge the lower/later element downward if there's space
        if (elB.y + elB.height + 20 < 1040) {
          elB.y = Math.min(1080 - elB.height - 20, elA.y + elA.height + 24);
        }
      }
    }
  }

  return result;
}

/**
 * Converts a raw validated AI presentation structure into a production-grade,
 * fully validated, UUID-populated ArchXperience Project object.
 */
export function postprocessGeneratedPresentation(
  raw: RawGeneratedProject,
  request: AIGenerationRequest
): Project {
  const projectId = generateUuid();
  const now = new Date().toISOString();

  // 1. Create clean share slug from user's title
  const slugBase = (request.title || raw.title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const shareSlug = `${slugBase || "experience"}-${Date.now().toString(36)}`;

  // 2. Build semantic slide reference map (slideRef -> actual UUID)
  const slideRefMap = new Map<string, string>();
  const slideIdList: string[] = [];

  raw.slides.forEach((rawSlide, idx) => {
    const slideId = generateUuid();
    slideIdList.push(slideId);

    if (rawSlide.slideRef) {
      slideRefMap.set(rawSlide.slideRef.toLowerCase().trim(), slideId);
    }
    // Also map common numeric/positional references
    slideRefMap.set(`slide-${idx + 1}`, slideId);
    slideRefMap.set(String(idx + 1), slideId);
    slideRefMap.set(`0${idx + 1}`, slideId);
  });

  // 3. Process Slides & Elements
  const slides: Slide[] = raw.slides.map((rawSlide: RawGeneratedSlide, slideIdx: number) => {
    const slideId = slideIdList[slideIdx];

    // Resolve background image
    let backgroundImageUrl: string | undefined = undefined;
    if (rawSlide.backgroundImageRole) {
      backgroundImageUrl = resolveImageRole(rawSlide.backgroundImageRole).url;
    }

    // Collision check & geometry clamp
    const collisionResolvedElements = resolveCollisions(rawSlide.elements);

    // Map elements to canonical CanvasElement structure
    const elements: CanvasElement[] = collisionResolvedElements.map(
      (rawEl: RawGeneratedElement, elIdx: number) => {
        const elementId = generateUuid();

        // Safe coordinate bounding
        const x = Math.max(0, Math.min(1920 - 40, rawEl.x));
        const y = Math.max(0, Math.min(1080 - 40, rawEl.y));
        const width = Math.max(40, Math.min(1920 - x, rawEl.width));
        const height = Math.max(20, Math.min(1080 - y, rawEl.height));
        const zIndex = rawEl.zIndex || (rawEl.type === "hotspot" ? 25 : rawEl.type === "button" ? 20 : 10 + elIdx);

        switch (rawEl.type) {
          case "text": {
            return {
              id: elementId,
              slideId,
              type: "text",
              x,
              y,
              width,
              height,
              zIndex,
              content: {
                text: rawEl.content.text || "Architectural Design Concept",
                fontSize: rawEl.content.fontSize || 24,
                fontWeight: rawEl.content.fontWeight || "normal",
                textAlign: rawEl.content.textAlign || "left",
                color: rawEl.content.color || "var(--text-primary)",
                lineHeight: 1.3,
              },
            };
          }

          case "image": {
            const asset = resolveImageRole(rawEl.content.imageRole);
            return {
              id: elementId,
              slideId,
              type: "image",
              x,
              y,
              width,
              height,
              zIndex,
              content: {
                src: asset.url,
                alt: rawEl.content.alt || asset.alt,
                objectFit: rawEl.content.objectFit || "cover",
                borderRadius: 8,
              },
            };
          }

          case "button": {
            let targetSlideId: string | undefined = undefined;
            let action: "navigate_slide" | "open_url" | "none" = rawEl.content.action || "navigate_slide";

            if (action === "navigate_slide") {
              const ref = rawEl.content.targetSlideRef?.toLowerCase().trim();
              if (ref && slideRefMap.has(ref)) {
                targetSlideId = slideRefMap.get(ref);
              } else {
                // Fallback: Link to next slide or first slide
                targetSlideId = slideIdList[slideIdx + 1] || slideIdList[0];
              }
            } else if (action === "open_url") {
              // Ensure secure HTTPS URL
              const url = rawEl.content.url;
              if (!url || !url.startsWith("https://")) {
                action = "none";
              }
            }

            return {
              id: elementId,
              slideId,
              type: "button",
              x,
              y,
              width,
              height,
              zIndex,
              content: {
                label: rawEl.content.label || "Explore Experience",
                action,
                targetSlideId,
                url: action === "open_url" ? rawEl.content.url : undefined,
                variant: rawEl.content.variant || "primary",
              },
            };
          }

          case "hotspot": {
            return {
              id: elementId,
              slideId,
              type: "hotspot",
              x,
              y,
              width: 48,
              height: 48,
              zIndex: 30,
              content: {
                title: rawEl.content.title || "Spatial Feature",
                description: rawEl.content.description || "Conceptual architectural specification.",
                action: "open_panel",
                triggerType: "click",
                badgeText: rawEl.content.badgeText || String(elIdx + 1),
                pulseAnimation: true,
                specs: rawEl.content.specs || [
                  { label: "Design Intent", value: "Conceptual Specification" },
                ],
              },
            };
          }

          case "info_card": {
            return {
              id: elementId,
              slideId,
              type: "info_card",
              x,
              y,
              width,
              height,
              zIndex,
              content: {
                title: rawEl.content.title || "Technical Specification",
                eyebrow: rawEl.content.eyebrow || "CONCEPTUAL PERFORMANCE",
                description: rawEl.content.description || "Sustainable materials and spatial integration parameters.",
                metadata: rawEl.content.metadata || [
                  { label: "Target Metric", value: "High Performance" },
                ],
              },
            };
          }

          case "comparison": {
            const beforeAsset = resolveImageRole(rawEl.content.beforeImageRole || "before_site");
            const afterAsset = resolveImageRole(rawEl.content.afterImageRole || "after_design");

            return {
              id: elementId,
              slideId,
              type: "comparison",
              x,
              y,
              width,
              height,
              zIndex,
              content: {
                beforeImageUrl: beforeAsset.url,
                afterImageUrl: afterAsset.url,
                beforeLabel: rawEl.content.beforeLabel || "Existing Site Context",
                afterLabel: rawEl.content.afterLabel || "Proposed Architecture",
                defaultPosition: rawEl.content.defaultPosition || 50,
                orientation: "horizontal",
              },
            };
          }
        }
      }
    );

    return {
      id: slideId,
      projectId,
      title: rawSlide.title,
      orderIndex: slideIdx,
      backgroundColor: rawSlide.backgroundColor || "#0C0E12",
      backgroundImageUrl,
      backgroundOverlayOpacity: rawSlide.backgroundOverlayOpacity ?? 0.35,
      transitionType: rawSlide.transitionType || "fade",
      background: backgroundImageUrl
        ? { type: "image", imageUrl: backgroundImageUrl, overlayOpacity: rawSlide.backgroundOverlayOpacity ?? 0.35 }
        : { type: "color", color: rawSlide.backgroundColor || "#0C0E12" },
      transition: rawSlide.transitionType || "fade",
      notes: rawSlide.notes,
      elements,
      createdAt: now,
      updatedAt: now,
    };
  });

  // 4. Construct complete Project domain model
  return {
    id: projectId,
    title: request.title.trim() || raw.title.trim(),
    description: request.description.trim() || raw.description.trim(),
    category: request.category || raw.category || "Architecture",
    aspectRatio: "16:9",
    thumbnailUrl: slides[0]?.backgroundImageUrl || resolveImageRole("hero_exterior").url,
    isPublished: false,
    shareSlug,
    settings: {
      aspectRatio: "16:9",
      theme: "dark",
      showNavigationArrows: true,
      allowPublicComments: true,
    },
    slides,
    createdAt: now,
    updatedAt: now,
  };
}
