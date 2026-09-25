import React from "react";
import { IconButton } from "../common/IconButton";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface ViewerNavigationProps {
  currentIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectSlide: (index: number) => void;
  onRestart?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  className?: string;
  isVisible?: boolean;
}

export const ViewerNavigation: React.FC<ViewerNavigationProps> = ({
  currentIndex,
  totalSlides,
  onNext,
  onPrev,
  onSelectSlide,
  onRestart,
  isFullscreen,
  onToggleFullscreen,
  className,
  isVisible = true,
}) => {
  const isLastSlide = currentIndex >= totalSlides - 1;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-surface-elevated/90 backdrop-blur-md border border-border shadow-elevated select-none transition-opacity duration-300",
        !isVisible && "opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Previous Slide */}
      <IconButton
        aria-label="Previous Slide (ArrowLeft)"
        size="sm"
        variant="ghost"
        disabled={currentIndex === 0}
        onClick={onPrev}
      >
        <ChevronLeft className="w-4 h-4" />
      </IconButton>

      {/* Slide Indicators & Progress Dots */}
      <div className="flex items-center gap-1.5 px-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            aria-label={`Jump to slide ${index + 1}`}
            onClick={() => onSelectSlide(index)}
            className={cn(
              "transition-all duration-200 rounded-full cursor-pointer",
              index === currentIndex
                ? "w-6 h-1.5 bg-accent"
                : "w-1.5 h-1.5 bg-border-strong hover:bg-text-secondary"
            )}
          />
        ))}
      </div>

      {/* Next or Restart on Final Slide */}
      {isLastSlide && onRestart ? (
        <IconButton
          aria-label="Restart Presentation from Beginning"
          size="sm"
          variant="ghost"
          onClick={onRestart}
          title="Restart from beginning"
        >
          <RotateCcw className="w-4 h-4 text-accent" />
        </IconButton>
      ) : (
        <IconButton
          aria-label="Next Slide (ArrowRight or Space)"
          size="sm"
          variant="ghost"
          disabled={isLastSlide}
          onClick={onNext}
        >
          <ChevronRight className="w-4 h-4" />
        </IconButton>
      )}

      <div className="h-4 w-[1px] bg-border mx-0.5" />

      {/* Fullscreen Button */}
      <IconButton
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        size="sm"
        variant="ghost"
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </IconButton>
    </div>
  );
};
