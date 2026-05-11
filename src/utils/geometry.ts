import { AnnotationShape, BoxAnnotation, PathAnnotation, SegmentAnnotation } from "../types/annotations";

export function normalizeBox<T extends BoxAnnotation>(shape: T): T {
  const next = { ...shape };
  if (next.width < 0) {
    next.x += next.width;
    next.width = Math.abs(next.width);
  }
  if (next.height < 0) {
    next.y += next.height;
    next.height = Math.abs(next.height);
  }
  return next;
}

export function isBoxShape(shape: AnnotationShape): shape is BoxAnnotation {
  return ["rectangle", "square", "ellipse", "circle", "triangle"].includes(shape.type);
}

export function isPointShape(shape: AnnotationShape): shape is PathAnnotation {
  return shape.type === "path" || shape.type === "highlight";
}

export function isSegmentShape(shape: AnnotationShape): shape is SegmentAnnotation {
  return shape.type === "line" || shape.type === "arrow";
}

export function shapeBounds(shape: AnnotationShape) {
  if (isBoxShape(shape) || isSegmentShape(shape)) {
    return {
      left: Math.min(shape.x, shape.x + shape.width),
      top: Math.min(shape.y, shape.y + shape.height),
      right: Math.max(shape.x, shape.x + shape.width),
      bottom: Math.max(shape.y, shape.y + shape.height)
    };
  }

  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index < shape.points.length; index += 2) {
    xs.push(shape.x + shape.points[index]);
    ys.push(shape.y + shape.points[index + 1]);
  }

  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys)
  };
}

export function isPointNearShape(shape: AnnotationShape, x: number, y: number, radius: number): boolean {
  const bounds = shapeBounds(shape);
  if (
    x < bounds.left - radius ||
    x > bounds.right + radius ||
    y < bounds.top - radius ||
    y > bounds.bottom + radius
  ) {
    return false;
  }

  if (isPointShape(shape)) {
    for (let index = 0; index < shape.points.length - 2; index += 2) {
      const ax = shape.x + shape.points[index];
      const ay = shape.y + shape.points[index + 1];
      const bx = shape.x + shape.points[index + 2];
      const by = shape.y + shape.points[index + 3];
      if (distanceToSegment(x, y, ax, ay, bx, by) <= radius + shape.strokeWidth / 2) {
        return true;
      }
    }
    return false;
  }

  if (isSegmentShape(shape)) {
    return distanceToSegment(x, y, shape.x, shape.y, shape.x + shape.width, shape.y + shape.height) <= radius + shape.strokeWidth / 2;
  }

  return true;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
