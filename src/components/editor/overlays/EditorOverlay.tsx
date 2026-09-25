import React from "react";
import { Modal } from "../../common/Modal";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "../../common/Toast";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareSlug: string;
  projectTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareSlug,
  projectTitle,
}) => {
  const { showToast } = useToast();
  const shareUrl = `${window.location.origin}/view/${shareSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast("Share link copied to clipboard", "success");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Interactive Experience"
      description={`Share "${projectTitle}" with clients, consultants, or stakeholders.`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-text-secondary block mb-1.5 font-medium">
            Public Presentation Link
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

        <div className="rounded p-3 bg-surface border border-border text-xs text-text-secondary space-y-1">
          <p className="font-medium text-text-primary">Interactive Client Mode</p>
          <p className="text-[11px] text-text-muted">
            Viewers can explore the design, navigate floor plans, toggle before/after comparisons, and click hotspots without editing permissions.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <a href={`/view/${shareSlug}`} target="_blank" rel="noreferrer">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open Experience Mode
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
