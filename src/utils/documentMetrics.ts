import { ViewportState } from "../types/annotations";

export function readViewportState(): ViewportState {
  const element = document.documentElement;
  const body = document.body;

  const documentWidth = Math.max(
    element?.scrollWidth ?? 0,
    element?.clientWidth ?? 0,
    body?.scrollWidth ?? 0,
    body?.clientWidth ?? 0,
    window.innerWidth
  );

  const documentHeight = Math.max(
    element?.scrollHeight ?? 0,
    element?.clientHeight ?? 0,
    body?.scrollHeight ?? 0,
    body?.clientHeight ?? 0,
    window.innerHeight
  );

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    documentWidth,
    documentHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

export function observeViewportState(onChange: (state: ViewportState) => void): () => void {
  let frame = 0;
  let last = "";

  const emit = () => {
    frame = 0;
    const next = readViewportState();
    const signature = JSON.stringify(next);
    if (signature !== last) {
      last = signature;
      onChange(next);
    }
  };

  const schedule = () => {
    if (frame) {
      return;
    }
    frame = window.requestAnimationFrame(emit);
  };

  const resizeObserver = new ResizeObserver(schedule);
  if (document.documentElement) {
    resizeObserver.observe(document.documentElement);
  }
  if (document.body) {
    resizeObserver.observe(document.body);
  }

  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true
  });

  window.addEventListener("scroll", schedule, { passive: true, capture: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule, { passive: true });
  window.visualViewport?.addEventListener("scroll", schedule, { passive: true });

  emit();

  return () => {
    if (frame) {
      window.cancelAnimationFrame(frame);
    }
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("scroll", schedule);
  };
}
