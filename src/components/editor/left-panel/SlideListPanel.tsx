import React from "react";
import type { Slide } from "../../../types";
import { useEditorStore } from "../../../stores";
import { Button } from "../../common/Button";
import { Dropdown } from "../../common/Dropdown";
import { Plus, MoreVertical, Layers, ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface SlideListPanelProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
  onAddSlide?: () => void;
}

export const SlideListPanel: React.FC<SlideListPanelProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
}) => {
  const { duplicateSlide, deleteSlide, reorderSlides, addSlide } = useEditorStore();

  const handleAdd = () => {
    if (onAddSlide) {
      onAddSlide();
    } else {
      addSlide();
    }
  };

  return (
    <div className="h-full flex flex-col select-none">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Slides ({slides.length})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3 h-3" />}
          className="h-7 text-xs px-2"
        >
          Add
        </Button>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          const bgImg = slide.backgroundImageUrl || slide.background?.imageUrl;

          const dropdownItems = [
            {
              id: "move-up",
              label: "Move Up",
              icon: <ChevronUp className="w-3.5 h-3.5" />,
              disabled: index === 0,
              onClick: () => reorderSlides(index, index - 1),
            },
            {
              id: "move-down",
              label: "Move Down",
              icon: <ChevronDown className="w-3.5 h-3.5" />,
              disabled: index === slides.length - 1,
              onClick: () => reorderSlides(index, index + 1),
            },
            {
              id: "duplicate",
              label: "Duplicate Slide",
              icon: <Copy className="w-3.5 h-3.5" />,
              onClick: () => duplicateSlide(slide.id),
            },
            {
              id: "delete",
              label: "Delete Slide",
              icon: <Trash2 className="w-3.5 h-3.5 text-danger" />,
              danger: true,
              disabled: slides.length <= 1,
              onClick: () => deleteSlide(slide.id),
            },
          ];

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={cn(
                "group relative rounded border transition-all duration-150 p-2 cursor-pointer select-none",
                isActive
                  ? "border-accent bg-surface-elevated shadow-subtle"
                  : "border-border bg-surface-subtle/40 hover:border-border-strong hover:bg-surface-elevated/40"
              )}
            >
              {/* Slide Header */}
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-text-muted">#{index + 1}</span>
                  <span className="font-medium text-text-secondary truncate max-w-[130px]">
                    {slide.title}
                  </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    trigger={
                      <button
                        className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
                        aria-label="Slide Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    }
                    items={dropdownItems}
                    align="right"
                  />
                </div>
              </div>

              {/* 16:9 Thumbnail Preview */}
              <div className="w-full aspect-video rounded bg-background border border-border/50 relative overflow-hidden flex items-center justify-center">
                {bgImg ? (
                  <img
                    src={bgImg}
                    alt={slide.title}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-surface-elevated text-[11px] font-mono text-text-muted">
                    <span>16:9</span>
                    <span>{slide.elements.length} elements</span>
                  </div>
                )}

                {/* Elements count badge */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-background/80 backdrop-blur-xs text-[9px] font-mono text-text-muted border border-border">
                  {slide.elements.length} el
                </div>

                {/* Active Outline */}
                {isActive && (
                  <div className="absolute inset-0 border-2 border-accent rounded pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
