import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { AlertTriangle } from "lucide-react";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Presentation"
      maxWidth="sm"
    >
      <div className="space-y-4 select-none">
        <div className="flex items-start gap-3 p-3 rounded-md bg-danger/10 border border-danger/30 text-danger">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold">Delete "{projectTitle}"?</p>
            <p className="text-text-secondary leading-relaxed">
              All slides, spatial elements, material specifications, and interactive hotspots in this project will be permanently removed.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-danger hover:bg-danger/90 text-white"
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
};
