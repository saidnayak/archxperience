import React, { useRef, useState, useEffect } from "react";
import type { Slide, HotspotElement } from "../../../types";
import { useEditorStore } from "../../../stores";
import { ElementRenderer } from "../elements/ElementRenderer";

export interface EditorCanvasProps {
  slide: Slide | null;
  previewHotspots?: HotspotElement[];
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ slide, previewHotspots }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    zoomLevel,
    clearSelection,
    activeGuideX,
    activeGuideY,
    gridSnapEnabled,
  } = useEditorStore();
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 700 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute scale factor to fit 1920x1080 reference canvas into container with padding
  const padding = 48;
  const availableWidth = Math.max(100, containerSize.width - padding * 2);
  const availableHeight = Math.max(100, containerSize.height - padding * 2);
  const baseScale = Math.min(availableWidth / 1920, availableHeight / 1080);
  const effectiveScale = Number((baseScale * zoomLevel).toFixed(4));

  const bgImage = slide?.backgroundImageUrl || slide?.background?.imageUrl;
  const bgColor = slide?.backgroundColor || slide?.background?.color || "#0C0E12";
  const bgOpacity = slide?.backgroundOverlayOpacity ?? slide?.background?.overlayOpacity ?? 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-auto grid-pattern relative select-none"
      onClick={clearSelection}
    >
      {/* 1920x1080 Reference Canvas Artboard */}
      <div
        style={{
          width: "1920px",
          height: "1080px",
          transform: `scale(${effectiveScale})`,
          transformOrigin: "center center",
          backgroundColor: bgColor,
        }}
        className="shrink-0 relative overflow-hidden border border-border-strong rounded shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {slide ? (
          <>
            {/* Background Visual Layer */}
            {bgImage && (
              <img
                src={bgImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                style={{ opacity: 1 - bgOpacity }}
              />
            )}

            {/* Elements Layer */}
            <div className="absolute inset-0 z-10">
              {slide.elements.map((element) => (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  isEditor={true}
                  scaleFactor={effectiveScale}
                />
              ))}

              {/* Transient AI Suggested Hotspot Preview Markers */}
              {previewHotspots?.map((marker, idx) => (
                <div
                  key={`preview-${idx}`}
                  className="absolute z-30 pointer-events-none flex items-center gap-2 animate-in zoom-in-75 duration-200"
                  style={{
                    left: `${marker.x}px`,
                    top: `${marker.y}px`,
                    width: `${marker.width}px`,
                    height: `${marker.height}px`,
                  }}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-accent bg-accent/30 text-white flex items-center justify-center font-mono font-bold text-xs shadow-lg animate-pulse">
                    {marker.content.badgeText || String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="bg-surface-elevated/95 backdrop-blur-md border border-accent/50 text-accent font-mono text-[11px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                    {marker.content.title}
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Center Alignment Guides (Active during dragging) */}
            {activeGuideX !== null && (
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-accent z-40 pointer-events-none shadow-[0_0_8px_rgba(200,97,62,0.8)]"
                style={{ left: `${activeGuideX}px` }}
              >
                <div className="absolute top-2 -translate-x-1/2 bg-accent text-text-primary text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                  Center X (960)
                </div>
              </div>
            )}
            {activeGuideY !== null && (
              <div
                className="absolute left-0 right-0 h-[1.5px] bg-accent z-40 pointer-events-none shadow-[0_0_8px_rgba(200,97,62,0.8)]"
                style={{ top: `${activeGuideY}px` }}
              >
                <div className="absolute left-2 -translate-y-1/2 bg-accent text-text-primary text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                  Center Y (540)
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg text-text-muted font-mono">
            No active slide selected
          </div>
        )}

        {/* 1920x1080 Dimension Badge & Grid State */}
        <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-md px-3 py-1 rounded text-xs font-mono text-text-muted border border-border pointer-events-none flex items-center gap-3">
          <span>1920 × 1080 Canvas (Scale: {Math.round(effectiveScale * 100)}%)</span>
          {gridSnapEnabled && <span className="text-accent">Snap: 16px</span>}
        </div>
      </div>
    </div>
  );
};
