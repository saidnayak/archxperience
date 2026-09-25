import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ViewerCanvas } from "../components/viewer/ViewerCanvas";
import { ViewerNavigation } from "../components/viewer/ViewerNavigation";
import { InfoPanel } from "../components/viewer/InfoPanel";
import { HotspotModal } from "../components/viewer/HotspotModal";
import type { InfoPanelData } from "../components/viewer/InfoPanel";
import { usePresentationStore, useProjectStore } from "../stores";
import type { HotspotContent, Project } from "../types";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { Button } from "../components/common/Button";
import { DEMO_PROJECT_ID } from "../lib/demo-data";

export const ViewerPage: React.FC = () => {
  const { shareSlug, projectId } = useParams<{ shareSlug?: string; projectId?: string }>();
  const location = useLocation();
  const isPreviewMode = location.pathname.startsWith("/preview");

  const { getProjectBySlug, getProjectById, getProjectFromCache } = useProjectStore();

  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    if (isPreviewMode && projectId) {
      return getProjectFromCache(projectId);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function resolveProject() {
      setIsLoading(true);
      try {
        let proj: Project | null = null;
        if (isPreviewMode) {
          proj = projectId
            ? await getProjectById(projectId)
            : await getProjectById(DEMO_PROJECT_ID);
        } else if (shareSlug) {
          // Public viewer: must strictly resolve published presentation by slug
          const resolved = await getProjectBySlug(shareSlug);
          if (resolved && resolved.isPublished) {
            proj = resolved;
          } else {
            proj = null;
          }
        }
        if (isMounted) {
          setCurrentProject(proj);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[ViewerPage] Failed to resolve presentation project:", err);
        if (isMounted) {
          setCurrentProject(null);
          setIsLoading(false);
        }
      }
    }

    resolveProject();
    return () => {
      isMounted = false;
    };
  }, [isPreviewMode, projectId, shareSlug, getProjectById, getProjectBySlug]);


  const slides = useMemo(() => currentProject?.slides || [], [currentProject?.slides]);

  const {
    currentSlideIndex,
    goToSlide,
    nextSlide,
    previousSlide,
    setTotalSlides,
    isFullscreen,
    toggleFullscreen,
    setFullscreen,
    transitionDirection,
    resetPresentation,
  } = usePresentationStore();

  // Active Hotspot data states
  const [selectedHotspot, setSelectedHotspot] = useState<InfoPanelData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-hide controls on user inactivity
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

  // Preloading next slide images for performance
  useEffect(() => {
    if (slides.length > currentSlideIndex + 1) {
      const nextSlide = slides[currentSlideIndex + 1];
      const nextBg = nextSlide.backgroundImageUrl || nextSlide.background?.imageUrl;
      if (nextBg) {
        const img = new Image();
        img.src = nextBg;
      }
    }
  }, [currentSlideIndex, slides]);

  // Sync total slide count
  useEffect(() => {
    setTotalSlides(slides.length);
  }, [slides.length, setTotalSlides]);

  // Auto-hide controls timer
  const handleUserActivity = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      // Keep controls visible if a panel or modal is open
      if (!isPanelOpen && !isModalOpen) {
        setControlsVisible(false);
      }
    }, 3500);
  }, [isPanelOpen, isModalOpen]);

  useEffect(() => {
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [handleUserActivity]);


  // Fullscreen change listener to sync store
  useEffect(() => {
    const handleFsChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [setFullscreen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If modal or panel is open, let them handle Escape
      if (e.key === "Escape") {
        if (isModalOpen) {
          setIsModalOpen(false);
          return;
        }
        if (isPanelOpen) {
          setIsPanelOpen(false);
          return;
        }
        if (isFullscreen) {
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
          setFullscreen(false);
          return;
        }
      }

      // Do not navigate slides if viewing an active overlay
      if (isModalOpen || isPanelOpen) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousSlide();
      }
    },
    [nextSlide, previousSlide, isFullscreen, setFullscreen, isModalOpen, isPanelOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      toggleFullscreen();
    } else {
      document.exitFullscreen?.().catch(() => {});
      toggleFullscreen();
    }
  };

  const handleHotspotClick = (hotspot: HotspotContent) => {
    const payload: InfoPanelData = {
      title: hotspot.title,
      category: "Technical Callout",
      description: hotspot.description || "Detailed technical specification for this space.",
      imageUrl: hotspot.imageUrl,
      specs: hotspot.specs || [
        { label: "Status", value: "Specified" },
        { label: "Compliance", value: "LEED Platinum / BREEAM" },
      ],
    };

    if (hotspot.action === "open_modal") {
      setSelectedHotspot(payload);
      setIsModalOpen(true);
    } else {
      setSelectedHotspot(payload);
      setIsPanelOpen(true);
    }
  };

  const handleNavigateSlide = (targetSlideId: string) => {
    const targetIdx = slides.findIndex((s) => s.id === targetSlideId);
    if (targetIdx !== -1) {
      goToSlide(targetIdx);
    }
  };

  const handleRestart = () => {
    resetPresentation();
    setIsPanelOpen(false);
    setIsModalOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-text-secondary">Loading presentation experience...</p>
      </div>
    );
  }

  // Graceful project not found
  if (!currentProject) {
    return (
      <div className="h-screen w-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-4 text-accent">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-display font-semibold mb-2">Presentation Unavailable</h1>
        <p className="text-xs text-text-secondary max-w-sm mb-6">
          The requested presentation could not be found or is currently in private draft mode.
        </p>

        <Link to="/dashboard">
          <Button variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Graceful empty slides state
  if (slides.length === 0) {
    return (
      <div className="h-screen w-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-4 text-accent">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-display font-semibold mb-2">Empty Presentation</h1>
        <p className="text-xs text-text-secondary max-w-sm mb-6">
          This presentation contains no slides yet. Open the studio editor to create your first slide.
        </p>
        {isPreviewMode && (
          <Link to={`/editor/${currentProject.id}`}>
            <Button variant="primary" size="sm">
              Open Editor
            </Button>
          </Link>
        )}
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div className="h-screen w-screen bg-background text-text-primary overflow-hidden relative flex flex-col items-center justify-center select-none">
      {/* Top Experience Bar (Auto-hides with controls) */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          {isPreviewMode ? (
            <Link to={`/editor/${currentProject.id}`}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="bg-surface/90 backdrop-blur-md"
              >
                Exit Preview
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface/85 backdrop-blur-md border border-border">
              <div className="w-4 h-4 rounded bg-accent text-text-primary flex items-center justify-center">
                <Layers className="w-2.5 h-2.5" />
              </div>
              <span className="text-xs font-display font-semibold tracking-architectural uppercase">
                {currentProject.title}
              </span>
            </div>
          )}
        </div>

        {/* Progress & Slide Counter */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-surface/85 backdrop-blur-md border border-border text-[11px] font-mono text-text-secondary">
            {String(currentSlideIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
        </div>
      </header>

      {/* Subtle First Slide Opening Hint */}
      {currentSlideIndex === 0 && controlsVisible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3 py-1 rounded-full bg-surface-elevated/70 backdrop-blur-xs border border-border/40 text-[11px] font-mono text-text-muted flex items-center gap-1.5 transition-opacity">
          <Sparkles className="w-3 h-3 text-accent" />
          <span>Click anywhere or use arrow keys to navigate</span>
        </div>
      )}

      {/* Presentation Canvas (Strict 1920x1080 resolution, letterbox/pillarbox) */}
      <ViewerCanvas
        slide={currentSlide}
        direction={transitionDirection}
        onHotspotClick={handleHotspotClick}
        onNavigateSlide={handleNavigateSlide}
        onRestartPresentation={handleRestart}
      />

      {/* Floating Bottom Navigation */}
      <ViewerNavigation
        currentIndex={currentSlideIndex}
        totalSlides={slides.length}
        onNext={nextSlide}
        onPrev={previousSlide}
        onSelectSlide={goToSlide}
        onRestart={handleRestart}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleFullscreenToggle}
        isVisible={controlsVisible}
      />

      {/* Hotspot Slide-over Technical Info Sheet */}
      <InfoPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        data={selectedHotspot}
      />

      {/* Centered Technical Hotspot Modal */}
      <HotspotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedHotspot}
      />
    </div>
  );
};
