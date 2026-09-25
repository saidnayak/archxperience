import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useEditorStore, useAuthStore } from "../../../stores";
import { Button } from "../../common/Button";
import { IconButton } from "../../common/IconButton";
import { Badge } from "../../common/Badge";
import { Dropdown } from "../../common/Dropdown";
import { useToast } from "../../common/Toast";
import type { ElementType } from "../../../types";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Share2,
  Save,
  Plus,
  Grid,
  Type,
  Image as ImageIcon,
  Square,
  MapPin,
  FileText,
  SplitSquareVertical,
  Check,
  Sparkles,
} from "lucide-react";

export interface EditorToolbarProps {
  projectTitle: string;
  projectId: string;
  onShare?: () => void;
  onOpenReview?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  projectTitle,
  projectId,
  onShare,
  onOpenReview,
}) => {
  const {
    zoomLevel,
    setZoom,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    saveStatus,
    saveProject,
    gridSnapEnabled,
    toggleGridSnap,
    addElement,
  } = useEditorStore();
  const { mode } = useAuthStore();

  const { showToast } = useToast();
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);

  const handleSave = async () => {
    try {
      await saveProject();
      showToast(mode === "cloud" ? "Project saved to cloud" : "Project saved locally", "success");
    } catch {
      showToast("Failed to save project. Edits preserved.", "danger");
    }
  };


  const handleAddElement = (type: ElementType) => {
    addElement(type);
    const names: Record<ElementType, string> = {
      text: "Heading Text",
      image: "Image Visual",
      button: "Interactive Button",
      hotspot: "Technical Hotspot",
      info_card: "Info Card",
      comparison: "Before/After Comparison",
    };
    showToast(`Added ${names[type]} to slide`, "info");
  };

  const addMenuItems = [
    {
      id: "add-text",
      label: "Heading / Text",
      icon: <Type className="w-3.5 h-3.5 text-accent" />,
      onClick: () => handleAddElement("text"),
    },
    {
      id: "add-image",
      label: "Visual / Image",
      icon: <ImageIcon className="w-3.5 h-3.5 text-accent" />,
      onClick: () => handleAddElement("image"),
    },
    {
      id: "add-button",
      label: "Action Button",
      icon: <Square className="w-3.5 h-3.5 text-accent" />,
      onClick: () => handleAddElement("button"),
    },
    {
      id: "add-hotspot",
      label: "Technical Hotspot",
      icon: <MapPin className="w-3.5 h-3.5 text-accent" />,
      onClick: () => handleAddElement("hotspot"),
    },
    {
      id: "add-info-card",
      label: "Specification Card",
      icon: <FileText className="w-3.5 h-3.5 text-accent" />,
      onClick: () => handleAddElement("info_card"),
    },
    {
      id: "add-comparison",
      label: "Before / After Comparison",
      icon: <SplitSquareVertical className="w-3.5 h-3.5 text-accent" />,
      onClick: () => handleAddElement("comparison"),
    },
  ];

  return (
    <div className="h-full flex items-center justify-between px-3 select-none">
      {/* Left: Back, Title, Add Element, & Save Status */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <IconButton aria-label="Back to Dashboard" size="sm" variant="ghost">
            <ChevronLeft className="w-4 h-4" />
          </IconButton>
        </Link>
        <div className="h-4 w-[1px] bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary tracking-tight max-w-[180px] truncate">
            {projectTitle}
          </span>
          <Badge size="sm" variant="default">
            16:9
          </Badge>

          {/* Add Element Dropdown Menu */}
          <div className="ml-2">
            <Dropdown
              trigger={
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="h-7 text-xs font-medium px-2.5 shadow-sm"
                >
                  Add Element
                </Button>
              }
              items={addMenuItems}
              align="left"
            />
          </div>

          {/* Save Status Indicator & Quick Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              saveStatus === "saving"
                ? "bg-accent/20 text-accent animate-pulse"
                : isDirty
                ? "bg-accent/20 text-accent hover:bg-accent/30"
                : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
            }`}
            title="Click or press Ctrl+S to save locally"
          >
            <Save
              className={`w-3.5 h-3.5 ${
                saveStatus === "saving"
                  ? "animate-spin text-accent"
                  : saveStatus === "error"
                  ? "text-rose-500"
                  : isDirty
                  ? "text-accent"
                  : "text-success"
              }`}
            />
            <span>
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "error"
                ? "Save failed"
                : isDirty
                ? "Save changes"
                : "Saved"}
            </span>
          </button>
        </div>
      </div>

      {/* Center: Undo/Redo, Grid Snap, Zoom Controls */}
      <div className="flex items-center gap-1 bg-surface-elevated px-2 py-1 rounded border border-border">
        <IconButton
          aria-label="Undo (Ctrl+Z)"
          size="sm"
          variant="ghost"
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          aria-label="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          size="sm"
          variant="ghost"
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </IconButton>

        <div className="h-3.5 w-[1px] bg-border mx-1" />

        {/* Grid Snap Toggle */}
        <button
          onClick={toggleGridSnap}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
            gridSnapEnabled
              ? "bg-accent/20 text-accent font-medium"
              : "text-text-muted hover:text-text-primary hover:bg-surface-subtle"
          }`}
          title="Toggle 16px Grid Snapping"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">Snap</span>
        </button>

        <div className="h-3.5 w-[1px] bg-border mx-1" />

        {/* Zoom Out */}
        <IconButton
          aria-label="Zoom Out"
          size="sm"
          variant="ghost"
          onClick={() => setZoom(zoomLevel - 0.15)}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </IconButton>

        {/* Zoom Presets Selector */}
        <div className="relative">
          <button
            onClick={() => setZoomDropdownOpen(!zoomDropdownOpen)}
            className="text-[11px] font-mono font-medium text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-surface-subtle transition-colors flex items-center gap-1"
            title="Select Zoom Preset"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {zoomDropdownOpen && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-surface-elevated border border-border rounded shadow-elevated py-1 w-24 z-50 text-xs font-mono">
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5].map((z) => (
                <button
                  key={z}
                  onClick={() => {
                    setZoom(z);
                    setZoomDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1 flex items-center justify-between hover:bg-surface-subtle text-text-secondary hover:text-text-primary"
                >
                  <span>{Math.round(z * 100)}%</span>
                  {Math.abs(zoomLevel - z) < 0.01 && <Check className="w-3 h-3 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom In */}
        <IconButton
          aria-label="Zoom In"
          size="sm"
          variant="ghost"
          onClick={() => setZoom(zoomLevel + 0.15)}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </IconButton>

        {/* Fit to Screen (100% scale factor) */}
        <IconButton
          aria-label="Fit to Screen"
          size="sm"
          variant="ghost"
          onClick={() => setZoom(1)}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </IconButton>
      </div>

      {/* Right: Review, Share & Preview */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
          onClick={onOpenReview}
          className="border-accent/30 hover:border-accent hover:bg-accent/10 text-xs font-medium shadow-sm"
        >
          Review
        </Button>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Share2 className="w-3.5 h-3.5" />}
          onClick={onShare}
        >
          Share
        </Button>

        <Link to={`/preview/${projectId}`}>
          <Button variant="primary" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />}>
            Preview
          </Button>
        </Link>
      </div>
    </div>
  );
};
