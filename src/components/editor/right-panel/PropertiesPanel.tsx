import React, { useState, useRef } from "react";
import type { Slide, CanvasElement } from "../../../types";
import { useEditorStore } from "../../../stores";
import { uploadPresentationAsset } from "../../../lib/storage";
import { Tabs } from "../../common/Tabs";
import { Input } from "../../common/Input";
import { Textarea } from "../../common/Textarea";
import { Select } from "../../common/Select";
import { Slider } from "../../common/Slider";
import { Badge } from "../../common/Badge";
import { Button } from "../../common/Button";
import {
  Sliders,
  Layers as LayersIcon,
  Settings,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize,
  Compass,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export interface PropertiesPanelProps {
  activeSlide: Slide | null;
  onTriggerImproveSlide?: (slideId: string) => void;
  onTriggerHotspots?: (element: CanvasElement) => void;
  onTriggerSpecNormalizer?: (element: CanvasElement) => void;
  onTriggerAudienceTuner?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeSlide,
  onTriggerImproveSlide,
  onTriggerHotspots,
  onTriggerSpecNormalizer,
  onTriggerAudienceTuner,
}) => {
  const [activeTab, setActiveTab] = useState("inspector");
  const {
    activeProjectId,
    slides,
    selectedElementIds,
    updateElement,
    deleteElement,
    deleteSelected,
    duplicateElement,
    duplicateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    alignSelected,
    centerSelectedOnCanvas,
    updateSlide,
    selectElement,
  } = useEditorStore();

  const [imageUploadStatus, setImageUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const [bgUploadStatus, setBgUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [bgUploadError, setBgUploadError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleElementImageUpload = async (file: File) => {
    if (!selectedElement || !activeProjectId) return;
    setImageUploadStatus("uploading");
    setImageUploadError(null);
    try {
      const res = await uploadPresentationAsset(file, activeProjectId);
      updateElement(selectedElement.id, {
        content: { ...selectedElement.content, src: res.url },
      });
      setImageUploadStatus("success");
      setTimeout(() => setImageUploadStatus("idle"), 2500);
    } catch (err: unknown) {
      setImageUploadStatus("error");
      setImageUploadError((err as Error)?.message || "Upload failed");
    }
  };

  const handleBgImageUpload = async (file: File) => {
    if (!activeSlide || !activeProjectId) return;
    setBgUploadStatus("uploading");
    setBgUploadError(null);
    try {
      const res = await uploadPresentationAsset(file, activeProjectId);
      updateSlide(activeSlide.id, {
        backgroundImageUrl: res.url,
        background: { type: "image", imageUrl: res.url },
      });
      setBgUploadStatus("success");
      setTimeout(() => setBgUploadStatus("idle"), 2500);
    } catch (err: unknown) {
      setBgUploadStatus("error");
      setBgUploadError((err as Error)?.message || "Upload failed");
    }
  };

  const isMultiSelect = selectedElementIds.length > 1;

  const selectedElement: CanvasElement | undefined = activeSlide?.elements.find((el) =>
    selectedElementIds.includes(el.id)
  );

  const tabs = [
    { id: "inspector", label: "Properties", icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: "layers", label: "Layers", icon: <LayersIcon className="w-3.5 h-3.5" /> },
    { id: "slide", label: "Slide Settings", icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  // Available slides for slide navigation actions
  const slideOptions = slides.map((s, idx) => ({
    value: s.id,
    label: `${idx + 1}. ${s.title}`,
  }));

  return (
    <div className="h-full flex flex-col select-none">
      {/* Tab bar */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-2 pt-1" />

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === "inspector" && (
          <>
            {isMultiSelect ? (
              /* Multi-Selection Control Group */
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">
                      Multi-Selection
                    </span>
                    <Badge size="sm" variant="accent">
                      {selectedElementIds.length} elements
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateSelected()}
                      className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
                      title="Duplicate Selected (Ctrl+D)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSelected()}
                      className="text-danger hover:text-danger/80 p-1 rounded transition-colors"
                      title="Delete Selected (Delete key)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Alignment Tools */}
                <div>
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                    Align Elements
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <button
                      onClick={() => alignSelected("left")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Left</span>
                    </button>
                    <button
                      onClick={() => alignSelected("center")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Align Center Horizontally"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Center</span>
                    </button>
                    <button
                      onClick={() => alignSelected("right")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                      <span>Right</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => alignSelected("top")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Align Top"
                    >
                      <AlignJustify className="w-3.5 h-3.5 rotate-90" />
                      <span>Top</span>
                    </button>
                    <button
                      onClick={() => alignSelected("middle")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Align Middle Vertically"
                    >
                      <AlignCenter className="w-3.5 h-3.5 rotate-90" />
                      <span>Middle</span>
                    </button>
                    <button
                      onClick={() => alignSelected("bottom")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Align Bottom"
                    >
                      <AlignJustify className="w-3.5 h-3.5 -rotate-90" />
                      <span>Bottom</span>
                    </button>
                  </div>
                </div>

                {/* Center on Canvas */}
                <div className="pt-2 border-t border-border">
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                    Center on 1920×1080 Canvas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => centerSelectedOnCanvas("horizontal")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Maximize className="w-3.5 h-3.5 rotate-45" />
                      <span>Horizontally</span>
                    </button>
                    <button
                      onClick={() => centerSelectedOnCanvas("vertical")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Maximize className="w-3.5 h-3.5 -rotate-45" />
                      <span>Vertically</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedElement ? (
              <div className="space-y-5">
                {/* Element Header & Quick Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary capitalize">
                      {selectedElement.type.replace("_", " ")}
                    </span>
                    <Badge size="sm" variant="accent">
                      Selected
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateElement(selectedElement.id)}
                      className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
                      title="Duplicate Element (Ctrl+D)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteElement(selectedElement.id)}
                      className="text-danger hover:text-danger/80 p-1 rounded transition-colors"
                      title="Delete Element (Delete key)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Layer Ordering Controls */}
                <div>
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                    Layer Arrangement (Z: {selectedElement.zIndex})
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => bringToFront(selectedElement.id)}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Bring to Front"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => bringForward(selectedElement.id)}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Bring Forward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => sendBackward(selectedElement.id)}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Send Backward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => sendToBack(selectedElement.id)}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1"
                      title="Send to Back"
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Canvas Centering */}
                <div>
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                    Center on Canvas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => centerSelectedOnCanvas("horizontal")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Maximize className="w-3.5 h-3.5 rotate-45" />
                      <span>Horizontally</span>
                    </button>
                    <button
                      onClick={() => centerSelectedOnCanvas("vertical")}
                      className="p-1.5 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Maximize className="w-3.5 h-3.5 -rotate-45" />
                      <span>Vertically</span>
                    </button>
                  </div>
                </div>

                {/* 1920x1080 Geometry Controls */}
                <div>
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-2">
                    Reference Geometry (1920×1080)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="X (px)"
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { x: Number(e.target.value) })
                      }
                    />
                    <Input
                      label="Y (px)"
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { y: Number(e.target.value) })
                      }
                    />
                    <Input
                      label="Width (px)"
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          width: Math.max(20, Number(e.target.value)),
                        })
                      }
                    />
                    <Input
                      label="Height (px)"
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          height: Math.max(20, Number(e.target.value)),
                        })
                      }
                    />
                  </div>
                  <div className="mt-2">
                    <Input
                      label="Rotation (deg)"
                      type="number"
                      min={0}
                      max={360}
                      value={Math.round(selectedElement.rotation || 0)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { rotation: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                {/* Appearance */}
                <div className="pt-2 border-t border-border space-y-3">
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                    Appearance
                  </label>
                  <Slider
                    label="Opacity"
                    min={10}
                    max={100}
                    value={Math.round((selectedElement.styles?.opacity ?? 1) * 100)}
                    valueDisplay={`${Math.round((selectedElement.styles?.opacity ?? 1) * 100)}%`}
                    onChange={(val) =>
                      updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, opacity: val / 100 },
                      })
                    }
                  />
                </div>

                {/* Type-Specific Property Editors */}
                {selectedElement.type === "text" && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                      Typography Content
                    </label>
                    <Textarea
                      label="Text Content"
                      value={selectedElement.content.text}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, text: e.target.value },
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Font Size (px)"
                        type="number"
                        min={12}
                        max={120}
                        value={selectedElement.content.fontSize || 24}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            content: {
                              ...selectedElement.content,
                              fontSize: Number(e.target.value),
                            },
                          })
                        }
                      />
                      <Select
                        label="Weight"
                        options={[
                          { value: "light", label: "Light" },
                          { value: "normal", label: "Regular" },
                          { value: "medium", label: "Medium" },
                          { value: "semibold", label: "Semibold" },
                          { value: "bold", label: "Bold" },
                        ]}
                        value={selectedElement.content.fontWeight || "normal"}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            content: {
                              ...selectedElement.content,
                              fontWeight: e.target.value as any,
                            },
                          })
                        }
                      />
                    </div>
                    <Select
                      label="Alignment"
                      options={[
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                      ]}
                      value={selectedElement.content.textAlign || "left"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: {
                            ...selectedElement.content,
                            textAlign: e.target.value as any,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {selectedElement.type === "hotspot" && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                      Hotspot Configuration
                    </label>
                    <Input
                      label="Hotspot Title"
                      value={selectedElement.content.title}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, title: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="Badge Label (1-3 chars)"
                      value={selectedElement.content.badgeText || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, badgeText: e.target.value },
                        })
                      }
                    />
                    <Textarea
                      label="Specification / Description"
                      value={selectedElement.content.description || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, description: e.target.value },
                        })
                      }
                    />
                    <Select
                      label="Trigger Action"
                      options={[
                        { value: "open_panel", label: "Open Slide-over Info Sheet" },
                        { value: "open_modal", label: "Open Technical Modal" },
                        { value: "navigate_slide", label: "Jump to Slide" },
                        { value: "open_url", label: "Open External Link" },
                      ]}
                      value={selectedElement.content.action}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, action: e.target.value as any },
                        })
                      }
                    />
                    {selectedElement.content.action === "navigate_slide" && (
                      <Select
                        label="Destination Slide"
                        options={slideOptions}
                        value={selectedElement.content.targetSlideId || ""}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            content: {
                              ...selectedElement.content,
                              targetSlideId: e.target.value,
                            },
                          })
                        }
                      />
                    )}

                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
                        className="w-full text-xs justify-center border-accent/40 text-accent hover:bg-accent/10"
                        onClick={() => onTriggerSpecNormalizer?.(selectedElement)}
                      >
                        Structure Specifications with AI
                      </Button>
                    </div>
                  </div>
                )}

                {selectedElement.type === "button" && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                      Button Settings
                    </label>
                    <Input
                      label="Button Label"
                      value={selectedElement.content.label}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, label: e.target.value },
                        })
                      }
                    />
                    <Select
                      label="Button Style"
                      options={[
                        { value: "primary", label: "Primary (Terracotta)" },
                        { value: "secondary", label: "Secondary (Elevated)" },
                      ]}
                      value={selectedElement.content.variant || "primary"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, variant: e.target.value as any },
                        })
                      }
                    />
                    <Select
                      label="Button Action"
                      options={[
                        { value: "navigate_slide", label: "Jump to Slide" },
                        { value: "open_url", label: "Open URL" },
                        { value: "none", label: "None (Visual only)" },
                      ]}
                      value={selectedElement.content.action}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, action: e.target.value as any },
                        })
                      }
                    />
                    {selectedElement.content.action === "navigate_slide" && (
                      <Select
                        label="Destination Slide"
                        options={slideOptions}
                        value={selectedElement.content.targetSlideId || ""}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            content: {
                              ...selectedElement.content,
                              targetSlideId: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                )}

                {selectedElement.type === "image" && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                        Image Visual Asset
                      </label>
                      <Badge size="sm" variant="accent">
                        Asset
                      </Badge>
                    </div>

                    {/* Direct Upload Button & Hidden Input */}
                    <div>
                      <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleElementImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={imageUploadStatus === "uploading"}
                        leftIcon={
                          imageUploadStatus === "uploading" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                          ) : imageUploadStatus === "success" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-accent" />
                          )
                        }
                        className="w-full text-xs justify-center"
                      >
                        {imageUploadStatus === "uploading"
                          ? "Uploading Image..."
                          : imageUploadStatus === "success"
                          ? "Image Uploaded"
                          : "Upload Image to Cloud"}
                      </Button>
                    </div>

                    {/* Upload Error Banner */}
                    {imageUploadError && (
                      <div className="p-2.5 rounded bg-danger/15 border border-danger/40 text-danger text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-snug">{imageUploadError}</span>
                      </div>
                    )}

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-border/60"></div>
                      <span className="flex-shrink mx-2 text-[10px] uppercase font-mono text-text-muted">or URL</span>
                      <div className="flex-grow border-t border-border/60"></div>
                    </div>

                    <Input
                      label="Image URL"
                      placeholder="https://..."
                      value={selectedElement.content.src || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, src: e.target.value },
                        })
                      }
                    />

                    <Input
                      label="Alternative Text / Label"
                      placeholder="e.g. South elevation render"
                      value={selectedElement.content.alt || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, alt: e.target.value },
                        })
                      }
                    />

                    <Select
                      label="Object Fit"
                      options={[
                        { value: "cover", label: "Cover (Fill bounds)" },
                        { value: "contain", label: "Contain (Preserve aspect)" },
                      ]}
                      value={selectedElement.content.objectFit || "cover"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, objectFit: e.target.value as any },
                        })
                      }
                    />

                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
                        className="w-full text-xs justify-center border-accent/40 text-accent hover:bg-accent/10"
                        onClick={() => onTriggerHotspots?.(selectedElement)}
                      >
                        Suggest Hotspots with AI
                      </Button>
                    </div>
                  </div>
                )}


                {selectedElement.type === "info_card" && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                      Specification Card Content
                    </label>
                    <Input
                      label="Eyebrow"
                      value={selectedElement.content.eyebrow || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, eyebrow: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="Title"
                      value={selectedElement.content.title || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, title: e.target.value },
                        })
                      }
                    />
                    <Textarea
                      label="Description"
                      value={selectedElement.content.description || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, description: e.target.value },
                        })
                      }
                    />

                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
                        className="w-full text-xs justify-center border-accent/40 text-accent hover:bg-accent/10"
                        onClick={() => onTriggerSpecNormalizer?.(selectedElement)}
                      >
                        Structure Specifications with AI
                      </Button>
                    </div>
                  </div>
                )}

                {selectedElement.type === "comparison" && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                      Comparison Images
                    </label>
                    <Input
                      label="Before Image URL"
                      value={selectedElement.content.beforeImageUrl || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, beforeImageUrl: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="Before Label"
                      value={selectedElement.content.beforeLabel || "Before"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, beforeLabel: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="After Image URL"
                      value={selectedElement.content.afterImageUrl || ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, afterImageUrl: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="After Label"
                      value={selectedElement.content.afterLabel || "After"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: { ...selectedElement.content, afterLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              /* No selection: Show active slide quick properties */
              <div className="space-y-4">
                <div className="text-center py-4 border-b border-border">
                  <Compass className="w-6 h-6 text-accent mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-semibold text-text-primary">Slide Canvas Active</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Select an element to edit properties or customize this slide below.
                  </p>
                </div>

                {activeSlide && (
                  <div className="space-y-3">
                    <Input
                      label="Slide Title"
                      value={activeSlide.title}
                      onChange={(e) => updateSlide(activeSlide.id, { title: e.target.value })}
                    />
                    <Select
                      label="Transition Effect"
                      options={[
                        { value: "fade", label: "Fade" },
                        { value: "slide-left", label: "Slide Left" },
                        { value: "slide-right", label: "Slide Right" },
                        { value: "zoom", label: "Subtle Zoom" },
                        { value: "none", label: "Instant" },
                      ]}
                      value={activeSlide.transitionType || "fade"}
                      onChange={(e) =>
                        updateSlide(activeSlide.id, { transitionType: e.target.value as any })
                      }
                    />
                    <Input
                      label="Background Image URL"
                      value={activeSlide.backgroundImageUrl || activeSlide.background?.imageUrl || ""}
                      placeholder="https://..."
                      onChange={(e) =>
                        updateSlide(activeSlide.id, {
                          backgroundImageUrl: e.target.value,
                          background: { type: "image", imageUrl: e.target.value },
                        })
                      }
                    />

                    {/* AI Slide Assistant Card */}
                    <div className="pt-3 border-t border-border space-y-2">
                      <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                        AI Slide Assistant
                      </label>
                      <div className="p-3 rounded border border-accent/30 bg-accent/5 space-y-2">
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Analyze this slide for architectural text conciseness, visual hierarchy, and interaction opportunities.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                            className="flex-1 text-xs justify-center"
                            onClick={() => onTriggerImproveSlide?.(activeSlide.id)}
                          >
                            Improve Slide
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-2.5"
                            onClick={() => onTriggerAudienceTuner?.()}
                            title="Tune for specific audience"
                          >
                            Tone
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "layers" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                Slide Elements ({activeSlide?.elements.length || 0})
              </label>
            </div>
            {activeSlide?.elements.length === 0 ? (
              <p className="text-xs text-text-muted italic py-4 text-center">
                No elements on this slide
              </p>
            ) : (
              activeSlide?.elements
                .slice()
                .reverse()
                .map((el) => {
                  const isElSelected = selectedElementIds.includes(el.id);
                  return (
                    <div
                      key={el.id}
                      onClick={() => selectElement(el.id)}
                      className={`flex items-center justify-between p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                        isElSelected
                          ? "bg-accent/20 border-accent text-text-primary"
                          : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-text-muted text-[10px]">z:{el.zIndex}</span>
                        <span className="font-medium capitalize">{el.type.replace("_", " ")}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(el.id);
                        }}
                        className="text-text-muted hover:text-danger p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {activeTab === "slide" && activeSlide && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                Slide Title
              </label>
              <Input
                value={activeSlide.title}
                onChange={(e) => updateSlide(activeSlide.id, { title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                Slide Transition
              </label>
              <Select
                options={[
                  { value: "fade", label: "Fade (Default)" },
                  { value: "slide-left", label: "Slide Left" },
                  { value: "slide-right", label: "Slide Right" },
                  { value: "zoom", label: "Subtle Zoom" },
                  { value: "none", label: "Instant" },
                ]}
                value={activeSlide.transitionType || "fade"}
                onChange={(e) =>
                  updateSlide(activeSlide.id, { transitionType: e.target.value as any })
                }
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                Slide Background Visual
              </label>

              {/* Direct Upload Button & Hidden Input for Background */}
              <div>
                <input
                  type="file"
                  ref={bgInputRef}
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBgImageUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => bgInputRef.current?.click()}
                  disabled={bgUploadStatus === "uploading"}
                  leftIcon={
                    bgUploadStatus === "uploading" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    ) : bgUploadStatus === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-accent" />
                    )
                  }
                  className="w-full text-xs justify-center"
                >
                  {bgUploadStatus === "uploading"
                    ? "Uploading Background..."
                    : bgUploadStatus === "success"
                    ? "Background Uploaded"
                    : "Upload Background Image"}
                </Button>
              </div>

              {bgUploadError && (
                <div className="p-2.5 rounded bg-danger/15 border border-danger/40 text-danger text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="leading-snug">{bgUploadError}</span>
                </div>
              )}

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-mono text-text-muted">or URL</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>

              <Input
                label="Image URL"
                value={activeSlide.backgroundImageUrl || activeSlide.background?.imageUrl || ""}
                placeholder="https://images.unsplash.com/..."
                onChange={(e) =>
                  updateSlide(activeSlide.id, {
                    backgroundImageUrl: e.target.value,
                    background: { type: "image", imageUrl: e.target.value },
                  })
                }
              />
            </div>

            {/* AI Slide Assistant in Slide Settings tab */}
            <div className="pt-3 border-t border-border space-y-2">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                AI Slide Assistant
              </label>
              <div className="p-3 rounded border border-accent/30 bg-accent/5 space-y-2">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Analyze this slide for architectural text conciseness, visual hierarchy, and interaction opportunities.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    className="flex-1 text-xs justify-center"
                    onClick={() => onTriggerImproveSlide?.(activeSlide.id)}
                  >
                    Improve Slide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2.5"
                    onClick={() => onTriggerAudienceTuner?.()}
                    title="Tune for specific audience"
                  >
                    Tone
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="p-3 border-t border-border bg-surface-subtle/40 text-[10px] font-mono text-text-muted flex justify-between items-center">
        <span>Zustand State Active</span>
        <span>1920 × 1080 px</span>
      </div>
    </div>
  );
};
