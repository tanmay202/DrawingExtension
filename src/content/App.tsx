import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnnotationStage, AnnotationStageHandle } from "./components/AnnotationStage";
import { BrushCursor } from "./components/BrushCursor";
import { Toolbar } from "./components/Toolbar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { injectedStyles } from "./styles";
import { useHistory } from "../history/useHistory";
import { createDocument, currentUrlKey, loadAnnotations, saveAnnotations } from "../storage/annotationStorage";
import { AnnotationDocument, AnnotationShape, Tool, ToolSettings, ViewportState } from "../types/annotations";
import { observeViewportState, readViewportState } from "../utils/documentMetrics";

export default function App() {
  const stageRef = useRef<AnnotationStageHandle | null>(null);
  const history = useHistory([]);
  const [active, setActive] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [settings, setSettings] = useState<ToolSettings>({
    stroke: "#38bdf8",
    strokeWidth: 5,
    opacity: 1
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportState>(() => readViewportState());
  const [storageKey, setStorageKey] = useState(() => currentUrlKey());
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => observeViewportState(setViewport), []);

  useEffect(() => {
    const notify = () => setStorageKey(currentUrlKey());
    const originalPushState = historyApi("pushState");
    const originalReplaceState = historyApi("replaceState");

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      queueMicrotask(notify);
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      queueMicrotask(notify);
      return result;
    };

    window.addEventListener("popstate", notify);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", notify);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const documentValue = await loadAnnotations(storageKey);
      if (cancelled) {
        return;
      }

      history.replaceSilently(documentValue?.shapes ?? []);
      setSelectedId(null);
      setLoadedKey(storageKey);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [history.replaceSilently, storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveAnnotations(storageKey, createDocument(history.shapes));
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [history.shapes, loadedKey, storageKey]);

  const createShape = useCallback((shape: AnnotationShape) => {
    history.commit((current) => [...current, shape]);
  }, [history]);

  const updateShape = useCallback((shape: AnnotationShape) => {
    history.commit((current) => current.map((item) => (item.id === shape.id ? shape : item)));
  }, [history]);

  const removeShapes = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    history.commit((current) => current.filter((shape) => !idSet.has(shape.id)));
  }, [history]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) {
      return;
    }
    removeShapes([selectedId]);
    setSelectedId(null);
  }, [removeShapes, selectedId]);

  const clearAll = useCallback(() => {
    if (history.shapes.length === 0) {
      return;
    }
    history.commit([]);
    setSelectedId(null);
  }, [history]);

  const toggleMinimize = useCallback(() => {
    setMinimized((v) => !v);
  }, []);

  useKeyboardShortcuts({
    active,
    selectedId,
    onToggle: () => setActive((value) => !value),
    onMinimize: toggleMinimize,
    onTool: setTool,
    onUndo: history.undo,
    onRedo: history.redo,
    onDelete: deleteSelected
  });

  const exportDocument = useMemo<AnnotationDocument>(() => createDocument(history.shapes), [history.shapes]);

  const exportJson = useCallback(() => {
    downloadBlob(
      new Blob([JSON.stringify(exportDocument, null, 2)], { type: "application/json" }),
      `annotations-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    );
  }, [exportDocument]);

  const importJson = useCallback(async (file: File) => {
    const raw = await file.text();
    const value = JSON.parse(raw) as AnnotationDocument | AnnotationShape[];
    const shapes = Array.isArray(value) ? value : value.shapes;
    if (!Array.isArray(shapes)) {
      throw new Error("Imported file does not contain annotation shapes.");
    }

    history.commit(shapes);
    setSelectedId(null);
  }, [history]);

  const exportScreenshot = useCallback(async () => {
    const overlay = stageRef.current?.exportOverlayPng();
    if (!overlay) {
      return;
    }

    const pageCapture = await captureVisibleTab();
    if (!pageCapture) {
      downloadDataUrl(overlay, "annotation-overlay.png");
      return;
    }

    const [pageImage, overlayImage] = await Promise.all([loadImage(pageCapture), loadImage(overlay)]);
    const canvas = document.createElement("canvas");
    canvas.width = pageImage.naturalWidth;
    canvas.height = pageImage.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      downloadDataUrl(overlay, "annotation-overlay.png");
      return;
    }

    context.drawImage(pageImage, 0, 0, canvas.width, canvas.height);
    context.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
    downloadDataUrl(canvas.toDataURL("image/png"), `annotated-${Date.now()}.png`);
  }, []);

  return (
    <>
      <style>{injectedStyles}</style>
      <div className="annotation-shell">
        <AnnotationStage
          ref={stageRef}
          active={active}
          tool={tool}
          settings={settings}
          shapes={history.shapes}
          selectedId={selectedId}
          viewport={viewport}
          onCreate={createShape}
          onUpdate={updateShape}
          onRemove={removeShapes}
          onSelect={setSelectedId}
        />
        <Toolbar
          active={active}
          minimized={minimized}
          tool={tool}
          settings={settings}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onTool={setTool}
          onSettings={setSettings}
          onUndo={history.undo}
          onRedo={history.redo}
          onClear={clearAll}
          onExportJson={exportJson}
          onImportJson={(file) => void importJson(file)}
          onScreenshot={exportScreenshot}
          onToggleMinimize={toggleMinimize}
        />
        <BrushCursor active={active} tool={tool} settings={settings} />
      </div>
    </>
  );
}

function historyApi(name: "pushState" | "replaceState") {
  return window.history[name];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

function captureVisibleTab(): Promise<string | null> {
  const runtime = globalThis.chrome?.runtime;
  if (!runtime?.sendMessage) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    runtime.sendMessage({ type: "ANNOTATOR_CAPTURE_VISIBLE_TAB" }, (response?: { ok: boolean; dataUrl?: string }) => {
      if (globalThis.chrome?.runtime?.lastError || !response?.ok || !response.dataUrl) {
        resolve(null);
        return;
      }

      resolve(response.dataUrl);
    });
  });
}
