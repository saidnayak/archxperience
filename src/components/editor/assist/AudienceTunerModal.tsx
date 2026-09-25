import React, { useState } from "react";
import type { Project } from "../../../types";
import type { AudienceSuggestion } from "../../../lib/ai";
import { requestAudienceTuning } from "../../../lib/ai";
import { useEditorStore } from "../../../stores";
import { useToast } from "../../common/Toast";
import { Button } from "../../common/Button";
import { Badge } from "../../common/Badge";
import { Modal } from "../../common/Modal";
import { Users, BookOpen, DollarSign, Globe, Wrench } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface AudienceTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const AUDIENCE_OPTIONS = [
  { id: "Client", label: "Client Pitch", icon: <Users className="w-3.5 h-3.5" />, desc: "Focus on design rationale, experiential quality, and schedule." },
  { id: "Academic Jury", label: "Academic Jury", icon: <BookOpen className="w-3.5 h-3.5" />, desc: "Focus on theoretical parti, spatial typology, and concept rigor." },
  { id: "Investor", label: "Investor / Developer", icon: <DollarSign className="w-3.5 h-3.5" />, desc: "Focus on efficiency, net-to-gross ratios, and sustainability ROI." },
  { id: "Public", label: "Public Consultation", icon: <Globe className="w-3.5 h-3.5" />, desc: "Focus on accessible language, community amenities, and green space." },
  { id: "Design Team", label: "Design Team", icon: <Wrench className="w-3.5 h-3.5" />, desc: "Focus on structural systems, constructability, and technical details." },
];

export const AudienceTunerModal: React.FC<AudienceTunerModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [selectedAudience, setSelectedAudience] = useState(project.settings?.theme || "Client");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AudienceSuggestion | null>(null);
  const [appliedElements, setAppliedElements] = useState<Set<string>>(new Set());

  const { startTransaction, commitTransaction, updateElement, triggerAutosave } = useEditorStore();
  const { showToast } = useToast();

  const handleTune = async (aud: string) => {
    setSelectedAudience(aud);
    setIsLoading(true);
    try {
      const res = await requestAudienceTuning(project, aud);
      setSuggestion(res);
      setAppliedElements(new Set());
    } catch (err: unknown) {
      console.error("[AudienceTuner] Failed:", err);
      showToast("Could not generate audience adaptation advice", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRefinement = (elementId: string, proposed: string) => {
    startTransaction();
    try {
      updateElement(elementId, {
        content: { text: proposed },
      });
      commitTransaction();
      triggerAutosave();
      setAppliedElements((prev) => new Set(prev).add(elementId));
      showToast("Tone refinement applied (Ctrl+Z to undo)", "success");
    } catch (err) {
      console.error("[AudienceTuner] Failed to apply:", err);
      showToast("Failed to apply refinement", "danger");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audience Tone Tuner"
      description="Tailor presentation storytelling and technical depth to your specific reviewer persona."
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        {/* Audience Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleTune(opt.id)}
              className={cn(
                "p-2.5 rounded border text-left transition-all",
                selectedAudience === opt.id
                  ? "border-accent bg-accent/10 text-text-primary shadow-sm"
                  : "border-border bg-surface-elevated/40 hover:border-border-strong text-text-secondary"
              )}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs text-text-primary mb-1">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed font-mono">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs text-text-muted font-mono">
              Evaluating narrative tone for {selectedAudience}...
            </p>
          </div>
        ) : suggestion ? (
          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {/* Overall Assessment */}
            <div className="p-3 rounded border border-border bg-surface-elevated space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">
                  Fit for {suggestion.audience}
                </span>
                <Badge size="sm" variant="accent">
                  Persona Insights
                </Badge>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {suggestion.overallFit}
              </p>
            </div>

            {/* Observations */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
                Key Persona Expectations:
              </span>
              <div className="space-y-1.5">
                {suggestion.observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-surface border border-border text-xs text-text-secondary flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide-by-Slide Recommendations */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
                Recommended Slide Adaptations:
              </span>
              <div className="space-y-2">
                {suggestion.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-border bg-surface space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                      <span>{rec.slideTitle}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {rec.advice}
                    </p>

                    {rec.sampleRefinement?.elementId && (
                      <div className="pt-2 border-t border-border/50 space-y-1.5">
                        <span className="text-[10px] font-mono text-accent uppercase font-semibold block">
                          Suggested Phrasing:
                        </span>
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                          {rec.sampleRefinement.proposed}
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-6 text-[10px] px-2.5"
                            disabled={appliedElements.has(rec.sampleRefinement.elementId)}
                            onClick={() =>
                              handleApplyRefinement(
                                rec.sampleRefinement!.elementId!,
                                rec.sampleRefinement!.proposed
                              )
                            }
                          >
                            {appliedElements.has(rec.sampleRefinement.elementId)
                              ? "Applied"
                              : "Apply Refinement"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-text-muted font-mono">
            Select an audience persona above to evaluate tone and receive strategic pitch advice.
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
