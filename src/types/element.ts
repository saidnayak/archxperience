export type ElementType =
  | "text"
  | "image"
  | "hotspot"
  | "info_card"
  | "comparison"
  | "button";

export interface ElementStyles {
  opacity?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: string;
  blur?: boolean | string;
  padding?: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
}

export interface BaseElement {
  id: string;
  slideId: string;
  type: ElementType;
  /** X coordinate on the virtual 1920x1080 reference canvas */
  x: number;
  /** Y coordinate on the virtual 1920x1080 reference canvas */
  y: number;
  /** Width in virtual 1920 reference canvas units */
  width: number;
  /** Height in virtual 1080 reference canvas units */
  height: number;
  zIndex: number;
  rotation?: number;
  locked?: boolean;
  styles?: ElementStyles;
}

export interface TextElementContent {
  text: string;
  fontSize?: number;
  fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold";
  fontFamily?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  color?: string;
  lineHeight?: number;
  letterSpacing?: string;
}

export interface ImageElementContent {
  src: string;
  alt?: string;
  objectFit?: "cover" | "contain" | "fill";
  caption?: string;
  borderRadius?: number;
}

export interface ButtonElementContent {
  label: string;
  action: "navigate_slide" | "open_url" | "none";
  targetSlideId?: string;
  url?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export interface HotspotElementContent {
  title: string;
  description?: string;
  triggerType?: "click" | "hover";
  action: "open_panel" | "open_modal" | "navigate_slide" | "open_url";
  targetSlideId?: string;
  imageUrl?: string;
  badgeText?: string;
  pulseAnimation?: boolean;
  specs?: { label: string; value: string }[];
}

export interface InfoCardElementContent {
  title: string;
  description: string;
  eyebrow?: string;
  imageUrl?: string;
  metadata?: { label: string; value: string }[];
}

export interface ComparisonElementContent {
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  defaultPosition?: number; // 0 to 100 percentage
  orientation?: "horizontal" | "vertical";
}

// Discriminated Unions for CanvasElement
export interface TextElement extends BaseElement {
  type: "text";
  content: TextElementContent;
}

export interface ImageElement extends BaseElement {
  type: "image";
  content: ImageElementContent;
}

export interface ButtonElement extends BaseElement {
  type: "button";
  content: ButtonElementContent;
}

export interface HotspotElement extends BaseElement {
  type: "hotspot";
  content: HotspotElementContent;
}

export interface InfoCardElement extends BaseElement {
  type: "info_card";
  content: InfoCardElementContent;
}

export interface ComparisonElement extends BaseElement {
  type: "comparison";
  content: ComparisonElementContent;
}

export type CanvasElement =
  | TextElement
  | ImageElement
  | ButtonElement
  | HotspotElement
  | InfoCardElement
  | ComparisonElement;

// Aliases for compatibility
export type TextContent = TextElementContent;
export type ImageContent = ImageElementContent;
export type ButtonContent = ButtonElementContent;
export type HotspotContent = HotspotElementContent;
export type InfoCardContent = InfoCardElementContent;
export type ComparisonContent = ComparisonElementContent;
