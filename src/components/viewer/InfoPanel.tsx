import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { slidePanelRight } from "../../lib/motion";
import { X, Layers, ExternalLink } from "lucide-react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";

export interface InfoPanelData {
  title: string;
  category?: string;
  description: string;
  imageUrl?: string;
  specs?: { label: string; value: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: InfoPanelData | null;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ isOpen, onClose, data }) => {
  return (
    <AnimatePresence>
      {isOpen && data && (
        <motion.aside
          variants={slidePanelRight}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-surface-elevated/95 backdrop-blur-md border-l border-border shadow-elevated flex flex-col p-6 text-text-primary"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
            <div>
              {data.category && (
                <Badge size="sm" variant="accent" className="mb-2">
                  {data.category}
                </Badge>
              )}
              <h3 className="text-base font-semibold font-display tracking-tight text-text-primary">
                {data.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close information panel"
              className="text-text-muted hover:text-text-primary p-1.5 rounded transition-colors -mr-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {data.imageUrl && (
              <div className="w-full aspect-video rounded overflow-hidden border border-border">
                <img
                  src={data.imageUrl}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="text-xs text-text-secondary leading-relaxed space-y-2">
              <p>{data.description}</p>
            </div>

            {/* Architectural Specifications Table */}
            {data.specs && data.specs.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 mb-2.5 text-text-muted text-[11px] font-mono uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  <span>Technical Specifications</span>
                </div>
                <div className="rounded border border-border divide-y divide-border bg-surface text-xs">
                  {data.specs.map((spec, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5">
                      <span className="text-text-secondary">{spec.label}</span>
                      <span className="font-mono font-medium text-text-primary">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Dismiss
            </Button>
            {data.ctaUrl && (
              <a href={data.ctaUrl} target="_blank" rel="noreferrer">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  {data.ctaLabel || "View Details"}
                </Button>
              </a>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
