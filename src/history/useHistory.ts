import { useCallback, useMemo, useState } from "react";
import { AnnotationShape } from "../types/annotations";

const HISTORY_LIMIT = 80;

export function useHistory(initial: AnnotationShape[] = []) {
  const [present, setPresent] = useState<AnnotationShape[]>(initial);
  const [past, setPast] = useState<AnnotationShape[][]>([]);
  const [future, setFuture] = useState<AnnotationShape[][]>([]);

  const replaceSilently = useCallback((next: AnnotationShape[]) => {
    setPresent(next);
    setPast([]);
    setFuture([]);
  }, []);

  const commit = useCallback((nextOrUpdater: AnnotationShape[] | ((current: AnnotationShape[]) => AnnotationShape[])) => {
    setPresent((current) => {
      const next = typeof nextOrUpdater === "function" ? nextOrUpdater(current) : nextOrUpdater;
      if (JSON.stringify(current) === JSON.stringify(next)) {
        return current;
      }
      setPast((items) => [...items.slice(-HISTORY_LIMIT + 1), current]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((items) => {
      if (items.length === 0) {
        return items;
      }
      const previous = items[items.length - 1];
      setFuture((futureItems) => [present, ...futureItems].slice(0, HISTORY_LIMIT));
      setPresent(previous);
      return items.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((items) => {
      if (items.length === 0) {
        return items;
      }
      const next = items[0];
      setPast((pastItems) => [...pastItems.slice(-HISTORY_LIMIT + 1), present]);
      setPresent(next);
      return items.slice(1);
    });
  }, [present]);

  return useMemo(
    () => ({
      shapes: present,
      commit,
      replaceSilently,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0
    }),
    [commit, future.length, past.length, present, redo, replaceSilently, undo]
  );
}
