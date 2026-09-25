import React from "react";
import { Button } from "../../common/Button";
import { Badge } from "../../common/Badge";
import { Check, X, Sparkles } from "lucide-react";

export interface HotspotAdvisorOverlayProps {
  isActive: boolean;
  hotspotCount: number;
  imageTitle?: string;
  onApply: () => void;
  onCancel: () => void;
}

export const HotspotAdvisorOverlay: React.FC<HotspotAdvisorOverlayProps> = ({
  isActive,
  hotspotCount,
  imageTitle,
  onApply,
  onCancel,
}) => {
  if (!isActive) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-surface/95 backdrop-blur-md border border-accent/40 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-3 duration-200 select-none">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary">
              AI Hotspot Advisor Preview
            </span>
            <Badge size="sm" variant="accent">
              {hotspotCount} Pins
            </Badge>
          </div>
          <p className="text-[11px] text-text-muted font-mono">
            Previewing suggested callouts on {imageTitle || "Drawing"}
          </p>
        </div>
      </div>

      <div className="h-6 w-[1px] bg-border" />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2.5"
          onClick={onCancel}
          leftIcon={<X className="w-3 h-3" />}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="h-7 text-xs px-3 shadow"
          onClick={onApply}
          leftIcon={<Check className="w-3 h-3" />}
        >
          Apply Hotspots
        </Button>
      </div>
    </div>
  );
};
