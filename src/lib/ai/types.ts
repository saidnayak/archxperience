import type { ElementType, ProjectAspectRatio } from "../../types";

export interface AIGenerationRequest {
  title: string;
  description: string;
  category: "Architecture" | "Interior Design" | "Construction" | "Urban Design" | "Product Design" | "Other";
  designStyle?: "Minimalist" | "Brutalist" | "Biophilic" | "Modern" | "Industrial" | "Contemporary" | "Custom";
  audience?: "Client" | "Academic Jury" | "Investor" | "Public" | "Design Team";
  slideCount?: number; // 4 to 8, default 6
  includeFloorPlan?: boolean;
  includeMaterials?: boolean;
  includeComparison?: boolean;
  includeHotspots?: boolean;
  includeSustainability?: boolean;
  includeConclusion?: boolean;
}

export type GenerationStage =
  | "idle"
  | "analyzing"
  | "storytelling"
  | "structuring"
  | "interactions"
  | "content"
  | "validating"
  | "finalizing"
  | "complete"
  | "error";

export interface StageInfo {
  stage: GenerationStage;
  label: string;
  description: string;
}

export const GENERATION_STAGES: StageInfo[] = [
  {
    stage: "analyzing",
    label: "Analyzing project brief",
    description: "Evaluating spatial requirements, site context, and target audience...",
  },
  {
    stage: "storytelling",
    label: "Planning presentation story",
    description: "Structuring an architectural narrative with clear spatial progression...",
  },
  {
    stage: "structuring",
    label: "Structuring slides",
    description: "Arranging canonical 1920×1080 canvas layouts and concept hierarchies...",
  },
  {
    stage: "interactions",
    label: "Designing interactions",
    description: "Wiring technical callouts, floor plan hotspots, and spatial sliders...",
  },
  {
    stage: "content",
    label: "Preparing architectural content",
    description: "Formatting conceptual specifications, materials, and envelope metrics...",
  },
  {
    stage: "validating",
    label: "Validating experience",
    description: "Ensuring non-overlapping geometries, readable fonts, and valid links...",
  },
  {
    stage: "finalizing",
    label: "Opening Studio",
    description: "Hydrating into presentation workspace...",
  },
];

// Raw Intermediate AI Generation Output Interfaces
export interface RawGeneratedElement {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  rotation?: number;
  content: {
    // Text fields
    text?: string;
    fontSize?: number;
    fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold";
    textAlign?: "left" | "center" | "right" | "justify";
    color?: string;
    lineHeight?: number;
    letterSpacing?: string;

    // Image fields
    imageRole?: string;
    src?: string;
    alt?: string;
    objectFit?: "cover" | "contain" | "fill";
    caption?: string;
    borderRadius?: number;

    // Button fields
    label?: string;
    action?: "navigate_slide" | "open_url" | "none";
    targetSlideRef?: string;
    targetSlideId?: string;
    url?: string;
    variant?: "primary" | "secondary" | "outline" | "ghost";

    // Hotspot fields
    title?: string;
    description?: string;
    triggerType?: "click" | "hover";
    badgeText?: string;
    pulseAnimation?: boolean;
    specs?: { label: string; value: string }[];

    // Info card fields
    eyebrow?: string;
    metadata?: { label: string; value: string }[];

    // Comparison fields
    beforeImageRole?: string;
    afterImageRole?: string;
    beforeImageUrl?: string;
    afterImageUrl?: string;
    beforeLabel?: string;
    afterLabel?: string;
    defaultPosition?: number;
    orientation?: "horizontal" | "vertical";
  };
}

export interface RawGeneratedSlide {
  slideRef: string; // e.g. "slide-overview", "slide-concept", "slide-floorplan"
  title: string;
  orderIndex: number;
  backgroundColor?: string;
  backgroundImageRole?: string;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number;
  transitionType?: "fade" | "slide-left" | "slide-right" | "zoom" | "none";
  notes?: string;
  elements: RawGeneratedElement[];
}

export interface RawGeneratedProject {
  title: string;
  description: string;
  category: string;
  clientAudience?: string;
  aspectRatio?: ProjectAspectRatio;
  slides: RawGeneratedSlide[];
}

export interface AIGenerationResponse {
  success: boolean;
  data?: RawGeneratedProject;
  error?: {
    code: string;
    message: string;
  };
}
