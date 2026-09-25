import { create } from "zustand";

interface PresentationState {
  currentSlideIndex: number;
  totalSlides: number;
  isFullscreen: boolean;
  activeHotspotId: string | null;
  activeInfoPanelId: string | null;
  isPlaying: boolean;
  transitionDirection: "forward" | "backward";

  // Actions
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  prevSlide: () => void; // alias
  setTotalSlides: (total: number) => void;
  openHotspot: (id: string) => void;
  closeHotspot: () => void;
  openInfoPanel: (id: string) => void;
  closeInfoPanel: () => void;
  toggleFullscreen: () => void;
  setFullscreen: (val: boolean) => void;
  startPresentation: () => void;
  stopPresentation: () => void;
  resetPresentation: () => void;
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  currentSlideIndex: 0,
  totalSlides: 1,
  isFullscreen: false,
  activeHotspotId: null,
  activeInfoPanelId: null,
  isPlaying: false,
  transitionDirection: "forward",

  goToSlide: (index: number) => {
    const { totalSlides, currentSlideIndex } = get();
    if (index >= 0 && index < totalSlides) {
      set({
        currentSlideIndex: index,
        transitionDirection: index >= currentSlideIndex ? "forward" : "backward",
        activeHotspotId: null,
        activeInfoPanelId: null,
      });
    }
  },

  nextSlide: () => {
    const { currentSlideIndex, totalSlides } = get();
    if (currentSlideIndex < totalSlides - 1) {
      set({
        currentSlideIndex: currentSlideIndex + 1,
        transitionDirection: "forward",
        activeHotspotId: null,
        activeInfoPanelId: null,
      });
    }
  },

  previousSlide: () => {
    const { currentSlideIndex } = get();
    if (currentSlideIndex > 0) {
      set({
        currentSlideIndex: currentSlideIndex - 1,
        transitionDirection: "backward",
        activeHotspotId: null,
        activeInfoPanelId: null,
      });
    }
  },

  prevSlide: () => {
    get().previousSlide();
  },

  setTotalSlides: (total: number) => {
    set({ totalSlides: Math.max(1, total) });
  },

  openHotspot: (id: string) => {
    set({ activeHotspotId: id, activeInfoPanelId: id });
  },

  closeHotspot: () => {
    set({ activeHotspotId: null });
  },

  openInfoPanel: (id: string) => {
    set({ activeInfoPanelId: id });
  },

  closeInfoPanel: () => {
    set({ activeInfoPanelId: null, activeHotspotId: null });
  },

  toggleFullscreen: () => {
    set((state) => ({ isFullscreen: !state.isFullscreen }));
  },

  setFullscreen: (val: boolean) => {
    set({ isFullscreen: val });
  },

  startPresentation: () => {
    set({ isPlaying: true });
  },

  stopPresentation: () => {
    set({ isPlaying: false });
  },

  resetPresentation: () => {
    set({
      currentSlideIndex: 0,
      activeHotspotId: null,
      activeInfoPanelId: null,
      isFullscreen: false,
      isPlaying: false,
      transitionDirection: "forward",
    });
  },
}));
