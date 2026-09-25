import { create } from "zustand";
import type { Slide, CanvasElement, Project, ElementType } from "../types";
import { getRepository } from "../lib/repository";
import { generateUuid } from "../lib/utils";

const MAX_HISTORY_STEPS = 50;

interface EditorState {
  activeProjectId: string | null;
  projectTitle: string;
  slides: Slide[];
  activeSlideId: string | null;
  selectedElementIds: string[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
  gridSnapEnabled: boolean;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "unsaved" | "error";

  // History & Transaction Stack
  history: Slide[][];
  historyIndex: number;
  transactionSnapshot: Slide[] | null;

  // Clipboard for copy/paste
  clipboard: CanvasElement[];

  // Smart Guides / Active Alignment
  activeGuideX: number | null;
  activeGuideY: number | null;

  // Project Actions
  loadProject: (project: Project) => void;
  saveProject: () => Promise<void>;
  triggerAutosave: () => void;
  resetProject: () => void;

  // Slide Actions
  setActiveSlide: (slideId: string) => void;
  addSlide: (customTitle?: string) => Slide;
  duplicateSlide: (slideId: string) => Slide | null;
  updateSlide: (slideId: string, updates: Partial<Slide>) => void;
  deleteSlide: (slideId: string) => boolean;
  reorderSlides: (startIndex: number, endIndex: number) => void;

  // Element Actions
  addElement: (type: ElementType, overrides?: Partial<CanvasElement>) => CanvasElement | null;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  updateElementPosition: (elementId: string, x: number, y: number, snap?: boolean) => void;
  updateElementSize: (
    elementId: string,
    width: number,
    height: number,
    x?: number,
    y?: number
  ) => void;
  updateElementRotation: (elementId: string, rotation: number) => void;
  deleteElement: (elementId?: string) => void;
  deleteSelected: () => void;
  duplicateElement: (elementId?: string) => CanvasElement | null;
  duplicateSelected: () => CanvasElement[];
  selectElement: (elementId: string, multi?: boolean) => void;
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;

  // Multi-element & Alignment Actions
  moveSelected: (dx: number, dy: number, snap?: boolean) => void;
  alignSelected: (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => void;
  centerSelectedOnCanvas: (axis: "horizontal" | "vertical" | "both") => void;

  // Layer Ordering Actions
  bringForward: (elementId?: string) => void;
  sendBackward: (elementId?: string) => void;
  bringToFront: (elementId?: string) => void;
  sendToBack: (elementId?: string) => void;

  // Clipboard Actions
  copySelected: () => void;
  paste: () => CanvasElement[];

  // Canvas Actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGridSnap: () => void;
  setActiveGuides: (guideX: number | null, guideY: number | null) => void;

  // History Transaction Actions (to group mouse-drag movements into 1 undo step)
  startTransaction: () => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Deep clone slides array to guarantee immutable history snapshots
 */
function cloneSlides(slides: Slide[]): Slide[] {
  return JSON.parse(JSON.stringify(slides));
}

// Debounce timer and race-protection state for async autosave
let autosaveTimer: number | null = null;
let latestSaveSequence = 0;
let activeInFlightSave: Promise<void> | null = null;

export const useEditorStore = create<EditorState>((set, get) => ({
  activeProjectId: null,
  projectTitle: "Untitled Presentation",
  slides: [],
  activeSlideId: null,
  selectedElementIds: [],
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  gridSnapEnabled: true,
  isDirty: false,
  saveStatus: "saved",
  history: [],
  historyIndex: -1,
  transactionSnapshot: null,
  clipboard: [],
  activeGuideX: null,
  activeGuideY: null,

  loadProject: (project: Project) => {
    const slides = cloneSlides(project.slides || []);
    const firstSlideId = slides.length > 0 ? slides[0].id : null;

    set({
      activeProjectId: project.id,
      projectTitle: project.title,
      slides,
      activeSlideId: firstSlideId,
      selectedElementIds: [],
      isDirty: false,
      saveStatus: "saved",
      history: [cloneSlides(slides)],
      historyIndex: 0,
      zoomLevel: 1,
      transactionSnapshot: null,
    });
  },

  saveProject: async () => {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    const { activeProjectId, slides } = get();
    if (!activeProjectId) return;

    const snapshot = cloneSlides(slides);
    const currentSeq = ++latestSaveSequence;

    set({ saveStatus: "saving" });

    const performSave = async () => {
      try {
        await getRepository().updateProject(activeProjectId, { slides: snapshot });
        // Race guard: only newest save request can finalize status
        if (currentSeq === latestSaveSequence) {
          const currentSlides = get().slides;
          const isUnmodified =
            currentSlides.length === snapshot.length &&
            JSON.stringify(currentSlides) === JSON.stringify(snapshot);

          if (isUnmodified) {
            set({ isDirty: false, saveStatus: "saved" });
          } else {
            set({ isDirty: true, saveStatus: "unsaved" });
          }
        }
      } catch (err) {
        console.error("[useEditorStore] Failed to save project:", err);
        if (currentSeq === latestSaveSequence) {
          set({ saveStatus: "error" });
        }
        throw err;
      } finally {
        if (activeInFlightSave === currentPromise) {
          activeInFlightSave = null;
        }
      }
    };

    const currentPromise = performSave();
    activeInFlightSave = currentPromise;
    return currentPromise;
  },

  triggerAutosave: () => {
    set({ isDirty: true, saveStatus: "unsaved" });
    if (autosaveTimer) clearTimeout(autosaveTimer);

    autosaveTimer = window.setTimeout(() => {
      get().saveProject().catch(() => {});
    }, 750);
  },

  resetProject: () => {
    set({
      activeProjectId: null,
      projectTitle: "Untitled Presentation",
      slides: [],
      activeSlideId: null,
      selectedElementIds: [],
      isDirty: false,
      saveStatus: "saved",
      history: [],
      historyIndex: -1,
      transactionSnapshot: null,
    });
  },

  // ----------------------------------------------------
  // TRANSACTION MANAGEMENT (Group drag/resize to 1 undo step)
  // ----------------------------------------------------
  startTransaction: () => {
    const { slides, transactionSnapshot } = get();
    if (!transactionSnapshot) {
      set({ transactionSnapshot: cloneSlides(slides) });
    }
  },

  commitTransaction: () => {
    const { slides, history, historyIndex, transactionSnapshot } = get();
    if (!transactionSnapshot) return;

    // Only commit if slides actually changed
    const beforeStr = JSON.stringify(transactionSnapshot);
    const afterStr = JSON.stringify(slides);

    if (beforeStr !== afterStr) {
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
      newHistory.push(cloneSlides(slides));

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
        transactionSnapshot: null,
        activeGuideX: null,
        activeGuideY: null,
      });

      get().triggerAutosave();
    } else {
      set({
        transactionSnapshot: null,
        activeGuideX: null,
        activeGuideY: null,
      });
    }
  },

  cancelTransaction: () => {
    const { transactionSnapshot } = get();
    if (transactionSnapshot) {
      set({
        slides: cloneSlides(transactionSnapshot),
        transactionSnapshot: null,
        activeGuideX: null,
        activeGuideY: null,
      });
    }
  },

  // ----------------------------------------------------
  // SLIDE MANAGEMENT
  // ----------------------------------------------------
  setActiveSlide: (slideId: string) => {
    set({ activeSlideId: slideId, selectedElementIds: [] });
  },

  addSlide: (customTitle) => {
    const { activeProjectId, slides, history, historyIndex } = get();
    const newSlideId = generateUuid();
    const now = new Date().toISOString();

    const newSlide: Slide = {
      id: newSlideId,
      projectId: activeProjectId || "proj-local",
      title: customTitle || `Slide ${slides.length + 1}`,
      orderIndex: slides.length,
      backgroundColor: "#0C0E12",
      transitionType: "fade",
      background: {
        type: "color",
        color: "#0C0E12",
      },
      transition: "fade",
      elements: [],
      createdAt: now,
      updatedAt: now,
    };

    const newSlides = [...slides, newSlide];
    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      activeSlideId: newSlideId,
      selectedElementIds: [],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
    return newSlide;
  },

  duplicateSlide: (slideId: string) => {
    const { slides, history, historyIndex } = get();
    const target = slides.find((s) => s.id === slideId);
    if (!target) return null;

    const newSlideId = generateUuid();
    const now = new Date().toISOString();

    const duplicatedElements = target.elements.map((el) => ({
      ...el,
      id: generateUuid(),
      slideId: newSlideId,
      content: { ...el.content },
      styles: el.styles ? { ...el.styles } : undefined,
    })) as CanvasElement[];


    const duplicatedSlide: Slide = {
      ...target,
      id: newSlideId,
      title: `${target.title} (Copy)`,
      orderIndex: target.orderIndex + 1,
      elements: duplicatedElements,
      createdAt: now,
      updatedAt: now,
    };

    const targetIdx = slides.findIndex((s) => s.id === slideId);
    const newSlides = [...slides];
    newSlides.splice(targetIdx + 1, 0, duplicatedSlide);
    newSlides.forEach((s, idx) => {
      s.orderIndex = idx;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      activeSlideId: newSlideId,
      selectedElementIds: [],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
    return duplicatedSlide;
  },

  updateSlide: (slideId: string, updates: Partial<Slide>) => {
    const { slides, history, historyIndex } = get();
    const newSlides = slides.map((s) =>
      s.id === slideId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
  },

  deleteSlide: (slideId: string) => {
    const { slides, activeSlideId, history, historyIndex } = get();
    if (slides.length <= 1) return false;

    const newSlides = slides
      .filter((s) => s.id !== slideId)
      .map((s, idx) => ({ ...s, orderIndex: idx }));

    let nextActiveId = activeSlideId;
    if (activeSlideId === slideId) {
      const deletedIdx = slides.findIndex((s) => s.id === slideId);
      const fallbackIdx = Math.max(0, deletedIdx - 1);
      nextActiveId = newSlides[fallbackIdx]?.id || newSlides[0]?.id;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      activeSlideId: nextActiveId,
      selectedElementIds: [],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
    return true;
  },

  reorderSlides: (startIndex: number, endIndex: number) => {
    const { slides, history, historyIndex } = get();
    if (startIndex === endIndex || startIndex < 0 || endIndex >= slides.length) return;

    const reordered = [...slides];
    const [moved] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, moved);
    reordered.forEach((s, idx) => {
      s.orderIndex = idx;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(reordered));

    set({
      slides: reordered,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
  },

  // ----------------------------------------------------
  // ELEMENT MANAGEMENT
  // ----------------------------------------------------
  addElement: (type: ElementType, overrides?: Partial<CanvasElement>) => {
    const { slides, activeSlideId, history, historyIndex } = get();
    if (!activeSlideId) return null;

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return null;

    const newElId = generateUuid();
    const maxZ = currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 0);

    let defaultContent: CanvasElement["content"];
    let defaultWidth = 400;
    let defaultHeight = 160;
    let defaultX = 300;
    let defaultY = 250;

    switch (type) {
      case "text":
        defaultContent = {
          text: "Add your heading",
          fontSize: 48,
          fontWeight: "bold",
          color: "var(--text-primary)",
          lineHeight: 1.2,
          textAlign: "left",
        };
        defaultWidth = 600;
        defaultHeight = 100;
        defaultX = 300;
        defaultY = 250;
        break;
      case "image":
        defaultContent = {
          src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
          alt: "Architectural Visual",
          objectFit: "cover",
          borderRadius: 6,
        };
        defaultWidth = 700;
        defaultHeight = 400;
        defaultX = 400;
        defaultY = 250;
        break;
      case "button":
        defaultContent = {
          label: "Explore Detail",
          action: "none",
          variant: "primary",
        };
        defaultWidth = 260;
        defaultHeight = 60;
        defaultX = 700;
        defaultY = 800;
        break;
      case "hotspot":
        defaultContent = {
          title: "Technical Hotspot Callout",
          description: "Inspect architectural detail or material specification.",
          badgeText: `${currentSlide.elements.filter((e) => e.type === "hotspot").length + 1}`,
          action: "open_panel",
          pulseAnimation: true,
        };
        defaultWidth = 48;
        defaultHeight = 48;
        defaultX = 900;
        defaultY = 500;
        break;
      case "info_card":
        defaultContent = {
          title: "Specification Schedule",
          eyebrow: "SPECIFICATION",
          description: "Technical description of material performance, acoustic rating, and embodied carbon values.",
          metadata: [
            { label: "Material", value: "Specified" },
            { label: "Status", value: "Verified" },
          ],
        };
        defaultWidth = 450;
        defaultHeight = 240;
        defaultX = 500;
        defaultY = 350;
        break;
      case "comparison":
        defaultContent = {
          beforeImageUrl:
            "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80",
          afterImageUrl:
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
          beforeLabel: "Before / Existing",
          afterLabel: "After / Proposed",
          defaultPosition: 50,
          orientation: "horizontal",
        };
        defaultWidth = 1000;
        defaultHeight = 560;
        defaultX = 300;
        defaultY = 250;
        break;
      default:
        defaultContent = { text: "Element" };
    }

    const newElement: CanvasElement = {
      id: newElId,
      slideId: activeSlideId,
      type,
      x: defaultX,
      y: defaultY,
      width: defaultWidth,
      height: defaultHeight,
      zIndex: maxZ + 1,
      rotation: 0,
      content: defaultContent,
      styles: {},
      ...overrides,
    } as CanvasElement;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        return {
          ...slide,
          elements: [...slide.elements, newElement],
          updatedAt: new Date().toISOString(),
        };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      selectedElementIds: [newElId],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
    return newElement;
  },

  updateElement: (elementId: string, updates: Partial<CanvasElement>) => {
    const { slides, activeSlideId, history, historyIndex } = get();
    if (!activeSlideId) return;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const updatedElements = slide.elements.map((el) => {
          if (el.id === elementId) {
            return {
              ...el,
              ...updates,
              content: updates.content ? { ...el.content, ...updates.content } : el.content,
              styles: updates.styles ? { ...el.styles, ...updates.styles } : el.styles,
            } as CanvasElement;
          }
          return el;
        });
        return { ...slide, elements: updatedElements, updatedAt: new Date().toISOString() };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
  },

  updateElementPosition: (elementId: string, x: number, y: number, snap = true) => {
    const { slides, activeSlideId, gridSnapEnabled } = get();
    if (!activeSlideId) return;

    let finalX = x;
    let finalY = y;

    if (snap && gridSnapEnabled) {
      finalX = Math.round(finalX / 16) * 16;
      finalY = Math.round(finalY / 16) * 16;
    }

    // Guide checks for Canvas center
    let guideX: number | null = null;
    let guideY: number | null = null;

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    const targetEl = currentSlide?.elements.find((e) => e.id === elementId);

    if (targetEl) {
      const centerX = finalX + targetEl.width / 2;
      const centerY = finalY + targetEl.height / 2;

      // Center of 1920x1080 canvas is (960, 540)
      if (Math.abs(centerX - 960) < 12) {
        finalX = 960 - targetEl.width / 2;
        guideX = 960;
      }
      if (Math.abs(centerY - 540) < 12) {
        finalY = 540 - targetEl.height / 2;
        guideY = 540;
      }
    }

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) =>
          el.id === elementId
            ? ({
                ...el,
                x: Math.round(finalX),
                y: Math.round(finalY),
              } as CanvasElement)
            : el
        );
        return { ...slide, elements };
      }
      return slide;
    });

    set({
      slides: newSlides,
      activeGuideX: guideX,
      activeGuideY: guideY,
      isDirty: true,
    });
  },

  updateElementSize: (elementId, width, height, x, y) => {
    const { slides, activeSlideId, gridSnapEnabled } = get();
    if (!activeSlideId) return;

    let w = Math.max(24, Math.round(width));
    let h = Math.max(24, Math.round(height));

    if (gridSnapEnabled) {
      w = Math.max(24, Math.round(w / 16) * 16);
      h = Math.max(24, Math.round(h / 16) * 16);
    }

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) => {
          if (el.id === elementId) {
            return {
              ...el,
              width: w,
              height: h,
              x: x !== undefined ? Math.round(x) : el.x,
              y: y !== undefined ? Math.round(y) : el.y,
            } as CanvasElement;
          }
          return el;
        });
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides, isDirty: true });
  },

  updateElementRotation: (elementId: string, rotation: number) => {
    const { slides, activeSlideId } = get();
    if (!activeSlideId) return;

    // Normalize rotation 0 - 360
    let normalized = Math.round(rotation) % 360;
    if (normalized < 0) normalized += 360;

    // Snap to 0, 90, 180, 270 if within 5 degrees
    if (Math.abs(normalized - 0) < 5 || Math.abs(normalized - 360) < 5) normalized = 0;
    else if (Math.abs(normalized - 90) < 5) normalized = 90;
    else if (Math.abs(normalized - 180) < 5) normalized = 180;
    else if (Math.abs(normalized - 270) < 5) normalized = 270;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) =>
          el.id === elementId ? ({ ...el, rotation: normalized } as CanvasElement) : el
        );
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides, isDirty: true });
  },

  deleteElement: (elementId?: string) => {
    if (elementId) {
      set({ selectedElementIds: [elementId] });
    }
    get().deleteSelected();
  },

  deleteSelected: () => {
    const { slides, activeSlideId, selectedElementIds, history, historyIndex } = get();
    if (!activeSlideId || selectedElementIds.length === 0) return;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        return {
          ...slide,
          elements: slide.elements.filter((el) => !selectedElementIds.includes(el.id)),
          updatedAt: new Date().toISOString(),
        };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      selectedElementIds: [],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
  },

  duplicateElement: (elementId?: string) => {
    if (elementId) {
      set({ selectedElementIds: [elementId] });
    }
    const dups = get().duplicateSelected();
    return dups.length > 0 ? dups[0] : null;
  },

  duplicateSelected: () => {
    const { slides, activeSlideId, selectedElementIds, history, historyIndex } = get();
    if (!activeSlideId || selectedElementIds.length === 0) return [];

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return [];

    const newDuplicated: CanvasElement[] = [];
    const maxZ = currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 0);

    selectedElementIds.forEach((id, idx) => {
      const source = currentSlide.elements.find((el) => el.id === id);
      if (source) {
        const newElId = generateUuid();
        newDuplicated.push({

          ...source,
          id: newElId,
          x: source.x + 32,
          y: source.y + 32,
          zIndex: maxZ + 1 + idx,
          content: { ...source.content },
          styles: source.styles ? { ...source.styles } : undefined,
        } as CanvasElement);
      }
    });

    if (newDuplicated.length === 0) return [];

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        return {
          ...slide,
          elements: [...slide.elements, ...newDuplicated],
          updatedAt: new Date().toISOString(),
        };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      selectedElementIds: newDuplicated.map((el) => el.id),
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
    return newDuplicated;
  },

  selectElement: (elementId: string, multi = false) => {
    set((state) => {
      if (multi) {
        const exists = state.selectedElementIds.includes(elementId);
        return {
          selectedElementIds: exists
            ? state.selectedElementIds.filter((id) => id !== elementId)
            : [...state.selectedElementIds, elementId],
        };
      }
      return { selectedElementIds: [elementId] };
    });
  },

  selectElements: (elementIds: string[]) => {
    set({ selectedElementIds: elementIds });
  },

  clearSelection: () => {
    set({ selectedElementIds: [] });
  },

  // ----------------------------------------------------
  // MULTI-ELEMENT & ALIGNMENT ACTIONS
  // ----------------------------------------------------
  moveSelected: (dx: number, dy: number, snap = true) => {
    const { slides, activeSlideId, selectedElementIds, gridSnapEnabled } = get();
    if (!activeSlideId || selectedElementIds.length === 0) return;

    let deltaX = dx;
    let deltaY = dy;

    if (snap && gridSnapEnabled) {
      deltaX = Math.round(deltaX / 16) * 16;
      deltaY = Math.round(deltaY / 16) * 16;
    }

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) => {
          if (selectedElementIds.includes(el.id)) {
            return {
              ...el,
              x: Math.max(0, Math.min(1920 - el.width, Math.round(el.x + deltaX))),
              y: Math.max(0, Math.min(1080 - el.height, Math.round(el.y + deltaY))),
            } as CanvasElement;
          }
          return el;
        });
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides, isDirty: true });
  },

  alignSelected: (alignment) => {
    const { slides, activeSlideId, selectedElementIds, history, historyIndex } = get();
    if (!activeSlideId || selectedElementIds.length === 0) return;

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    if (selectedElements.length === 0) return;

    // Bounding metrics of the selected group
    const minX = Math.min(...selectedElements.map((el) => el.x));
    const maxX = Math.max(...selectedElements.map((el) => el.x + el.width));
    const minY = Math.min(...selectedElements.map((el) => el.y));
    const maxY = Math.max(...selectedElements.map((el) => el.y + el.height));
    const groupCenterX = minX + (maxX - minX) / 2;
    const groupCenterY = minY + (maxY - minY) / 2;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) => {
          if (!selectedElementIds.includes(el.id)) return el;

          let newX = el.x;
          let newY = el.y;

          switch (alignment) {
            case "left":
              newX = minX;
              break;
            case "center":
              newX = Math.round(groupCenterX - el.width / 2);
              break;
            case "right":
              newX = maxX - el.width;
              break;
            case "top":
              newY = minY;
              break;
            case "middle":
              newY = Math.round(groupCenterY - el.height / 2);
              break;
            case "bottom":
              newY = maxY - el.height;
              break;
          }

          return { ...el, x: newX, y: newY } as CanvasElement;
        });
        return { ...slide, elements };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
  },

  centerSelectedOnCanvas: (axis) => {
    const { slides, activeSlideId, selectedElementIds, history, historyIndex } = get();
    if (!activeSlideId || selectedElementIds.length === 0) return;

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    if (selectedElements.length === 0) return;

    // Reference canvas width = 1920, height = 1080
    const minX = Math.min(...selectedElements.map((el) => el.x));
    const maxX = Math.max(...selectedElements.map((el) => el.x + el.width));
    const minY = Math.min(...selectedElements.map((el) => el.y));
    const maxY = Math.max(...selectedElements.map((el) => el.y + el.height));

    const groupW = maxX - minX;
    const groupH = maxY - minY;

    const targetGroupX = Math.round((1920 - groupW) / 2);
    const targetGroupY = Math.round((1080 - groupH) / 2);

    const shiftX = targetGroupX - minX;
    const shiftY = targetGroupY - minY;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) => {
          if (!selectedElementIds.includes(el.id)) return el;
          return {
            ...el,
            x: axis === "vertical" ? el.x : Math.round(el.x + shiftX),
            y: axis === "horizontal" ? el.y : Math.round(el.y + shiftY),
          } as CanvasElement;
        });
        return { ...slide, elements };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
  },

  // ----------------------------------------------------
  // LAYER ORDERING ACTIONS
  // ----------------------------------------------------
  bringForward: (elementId?: string) => {
    const { slides, activeSlideId, selectedElementIds } = get();
    const id = elementId || selectedElementIds[0];
    if (!activeSlideId || !id) return;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) =>
          el.id === id ? { ...el, zIndex: el.zIndex + 1 } : el
        );
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides });
    get().triggerAutosave();
  },

  sendBackward: (elementId?: string) => {
    const { slides, activeSlideId, selectedElementIds } = get();
    const id = elementId || selectedElementIds[0];
    if (!activeSlideId || !id) return;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) =>
          el.id === id ? { ...el, zIndex: Math.max(1, el.zIndex - 1) } : el
        );
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides });
    get().triggerAutosave();
  },

  bringToFront: (elementId?: string) => {
    const { slides, activeSlideId, selectedElementIds } = get();
    const id = elementId || selectedElementIds[0];
    if (!activeSlideId || !id) return;

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;
    const maxZ = currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 0);

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) =>
          el.id === id ? { ...el, zIndex: maxZ + 1 } : el
        );
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides });
    get().triggerAutosave();
  },

  sendToBack: (elementId?: string) => {
    const { slides, activeSlideId, selectedElementIds } = get();
    const id = elementId || selectedElementIds[0];
    if (!activeSlideId || !id) return;

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        const elements = slide.elements.map((el) =>
          el.id === id ? { ...el, zIndex: 1 } : el
        );
        return { ...slide, elements };
      }
      return slide;
    });

    set({ slides: newSlides });
    get().triggerAutosave();
  },

  // ----------------------------------------------------
  // CLIPBOARD (Copy / Paste)
  // ----------------------------------------------------
  copySelected: () => {
    const { slides, activeSlideId, selectedElementIds } = get();
    if (!activeSlideId || selectedElementIds.length === 0) return;

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;

    const copied = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
    set({ clipboard: cloneSlides([{ id: "", projectId: "", title: "", orderIndex: 0, elements: copied, createdAt: "", updatedAt: "" }])[0].elements });
  },

  paste: () => {
    const { slides, activeSlideId, clipboard, history, historyIndex } = get();
    if (!activeSlideId || clipboard.length === 0) return [];

    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return [];

    const maxZ = currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 0);
    const pastedElements: CanvasElement[] = clipboard.map((el, idx) => {
      const newElId = generateUuid();
      return {

        ...el,
        id: newElId,
        slideId: activeSlideId,
        x: Math.min(1920 - el.width, el.x + 40),
        y: Math.min(1080 - el.height, el.y + 40),
        zIndex: maxZ + 1 + idx,
        content: { ...el.content },
        styles: el.styles ? { ...el.styles } : undefined,
      } as CanvasElement;
    });

    const newSlides = slides.map((slide) => {
      if (slide.id === activeSlideId) {
        return {
          ...slide,
          elements: [...slide.elements, ...pastedElements],
          updatedAt: new Date().toISOString(),
        };
      }
      return slide;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_HISTORY_STEPS) newHistory.shift();
    newHistory.push(cloneSlides(newSlides));

    set({
      slides: newSlides,
      selectedElementIds: pastedElements.map((el) => el.id),
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    get().triggerAutosave();
    return pastedElements;
  },

  // ----------------------------------------------------
  // CANVAS ZOOM & PAN
  // ----------------------------------------------------
  setZoom: (zoom: number) => {
    const clamped = Math.min(Math.max(zoom, 0.25), 2.5);
    set({ zoomLevel: Number(clamped.toFixed(2)) });
  },

  setPan: (pan) => {
    set({ panOffset: pan });
  },

  toggleGridSnap: () => {
    set((state) => ({ gridSnapEnabled: !state.gridSnapEnabled }));
  },

  setActiveGuides: (guideX, guideY) => {
    set({ activeGuideX: guideX, activeGuideY: guideY });
  },

  // ----------------------------------------------------
  // UNDO / REDO
  // ----------------------------------------------------
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const restoredSlides = cloneSlides(history[targetIndex]);
      set({
        slides: restoredSlides,
        historyIndex: targetIndex,
        selectedElementIds: [],
        isDirty: true,
      });

      get().triggerAutosave();
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const restoredSlides = cloneSlides(history[targetIndex]);
      set({
        slides: restoredSlides,
        historyIndex: targetIndex,
        selectedElementIds: [],
        isDirty: true,
      });

      get().triggerAutosave();
    }
  },

  get canUndo() {
    return get().historyIndex > 0;
  },

  get canRedo() {
    const { history, historyIndex } = get();
    return historyIndex >= 0 && historyIndex < history.length - 1;
  },
}));
