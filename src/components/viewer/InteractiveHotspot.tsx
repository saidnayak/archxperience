import React from "react";
import type { HotspotContent } from "../../types";
import { cn } from "../../lib/utils";
import { MapPin, ArrowRight } from "lucide-react";

export interface InteractiveHotspotProps {
  content: HotspotContent;
  onClick: () => void;
  className?: string;
}

export const InteractiveHotspot: React.FC<InteractiveHotspotProps> = ({
  content,
  onClick,
  className,
}) => {
  return (
    <div className={cn("relative group cursor-pointer select-none", className)} onClick={onClick}>
      {/* Subtle pulse wave */}
      {content.pulseAnimation !== false && (
        <span className="absolute -inset-1.5 rounded-full bg-accent/40 animate-ping pointer-events-none" />
      )}

      {/* Hotspot indicator button */}
      <button
        aria-label={content.title}
        className="relative w-8 h-8 rounded-full bg-accent text-text-primary flex items-center justify-center shadow-accent-glow border-2 border-text-primary/40 hover:scale-110 active:scale-95 transition-transform"
      >
        {content.badgeText ? (
          <span className="text-xs font-mono font-bold">{content.badgeText}</span>
        ) : (
          <MapPin className="w-4 h-4" />
        )}
      </button>

      {/* Floating Hover Label */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-9 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 transform group-hover:-translate-y-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-elevated/95 backdrop-blur-md text-xs font-medium text-text-primary border border-border shadow-elevated whitespace-nowrap">
          <span>{content.title}</span>
          <ArrowRight className="w-3 h-3 text-accent" />
        </div>
      </div>
    </div>
  );
};
