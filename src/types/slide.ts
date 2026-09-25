import type { CanvasElement } from "./element";

export type SlideTransition = "fade" | "slide-left" | "slide-right" | "zoom" | "none";

export interface SlideBackground {
  type: "color" | "image" | "gradient";
  color?: string;
  imageUrl?: string;
  overlayOpacity?: number; // 0 to 1
}

export interface Slide {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number;
  transitionType?: SlideTransition;
  /** Backwards compatibility alias */
  background?: SlideBackground;
  /** Backwards compatibility alias */
  transition?: SlideTransition;
  elements: CanvasElement[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
