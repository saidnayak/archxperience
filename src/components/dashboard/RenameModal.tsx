import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";

export interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  onRename: (newTitle: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  onRename,
}) => {
  const [title, setTitle] = useState(currentTitle);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevCurrentTitle, setPrevCurrentTitle] = useState(currentTitle);

  if (isOpen !== prevIsOpen || currentTitle !== prevCurrentTitle) {
    setPrevIsOpen(isOpen);
    setPrevCurrentTitle(currentTitle);
    setTitle(currentTitle);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onRename(title.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Presentation"
      description="Enter a new title for this architectural presentation."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!title.trim()}>
            Save Title
          </Button>
        </div>
      </form>
    </Modal>
  );
};
