import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { EditorLayout } from "../components/layout/EditorLayout";
import { EditorToolbar } from "../components/editor/toolbar/EditorToolbar";
import { SlideListPanel } from "../components/editor/left-panel/SlideListPanel";
import { EditorCanvas } from "../components/editor/canvas/EditorCanvas";
import { PropertiesPanel } from "../components/editor/right-panel/PropertiesPanel";
import { PublishModal } from "../components/dashboard/PublishModal";
import { ExperienceReviewDrawer } from "../components/editor/review/ExperienceReviewDrawer";
import { SlideImprovementDrawer } from "../components/editor/assist/SlideImprovementDrawer";
import { HotspotAdvisorOverlay } from "../components/editor/assist/HotspotAdvisorOverlay";
import { SpecNormalizerModal } from "../components/editor/assist/SpecNormalizerModal";
import { AudienceTunerModal } from "../components/editor/assist/AudienceTunerModal";
import { useProjectStore, useEditorStore } from "../stores";
import { useEditorKeyboardShortcuts } from "../hooks";
import { DEMO_PROJECT_ID } from "../lib/demo-data";
import { requestHotspotSuggestions, convertSuggestedHotspotsToElements } from "../lib/ai";
import { useToast } from "../components/common/Toast";
import type { Project, CanvasElement, ImageElement, HotspotElement } from "../types";

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const targetId = projectId || DEMO_PROJECT_ID;

  const { getProjectById, getProjectFromCache, updateProject } = useProjectStore();
  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    return getProjectFromCache(targetId) || getProjectFromCache(DEMO_PROJECT_ID);
  });
  const [isLoadingProject, setIsLoadingProject] = useState(!currentProject);

  const {
    activeProjectId,
    projectTitle,
    slides,
    activeSlideId,
    setActiveSlide,
    selectElement,
    addElement,
    startTransaction,
    commitTransaction,
    triggerAutosave,
    loadProject,
  } = useEditorStore();

  const { showToast } = useToast();

  // Modals & Drawers State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isImproveOpen, setIsImproveOpen] = useState(false);
  const [isSpecNormalizerOpen, setIsSpecNormalizerOpen] = useState(false);
  const [targetElementForSpec, setTargetElementForSpec] = useState<CanvasElement | null>(null);
  const [isAudienceTunerOpen, setIsAudienceTunerOpen] = useState(false);

  // Hotspot Advisor Preview State
  const [previewHotspots, setPreviewHotspots] = useState<HotspotElement[] | null>(null);
  const [targetImageForHotspots, setTargetImageForHotspots] = useState<ImageElement | null>(null);

  // Hook up keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Delete, Arrows, Escape)
  useEditorKeyboardShortcuts();

  // Load project asynchronously into state and editor store
  useEffect(() => {
    let isMounted = true;

    async function fetchProject() {
      const project =
        (await getProjectById(targetId)) || (await getProjectById(DEMO_PROJECT_ID));
      if (!isMounted) return;

      if (project) {
        setCurrentProject(project);
        if (activeProjectId !== project.id) {
          loadProject(project);
        }
      }
      setIsLoadingProject(false);
    }

    fetchProject();

    return () => {
      isMounted = false;
    };
  }, [targetId, activeProjectId, getProjectById, loadProject]);

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0] || null;

  // Real-time project snapshot incorporating current live editor slides
  const liveProject: Project | null = useMemo(() => {
    if (!currentProject) return null;
    return {
      ...currentProject,
      title: projectTitle || currentProject.title,
      slides,
    };
  }, [currentProject, projectTitle, slides]);

  // Hotspot Advisor Trigger
  const handleTriggerHotspots = async (element: CanvasElement) => {
    if (element.type !== "image" || !liveProject || !activeSlide) return;
    const imgEl = element as ImageElement;
    setTargetImageForHotspots(imgEl);

    showToast("Analyzing drawing for hotspot placements...", "info");
    try {
      const res = await requestHotspotSuggestions(liveProject, activeSlide, imgEl);
      const elements = convertSuggestedHotspotsToElements(
        res.hotspots,
        imgEl,
        activeSlide.id,
        slides
      );
      setPreviewHotspots(elements);
      showToast(`Generated ${elements.length} suggested hotspots. Preview on canvas.`, "success");
    } catch (err: unknown) {
      console.error("[EditorPage] Hotspot suggestion failed:", err);
      showToast((err as Error)?.message || "Failed to suggest hotspots", "danger");
      setTargetImageForHotspots(null);
      setPreviewHotspots(null);
    }
  };

  // Hotspot Advisor: Apply suggested hotspots
  const handleApplyHotspots = () => {
    if (!previewHotspots || previewHotspots.length === 0) return;

    startTransaction();
    try {
      previewHotspots.forEach((h) => {
        addElement("hotspot", h);
      });
      commitTransaction();
      triggerAutosave();
      showToast(`Applied ${previewHotspots.length} hotspots to drawing (Ctrl+Z to undo)`, "success");
    } catch (err) {
      console.error("[EditorPage] Failed to apply hotspots:", err);
      showToast("Failed to apply hotspots", "danger");
    } finally {
      setPreviewHotspots(null);
      setTargetImageForHotspots(null);
    }
  };

  // Hotspot Advisor: Cancel preview
  const handleCancelHotspots = () => {
    setPreviewHotspots(null);
    setTargetImageForHotspots(null);
    showToast("Hotspot preview canceled", "info");
  };

  if (isLoadingProject && !currentProject) {
    return (
      <div className="h-screen w-screen bg-background text-text-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-text-secondary">Loading studio editor...</p>
        </div>
      </div>
    );
  }

  return (
    <EditorLayout
      toolbar={
        <EditorToolbar
          projectTitle={projectTitle || "Architectural Presentation"}
          projectId={activeProjectId || targetId}
          onShare={() => setIsShareOpen(true)}
          onOpenReview={() => setIsReviewOpen(true)}
        />
      }
      leftPanel={
        <SlideListPanel
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={(id) => setActiveSlide(id)}
        />
      }
      canvas={
        <EditorCanvas
          slide={activeSlide}
          previewHotspots={previewHotspots || undefined}
        />
      }
      rightPanel={
        <PropertiesPanel
          activeSlide={activeSlide}
          onTriggerImproveSlide={(id) => {
            setActiveSlide(id);
            setIsImproveOpen(true);
          }}
          onTriggerHotspots={handleTriggerHotspots}
          onTriggerSpecNormalizer={(el) => {
            setTargetElementForSpec(el);
            setIsSpecNormalizerOpen(true);
          }}
          onTriggerAudienceTuner={() => setIsAudienceTunerOpen(true)}
        />
      }
      overlay={
        <>
          {/* Hotspot Advisor Preview Banner */}
          <HotspotAdvisorOverlay
            isActive={!!previewHotspots && previewHotspots.length > 0}
            hotspotCount={previewHotspots?.length || 0}
            imageTitle={targetImageForHotspots?.content?.alt || "Drawing"}
            onApply={handleApplyHotspots}
            onCancel={handleCancelHotspots}
          />

          {/* Share / Publish Modal */}
          {currentProject && (
            <PublishModal
              isOpen={isShareOpen}
              onClose={() => setIsShareOpen(false)}
              projectTitle={projectTitle || currentProject.title}
              shareSlug={currentProject.shareSlug}
              isPublished={currentProject.isPublished}
              slideCount={slides.length}
              onTogglePublish={async (publish) => {
                if (publish) {
                  await useEditorStore.getState().saveProject();
                }
                const updated = await updateProject(currentProject.id, { isPublished: publish });
                if (updated) {
                  setCurrentProject(updated);
                }
              }}
            />
          )}

          {/* Experience Review Drawer */}
          {liveProject && (
            <ExperienceReviewDrawer
              isOpen={isReviewOpen}
              onClose={() => setIsReviewOpen(false)}
              project={liveProject}
              onSelectSlide={(id) => setActiveSlide(id)}
              onSelectElement={(id) => selectElement(id)}
              onTriggerImproveSlide={(id) => {
                setActiveSlide(id);
                setIsImproveOpen(true);
              }}
              onTriggerHotspots={(elementId) => {
                const targetEl = activeSlide?.elements.find((e) => e.id === elementId);
                if (targetEl) handleTriggerHotspots(targetEl);
              }}
            />
          )}

          {/* Slide Improvement Drawer */}
          {liveProject && (
            <SlideImprovementDrawer
              isOpen={isImproveOpen}
              onClose={() => setIsImproveOpen(false)}
              project={liveProject}
              slide={activeSlide}
            />
          )}

          {/* Spec Normalizer Modal */}
          <SpecNormalizerModal
            isOpen={isSpecNormalizerOpen}
            onClose={() => {
              setIsSpecNormalizerOpen(false);
              setTargetElementForSpec(null);
            }}
            element={targetElementForSpec}
          />

          {/* Audience Tone Tuner Modal */}
          {liveProject && (
            <AudienceTunerModal
              isOpen={isAudienceTunerOpen}
              onClose={() => setIsAudienceTunerOpen(false)}
              project={liveProject}
            />
          )}
        </>
      }
    />
  );
};
