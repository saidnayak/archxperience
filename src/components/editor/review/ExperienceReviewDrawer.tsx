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
  "Reviewing presentation",
  "Analyzing layout",
  "Evaluating AEC communication",
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
  const [activeTab, setActiveTab] = useState<"summary" | "strengths" | "issues" | "checklist">("summary");
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
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
            title="Re-run Review"
          >
            <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin text-accent")} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guest Mode Banner if active */}
      {mode === "guest" && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Local deterministic review is available. Sign in to unlock AI critique.</span>
        </div>
      )}

      {/* Tab Navigation: Executive Summary -> Strengths -> Issues -> AEC Checklist */}
      <div className="flex items-center border-b border-border px-2 bg-surface text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab("summary")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer",
            activeTab === "summary"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Executive Summary
        </button>

        <button
          onClick={() => setActiveTab("strengths")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer",
            activeTab === "strengths"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Strengths
        </button>

        <button
          onClick={() => setActiveTab("issues")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
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
          onClick={() => setActiveTab("checklist")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer",
            activeTab === "checklist"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          AEC Checklist
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
                      "w-2 h-2 rounded-full transition-all duration-300",
                      idx <= loadingStageIndex
                        ? "bg-accent scale-105"
                        : "bg-border opacity-40"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : !reviewData ? (
          <div className="py-16 text-center text-xs text-text-muted space-y-3">
            <p>No review data generated yet.</p>
            <Button size="sm" variant="secondary" onClick={handleRunReview}>
              Analyze Presentation
            </Button>
          </div>
        ) : (
          <>
            {/* TAB 1: EXECUTIVE SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-surface-elevated/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    {reviewData.executiveSummary}
                  </p>
                </div>

                {/* Strategic Advice Card */}
                {reviewData.strategicSuggestions && reviewData.strategicSuggestions.length > 0 && (
                  <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block">
                      AEC Strategic Advice
                    </span>
                    <div className="space-y-2">
                      {reviewData.strategicSuggestions.map((sug, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                          <span className="leading-relaxed text-text-secondary">{sug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Navigation to Issues */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-text-muted font-mono">
                    {reviewData.issues.length} audit finding{reviewData.issues.length === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={() => setActiveTab("issues")}
                    className="text-accent hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Identified Issues</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: STRENGTHS */}
            {activeTab === "strengths" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    Validated Spatial Strengths
                  </span>
                  <Badge size="sm" variant="success">
                    {reviewData.strengths.length} Confirmed
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {reviewData.strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-xs text-emerald-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ISSUES */}
            {activeTab === "issues" && (
              <div className="space-y-4">
                {/* Severity Quick Filters */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <button
                    onClick={() => setSeverityFilter("all")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors cursor-pointer",
                      severityFilter === "all"
                        ? "bg-accent text-text-primary font-medium"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    All ({reviewData.issues.length})
                  </button>
                  <button
                    onClick={() => setSeverityFilter("error")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors cursor-pointer",
                      severityFilter === "error"
                        ? "bg-rose-500 text-white font-medium"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    Errors ({issueCounts.error})
                  </button>
                  <button
                    onClick={() => setSeverityFilter("warning")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors cursor-pointer",
                      severityFilter === "warning"
                        ? "bg-amber-500 text-black font-medium"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    Warnings ({issueCounts.warning})
                  </button>
                  <button
                    onClick={() => setSeverityFilter("suggestion")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors cursor-pointer",
                      severityFilter === "suggestion"
                        ? "bg-sky-500 text-white font-medium"
                        : "bg-surface-elevated text-text-muted hover:text-text-primary"
                    )}
                  >
                    Tips ({issueCounts.suggestion})
                  </button>
                </div>

                {/* Filtered Issue Cards */}
                <div className="space-y-3">
                  {filteredIssues.length === 0 ? (
                    <div className="p-8 text-center border border-border rounded-lg bg-surface-elevated/20 text-xs text-text-muted">
                      No issues found for this severity filter.
                    </div>
                  ) : (
                    filteredIssues.map((issue) => {
                      const slideIndex = issue.slideIndex !== undefined
                        ? issue.slideIndex + 1
                        : issue.slideId
                        ? (project.slides.findIndex((s) => s.id === issue.slideId) + 1 || undefined)
                        : undefined;

                      return (
                        <div
                          key={issue.id}
                          className="p-3.5 rounded-lg border border-border bg-surface-elevated/40 hover:border-border-strong transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {issue.severity === "error" && (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              {issue.severity === "warning" && (
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              )}
                              {issue.severity === "suggestion" && (
                                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                              <h4 className="text-xs font-semibold text-text-primary leading-tight">
                                {issue.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {issue.source === "ai" ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/40 font-semibold">
                                  AI Critique
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted font-medium">
                                  Rule Check
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
                          <div className="pt-2 flex items-center justify-between pl-6 border-t border-border/40">
                            {issue.slideId ? (
                              <button
                                onClick={() => {
                                  onSelectSlide(issue.slideId!);
                                  if (issue.elementId) onSelectElement(issue.elementId);
                                }}
                                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
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
              </div>
            )}

            {/* TAB 4: AEC CHECKLIST */}
            {activeTab === "checklist" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    {project.category || "Architecture"} Standards
                  </span>
                  <Badge size="sm" variant="default">
                    {reviewData.checklist.filter((c) => c.status === "pass").length} /{" "}
                    {reviewData.checklist.length} Complete
                  </Badge>
                </div>

                <div className="space-y-2">
                  {reviewData.checklist.map((item, idx) => (
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
          </>
        )}
      </div>
    </div>
  );
};
