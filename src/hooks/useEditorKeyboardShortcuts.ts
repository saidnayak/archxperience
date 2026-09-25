import { useEffect } from "react";
import { useEditorStore } from "../stores";
import { useToast } from "../components/common/Toast";

/**
 * Safe keyboard shortcut handler for the Presentation Studio Editor.
 * Safely ignores shortcuts when user is typing in form controls or inputs.
 */
export function useEditorKeyboardShortcuts() {
  const {
    undo,
    redo,
    saveProject,
    deleteSelected,
    duplicateSelected,
    copySelected,
    paste,
    clearSelection,
    selectedElementIds,
    moveSelected,
  } = useEditorStore();

  const { showToast } = useToast();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (cmdOrCtrl && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y
      if (
        (cmdOrCtrl && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
        (cmdOrCtrl && (e.key === "y" || e.key === "Y"))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl/Cmd + S
      if (cmdOrCtrl && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveProject()
          .then(() => showToast("Project saved locally", "success"))
          .catch(() => showToast("Failed to save project", "danger"));
        return;
      }

      // If user is focused on an input/textarea, do NOT handle element shortcuts
      if (isInput) return;

      // Duplicate: Ctrl/Cmd + D
      if (cmdOrCtrl && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (selectedElementIds.length > 0) {
          duplicateSelected();
          showToast("Duplicated selected element(s)", "info");
        }
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (cmdOrCtrl && (e.key === "c" || e.key === "C")) {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          copySelected();
          showToast("Copied to clipboard", "info");
        }
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (cmdOrCtrl && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        const pasted = paste();
        if (pasted.length > 0) {
          showToast("Pasted from clipboard", "info");
        }
        return;
      }

      // Clear Selection: Escape
      if (e.key === "Escape") {
        clearSelection();
        return;
      }

      // Delete selected element: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      // Arrow Key Nudge (Move selected elements by 2 virtual units, or 20 units with Shift)
      if (
        selectedElementIds.length > 0 &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 2;
        let dx = 0;
        let dy = 0;

        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;

        moveSelected(dx, dy, false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    saveProject,
    deleteSelected,
    duplicateSelected,
    copySelected,
    paste,
    clearSelection,
    selectedElementIds,
    moveSelected,
    showToast,
  ]);
}
