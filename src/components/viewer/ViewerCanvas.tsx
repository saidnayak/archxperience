import React, { useRef, useState, useEffect } from "react";
import type { Slide, HotspotContent, CanvasElement } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { getSlideTransitionVariants } from "../../lib/motion";
import { InteractiveHotspot } from "./InteractiveHotspot";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ArrowRight } from "lucide-react";

export interface ViewerCanvasProps {
  slide: Slide;
  direction?: "forward" | "backward";
  onHotspotClick?: (hotspot: HotspotContent) => void;
  onNavigateSlide?: (targetSlideId: string) => void;
  onRestartPresentation?: () => void;
}

export const ViewerCanvas: React.FC<ViewerCanvasProps> = ({
  slide,
  direction = "forward",
  onHotspotClick,
  onNavigateSlide,
  onRestartPresentation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const s = Math.min(clientWidth / 1920, clientHeight / 1080);
      setScale(Number(s.toFixed(4)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const bgImage = slide.backgroundImageUrl || slide.background?.imageUrl;
  const bgColor = slide.backgroundColor || slide.background?.color || "#0C0E12";
  const bgOpacity = slide.backgroundOverlayOpacity ?? slide.background?.overlayOpacity ?? 0;
  const transitionType = slide.transitionType || (slide.transition as any) || "fade";

  const variants = getSlideTransitionVariants(transitionType, direction);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-2 sm:p-4 relative overflow-hidden select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            width: "1920px",
            height: "1080px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            backgroundColor: bgColor,
          }}
          className="shrink-0 relative overflow-hidden rounded border border-border-strong shadow-elevated"
        >
          {/* Slide Background Visual Layer */}
          {bgImage && (
            <img
              src={bgImage}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{ opacity: 1 - bgOpacity }}
              onError={(e) => {
                // Graceful error fallback
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}

          {/* Slide Elements Layer (Exact 1920x1080 virtual coordinate space) */}
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {slide.elements.map((el: CanvasElement) => {
              const elStyle: React.CSSProperties = {
                position: "absolute",
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                zIndex: el.zIndex,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                opacity: el.styles?.opacity ?? 1,
              };

              switch (el.type) {
                case "hotspot": {
                  const hotspot = el.content;
                  return (
                    <div
                      key={el.id}
                      style={elStyle}
                      className="flex items-center justify-center pointer-events-auto"
                    >
                      <InteractiveHotspot
                        content={hotspot}
                        onClick={() => {
                          if (hotspot.action === "navigate_slide" && hotspot.targetSlideId) {
                            onNavigateSlide?.(hotspot.targetSlideId);
                          } else if (hotspot.action === "open_url" && (hotspot as any).url) {
                            const targetUrl = (hotspot as any).url;
                            if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
                              window.open(targetUrl, "_blank", "noopener,noreferrer");
                            }
                          } else if (onHotspotClick) {
                            onHotspotClick(hotspot);
                          }
                        }}
                      />
                    </div>
                  );
                }

                case "text": {
                  const content = el.content;
                  return (
                    <div
                      key={el.id}
                      style={{
                        ...elStyle,
                        fontSize: `${content.fontSize || el.styles?.fontSize || 24}px`,
                        fontWeight: content.fontWeight || el.styles?.fontWeight || "normal",
                        color: content.color || el.styles?.color || "var(--text-primary)",
                        textAlign: content.textAlign || el.styles?.textAlign || "left",
                        lineHeight: content.lineHeight || 1.25,
                      }}
                      className="flex flex-col justify-center select-none"
                    >
                      <p className="font-display break-words">{content.text}</p>
                    </div>
                  );
                }

                case "image": {
                  const content = el.content;
                  const imgSrc = content.src || (content as unknown as { url?: string }).url || "";
                  return (
                    <div
                      key={el.id}
                      style={{
                        ...elStyle,
                        borderRadius: `${content.borderRadius || el.styles?.borderRadius || 4}px`,
                      }}
                      className="overflow-hidden border border-border/40 shadow-subtle"
                    >
                      <img
                        src={imgSrc}
                        alt={content.alt || "Visual"}
                        className="w-full h-full"
                        style={{ objectFit: content.objectFit || "cover" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
                        }}
                      />
                    </div>
                  );
                }

                case "info_card": {
                  const content = el.content;
                  const metadata =
                    content.metadata ||
                    (content as unknown as { metrics?: { label: string; value: string }[] }).metrics ||
                    [];
                  return (
                    <div
                      key={el.id}
                      style={elStyle}
                      className="p-6 rounded bg-surface-elevated/95 backdrop-blur-md border border-border shadow-elevated flex flex-col justify-between overflow-hidden"
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
                              <div className="text-[10px] text-text-muted uppercase font-mono">
                                {m.label}
                              </div>
                              <div className="text-xs font-bold text-text-primary font-mono">
                                {m.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                case "comparison": {
                  const content = el.content;
                  return (
                    <div
                      key={el.id}
                      style={elStyle}
                      className="overflow-hidden rounded border border-border shadow-elevated"
                    >
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
                  const content = el.content;
                  return (
                    <div key={el.id} style={elStyle} className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          if (content.action === "navigate_slide" && content.targetSlideId) {
                            onNavigateSlide?.(content.targetSlideId);
                          } else if (
                            content.action === "navigate_slide" &&
                            !content.targetSlideId &&
                            onRestartPresentation
                          ) {
                            onRestartPresentation();
                          } else if (content.action === "open_url" && content.url) {
                            if (
                              content.url.startsWith("http://") ||
                              content.url.startsWith("https://")
                            ) {
                              window.open(content.url, "_blank", "noopener,noreferrer");
                            }
                          }
                        }}
                        className={`w-full h-full rounded font-medium flex items-center justify-center gap-2 text-sm shadow-sm transition-all cursor-pointer ${
                          content.variant === "secondary"
                            ? "bg-surface-elevated text-text-primary border border-border hover:bg-surface-subtle"
                            : "bg-accent text-text-primary hover:bg-accent-hover shadow-accent-glow"
                        }`}
                      >
                        <span>{content.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                default:
                  return null;
              }
            })}
          </div>

          {/* Discreet Architectural Slide Title Pill */}
          <div className="absolute top-6 left-6 z-20 px-3.5 py-1.5 rounded bg-surface-elevated/90 backdrop-blur-md border border-border text-xs font-medium text-text-primary pointer-events-none">
            {slide.title}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
