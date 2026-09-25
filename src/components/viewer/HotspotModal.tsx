import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "../../lib/motion";
import { X, Layers, ExternalLink } from "lucide-react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import type { InfoPanelData } from "./InfoPanel";

export interface HotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InfoPanelData | null;
}

export const HotspotModal: React.FC<HotspotModalProps> = ({ isOpen, onClose, data }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface-elevated/95 backdrop-blur-md border border-border-strong rounded-lg shadow-elevated p-6 text-text-primary flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
            <div>
              {data.category && (
                <Badge size="sm" variant="accent" className="mb-2">
                  {data.category}
                </Badge>
              )}
              <h2 className="text-xl font-display font-bold tracking-tight text-text-primary">
                {data.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-text-muted hover:text-text-primary p-1.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media & Content */}
          <div className="py-4 space-y-4 flex-1">
            {data.imageUrl && (
              <div className="w-full aspect-video rounded overflow-hidden border border-border">
                <img
                  src={data.imageUrl}
                  alt={data.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>{data.description}</p>
            </div>

            {/* Architectural Specifications Table */}
            {data.specs && data.specs.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 mb-2.5 text-text-muted text-[11px] font-mono uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  <span>Technical & Specification Schedule</span>
                </div>
                <div className="rounded border border-border divide-y divide-border bg-surface text-xs">
                  {data.specs.map((spec, i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <span className="text-text-secondary font-medium">{spec.label}</span>
                      <span className="font-mono font-semibold text-text-primary">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Dismiss
            </Button>
            {data.ctaUrl && (
              <a href={data.ctaUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  {data.ctaLabel || "View Specification"}
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
