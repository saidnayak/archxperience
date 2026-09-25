import React, { useRef, useState, useEffect } from "react";
import type { CanvasElement } from "../../../types";
import { useEditorStore } from "../../../stores";
import { cn } from "../../../lib/utils";
import { BeforeAfterSlider } from "../../viewer/BeforeAfterSlider";
import { MapPin, ArrowRight, RotateCw } from "lucide-react";

export interface ElementRendererProps {
  element: CanvasElement;
  isEditor?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  scaleFactor?: number;
}

type ResizeDirection = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isEditor = true,
  scaleFactor = 1,
}) => {
  const {
    selectedElementIds,
    selectElement,
    updateElementPosition,
    updateElementSize,
    updateElementRotation,
    updateElement,
    startTransaction,
    commitTransaction,
  } = useEditorStore();

  const isSelected = isEditor && selectedElementIds.includes(element.id);

  // Dragging in 1920x1080 virtual coordinate space
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    elX: number;
    elY: number;
  } | null>(null);

  // Resizing state
  const [resizeDir, setResizeDir] = useState<ResizeDirection | null>(null);
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  } | null>(null);

  // Rotating state
  const [isRotating, setIsRotating] = useState(false);
  const rotateCenterRef = useRef<{ cx: number; cy: number; initAngle: number } | null>(null);

  // Inline text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditingText]);

  // Handle Drag Start
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditor || element.locked || isEditingText) return;
    e.stopPropagation();

    // Select this element (multi-select on Shift)
    selectElement(element.id, e.shiftKey);

    startTransaction();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elX: element.x,
      elY: element.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = (e.clientX - dragStartRef.current.startX) / scaleFactor;
    const dy = (e.clientY - dragStartRef.current.startY) / scaleFactor;

    const newX = Math.max(0, Math.min(1920 - element.width, dragStartRef.current.elX + dx));
    const newY = Math.max(0, Math.min(1080 - element.height, dragStartRef.current.elY + dy));

    updateElementPosition(element.id, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe ignore
      }
      commitTransaction();
    }
  };

  // ----------------------------------------------------
  // RESIZE HANDLER
  // ----------------------------------------------------
  const handleResizeStart = (dir: ResizeDirection, e: React.PointerEvent) => {
    e.stopPropagation();
    startTransaction();
    setResizeDir(dir);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: element.x,
      initY: element.y,
      initW: element.width,
      initH: element.height,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeDir || !resizeStartRef.current) return;
    const deltaX = (e.clientX - resizeStartRef.current.startX) / scaleFactor;
    const deltaY = (e.clientY - resizeStartRef.current.startY) / scaleFactor;

    const { initX, initY, initW, initH } = resizeStartRef.current;
    let newX = initX;
    let newY = initY;
    let newW = initW;
    let newH = initH;

    // Corner / Edge adjustments
    if (resizeDir.includes("e")) {
      newW = Math.max(30, initW + deltaX);
    }
    if (resizeDir.includes("s")) {
      newH = Math.max(30, initH + deltaY);
    }
    if (resizeDir.includes("w")) {
      const prospectiveW = initW - deltaX;
      if (prospectiveW >= 30) {
        newW = prospectiveW;
        newX = initX + deltaX;
      }
    }
    if (resizeDir.includes("n")) {
      const prospectiveH = initH - deltaY;
      if (prospectiveH >= 30) {
        newH = prospectiveH;
        newY = initY + deltaY;
      }
    }

    // Aspect ratio preservation with Shift key
    if (e.shiftKey && (resizeDir === "se" || resizeDir === "nw" || resizeDir === "ne" || resizeDir === "sw")) {
      const ratio = initW / initH;
      newH = newW / ratio;
    }

    updateElementSize(element.id, newW, newH, newX, newY);
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (resizeDir) {
      setResizeDir(null);
      resizeStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe ignore
      }
      commitTransaction();
    }
  };

  // ----------------------------------------------------
  // ROTATION HANDLER
  // ----------------------------------------------------
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    startTransaction();
    setIsRotating(true);

    const elBox = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const cx = elBox.left + elBox.width / 2;
    const cy = elBox.top + elBox.height / 2;

    const angleNow = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    rotateCenterRef.current = { cx, cy, initAngle: angleNow - (element.rotation || 0) };

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleRotateMove = (e: React.PointerEvent) => {
    if (!isRotating || !rotateCenterRef.current) return;
    const { cx, cy, initAngle } = rotateCenterRef.current;
    const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    let newRotation = currentAngle - initAngle;
    if (newRotation < 0) newRotation += 360;

    // Shift key snaps to 15-degree increments
    if (e.shiftKey) {
      newRotation = Math.round(newRotation / 15) * 15;
    }

    updateElementRotation(element.id, newRotation);
  };

  const handleRotateEnd = (e: React.PointerEvent) => {
    if (isRotating) {
      setIsRotating(false);
      rotateCenterRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe ignore
      }
      commitTransaction();
    }
  };

  // Double click for inline text editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isEditor || element.type !== "text") return;
    e.stopPropagation();
    setIsEditingText(true);
  };

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    zIndex: element.zIndex,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: "center center",
    opacity: element.styles?.opacity ?? 1,
  };

  const renderContent = () => {
    switch (element.type) {
      case "text": {
        const content = element.content;
        if (isEditingText) {
          return (
            <textarea
              ref={textInputRef}
              value={content.text || ""}
              onChange={(e) =>
                updateElement(element.id, {
                  content: { ...content, text: e.target.value },
                })
              }
              onBlur={() => setIsEditingText(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
                  e.stopPropagation();
                  setIsEditingText(false);
                }
              }}
              className="w-full h-full p-2 bg-surface-elevated/95 text-text-primary rounded border border-accent font-display focus:outline-none resize-none leading-tight"
              style={{
                fontSize: `${content.fontSize || element.styles?.fontSize || 24}px`,
                fontWeight: content.fontWeight || element.styles?.fontWeight || "normal",
                textAlign: content.textAlign || element.styles?.textAlign || "left",
              }}
            />
          );
        }

        return (
          <div
            className="w-full h-full flex flex-col justify-center select-none cursor-text"
            style={{
              fontSize: `${content.fontSize || element.styles?.fontSize || 24}px`,
              fontWeight: content.fontWeight || element.styles?.fontWeight || "normal",
              color: content.color || element.styles?.color || "var(--text-primary)",
              textAlign: content.textAlign || element.styles?.textAlign || "left",
              lineHeight: content.lineHeight || 1.25,
            }}
          >
            <p className="font-display break-words">{content.text || "Heading Text"}</p>
          </div>
        );
      }

      case "image": {
        const content = element.content;
        const imageUrl = content.src || (content as unknown as { url?: string }).url || "";
        return (
          <div
            className="w-full h-full overflow-hidden border border-border/40 shadow-subtle"
            style={{
              borderRadius: `${content.borderRadius ?? element.styles?.borderRadius ?? 4}px`,
            }}
          >
            <img
              src={imageUrl}
              alt={content.alt || "Visual"}
              className="w-full h-full pointer-events-none select-none"
              style={{ objectFit: content.objectFit || "cover" }}
              onError={(e) => {
                // Graceful fallback for broken image URLs
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          </div>
        );
      }

      case "hotspot": {
        const content = element.content;
        return (
          <div className="w-full h-full flex items-center justify-center pointer-events-auto">
            <div className="relative group cursor-pointer">
              {content.pulseAnimation !== false && (
                <span className="absolute -inset-2 rounded-full bg-accent/40 animate-ping pointer-events-none" />
              )}
              <div className="relative w-11 h-11 rounded-full bg-accent text-text-primary flex items-center justify-center shadow-accent-glow border-2 border-text-primary/40 font-bold text-sm">
                {content.badgeText ? (
                  <span className="font-mono">{content.badgeText}</span>
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </div>

              {/* Title preview pill */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded bg-surface-elevated text-xs font-semibold text-text-primary border border-border shadow-elevated opacity-95 pointer-events-none">
                {content.title}
              </div>
            </div>
          </div>
        );
      }

      case "info_card": {
        const content = element.content;
        const metadata =
          content.metadata ||
          (content as unknown as { metrics?: { label: string; value: string }[] }).metrics ||
          [];
        return (
          <div
            className="w-full h-full p-6 rounded bg-surface-elevated/95 backdrop-blur-md border border-border shadow-elevated flex flex-col justify-between overflow-hidden"
            style={{
              borderRadius: `${element.styles?.borderRadius ?? 6}px`,
            }}
          >
            <div>
              {content.eyebrow && (
                <div className="text-[11px] uppercase tracking-wider font-mono text-accent mb-1.5 font-medium">
                  {content.eyebrow}
                </div>
              )}
              <h4 className="text-lg font-display font-semibold text-text-primary leading-tight">
                {content.title}
              </h4>
              <p className="text-xs text-text-secondary mt-2 line-clamp-4 leading-relaxed">
                {content.description || (content as unknown as { body?: string }).body}
              </p>
            </div>

            {metadata.length > 0 && (
              <div className="pt-3 border-t border-border/60 flex items-center gap-4">
                {metadata.map((m, idx) => (
                  <div key={idx}>
                    <div className="text-[10px] text-text-muted uppercase font-mono">{m.label}</div>
                    <div className="text-xs font-bold text-text-primary font-mono">{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "comparison": {
        const content = element.content;
        return (
          <div className="w-full h-full overflow-hidden rounded border border-border">
            <BeforeAfterSlider
              beforeImage={content.beforeImageUrl}
              afterImage={content.afterImageUrl}
              beforeLabel={content.beforeLabel}
              afterLabel={content.afterLabel}
              initialSplit={content.defaultPosition || 50}
              className="w-full h-full"
            />
          </div>
        );
      }

      case "button": {
        const content = element.content;
        return (
          <div className="w-full h-full flex items-center justify-center">
            <button
              className={cn(
                "w-full h-full rounded font-medium flex items-center justify-center gap-2 text-sm shadow-sm transition-colors",
                content.variant === "secondary"
                  ? "bg-surface-elevated text-text-primary border border-border hover:bg-surface-subtle"
                  : "bg-accent text-text-primary hover:bg-accent-hover"
              )}
            >
              <span>{content.label || "Interactive Button"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "select-none transition-shadow",
        isEditor && !isEditingText && "cursor-move hover:ring-1 hover:ring-accent/50",
        isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-background"
      )}
    >
      {renderContent()}

      {/* Complete 8 Handles & Rotation Pin when element is selected in editor */}
      {isSelected && !isEditingText && (
        <>
          {/* Rotation Handle Pin above element */}
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group z-30"
            onPointerDown={handleRotateStart}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateEnd}
            title="Rotate Element (Hold Shift for 15° steps)"
          >
            <div className="w-4 h-4 rounded-full bg-accent text-text-primary flex items-center justify-center shadow-subtle border border-text-primary/60 group-hover:scale-110 transition-transform">
              <RotateCw className="w-2.5 h-2.5" />
            </div>
            <div className="w-[1px] h-3 bg-accent" />
          </div>

          {/* 4 Corner Handles: NW, NE, SE, SW */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-text-primary border-2 border-accent rounded-xs cursor-nwse-resize z-20"
            onPointerDown={(e) => handleResizeStart("nw", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-text-primary border-2 border-accent rounded-xs cursor-nesw-resize z-20"
            onPointerDown={(e) => handleResizeStart("ne", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-text-primary border-2 border-accent rounded-xs cursor-nesw-resize z-20"
            onPointerDown={(e) => handleResizeStart("sw", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-text-primary border-2 border-accent rounded-xs cursor-nwse-resize z-20"
            onPointerDown={(e) => handleResizeStart("se", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />

          {/* 4 Side Handles: N, S, E, W */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-text-primary border border-accent rounded-xs cursor-ns-resize z-20"
            onPointerDown={(e) => handleResizeStart("n", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-text-primary border border-accent rounded-xs cursor-ns-resize z-20"
            onPointerDown={(e) => handleResizeStart("s", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-3 bg-text-primary border border-accent rounded-xs cursor-ew-resize z-20"
            onPointerDown={(e) => handleResizeStart("w", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-3 bg-text-primary border border-accent rounded-xs cursor-ew-resize z-20"
            onPointerDown={(e) => handleResizeStart("e", e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
        </>
      )}
    </div>
  );
};
