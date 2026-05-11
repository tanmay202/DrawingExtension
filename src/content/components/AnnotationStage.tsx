import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Arrow, Ellipse, Group, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { AnnotationShape, BoxAnnotation, PathAnnotation, SegmentAnnotation, Tool, ToolSettings, ViewportState } from "../../types/annotations";
import { createId } from "../../utils/id";
import { isBoxShape, isPointNearShape, isPointShape, isSegmentShape, normalizeBox, shapeBounds } from "../../utils/geometry";

export interface AnnotationStageHandle {
  exportOverlayPng: () => string | null;
}

interface AnnotationStageProps {
  active: boolean;
  tool: Tool;
  settings: ToolSettings;
  shapes: AnnotationShape[];
  selectedId: string | null;
  viewport: ViewportState;
  onCreate: (shape: AnnotationShape) => void;
  onUpdate: (shape: AnnotationShape) => void;
  onRemove: (ids: string[]) => void;
  onSelect: (id: string | null) => void;
}

interface Point {
  x: number;
  y: number;
}

Konva.pixelRatio = window.devicePixelRatio || 1;

export const AnnotationStage = forwardRef<AnnotationStageHandle, AnnotationStageProps>(function AnnotationStage(props, ref) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef(new Map<string, Konva.Node>());
  const drawStartRef = useRef<Point | null>(null);
  const erasedIdsRef = useRef<Set<string>>(new Set());
  const [draft, setDraft] = useState<AnnotationShape | null>(null);
  const [erasedIds, setErasedIds] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    exportOverlayPng: () => {
      const stage = stageRef.current;
      if (!stage) {
        return null;
      }

      return stage.toDataURL({
        mimeType: "image/png",
        pixelRatio: window.devicePixelRatio || 1
      });
    }
  }));

  useEffect(() => {
    Konva.pixelRatio = props.viewport.devicePixelRatio;
  }, [props.viewport.devicePixelRatio]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer || !props.selectedId) {
      transformer?.nodes([]);
      return;
    }

    const node = shapeRefs.current.get(props.selectedId);
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [props.selectedId, props.shapes]);

  const renderShapes = useMemo(() => {
    const viewportBounds = {
      left: props.viewport.scrollX - 160,
      top: props.viewport.scrollY - 160,
      right: props.viewport.scrollX + props.viewport.width + 160,
      bottom: props.viewport.scrollY + props.viewport.height + 160
    };

    return props.shapes.filter((shape) => {
      if (erasedIds.has(shape.id) || shape.id === props.selectedId) {
        return !erasedIds.has(shape.id);
      }

      const bounds = shapeBounds(shape);
      return (
        bounds.right >= viewportBounds.left &&
        bounds.left <= viewportBounds.right &&
        bounds.bottom >= viewportBounds.top &&
        bounds.top <= viewportBounds.bottom
      );
    });
  }, [erasedIds, props.selectedId, props.shapes, props.viewport.height, props.viewport.scrollX, props.viewport.scrollY, props.viewport.width]);

  const selectedShape = props.selectedId ? props.shapes.find((shape) => shape.id === props.selectedId && !erasedIds.has(shape.id)) : null;
  const visibleShapes = selectedShape ? [...renderShapes.filter((shape) => shape.id !== selectedShape.id), selectedShape] : renderShapes;
  const allShapes = draft ? [...visibleShapes, draft] : visibleShapes;

  function setShapeRef(id: string, node: Konva.Node | null) {
    if (node) {
      shapeRefs.current.set(id, node);
    } else {
      shapeRefs.current.delete(id);
    }
  }

  function pointerToDocument(): Point | null {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) {
      return null;
    }

    return {
      x: pointer.x + props.viewport.scrollX,
      y: pointer.y + props.viewport.scrollY
    };
  }

  function beginDrawing(point: Point) {
    const now = Date.now();
    const base = {
      id: createId(),
      x: point.x,
      y: point.y,
      stroke: props.tool === "highlight" ? props.settings.stroke : props.settings.stroke,
      strokeWidth: props.tool === "highlight" ? props.settings.strokeWidth * 2.2 : props.settings.strokeWidth,
      opacity: props.tool === "highlight" ? Math.min(0.55, props.settings.opacity * 0.42) : props.settings.opacity,
      createdAt: now,
      updatedAt: now
    };

    if (props.tool === "brush" || props.tool === "highlight") {
      setDraft({
        ...base,
        type: props.tool === "brush" ? "path" : "highlight",
        points: [0, 0],
        tension: 0.45
      });
      return;
    }

    if (["rectangle", "square", "ellipse", "circle", "triangle"].includes(props.tool)) {
      setDraft({
        ...base,
        type: props.tool as BoxAnnotation["type"],
        width: 0,
        height: 0,
        fill: "transparent"
      });
      return;
    }

    if (props.tool === "line" || props.tool === "arrow") {
      setDraft({
        ...base,
        type: props.tool,
        width: 0,
        height: 0
      });
    }
  }

  function updateDraft(point: Point) {
    setDraft((current) => {
      if (!current || !drawStartRef.current) {
        return current;
      }

      if (isPointShape(current)) {
        const nextX = point.x - current.x;
        const nextY = point.y - current.y;
        const lastX = current.points[current.points.length - 2];
        const lastY = current.points[current.points.length - 1];
        const minDistance = Math.max(0.8, current.strokeWidth * 0.14);
        if (Math.hypot(nextX - lastX, nextY - lastY) < minDistance) {
          return current;
        }

        const midpointX = (lastX + nextX) / 2;
        const midpointY = (lastY + nextY) / 2;
        return {
          ...current,
          points: [...current.points, midpointX, midpointY, nextX, nextY],
          updatedAt: Date.now()
        };
      }

      const dx = point.x - drawStartRef.current.x;
      const dy = point.y - drawStartRef.current.y;

      if (isBoxShape(current)) {
        if (current.type === "square" || current.type === "circle") {
          const size = Math.min(Math.abs(dx), Math.abs(dy));
          return {
            ...current,
            width: Math.sign(dx || 1) * size,
            height: Math.sign(dy || 1) * size,
            updatedAt: Date.now()
          };
        }

        return {
          ...current,
          width: dx,
          height: dy,
          updatedAt: Date.now()
        };
      }

      return {
        ...current,
        width: dx,
        height: dy,
        updatedAt: Date.now()
      };
    });
  }

  function finishDraft() {
    if (!draft) {
      return;
    }

    if (isPointShape(draft)) {
      if (draft.points.length >= 6) {
        props.onCreate(draft);
        props.onSelect(draft.id);
      }
    } else if (isBoxShape(draft)) {
      const next = normalizeBox(draft);
      if (Math.abs(next.width) >= 4 && Math.abs(next.height) >= 4) {
        props.onCreate(next);
        props.onSelect(next.id);
      }
    } else if (Math.hypot(draft.width, draft.height) >= 4) {
      props.onCreate(draft);
      props.onSelect(draft.id);
    }

    setDraft(null);
  }

  function eraseAt(point: Point) {
    const radius = Math.max(10, props.settings.strokeWidth * 1.4);
    let hit: AnnotationShape | undefined;
    for (let index = props.shapes.length - 1; index >= 0; index -= 1) {
      const shape = props.shapes[index];
      if (!erasedIdsRef.current.has(shape.id) && isPointNearShape(shape, point.x, point.y, radius)) {
        hit = shape;
        break;
      }
    }
    if (!hit) {
      return;
    }

    erasedIdsRef.current.add(hit.id);
    setErasedIds(new Set(erasedIdsRef.current));
    if (hit.id === props.selectedId) {
      props.onSelect(null);
    }
  }

  function handlePointerDown(event: KonvaEventObject<PointerEvent>) {
    if (!props.active) {
      return;
    }

    if (props.tool === "select") {
      if (event.target === stageRef.current) {
        props.onSelect(null);
      }
      return;
    }

    event.evt.preventDefault();
    const point = pointerToDocument();
    if (!point) {
      return;
    }

    drawStartRef.current = point;

    if (props.tool === "eraser") {
      erasedIdsRef.current = new Set();
      setErasedIds(new Set());
      eraseAt(point);
      return;
    }

    props.onSelect(null);
    beginDrawing(point);
  }

  function handlePointerMove(event: KonvaEventObject<PointerEvent>) {
    if (!props.active || !drawStartRef.current) {
      return;
    }

    event.evt.preventDefault();
    const point = pointerToDocument();
    if (!point) {
      return;
    }

    if (props.tool === "eraser") {
      eraseAt(point);
      return;
    }

    updateDraft(point);
  }

  function handlePointerUp() {
    if (!drawStartRef.current) {
      return;
    }

    if (props.tool === "eraser") {
      const ids = Array.from(erasedIdsRef.current);
      if (ids.length > 0) {
        props.onRemove(ids);
      }
      erasedIdsRef.current = new Set();
      setErasedIds(new Set());
    } else {
      finishDraft();
    }

    drawStartRef.current = null;
  }

  function updateFromDrag(shape: AnnotationShape, node: Konva.Node) {
    if (isBoxShape(shape) && (shape.type === "ellipse" || shape.type === "circle")) {
      props.onUpdate({
        ...shape,
        x: node.x() - shape.width / 2,
        y: node.y() - shape.height / 2,
        updatedAt: Date.now()
      });
      return;
    }

    props.onUpdate({
      ...shape,
      x: node.x(),
      y: node.y(),
      updatedAt: Date.now()
    });
  }

  function updateFromTransform(shape: AnnotationShape, node: Konva.Node) {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    if (isBoxShape(shape)) {
      const nextWidth = Math.max(4, shape.width * scaleX);
      const nextHeight = Math.max(4, shape.height * scaleY);
      if (shape.type === "ellipse" || shape.type === "circle") {
        props.onUpdate({
          ...shape,
          x: node.x() - nextWidth / 2,
          y: node.y() - nextHeight / 2,
          width: nextWidth,
          height: nextHeight,
          updatedAt: Date.now()
        });
        return;
      }

      props.onUpdate({
        ...shape,
        x: node.x(),
        y: node.y(),
        width: nextWidth,
        height: nextHeight,
        updatedAt: Date.now()
      });
      return;
    }

    if (isSegmentShape(shape)) {
      props.onUpdate({
        ...shape,
        x: node.x(),
        y: node.y(),
        width: shape.width * scaleX,
        height: shape.height * scaleY,
        updatedAt: Date.now()
      });
      return;
    }

    props.onUpdate({
      ...shape,
      x: node.x(),
      y: node.y(),
      points: shape.points.map((value, index) => value * (index % 2 === 0 ? scaleX : scaleY)),
      updatedAt: Date.now()
    });
  }

  function handleWheel(event: KonvaEventObject<WheelEvent>) {
    if (!props.active) {
      return;
    }

    event.evt.preventDefault();
    window.scrollBy({
      left: event.evt.deltaX,
      top: event.evt.deltaY,
      behavior: "auto"
    });
  }

  return (
    <div className={`annotation-stage ${props.active ? "is-active" : ""} ${props.tool === "select" ? "is-selecting" : ""}`}>
      <Stage
        ref={stageRef}
        width={props.viewport.width}
        height={props.viewport.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <Layer listening={props.active}>
          <Group x={-props.viewport.scrollX} y={-props.viewport.scrollY}>
            {allShapes.map((shape) => (
              <AnnotationNode
                key={shape.id}
                shape={shape}
                selected={shape.id === props.selectedId}
                active={props.active}
                tool={props.tool}
                setRef={setShapeRef}
                onSelect={() => props.onSelect(shape.id)}
                onDragEnd={(node) => updateFromDrag(shape, node)}
                onTransformEnd={(node) => updateFromTransform(shape, node)}
              />
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              borderEnabled={false}
              enabledAnchors={[]}
              anchorSize={0}
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
});

interface AnnotationNodeProps {
  shape: AnnotationShape;
  selected: boolean;
  active: boolean;
  tool: Tool;
  setRef: (id: string, node: Konva.Node | null) => void;
  onSelect: () => void;
  onDragEnd: (node: Konva.Node) => void;
  onTransformEnd: (node: Konva.Node) => void;
}

function AnnotationNode(props: AnnotationNodeProps) {
  const common = {
    ref: (node: Konva.Node | null) => props.setRef(props.shape.id, node),
    x: props.shape.x,
    y: props.shape.y,
    opacity: props.shape.opacity,
    stroke: props.shape.stroke,
    strokeWidth: props.shape.strokeWidth,
    lineCap: "round" as const,
    lineJoin: "round" as const,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    strokeScaleEnabled: false,
    listening: props.active && props.tool === "select",
    draggable: props.active && props.tool === "select" && props.selected,
    onPointerDown: (event: KonvaEventObject<PointerEvent>) => {
      if (props.active && props.tool === "select") {
        event.cancelBubble = true;
        props.onSelect();
      }
    },
    onDragEnd: (event: KonvaEventObject<DragEvent>) => props.onDragEnd(event.target),
    onTransformEnd: (event: KonvaEventObject<Event>) => props.onTransformEnd(event.target)
  };

  if (isPointShape(props.shape)) {
    return (
      <Line
        {...common}
        points={props.shape.points}
        tension={props.shape.tension}
        bezier={false}
        hitStrokeWidth={Math.max(18, props.shape.strokeWidth + 8)}
        globalCompositeOperation="source-over"
      />
    );
  }

  if (isSegmentShape(props.shape)) {
    const points = [0, 0, props.shape.width, props.shape.height];
    if (props.shape.type === "arrow") {
      return <Arrow {...common} points={points} pointerLength={14} pointerWidth={12} hitStrokeWidth={Math.max(18, props.shape.strokeWidth + 8)} />;
    }

    return <Line {...common} points={points} hitStrokeWidth={Math.max(18, props.shape.strokeWidth + 8)} />;
  }

  if (props.shape.type === "ellipse" || props.shape.type === "circle") {
    return (
      <Ellipse
        {...common}
        x={props.shape.x + props.shape.width / 2}
        y={props.shape.y + props.shape.height / 2}
        radiusX={Math.max(1, props.shape.width / 2)}
        radiusY={Math.max(1, props.shape.height / 2)}
        fill="transparent"
      />
    );
  }

  if (props.shape.type === "triangle") {
    return (
      <Line
        {...common}
        points={[props.shape.width / 2, 0, props.shape.width, props.shape.height, 0, props.shape.height]}
        closed
        fill="transparent"
      />
    );
  }

  return <Rect {...common} width={props.shape.width} height={props.shape.height} fill="transparent" />;
}
