import React, { useState, useEffect, useCallback } from "react";
import type { Project, Slide } from "../../../types";
import type { SlideImprovementResponse, SlideImprovementChange, IssueItem } from "../../../lib/ai";
import { requestSlideImprovement } from "../../../lib/ai";
import { useEditorStore } from "../../../stores";
import { useToast } from "../../common/Toast";
import { Button } from "../../common/Button";
import { Badge } from "../../common/Badge";
import {
  X,
  Sparkles,
  Check,
  RotateCcw,
  Type,
  FileText,
  Plus,
  Sliders,
} from "lucide-react";
import { cn } from "../../../lib/utils";

export interface SlideImprovementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  slide: Slide | null;
  deterministicIssues?: IssueItem[];
}

export const SlideImprovementDrawer: React.FC<SlideImprovementDrawerProps> = ({
  isOpen,
  onClose,
  project,
  slide,
  deterministicIssues = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [improvementData, setImprovementData] = useState<SlideImprovementResponse | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const {
    startTransaction,
    commitTransaction,
    updateElement,
    addElement,
    triggerAutosave,
  } = useEditorStore();

  const { showToast } = useToast();

  const handleFetchImprovements = useCallback(async () => {
    if (!slide) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await requestSlideImprovement(project, slide, deterministicIssues);
      setImprovementData(res);
      setAppliedIds(new Set());
    } catch (err: unknown) {
      console.error("[SlideImprovement] Failed to request improvements:", err);
      setError((err as Error)?.message || "Failed to generate slide improvements.");
    } finally {
      setIsLoading(false);
    }
  }, [project, slide, deterministicIssues]);

  useEffect(() => {
    if (isOpen && slide) {
      const timer = setTimeout(() => {
        handleFetchImprovements();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, slide, handleFetchImprovements]);

  if (!isOpen || !slide) return null;

  // Apply a single improvement within a transaction
  const handleApplySingle = (change: SlideImprovementChange) => {
    startTransaction();

    try {
      if (change.elementId) {
        const targetEl = slide.elements.find((e) => e.id === change.elementId);
        if (targetEl) {
          if (change.action === "modify_text" && change.proposedValue) {
            if (targetEl.type === "text") {
              updateElement(change.elementId, {
                content: { ...targetEl.content, text: change.proposedValue },
              });
            }
          } else if (change.action === "adjust_typography" && change.proposedValue) {
            const match = change.proposedValue.match(/\d+/);
            const newFontSize = match ? parseInt(match[0], 10) : 20;
            if (targetEl.type === "text") {
              updateElement(change.elementId, {
                content: { ...targetEl.content, fontSize: newFontSize },
                styles: { ...targetEl.styles, fontSize: newFontSize },
              });
            }
          } else if (change.action === "convert_to_card") {
            const currentText = targetEl.type === "text" ? targetEl.content.text : "";
            updateElement(change.elementId, {
              type: "info_card",
              content: {
                title: change.proposedValue || currentText.substring(0, 40) || "Specification",
                description: currentText,
                eyebrow: "Design Intent",
                metadata: [
                  { label: "Category", value: "Conceptual" },
                  { label: "Target", value: "High Performance" },
                ],
              },
            });
          }
        }
      } else if (change.action === "add_element" && change.proposedElement) {
        addElement(change.proposedElement.type || "text", change.proposedElement);
      }

      commitTransaction();
      triggerAutosave();

      setAppliedIds((prev) => new Set(prev).add(change.id));
      showToast("Applied 1 improvement to slide (Ctrl+Z to undo)", "success");
    } catch (applyErr) {
      console.error("[SlideImprovement] Apply failed:", applyErr);
      showToast("Failed to apply suggestion", "danger");
    }
  };

  // Apply all pending improvements in ONE atomic transaction
  const handleApplyAll = () => {
    if (!improvementData?.suggestedChanges) return;

    startTransaction();
    try {
      improvementData.suggestedChanges.forEach((change) => {
        if (appliedIds.has(change.id)) return;

        if (change.elementId) {
          const targetEl = slide.elements.find((e) => e.id === change.elementId);
          if (targetEl) {
            if (change.action === "modify_text" && change.proposedValue) {
              if (targetEl.type === "text") {
                updateElement(change.elementId, {
                  content: { ...targetEl.content, text: change.proposedValue },
                });
              }
            } else if (change.action === "adjust_typography" && change.proposedValue) {
              const match = change.proposedValue.match(/\d+/);
              const newFontSize = match ? parseInt(match[0], 10) : 20;
              if (targetEl.type === "text") {
                updateElement(change.elementId, {
                  content: { ...targetEl.content, fontSize: newFontSize },
                  styles: { ...targetEl.styles, fontSize: newFontSize },
                });
              }
            } else if (change.action === "convert_to_card") {
              const currentText = targetEl.type === "text" ? targetEl.content.text : "";
              updateElement(change.elementId, {
                type: "info_card",
                content: {
                  title: change.proposedValue || currentText.substring(0, 40) || "Specification",
                  description: currentText,
                  eyebrow: "Design Intent",
                  metadata: [
                    { label: "Category", value: "Conceptual" },
                    { label: "Target", value: "High Performance" },
                  ],
                },
              });
            }
          }
        } else if (change.action === "add_element" && change.proposedElement) {
          addElement(change.proposedElement.type || "text", change.proposedElement);
        }
      });

      commitTransaction();
      triggerAutosave();

      const countApplied = pendingCount;
      const allIds = new Set(improvementData.suggestedChanges.map((c) => c.id));
      setAppliedIds(allIds);
      showToast(
        `Applied ${countApplied} improvement${countApplied === 1 ? "" : "s"} (Ctrl+Z to undo)`,
        "success"
      );
    } catch (err) {
      console.error("[SlideImprovement] Apply all failed:", err);
      showToast("Failed to apply some suggestions", "danger");
    }
  };

  const pendingCount = (improvementData?.suggestedChanges || []).filter(
    (c) => !appliedIds.has(c.id)
  ).length;

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] max-w-full bg-surface border-l border-border shadow-2xl z-50 flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary tracking-tight">AI Slide Assistant</h2>
              <Badge size="sm" variant="accent">Non-Destructive</Badge>
            </div>
            <p className="text-[11px] text-text-secondary truncate max-w-[260px] font-mono">
              Slide: {slide.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleFetchImprovements}
            disabled={isLoading}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
            title="Re-analyze Slide"
          >
            <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin text-accent")} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-primary">Analyzing Slide Content & Layout...</p>
              <p className="text-[11px] text-text-muted font-mono">
                Evaluating architectural phrasing, readability & visual hierarchy
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300 space-y-2">
            <p className="font-semibold">Unable to Generate Suggestions</p>
            <p className="text-[11px] opacity-90">{error}</p>
            <Button size="sm" variant="outline" onClick={handleFetchImprovements} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Design Strategy Rationale */}
            {improvementData?.rationale && (
              <div className="p-3 rounded border border-border bg-surface-elevated/40 space-y-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                  Design Strategy
                </span>
                <p className="text-text-secondary leading-relaxed font-sans">
                  {improvementData.rationale}
                </p>
              </div>
            )}

            {/* Suggestions Count & Apply All */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                Proposed Changes ({improvementData?.suggestedChanges.length || 0})
              </span>

              {pendingCount > 1 && (
                <Button
                  size="sm"
                  variant="primary"
                  className="h-6 text-[10px] px-2.5"
                  onClick={handleApplyAll}
                >
                  Apply All ({pendingCount})
                </Button>
              )}
            </div>

            {/* Suggestions Diff Cards */}
            <div className="space-y-3">
              {improvementData?.suggestedChanges.map((change) => {
                const isApplied = appliedIds.has(change.id);

                return (
                  <div
                    key={change.id}
                    className={cn(
                      "p-3 rounded border transition-all space-y-2.5 text-left",
                      isApplied
                        ? "border-emerald-500/40 bg-emerald-500/5 opacity-80"
                        : "border-border bg-surface-elevated/40 hover:border-border-strong"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {change.action === "modify_text" && (
                          <Type className="w-3.5 h-3.5 text-accent" />
                        )}
                        {change.action === "adjust_typography" && (
                          <Sliders className="w-3.5 h-3.5 text-accent" />
                        )}
                        {change.action === "convert_to_card" && (
                          <FileText className="w-3.5 h-3.5 text-accent" />
                        )}
                        {change.action === "add_element" && (
                          <Plus className="w-3.5 h-3.5 text-accent" />
                        )}
                        <span className="text-xs font-semibold text-text-primary">
                          {change.action === "modify_text" && "Refine Text Phrasing"}
                          {change.action === "adjust_typography" && "Typography Scale"}
                          {change.action === "convert_to_card" && "Convert to Info Card"}
                          {change.action === "add_element" && "Add Interactive Element"}
                        </span>
                      </div>

                      {isApplied && (
                        <Badge size="sm" variant="success" className="gap-1">
                          <Check className="w-3 h-3" />
                          Applied
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {change.description}
                    </p>

                    {/* Expected Benefit */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono bg-accent/5 px-2.5 py-1 rounded border border-accent/20">
                      <span className="font-semibold uppercase tracking-wider text-accent">Benefit:</span>
                      <span className="text-text-secondary">
                        {change.action === "modify_text" && "Refines architectural phrasing for client executive clarity."}
                        {change.action === "adjust_typography" && "Balances reading hierarchy across 1920×1080 artboard."}
                        {change.action === "convert_to_card" && "Structures raw text into scannable technical specification."}
                        {change.action === "add_element" && "Engages stakeholders with interactive spatial inspection."}
                      </span>
                    </div>

                    {/* Diff: Current vs Proposed */}
                    {(change.currentValue || change.proposedValue) && (
                      <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                        {change.currentValue && (
                          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            <span className="text-[9px] uppercase tracking-wider block text-rose-400 font-bold mb-0.5">
                              Current:
                            </span>
                            <span className="line-through opacity-80">{change.currentValue}</span>
                          </div>
                        )}

                        {change.proposedValue && (
                          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            <span className="text-[9px] uppercase tracking-wider block text-emerald-400 font-bold mb-0.5">
                              Proposed:
                            </span>
                            <span>{change.proposedValue}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {!isApplied && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-6 text-[11px] px-3 font-medium"
                          onClick={() => handleApplySingle(change)}
                        >
                          Apply Change
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
