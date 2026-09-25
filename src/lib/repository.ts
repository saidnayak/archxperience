import type { Project, Slide, CanvasElement } from "../types";
import { ECOHUB_DEMO_PROJECT } from "./demo-data";

export const STORAGE_KEY_PROJECTS = "archxperience:v1:projects";

/**
 * Asynchronous repository contract for presentation projects.
 * Designed to unify local storage operations and future remote cloud (Supabase) operations.
 */
export interface IProjectRepository {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  createProject(data: Partial<Project> & { title: string }): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
  duplicateProject(id: string): Promise<Project | null>;
  resetToDemo(): Promise<Project[]>;
}

/**
 * Lightweight runtime validation for persisted Project structures
 */
function isValidProject(item: unknown): item is Project {
  if (!item || typeof item !== "object") return false;
  const p = item as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.title !== "string" || !Array.isArray(p.slides)) {
    return false;
  }
  return true;
}

/**
 * Validates slides and elements defensively
 */
function sanitizeSlides(slides: unknown[]): Slide[] {
  return slides.filter((s): s is Slide => {
    if (!s || typeof s !== "object") return false;
    const slide = s as Record<string, unknown>;
    return typeof slide.id === "string" && Array.isArray(slide.elements);
  }).map((s) => ({
    ...s,
    elements: Array.isArray(s.elements)
      ? (s.elements as CanvasElement[]).filter(
          (el) => el && typeof el.id === "string" && typeof el.type === "string" && typeof el.x === "number"
        )
      : [],
  }));
}

/**
 * LocalStorage adapter implementation of IProjectRepository.
 * Wraps browser localStorage synchronous access in Promise resolution
 * to seamlessly adhere to the async repository contract without artificial delays.
 *
 * NOTE ON PRIVACY LIMITATION:
 * LocalStorage is shared across the same browser origin. It is intended for
 * local prototyping and guest mode. Future authenticated multi-tenant isolation
 * will be handled via the Supabase cloud repository.
 */
export class LocalStorageProjectRepository implements IProjectRepository {
  private key: string;

  constructor(customKey: string = STORAGE_KEY_PROJECTS) {
    this.key = customKey;
  }

  private loadRaw(): Project[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        // First run: seed demo project
        this.saveRaw([ECOHUB_DEMO_PROJECT]);
        return [ECOHUB_DEMO_PROJECT];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn("[ProjectRepository] Stored data is not an array. Resetting to demo.");
        this.saveRaw([ECOHUB_DEMO_PROJECT]);
        return [ECOHUB_DEMO_PROJECT];
      }

      const validProjects = parsed.filter(isValidProject).map((p) => ({
        ...p,
        slides: sanitizeSlides(p.slides),
      }));

      if (validProjects.length === 0) {
        this.saveRaw([ECOHUB_DEMO_PROJECT]);
        return [ECOHUB_DEMO_PROJECT];
      }

      return validProjects;
    } catch (err) {
      console.error("[ProjectRepository] Failed to read or parse local storage:", err);
      return [ECOHUB_DEMO_PROJECT];
    }
  }

  private saveRaw(projects: Project[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(projects));
    } catch (err) {
      console.error("[ProjectRepository] Failed to save projects to local storage:", err);
    }
  }

  async getProjects(): Promise<Project[]> {
    return Promise.resolve(this.loadRaw());
  }

  async getProject(id: string): Promise<Project | null> {
    const projects = this.loadRaw();
    const found = projects.find((p) => p.id === id) || null;
    return Promise.resolve(found);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const projects = this.loadRaw();
    const found = projects.find((p) => p.shareSlug === slug || p.id === slug) || null;
    return Promise.resolve(found);
  }

  async createProject(data: Partial<Project> & { title: string }): Promise<Project> {
    const projects = this.loadRaw();
    const cleanSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Default blank 16:9 slide for fresh project
    const initialSlideId = `slide-${Date.now()}-1`;
    const initialSlide: Slide = {
      id: initialSlideId,
      projectId: newId,
      title: "01 / Title Slide",
      orderIndex: 0,
      backgroundColor: "#0C0E12",
      transitionType: "fade",
      background: {
        type: "color",
        color: "#0C0E12",
      },
      transition: "fade",
      elements: [
        {
          id: `el-title-${Date.now()}`,
          slideId: initialSlideId,
          type: "text",
          x: 160,
          y: 360,
          width: 1400,
          height: 140,
          zIndex: 1,
          content: {
            text: data.title,
            fontSize: 64,
            fontWeight: "bold",
            color: "var(--text-primary)",
          },
        },
        {
          id: `el-desc-${Date.now()}`,
          slideId: initialSlideId,
          type: "text",
          x: 160,
          y: 520,
          width: 1100,
          height: 80,
          zIndex: 1,
          content: {
            text: data.description || "Interactive presentation project.",
            fontSize: 22,
            color: "var(--text-secondary)",
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const projectSlides = data.slides && data.slides.length > 0 ? data.slides : [initialSlide];

    // Automatically derive thumbnail from first slide if available
    let derivedThumbnail = data.thumbnailUrl;
    if (!derivedThumbnail && projectSlides.length > 0) {
      const firstSlide = projectSlides[0];
      derivedThumbnail = firstSlide.backgroundImageUrl || firstSlide.background?.imageUrl;
      if (!derivedThumbnail) {
        const firstImgEl = firstSlide.elements.find((el) => el.type === "image");
        if (firstImgEl && "src" in firstImgEl.content && firstImgEl.content.src) {
          derivedThumbnail = firstImgEl.content.src;
        }
      }
    }

    const newProject: Project = {
      id: newId,
      title: data.title,
      description: data.description || "Interactive architectural presentation project.",
      thumbnailUrl:
        derivedThumbnail ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      aspectRatio: data.aspectRatio || "16:9",
      isPublished: Boolean(data.isPublished),
      shareSlug: `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: data.category || "Architecture",
      settings: data.settings || {
        aspectRatio: "16:9",
        theme: "dark",
        showNavigationArrows: true,
      },
      slides: projectSlides,
      createdAt: now,
      updatedAt: now,
    };

    projects.unshift(newProject);
    this.saveRaw(projects);
    return Promise.resolve(newProject);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = this.loadRaw();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return Promise.resolve(null);

    const updated: Project = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updated;
    this.saveRaw(projects);
    return Promise.resolve(updated);
  }

  async deleteProject(id: string): Promise<boolean> {
    const projects = this.loadRaw();
    const remaining = projects.filter((p) => p.id !== id);
    if (remaining.length === projects.length) return Promise.resolve(false);
    this.saveRaw(remaining);
    return Promise.resolve(true);
  }

  async duplicateProject(id: string): Promise<Project | null> {
    const original = await this.getProject(id);
    if (!original) return null;

    const newProjectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Map old slide IDs to new slide IDs for targetSlideId rewriting
    const slideIdMap = new Map<string, string>();
    original.slides.forEach((slide) => {
      slideIdMap.set(slide.id, `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    });

    const duplicatedSlides: Slide[] = original.slides.map((slide) => {
      const newSlideId = slideIdMap.get(slide.id)!;
      return {
        ...slide,
        id: newSlideId,
        projectId: newProjectId,
        elements: slide.elements.map((el) => {
          const newElId = `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          // Rewrite targetSlideId in button/hotspot if it links to internal slides
          const updatedContent = { ...el.content };
          if (
            "targetSlideId" in updatedContent &&
            updatedContent.targetSlideId &&
            slideIdMap.has(updatedContent.targetSlideId)
          ) {
            updatedContent.targetSlideId = slideIdMap.get(updatedContent.targetSlideId);
          }

          return {
            ...el,
            id: newElId,
            slideId: newSlideId,
            content: updatedContent,
          } as CanvasElement;
        }),
        createdAt: now,
        updatedAt: now,
      };
    });

    const duplicatedProject: Project = {
      ...original,
      id: newProjectId,
      title: `${original.title} (Copy)`,
      shareSlug: `${original.shareSlug}-copy-${Math.floor(100 + Math.random() * 900)}`,
      slides: duplicatedSlides,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    const projects = this.loadRaw();
    projects.unshift(duplicatedProject);
    this.saveRaw(projects);
    return Promise.resolve(duplicatedProject);
  }

  async resetToDemo(): Promise<Project[]> {
    const projects = [ECOHUB_DEMO_PROJECT];
    this.saveRaw(projects);
    return Promise.resolve(projects);
  }
}

import { SupabaseProjectRepository } from "./supabase-repository";
import { isSupabaseConfigured } from "./supabase";

export type RepositoryMode = "cloud" | "local";

const localRepoInstance = new LocalStorageProjectRepository();
let cloudRepoInstance: IProjectRepository | null = null;

function getCloudRepo(): IProjectRepository {
  if (!cloudRepoInstance) {
    cloudRepoInstance = new SupabaseProjectRepository();
  }
  return cloudRepoInstance;
}

const AUTH_MODE_KEY = "archxperience:v1:auth_mode";

export function getRepositoryMode(): RepositoryMode {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  if (mode === "cloud" && isSupabaseConfigured) {
    return "cloud";
  }
  return "local";
}

export function setRepositoryMode(mode: RepositoryMode): void {
  localStorage.setItem(AUTH_MODE_KEY, mode);
}

/**
 * Returns active repository based on authentication and configuration mode:
 * - "cloud": SupabaseProjectRepository
 * - "local": LocalStorageProjectRepository
 */
export function getRepository(): IProjectRepository {
  if (getRepositoryMode() === "cloud") {
    return getCloudRepo();
  }
  return localRepoInstance;
}

export function getLocalRepository(): IProjectRepository {
  return localRepoInstance;
}

export function getCloudRepository(): IProjectRepository {
  return getCloudRepo();
}

export function setRepository(repo: IProjectRepository): void {
  cloudRepoInstance = repo;
}

export const projectRepository: IProjectRepository = localRepoInstance;
