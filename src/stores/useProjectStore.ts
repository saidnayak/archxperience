import { create } from "zustand";
import type { Project } from "../types";
import { getRepository } from "../lib/repository";

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  loadProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<Project | null>;
  getProjectBySlug: (slug: string) => Promise<Project | null>;
  getProjectFromCache: (id: string) => Project | null;
  setActiveProject: (project: Project | null) => void;
  createProject: (data: Partial<Project> & { title: string }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  duplicateProject: (id: string) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  saveProjectToDisk: (project: Project) => Promise<void>;
  setSearchQuery: (query: string) => void;
  resetToDemo: () => Promise<void>;
  resetDemo: () => Promise<void>;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,
  searchQuery: "",

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await getRepository().getProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      console.error("[ProjectStore] Failed to load projects:", err);
      set({ isLoading: false, error: "Failed to load projects from workspace repository." });
    }
  },

  getProjectById: async (id: string) => {
    // Check in-memory store cache first
    const cached = get().projects.find((p) => p.id === id);
    if (cached) return cached;

    try {
      const project = await getRepository().getProject(id);
      if (project) {
        // Hydrate into memory if not yet present
        set((state) => ({
          projects: state.projects.some((p) => p.id === id)
            ? state.projects
            : [...state.projects, project],
        }));
      }
      return project;
    } catch (err) {
      console.error(`[ProjectStore] Failed to fetch project ${id}:`, err);
      return null;
    }
  },

  getProjectBySlug: async (slug: string) => {
    const cached = get().projects.find((p) => p.shareSlug === slug || p.id === slug);
    if (cached) return cached;

    try {
      const project = await getRepository().getProjectBySlug(slug);
      if (project) {
        set((state) => ({
          projects: state.projects.some((p) => p.id === project.id)
            ? state.projects
            : [...state.projects, project],
        }));
      }
      return project;
    } catch (err) {
      console.error(`[ProjectStore] Failed to fetch project by slug ${slug}:`, err);
      return null;
    }
  },

  getProjectFromCache: (id: string) => {
    return get().projects.find((p) => p.id === id) || null;
  },

  setActiveProject: (project) => {
    set({ activeProject: project });
  },

  createProject: async (data) => {
    set({ error: null });
    try {
      const newProject = await getRepository().createProject(data);
      set((state) => ({ projects: [newProject, ...state.projects] }));
      return newProject;
    } catch (err) {
      console.error("[ProjectStore] Failed to create project:", err);
      set({ error: "Failed to create presentation project." });
      throw err;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const updated = await getRepository().updateProject(id, updates);
      if (updated) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updated : p)),
          activeProject: state.activeProject?.id === id ? updated : state.activeProject,
        }));
      }
      return updated;
    } catch (err) {
      console.error(`[ProjectStore] Failed to update project ${id}:`, err);
      set({ error: "Failed to save project updates." });
      return null;
    }
  },

  duplicateProject: async (id) => {
    try {
      const duplicated = await getRepository().duplicateProject(id);
      if (duplicated) {
        set((state) => ({ projects: [duplicated, ...state.projects] }));
      }
      return duplicated;
    } catch (err) {
      console.error(`[ProjectStore] Failed to duplicate project ${id}:`, err);
      set({ error: "Failed to duplicate project." });
      return null;
    }
  },

  deleteProject: async (id) => {
    try {
      const success = await getRepository().deleteProject(id);
      if (success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProject: state.activeProject?.id === id ? null : state.activeProject,
        }));
      }
      return success;
    } catch (err) {
      console.error(`[ProjectStore] Failed to delete project ${id}:`, err);
      set({ error: "Failed to delete project." });
      return false;
    }
  },

  saveProjectToDisk: async (project) => {
    try {
      await getRepository().updateProject(project.id, project);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === project.id ? project : p)),
        activeProject: state.activeProject?.id === project.id ? project : state.activeProject,
      }));
    } catch (err) {
      console.error(`[ProjectStore] Failed to save project to repository:`, err);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  resetToDemo: async () => {
    set({ isLoading: true, error: null });
    try {
      const reset = await getRepository().resetToDemo();
      set({ projects: reset, activeProject: reset[0], isLoading: false });
    } catch (err) {
      console.error("[ProjectStore] Failed to reset demo:", err);
      set({ isLoading: false, error: "Failed to restore demo project." });
    }
  },

  resetDemo: async () => {
    return get().resetToDemo();
  },

  clearProjects: () => {
    set({ projects: [], activeProject: null, error: null });
  },
}));
