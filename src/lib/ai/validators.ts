import type {
  RawGeneratedProject,
  RawGeneratedSlide,
  RawGeneratedElement,
} from "./types";
import type { ElementType } from "../../types";

const VALID_ELEMENT_TYPES = new Set<ElementType>([
  "text",
  "image",
  "button",
  "hotspot",
  "info_card",
  "comparison",
]);

/**
 * Validates and repairs an individual generated element.
 * Returns null if the element is fundamentally unrecoverable.
 */
export function validateAndSanitizeElement(
  raw: unknown,
  _slideRef: string,
  index: number
): RawGeneratedElement | null {
  if (!raw || typeof raw !== "object") return null;

  const el = raw as Record<string, unknown>;

  // Validate or infer element type
  const rawType = String(el.type || "").toLowerCase() as ElementType;
  const type: ElementType = VALID_ELEMENT_TYPES.has(rawType) ? rawType : "text";

  // Validate coordinates (canonical 1920x1080 canvas)
  let x = typeof el.x === "number" && !isNaN(el.x) ? Math.round(el.x) : 120;
  let y = typeof el.y === "number" && !isNaN(el.y) ? Math.round(el.y) : 100 + index * 100;
  let width = typeof el.width === "number" && !isNaN(el.width) ? Math.round(el.width) : 400;
  let height = typeof el.height === "number" && !isNaN(el.height) ? Math.round(el.height) : 80;

  // Boundary constraints
  x = Math.max(0, Math.min(1920 - 40, x));
  y = Math.max(0, Math.min(1080 - 40, y));
  width = Math.max(40, Math.min(1920 - x, width));
  height = Math.max(20, Math.min(1080 - y, height));

  const zIndex = typeof el.zIndex === "number" ? Math.max(1, Math.min(50, Math.round(el.zIndex))) : 10;
  const content = (el.content && typeof el.content === "object" ? el.content : {}) as Record<string, unknown>;

  // Sanitize content per element type
  const sanitizedContent: RawGeneratedElement["content"] = {};

  switch (type) {
    case "text":
      sanitizedContent.text = String(content.text || "Architectural Space & Narrative");
      sanitizedContent.fontSize =
        typeof content.fontSize === "number" ? Math.max(12, Math.min(96, content.fontSize)) : 24;
      sanitizedContent.fontWeight = (
        ["light", "normal", "medium", "semibold", "bold"].includes(String(content.fontWeight))
          ? content.fontWeight
          : "normal"
      ) as RawGeneratedElement["content"]["fontWeight"];
      sanitizedContent.textAlign = (
        ["left", "center", "right", "justify"].includes(String(content.textAlign))
          ? content.textAlign
          : "left"
      ) as RawGeneratedElement["content"]["textAlign"];
      sanitizedContent.color =
        typeof content.color === "string" && content.color.startsWith("#")
          ? content.color
          : undefined;
      break;

    case "image":
      sanitizedContent.imageRole = String(content.imageRole || "hero_exterior");
      sanitizedContent.alt = String(content.alt || "Architectural Drawing Visual");
      sanitizedContent.objectFit = (
        ["cover", "contain", "fill"].includes(String(content.objectFit))
          ? content.objectFit
          : "cover"
      ) as RawGeneratedElement["content"]["objectFit"];
      break;

    case "button":
      sanitizedContent.label = String(content.label || "Explore Slide");
      sanitizedContent.action = (
        ["navigate_slide", "open_url", "none"].includes(String(content.action))
          ? content.action
          : "navigate_slide"
      ) as RawGeneratedElement["content"]["action"];
      sanitizedContent.targetSlideRef =
        typeof content.targetSlideRef === "string" ? content.targetSlideRef : undefined;
      sanitizedContent.variant = (
        ["primary", "secondary", "outline", "ghost"].includes(String(content.variant))
          ? content.variant
          : "primary"
      ) as RawGeneratedElement["content"]["variant"];
      break;

    case "hotspot":
      sanitizedContent.title = String(content.title || "Spatial Feature");
      sanitizedContent.description = String(
        content.description || "Interactive spatial detail and material specification."
      );
      sanitizedContent.triggerType = "click";
      sanitizedContent.badgeText = String(content.badgeText || String(index + 1));
      sanitizedContent.pulseAnimation = true;
      if (Array.isArray(content.specs)) {
        sanitizedContent.specs = content.specs
          .filter((s) => s && typeof s === "object")
          .map((s) => ({
            label: String((s as Record<string, unknown>).label || "Metric"),
            value: String((s as Record<string, unknown>).value || "Conceptual Specification"),
          }));
      } else {
        sanitizedContent.specs = [
          { label: "Specification", value: "Conceptual Design Intent" },
        ];
      }
      break;

    case "info_card":
      sanitizedContent.title = String(content.title || "Design Specification");
      sanitizedContent.eyebrow = String(content.eyebrow || "TECHNICAL CONCEPT");
      sanitizedContent.description = String(
        content.description || "Sustainable materials and spatial integration parameters."
      );
      if (Array.isArray(content.metadata)) {
        sanitizedContent.metadata = content.metadata
          .filter((m) => m && typeof m === "object")
          .map((m) => ({
            label: String((m as Record<string, unknown>).label || "Parameter"),
            value: String((m as Record<string, unknown>).value || "Target Value"),
          }));
      } else {
        sanitizedContent.metadata = [
          { label: "Target Metric", value: "High Performance" },
        ];
      }
      break;

    case "comparison":
      sanitizedContent.beforeImageRole = String(content.beforeImageRole || "before_site");
      sanitizedContent.afterImageRole = String(content.afterImageRole || "after_design");
      sanitizedContent.beforeLabel = String(content.beforeLabel || "Existing Context");
      sanitizedContent.afterLabel = String(content.afterLabel || "Proposed Architecture");
      sanitizedContent.defaultPosition =
        typeof content.defaultPosition === "number"
          ? Math.max(10, Math.min(90, content.defaultPosition))
          : 50;
      break;
  }

  return {
    type,
    x,
    y,
    width,
    height,
    zIndex,
    content: sanitizedContent,
  };
}

/**
 * Validates and sanitizes a complete raw generated presentation structure.
 */
export function validateAndSanitizeRawPresentation(raw: unknown): RawGeneratedProject {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid generation payload: Expected JSON object.");
  }

  const p = raw as Record<string, unknown>;

  const title = typeof p.title === "string" && p.title.trim() ? p.title.trim() : "Untitled Presentation";
  const description = typeof p.description === "string" ? p.description.trim() : "";
  const category = typeof p.category === "string" ? p.category.trim() : "Architecture";
  const clientAudience = typeof p.clientAudience === "string" ? p.clientAudience.trim() : undefined;

  if (!Array.isArray(p.slides) || p.slides.length === 0) {
    throw new Error("Generation failure: Response did not include any slides.");
  }

  const sanitizedSlides: RawGeneratedSlide[] = [];

  p.slides.forEach((rawSlide, slideIdx) => {
    if (!rawSlide || typeof rawSlide !== "object") return;
    const s = rawSlide as Record<string, unknown>;

    const slideRef = typeof s.slideRef === "string" && s.slideRef.trim()
      ? s.slideRef.trim()
      : `slide-${slideIdx + 1}`;

    const slideTitle = typeof s.title === "string" && s.title.trim()
      ? s.title.trim()
      : `0${slideIdx + 1} / Presentation Slide`;

    const elements: RawGeneratedElement[] = [];
    if (Array.isArray(s.elements)) {
      s.elements.forEach((rawEl, elIdx) => {
        const sanitizedEl = validateAndSanitizeElement(rawEl, slideRef, elIdx);
        if (sanitizedEl) {
          elements.push(sanitizedEl);
        }
      });
    }

    sanitizedSlides.push({
      slideRef,
      title: slideTitle,
      orderIndex: slideIdx,
      backgroundColor: typeof s.backgroundColor === "string" ? s.backgroundColor : "#0C0E12",
      backgroundImageRole: typeof s.backgroundImageRole === "string" ? s.backgroundImageRole : undefined,
      backgroundOverlayOpacity:
        typeof s.backgroundOverlayOpacity === "number"
          ? Math.max(0, Math.min(1, s.backgroundOverlayOpacity))
          : 0.35,
      transitionType: (
        ["fade", "slide-left", "slide-right", "zoom", "none"].includes(String(s.transitionType))
          ? s.transitionType
          : "fade"
      ) as RawGeneratedSlide["transitionType"],
      notes: typeof s.notes === "string" ? s.notes : undefined,
      elements,
    });
  });

  if (sanitizedSlides.length === 0) {
    throw new Error("Generation failure: All slides in payload were invalid.");
  }

  return {
    title,
    description,
    category,
    clientAudience,
    aspectRatio: "16:9",
    slides: sanitizedSlides,
  };
}
