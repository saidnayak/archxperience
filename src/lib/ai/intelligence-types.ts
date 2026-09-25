import type { CanvasElement } from "../../types";

export type IssueSeverity = "error" | "warning" | "suggestion";

export type IssueCategory =
  | "text_density"
  | "visual_hierarchy"
  | "geometry"
  | "interactivity"
  | "navigation"
  | "structure"
  | "aec_completeness"
  | "audience_alignment";

export type IssueAction =
  | "shorten_text"
  | "adjust_typography"
  | "add_hotspots"
  | "fix_overlap"
  | "add_metrics"
  | "adjust_tone"
  | "add_element"
  | "restructure_content";

export interface IssueItem {
  id: string;
  title: string;
  message: string;
  severity: IssueSeverity;
  category: IssueCategory;
  slideId?: string;
  slideIndex?: number;
  elementId?: string;
  elementName?: string;
  suggestedAction?: IssueAction;
  source: "deterministic" | "ai";
}

export type ChecklistStatus = "pass" | "attention" | "missing";

export interface AECChecklistItem {
  category: string;
  item: string;
  status: ChecklistStatus;
  notes: string;
}

export interface PresentationReviewResponse {
  executiveSummary: string;
  strengths: string[];
  issues: IssueItem[];
  strategicSuggestions: string[];
  checklist: AECChecklistItem[];
}

export interface SuggestedHotspot {
  id?: string;
  title: string;
  description: string;
  /** Normalized X position relative to parent image (0.0 to 1.0) */
  relativeX: number;
  /** Normalized Y position relative to parent image (0.0 to 1.0) */
  relativeY: number;
  specs: { label: string; value: string }[];
  targetSlideRef?: string;
  targetSlideId?: string;
  badgeText?: string;
}

export interface HotspotSuggestionResponse {
  targetElementId: string;
  targetImageAlt?: string;
  hotspots: SuggestedHotspot[];
}

export type SlideImprovementActionType =
  | "modify_text"
  | "adjust_typography"
  | "convert_to_card"
  | "add_element";

export interface SlideImprovementChange {
  id: string;
  elementId?: string;
  elementName?: string;
  action: SlideImprovementActionType;
  description: string;
  currentValue?: string;
  proposedValue?: string;
  proposedElement?: Partial<CanvasElement>;
}

export interface SlideImprovementResponse {
  slideId: string;
  rationale: string;
  suggestedChanges: SlideImprovementChange[];
}

export interface SpecificationSuggestion {
  elementId: string;
  originalText: string;
  specs: { label: string; value: string }[];
}

export interface AudienceSuggestion {
  audience: string;
  overallFit: string;
  observations: string[];
  recommendations: {
    slideId: string;
    slideTitle: string;
    advice: string;
    sampleRefinement?: {
      elementId?: string;
      original: string;
      proposed: string;
    };
  }[];
}
