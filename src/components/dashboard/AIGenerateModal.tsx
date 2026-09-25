import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Textarea } from "../common/Textarea";
import { Button } from "../common/Button";
import { Select } from "../common/Select";
import { Badge } from "../common/Badge";
import { useAuthStore } from "../../stores";
import { useToast } from "../common/Toast";
import { generatePresentationExperience } from "../../lib/ai/generator";
import { GENERATION_STAGES, type GenerationStage, type AIGenerationRequest } from "../../lib/ai/types";
import { TEMPLATES } from "../../lib/templates";
import type { Project } from "../../types";
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  onUseTemplateFallback?: (templateId: string, title: string) => void;
}

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onUseTemplateFallback,
}) => {
  const navigate = useNavigate();
  const { mode, user } = useAuthStore();
  const { showToast } = useToast();

  const isCloudAuthenticated = mode === "cloud" && Boolean(user);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AIGenerationRequest["category"]>("Architecture");
  const [designStyle, setDesignStyle] = useState<AIGenerationRequest["designStyle"]>("Contemporary");
  const [audience, setAudience] = useState<AIGenerationRequest["audience"]>("Client");
  const [slideCount, setSlideCount] = useState<number>(6);

  // Experience Options
  const [includeHotspots, setIncludeHotspots] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeSustainability, setIncludeSustainability] = useState(true);

  // Generation Lifecycle State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState<GenerationStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Architecture");
    setDesignStyle("Contemporary");
    setAudience("Client");
    setSlideCount(6);
    setIncludeHotspots(true);
    setIncludeMaterials(true);
    setIncludeComparison(true);
    setIncludeSustainability(true);
    setIsGenerating(false);
    setCurrentStage("idle");
    setErrorMessage(null);
  };

  const handleModalClose = () => {
    if (isGenerating) return; // Disallow closing during in-flight generation
    resetForm();
    onClose();
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !description.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setCurrentStage("analyzing");

    const request: AIGenerationRequest = {
      title: title.trim(),
      description: description.trim(),
      category,
      designStyle,
      audience,
      slideCount,
      includeHotspots,
      includeMaterials,
      includeComparison,
      includeSustainability,
    };

    try {
      const generatedProject = await generatePresentationExperience(request, (stage) => {
        setCurrentStage(stage);
      });

      showToast("Your interactive experience is ready.", "success");
      onSuccess(generatedProject);
      handleModalClose();
    } catch (err: unknown) {
      console.error("[AIGenerateModal] Generation failed:", err);
      setCurrentStage("error");
      const msg =
        (err as { message?: string })?.message ||
        "The presentation could not be generated. Please verify your connection and try again.";
      setErrorMessage(msg);
      showToast(msg, "danger");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFallbackToTemplate = () => {
    const fallbackTemplate = TEMPLATES.find((t) => t.id === "aec-starter") || TEMPLATES[0];
    if (onUseTemplateFallback) {
      onUseTemplateFallback(fallbackTemplate.id, title.trim() || "Architectural Project Deck");
    }
    handleModalClose();
  };

  // Find active stage info for progress UI
  const activeStageInfo =
    GENERATION_STAGES.find((s) => s.stage === currentStage) || GENERATION_STAGES[0];
  const activeStageIndex = GENERATION_STAGES.findIndex((s) => s.stage === currentStage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Generate with AI"
      description="Describe your design brief. ArchXperience synthesizes spatial narratives, layouts, and interactions into a complete deck."
      maxWidth="lg"
    >
      {/* 1. GUEST MODE VIEW (Cloud Authentication Required) */}
      {!isCloudAuthenticated ? (
        <div className="py-4 space-y-6">
          <div className="p-5 rounded-xl border border-accent/30 bg-accent/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-text-primary">
                Cloud Workspace Required for AI Generation
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                AI presentation generation uses a secure server-side pipeline to connect with Google Gemini.
                To protect platform quota and securely manage API credentials, presentation generation requires an
                authenticated ArchXperience Cloud workspace.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-accent font-medium">
                <span>Guest mode preserves local editing, templates, and viewer features.</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-surface-elevated/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-text-primary">
                Want to test interactive features immediately?
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Start with the comprehensive AEC Starter template complete with hotspots and comparison sliders.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFallbackToTemplate}
              leftIcon={<Layers className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Use AEC Starter
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                handleModalClose();
                navigate("/auth");
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Sign In to Cloud
            </Button>
          </div>
        </div>
      ) : isGenerating || currentStage === "finalizing" ? (
        /* 2. IN-FLIGHT GENERATION PROGRESS VIEW */
        <div className="py-8 px-2 space-y-8 select-none">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-display font-bold text-text-primary tracking-tight">
                {activeStageInfo.label}
              </h3>
              <p className="text-xs text-text-secondary max-w-sm">
                {activeStageInfo.description}
              </p>
            </div>
          </div>

          {/* Sequential Stage Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
              <span>Generating Experience</span>
              <span>
                Stage {Math.max(1, activeStageIndex + 1)} of {GENERATION_STAGES.length}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border/50">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{
                  width: `${Math.round(((activeStageIndex + 1) / GENERATION_STAGES.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Stage List Checklist */}
          <div className="max-w-md mx-auto grid grid-cols-1 gap-2 pt-2">
            {GENERATION_STAGES.map((s, idx) => {
              const isPast = activeStageIndex > idx;
              const isCurrent = activeStageIndex === idx;
              return (
                <div
                  key={s.stage}
                  className={`flex items-center justify-between px-3 py-2 rounded border text-xs transition-colors ${
                    isCurrent
                      ? "border-accent/40 bg-accent/10 text-text-primary"
                      : isPast
                      ? "border-border/60 bg-surface-elevated/40 text-text-secondary"
                      : "border-transparent text-text-muted opacity-40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                    )}
                    <span>{s.label}</span>
                  </span>
                  {isCurrent && (
                    <Badge size="sm" variant="accent">
                      In progress
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. GENERATION FORM VIEW */
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Error Banner if prior attempt failed */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg border border-danger/40 bg-danger/10 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold text-danger">Generation Failed</span>
                <p className="text-text-secondary leading-relaxed">{errorMessage}</p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFallbackToTemplate}
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    Open AEC Starter Template instead &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Project Title */}
          <Input
            label="Project Name *"
            placeholder="e.g. Nordic Waterfront Cultural Center"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          {/* Project Brief Description */}
          <Textarea
            label="Project Brief & Architectural Intent *"
            placeholder="Describe the design, key spaces, massing, materials, sustainability strategy, and audience story (e.g. 3-floor timber civic library with central daylight atrium, passive cooling, recycled aggregate concrete, and landscaped courtyard)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          {/* Classification, Style, and Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Classification"
              value={category}
              onChange={(e) => setCategory(e.target.value as AIGenerationRequest["category"])}
              options={[
                { value: "Architecture", label: "Architecture" },
                { value: "Interior Design", label: "Interior Design" },
                { value: "Construction", label: "Construction & Engineering" },
                { value: "Urban Design", label: "Urban Design & Planning" },
                { value: "Product Design", label: "Product / Spatial Design" },
                { value: "Other", label: "Other" },
              ]}
            />

            <Select
              label="Design Style"
              value={designStyle}
              onChange={(e) => setDesignStyle(e.target.value as AIGenerationRequest["designStyle"])}
              options={[
                { value: "Contemporary", label: "Contemporary" },
                { value: "Minimalist", label: "Minimalist" },
                { value: "Biophilic", label: "Biophilic / Green" },
                { value: "Modern", label: "Modernist" },
                { value: "Industrial", label: "Industrial" },
                { value: "Brutalist", label: "Brutalist" },
                { value: "Custom", label: "Custom" },
              ]}
            />

            <Select
              label="Target Audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as AIGenerationRequest["audience"])}
              options={[
                { value: "Client", label: "Client Pitch" },
                { value: "Academic Jury", label: "Academic Jury" },
                { value: "Investor", label: "Investor Review" },
                { value: "Public", label: "Public Consultation" },
                { value: "Design Team", label: "Internal Design Team" },
              ]}
            />
          </div>

          {/* Presentation Slide Count Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary">
              Presentation Deck Length
            </label>
            <div className="flex items-center gap-2">
              {[4, 5, 6, 7, 8].map((count) => {
                const isSelected = slideCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSlideCount(count)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-mono transition-all text-center ${
                      isSelected
                        ? "border-accent bg-accent/15 text-text-primary font-bold shadow-xs"
                        : "border-border bg-surface hover:border-border-strong text-text-secondary"
                    }`}
                  >
                    {count} {count === 1 ? "Slide" : "Slides"}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-muted">
              Recommended: 5 to 7 slides for balanced architectural storytelling.
            </p>
          </div>

          {/* Experience Feature Toggles */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-text-primary block">
              Interactive Experience Modules
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded border border-border bg-surface cursor-pointer select-none hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={includeHotspots}
                  onChange={(e) => setIncludeHotspots(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                />
                <span className="text-text-secondary">Interactive Floor Plan Hotspots</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded border border-border bg-surface cursor-pointer select-none hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={includeMaterials}
                  onChange={(e) => setIncludeMaterials(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                />
                <span className="text-text-secondary">Material Strategy & U-Values</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded border border-border bg-surface cursor-pointer select-none hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={includeComparison}
                  onChange={(e) => setIncludeComparison(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                />
                <span className="text-text-secondary">Before/After Transformation Slider</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded border border-border bg-surface cursor-pointer select-none hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={includeSustainability}
                  onChange={(e) => setIncludeSustainability(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                />
                <span className="text-text-secondary">Daylight & Carbon Efficiency</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleModalClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {errorMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleFallbackToTemplate}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Use Template
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!title.trim() || !description.trim() || isGenerating}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Generate Experience
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
