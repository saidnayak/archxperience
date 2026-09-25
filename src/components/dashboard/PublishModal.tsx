import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { Copy, ExternalLink, Globe, ShieldCheck, Cloud, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "../common/Toast";
import { useAuthStore } from "../../stores";

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  shareSlug: string;
  isPublished: boolean;
  slideCount?: number;
  onTogglePublish: (publish: boolean) => Promise<void> | void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  shareSlug,
  isPublished,
  slideCount = 1,
  onTogglePublish,
}) => {
  const { showToast } = useToast();
  const { mode, user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const shareUrl = `${window.location.origin}/view/${shareSlug}`;

  const isCloudPublished = mode === "cloud" && !!user;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast("Shareable link copied to clipboard", "success");
  };

  const handleToggle = async () => {
    if (!isPublished && slideCount < 1) {
      showToast("Cannot publish an empty presentation. Add at least one slide.", "danger");
      return;
    }

    setIsProcessing(true);
    try {
      await onTogglePublish(!isPublished);
      showToast(
        !isPublished ? "Presentation published to live view" : "Presentation unpublished (draft mode)",
        "success"
      );
    } catch {
      showToast("Failed to update publication status", "danger");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Presentation Publishing & Share Link"
      description={`Manage presentation access and shareable links for "${projectTitle}".`}
      maxWidth="md"
    >
      <div className="space-y-4 select-none">
        {/* Publishing Status Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isPublished
                  ? "bg-success/20 text-success border border-success/40"
                  : "bg-surface text-text-muted border border-border"
              }`}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  Presentation Status
                </span>
                <Badge size="sm" variant={isPublished ? "success" : "default"}>
                  {isPublished ? "Published (Live)" : "Draft Mode"}
                </Badge>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                {isPublished
                  ? isCloudPublished
                    ? "Live on ArchXperience Cloud. Anyone with the link can view without login."
                    : "Published in local mode. Accessible in this browser session."
                  : "Currently private. Publish to enable client share link."}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={isPublished ? "outline" : "primary"}
            onClick={handleToggle}
            disabled={isProcessing}
            leftIcon={isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
          >
            {isProcessing
              ? isPublished
                ? "Unpublishing..."
                : "Publishing..."
              : isPublished
              ? "Unpublish"
              : "Publish Presentation"}
          </Button>
        </div>

        {/* Validation Warning if 0 slides */}
        {slideCount < 1 && (
          <div className="p-2.5 rounded bg-danger/15 border border-danger/40 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>This presentation has 0 slides. Add slides before publishing.</span>
          </div>
        )}

        {/* Share Link Row */}
        <div>
          <label className="text-xs text-text-secondary block mb-1.5 font-medium">
            {isCloudPublished ? "Public Client Experience Link" : "Local Presentation Link"}
          </label>
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="font-mono text-xs" />
            <Button
              variant="secondary"
              size="md"
              onClick={copyToClipboard}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Cloud vs Local Disclosure */}
        {isCloudPublished ? (
          <div className="rounded p-3 bg-surface border border-border/70 text-xs text-text-secondary space-y-1.5">
            <div className="flex items-center gap-1.5 text-text-primary font-medium">
              <Cloud className="w-3.5 h-3.5 text-success" />
              <span>Supabase Cloud Hosting Verified</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              This presentation is secured via PostgreSQL Row-Level Security. When published, clients can experience slides, hotspots, specifications, and before/after comparisons on any device without logging in.
            </p>
          </div>
        ) : (
          <div className="rounded p-3 bg-surface border border-border/70 text-xs text-text-secondary space-y-1.5">
            <div className="flex items-center gap-1.5 text-text-primary font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Local Presentation Mode</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Presentations are saved to your browser's local repository. In this mode, share links open directly on this machine. Sign in to ArchXperience Cloud to generate globally accessible public links.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <a href={`/view/${shareSlug}`} target="_blank" rel="noreferrer">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              disabled={!isPublished}
            >
              Open Experience Mode
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
