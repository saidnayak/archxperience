import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Select } from "../common/Select";
import { TEMPLATES } from "../../lib/templates";
import type { ProjectTemplate } from "../../lib/templates";
import { Sparkles, ArrowRight, Check } from "lucide-react";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    category: string;
    templateId: string;
  }) => void;
  onOpenAI?: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onOpenAI,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Architecture");
  const [selectedTemplateId, setSelectedTemplateId] = useState("blank");

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setStep(2);
  };

  const handleFinalSubmit = () => {
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      templateId: selectedTemplateId,
    });
    // Reset state
    setTitle("");
    setDescription("");
    setCategory("Architecture");
    setSelectedTemplateId("blank");
    setStep(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStep(1);
        onClose();
      }}
      title={step === 1 ? "New Interactive Presentation" : "Choose Starting Template"}
      description={
        step === 1
          ? "Define project details and classification for your presentation deck."
          : "Select a curated architectural layout or begin with an empty 16:9 artboard."
      }
      maxWidth={step === 2 ? "lg" : "md"}
    >
      {step === 1 ? (
        /* STEP 1: PROJECT DETAILS */
        <form onSubmit={handleNext} className="space-y-4">
          {onOpenAI && (
            <div
              onClick={() => {
                onClose();
                onOpenAI();
              }}
              className="p-3 rounded-lg border border-accent/40 bg-accent/5 hover:bg-accent/10 transition-colors flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-accent/20 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-primary block">
                    Generate with AI
                  </span>
                  <span className="text-[11px] text-text-secondary block">
                    Describe your brief and let ArchXperience build the complete deck.
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          <Input
            label="Project Name *"
            placeholder="e.g. Nordic Waterfront Cultural Center"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Brief Description (Optional)"
            placeholder="e.g. Schematic design iteration and material schedule"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          />

          <Select
            label="Project Classification"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            options={[
              { value: "Architecture", label: "Architecture" },
              { value: "Interior Design", label: "Interior Design" },
              { value: "Construction", label: "Construction & Engineering" },
              { value: "Urban Design", label: "Urban Design & Planning" },
              { value: "Product Design", label: "Product / Spatial Design" },
              { value: "Other", label: "Other" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              disabled={!title.trim()}
            >
              Continue to Templates
            </Button>
          </div>
        </form>
      ) : (
        /* STEP 2: TEMPLATE SELECTION */
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-1">
            {TEMPLATES.map((tmpl: ProjectTemplate) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`relative rounded-lg border p-3 cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-subtle"
                  }`}
                >
                  <div>
                    {/* Thumbnail preview */}
                    <div className="relative aspect-video w-full rounded overflow-hidden bg-surface-elevated mb-2.5 border border-border/50">
                      <img
                        src={tmpl.thumbnailUrl}
                        alt={tmpl.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono text-text-muted border border-border">
                        {tmpl.slideCount} {tmpl.slideCount === 1 ? "slide" : "slides"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-text-primary">{tmpl.name}</h4>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-accent text-text-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/40">
                    <span className="text-[10px] font-mono text-text-muted uppercase">
                      {tmpl.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinalSubmit}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Create & Open Studio
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
