import React, { useState, useEffect } from "react";
import type { CanvasElement } from "../../../types";
import { requestSpecNormalization } from "../../../lib/ai";
import { useEditorStore } from "../../../stores";
import { useToast } from "../../common/Toast";
import { Button } from "../../common/Button";
import { Modal } from "../../common/Modal";
import { Plus, Trash2, Check } from "lucide-react";

export interface SpecNormalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: CanvasElement | null;
}

export const SpecNormalizerModal: React.FC<SpecNormalizerModalProps> = ({
  isOpen,
  onClose,
  element,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const { startTransaction, commitTransaction, updateElement, triggerAutosave } = useEditorStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && element) {
      const rawText =
        ("description" in element.content ? element.content.description : "") ||
        ("text" in element.content ? element.content.text : "") ||
        ("title" in element.content ? element.content.title : "");

      if (rawText) {
        setIsLoading(true);
        requestSpecNormalization(element.id, rawText)
          .then((res) => {
            setSpecs(res.specs || []);
          })
          .catch((err) => {
            console.error("[SpecNormalizer] Failed:", err);
            showToast("Could not normalize specifications", "danger");
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [isOpen, element?.id]);

  if (!isOpen || !element) return null;

  const handleAddPair = () => {
    setSpecs([...specs, { label: "New Spec", value: "Conceptual Target" }]);
  };

  const handleUpdatePair = (index: number, key: "label" | "value", val: string) => {
    const updated = [...specs];
    updated[index][key] = val;
    setSpecs(updated);
  };

  const handleRemovePair = (index: number) => {
    setSpecs(specs.filter((_, idx) => idx !== index));
  };

  const handleApply = () => {
    startTransaction();
    try {
      if (element.type === "info_card") {
        updateElement(element.id, {
          content: { ...element.content, metadata: specs },
        });
      } else if (element.type === "hotspot") {
        updateElement(element.id, {
          content: { ...element.content, specs },
        });
      }
      commitTransaction();
      triggerAutosave();
      showToast("Specifications structured & applied (Ctrl+Z to undo)", "success");
      onClose();
    } catch (err) {
      console.error("[SpecNormalizer] Failed to apply:", err);
      showToast("Failed to apply specifications", "danger");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Structure Architectural Specifications"
      description="Format descriptive notes into clean, presentation-ready specification pairs."
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs text-text-muted font-mono">Extracting architectural parameters...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-text-muted uppercase">
                <span>Extracted Metrics ({specs.length})</span>
                <button
                  onClick={handleAddPair}
                  className="text-accent hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Pair</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {specs.map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-surface-elevated p-2 rounded border border-border">
                    <input
                      type="text"
                      value={pair.label}
                      onChange={(e) => handleUpdatePair(idx, "label", e.target.value)}
                      placeholder="Label"
                      className="w-1/2 bg-surface border border-border px-2 py-1 text-xs rounded text-text-primary focus:border-accent outline-none"
                    />
                    <input
                      type="text"
                      value={pair.value}
                      onChange={(e) => handleUpdatePair(idx, "value", e.target.value)}
                      placeholder="Value"
                      className="w-1/2 bg-surface border border-border px-2 py-1 text-xs rounded text-text-primary focus:border-accent outline-none"
                    />
                    <button
                      onClick={() => handleRemovePair(idx)}
                      className="text-text-muted hover:text-danger p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded bg-surface border border-border text-[11px] text-text-muted font-mono">
              Note: Unverified performance values are formatted as conceptual design targets.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleApply}
                disabled={specs.length === 0}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Apply Specifications
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
