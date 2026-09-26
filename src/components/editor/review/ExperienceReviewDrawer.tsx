import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Project } from "../../../types";
import type { PresentationReviewResponse, IssueSeverity } from "../../../lib/ai";
import { executeExperienceReview } from "../../../lib/ai";
import { Button } from "../../common/Button";
import { Badge } from "../../common/Badge";
import { useAuthStore } from "../../../stores";
import {
  X,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "../../../lib/utils";

export interface ExperienceReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSelectSlide: (slideId: string) => void;
  onSelectElement: (elementId: string) => void;
  onTriggerImproveSlide?: (slideId: string) => void;
  onTriggerHotspots?: (elementId: string) => void;
}

const LOADING_STAGES = [
  "Running layout checks",
  "Reviewing narrative",
  "Checking AEC completeness",
  "Evaluating audience fit",
  "Preparing recommendations",
];

export const ExperienceReviewDrawer: React.FC<ExperienceReviewDrawerProps> = ({
  isOpen,
  onClose,
  project,
  onSelectSlide,
  onSelectElement,
  onTriggerImproveSlide,
  onTriggerHotspots,
}) => {
  const { mode } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"issues" | "summary" | "checklist" | "suggestions">("issues");
  const [severityFilter, setSeverityFilter] = useState<"all" | IssueSeverity>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [reviewData, setReviewData] = useState<PresentationReviewResponse | null>(null);

  // Cycle through loading stages during evaluation
  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const interval = setInterval(() => {
      setLoadingStageIndex((prev) =>
        prev < LOADING_STAGES.length - 1 ? prev + 1 : prev
      );
    }, 1100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Run or refresh review
  const handleRunReview = useCallback(async () => {
    setIsLoading(true);
    setLoadingStageIndex(0);
    try {
      const res = await executeExperienceReview(project);
      setReviewData(res);
    } catch (err) {
      console.error("[ExperienceReview] Failed to run review:", err);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  // Run review on initial open if not present
  useEffect(() => {
    if (isOpen && !reviewData && !isLoading) {
      const timer = setTimeout(() => {
        handleRunReview();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reviewData, isLoading, handleRunReview]);

  const filteredIssues = useMemo(() => {
    if (!reviewData?.issues) return [];
    if (severityFilter === "all") return reviewData.issues;
    return reviewData.issues.filter((i) => i.severity === severityFilter);
  }, [reviewData, severityFilter]);

  const issueCounts = useMemo(() => {
    const counts = { error: 0, warning: 0, suggestion: 0 };
    reviewData?.issues.forEach((i) => {
      if (counts[i.severity] !== undefined) counts[i.severity]++;
    });
    return counts;
  }, [reviewData]);

  if (!isOpen) return null;

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
              <h2 className="text-sm font-semibold text-text-primary tracking-tight">Experience Review</h2>
              <Badge size="sm" variant="accent">AEC Critique</Badge>
            </div>
            <p className="text-[11px] text-text-secondary truncate max-w-[260px] font-mono">
              {project.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRunReview}
            disabled={isLoading}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
            title="Re-run Review"
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

      {/* Guest Mode Banner if active */}
      {mode === "guest" && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Local deterministic review active. Sign in for AI critique.</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-border px-3 bg-surface text-xs font-mono">
        <button
          onClick={() => setActiveTab("issues")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5",
            activeTab === "issues"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <span>Issues</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-elevated border border-border">
            {reviewData?.issues.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("summary")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors",
            activeTab === "summary"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Summary & Strengths
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors",
            activeTab === "checklist"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          AEC Checklist
        </button>

        <button
          onClick={() => setActiveTab("suggestions")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors",
            activeTab === "suggestions"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Strategy
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-9 h-9 rounded-full border-2 border-accent border-t-transparent animate-spin shadow-lg" />
            <div className="space-y-2 max-w-[280px]">
              <p className="text-xs font-semibold text-text-primary tracking-tight">
                {LOADING_STAGES[loadingStageIndex]}...
              </p>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {LOADING_STAGES.map((stg, idx) => (
                  <div
                    key={stg}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      idx === loadingStageIndex
                        ? "w-6 bg-accent shadow-[0_0_8px_rgba(200,97,62,0.8)]"
                        : idx < loadingStageIndex
                        ? "w-2.5 bg-accent/60"
                        : "w-2 bg-border"
                    )}
                  />
                ))}
              </div>
              <p className="text-[10px] text-text-muted font-mono pt-1">
                Deterministic layout checks resolved immediately. Analyzing spatial pitch.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* TAB: ISSUES */}
            {activeTab === "issues" && (
              <div className="space-y-3">
                {/* Severity Filter Pills */}
                <div className="flex items-center gap-1.5 pb-1">
                  <button
                    onClick={() => setSeverityFilter("all")}
                    className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded transition-colors",
                      severityFilter === "all"
                        ? "bg-accent text-white font-medium"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    All ({reviewData?.issues.length || 0})
                  </button>
                  <button
                    onClick={() => setSeverityFilter("error")}
                    className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded transition-colors flex items-center gap-1",
                      severityFilter === "error"
                        ? "bg-rose-500/20 text-rose-300 font-medium border border-rose-500/40"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>Errors ({issueCounts.error})</span>
                  </button>
                  <button
                    onClick={() => setSeverityFilter("warning")}
                    className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded transition-colors flex items-center gap-1",
                      severityFilter === "warning"
                        ? "bg-amber-500/20 text-amber-300 font-medium border border-amber-500/40"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Warnings ({issueCounts.warning})</span>
                  </button>
                  <button
                    onClick={() => setSeverityFilter("suggestion")}
                    className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded transition-colors flex items-center gap-1",
                      severityFilter === "suggestion"
                        ? "bg-sky-500/20 text-sky-300 font-medium border border-sky-500/40"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    <Info className="w-3 h-3 text-sky-400" />
                    <span>Tips ({issueCounts.suggestion})</span>
                  </button>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded p-6 bg-surface-subtle/30">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-text-primary">No Issues Found</p>
                    <p className="text-[11px] text-text-secondary mt-1">
                      {severityFilter === "all"
                        ? "All slides pass layout, text density, and geometry standards."
                        : `No ${severityFilter} items found.`}
                    </p>
                  </div>
                ) : (
                  filteredIssues.map((issue) => {
                    const slideIndex =
                      issue.slideIndex !== undefined
                        ? issue.slideIndex + 1
                        : issue.slideId
                        ? project.slides.findIndex((s) => s.id === issue.slideId) + 1
                        : null;

                    return (
                      <div
                        key={issue.id}
                        className="p-3 rounded border border-border bg-surface-elevated/40 hover:border-border-strong hover:bg-surface-elevated transition-all text-left space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {issue.severity === "error" && (
                              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            {issue.severity === "warning" && (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            {issue.severity === "suggestion" && (
                              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                            )}
                            <h4 className="text-xs font-semibold text-text-primary leading-tight">
                              {issue.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {issue.source === "ai" && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                AI
                              </span>
                            )}
                            {slideIndex && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                                Slide {slideIndex}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-text-secondary leading-relaxed pl-6">
                          {issue.message}
                        </p>

                        {/* Interactive Quick-Actions */}
                        <div className="pt-1 flex items-center justify-between pl-6 border-t border-border/40">
                          {issue.slideId ? (
                            <button
                              onClick={() => {
                                onSelectSlide(issue.slideId!);
                                if (issue.elementId) onSelectElement(issue.elementId);
                              }}
                              className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1"
                            >
                              <span>Inspect on Canvas</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div />
                          )}

                          <div className="flex items-center gap-1.5">
                            {issue.suggestedAction === "add_hotspots" && onTriggerHotspots && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2"
                                leftIcon={<MapPin className="w-3 h-3 text-accent" />}
                                onClick={() => {
                                  if (issue.slideId) onSelectSlide(issue.slideId);
                                  if (issue.elementId) {
                                    onSelectElement(issue.elementId);
                                    onTriggerHotspots(issue.elementId);
                                  }
                                }}
                              >
                                Suggest Hotspots
                              </Button>
                            )}

                            {(issue.suggestedAction === "shorten_text" ||
                              issue.suggestedAction === "adjust_typography") &&
                              onTriggerImproveSlide && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] px-2"
                                  leftIcon={<Sparkles className="w-3 h-3 text-accent" />}
                                  onClick={() => {
                                    if (issue.slideId) {
                                      onSelectSlide(issue.slideId);
                                      onTriggerImproveSlide(issue.slideId);
                                    }
                                  }}
                                >
                                  Improve Slide
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: SUMMARY & STRENGTHS */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded border border-border bg-surface-elevated/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    {reviewData?.executiveSummary}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Presentation Strengths</span>
                  </h4>
                  <div className="space-y-2">
                    {reviewData?.strengths.map((str, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-200 flex items-start gap-2.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{str}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AEC CHECKLIST */}
            {activeTab === "checklist" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    {project.category || "Architecture"} Standards
                  </span>
                  <Badge size="sm" variant="default">
                    {reviewData?.checklist.filter((c) => c.status === "pass").length || 0} /{" "}
                    {reviewData?.checklist.length || 0} Complete
                  </Badge>
                </div>

                <div className="space-y-2">
                  {reviewData?.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-border bg-surface-elevated/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary">{item.item}</span>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold",
                            item.status === "pass" && "bg-emerald-500/20 text-emerald-300",
                            item.status === "attention" && "bg-amber-500/20 text-amber-300",
                            item.status === "missing" && "bg-rose-500/20 text-rose-300"
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">{item.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: STRATEGIC SUGGESTIONS */}
            {activeTab === "suggestions" && (
              <div className="space-y-3">
                <p className="text-[11px] text-text-muted">
                  High-level opportunities to elevate presentation persuasion and clarity:
                </p>
                <div className="space-y-2.5">
                  {reviewData?.strategicSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-accent/20 bg-accent/5 space-y-1 text-xs text-text-primary"
                    >
                      <div className="flex items-center gap-2 text-accent font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Strategic Opportunity {idx + 1}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
