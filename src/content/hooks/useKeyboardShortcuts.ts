import { useEffect } from "react";
import { Tool } from "../../types/annotations";

interface ShortcutOptions {
  active: boolean;
  selectedId: string | null;
  onToggle: () => void;
  onMinimize: () => void;
  onTool: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Ctrl+P → toggle drawing mode on/off
      if ((event.ctrlKey || event.metaKey) && key === "p") {
        event.preventDefault();
        event.stopPropagation();
        options.onToggle();
        return;
      }

      // Ctrl+M → minimize / restore toolbar
      if ((event.ctrlKey || event.metaKey) && key === "m") {
        event.preventDefault();
        event.stopPropagation();
        options.onMinimize();
        return;
      }

      if (!options.active || isEditableTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "z" && event.shiftKey) {
        event.preventDefault();
        options.onRedo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        options.onUndo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (options.selectedId) {
          event.preventDefault();
          options.onDelete();
        }
        return;
      }

      const shortcuts: Partial<Record<string, Tool>> = {
        v: "select",
        b: "brush",
        e: "eraser",
        r: "rectangle",
        c: "circle",
        l: "line",
        a: "arrow",
        h: "highlight"
      };

      const nextTool = shortcuts[key];
      if (nextTool) {
        event.preventDefault();
        options.onTool(nextTool);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [options]);
}
