export type Tool =
  | "select"
  | "brush"
  | "eraser"
  | "rectangle"
  | "square"
  | "ellipse"
  | "circle"
  | "line"
  | "arrow"
  | "triangle"
  | "highlight";

export interface ToolSettings {
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface BaseAnnotation {
  id: string;
  type: Exclude<Tool, "select" | "brush" | "eraser"> | "path";
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  createdAt: number;
  updatedAt: number;
}

export interface PathAnnotation extends BaseAnnotation {
  type: "path" | "highlight";
  points: number[];
  tension: number;
}

export interface BoxAnnotation extends BaseAnnotation {
  type: "rectangle" | "square" | "ellipse" | "circle" | "triangle";
  width: number;
  height: number;
  fill?: string;
}

export interface SegmentAnnotation extends BaseAnnotation {
  type: "line" | "arrow";
  width: number;
  height: number;
}

export type AnnotationShape = PathAnnotation | BoxAnnotation | SegmentAnnotation;

export interface AnnotationDocument {
  version: 1;
  url: string;
  title: string;
  updatedAt: number;
  shapes: AnnotationShape[];
}

export interface ViewportState {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  documentWidth: number;
  documentHeight: number;
  devicePixelRatio: number;
}
