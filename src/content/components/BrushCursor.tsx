import { useEffect, useState } from "react";
import { Tool, ToolSettings } from "../../types/annotations";

interface BrushCursorProps {
  active: boolean;
  tool: Tool;
  settings: ToolSettings;
}

export function BrushCursor({ active, tool, settings }: BrushCursorProps) {
  const [point, setPoint] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const move = (event: PointerEvent) => setPoint({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  if (!active || !["brush", "highlight", "eraser"].includes(tool)) {
    return null;
  }

  const size = tool === "eraser" ? Math.max(18, settings.strokeWidth * 1.6) : Math.max(6, settings.strokeWidth);

  return (
    <div
      className="brush-cursor"
      style={{
        width: size,
        height: size,
        transform: `translate(${point.x - size / 2}px, ${point.y - size / 2}px)`,
        background: tool === "eraser" ? "rgba(255, 111, 111, 0.16)" : `${settings.stroke}26`
      }}
    />
  );
}
