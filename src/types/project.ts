import type { Slide } from "./slide";

export type ProjectAspectRatio = "16:9" | "4:3" | "16:10";

export interface ProjectSettings {
  aspectRatio: ProjectAspectRatio;
  theme: "dark" | "light";
  primaryColor?: string;
  allowPublicComments?: boolean;
  showNavigationArrows?: boolean;
}

export interface Project {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  category?: "Architecture" | "Interior Design" | "Landscape" | "Urban Planning" | "Product Design" | string;
  aspectRatio: ProjectAspectRatio;
  isPublished: boolean;
  shareSlug: string;
  slides: Slide[];
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}
