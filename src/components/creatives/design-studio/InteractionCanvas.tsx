import { useEffect, useRef, useState } from "react";
import { RenderEngine } from "../rendering/RenderEngine";
import { Canvas2DRenderer } from "../rendering/Canvas2DRenderer";

interface InteractionCanvasProps {
  width: number;
  height: number;
  onSelectionChange?: (selectedIds: string[]) => void;
  onObjectTransform?: (id: string, transform: any) => void;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate';

export const InteractionCanvas = ({
  width,
  height,
  onSelectionChange,
  onObjectTransform
}: InteractionCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderEngine | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize rendering engine (Canvas2D for now, can be swapped with WebGL)
    const engine = new Canvas2DRenderer(canvasRef.current);
    engineRef.current = engine;

    // Initial render
    engine.render();

    return () => {
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resize(width, height);
    }
  }, [width, height]);

  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!engineRef.current) return;
    
    const pos = getMousePos(e);
    setDragStart(pos);

    // Check if clicking on a handle
    const bounds = engineRef.current.getSelectedBounds();
    if (bounds) {
      const handle = getHandleAtPoint(pos, bounds);
      if (handle) {
        setActiveHandle(handle);
        setIsDragging(true);
        return;
      }
    }

    // Otherwise, hit test for objects
    const hitId = engineRef.current.hitTest(pos.x, pos.y);
    if (hitId) {
      engineRef.current.selectObjects([hitId]);
      onSelectionChange?.([hitId]);
      setIsDragging(true);
    } else {
      engineRef.current.selectObjects([]);
      onSelectionChange?.([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !engineRef.current) return;

    const pos = getMousePos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (activeHandle) {
      // Handle resize/rotate
      handleTransformOperation(activeHandle, dx, dy);
    } else {
      // Handle move
      const bounds = engineRef.current.getSelectedBounds();
      if (bounds) {
        // Move selected objects
        const selectedIds = Array.from((engineRef.current as any).selectedIds) as string[];
        selectedIds.forEach((id: string) => {
          const obj = engineRef.current!.getObject(id);
          if (obj) {
            engineRef.current!.applyTransform(id, {
              x: obj.transform.x + dx,
              y: obj.transform.y + dy
            });
            onObjectTransform?.(id, { x: obj.transform.x + dx, y: obj.transform.y + dy });
          }
        });
      }
    }

    setDragStart(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  const getHandleAtPoint = (
    point: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): HandleType | null => {
    const handleSize = 8;
    const handles = [
      { type: 'nw' as HandleType, x: bounds.x, y: bounds.y },
      { type: 'ne' as HandleType, x: bounds.x + bounds.width, y: bounds.y },
      { type: 'sw' as HandleType, x: bounds.x, y: bounds.y + bounds.height },
      { type: 'se' as HandleType, x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { type: 'n' as HandleType, x: bounds.x + bounds.width / 2, y: bounds.y },
      { type: 's' as HandleType, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { type: 'e' as HandleType, x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { type: 'w' as HandleType, x: bounds.x, y: bounds.y + bounds.height / 2 },
      { type: 'rotate' as HandleType, x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
    ];

    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(point.x - handle.x, 2) + Math.pow(point.y - handle.y, 2)
      );
      if (distance <= handleSize) {
        return handle.type;
      }
    }

    return null;
  };

  const handleTransformOperation = (handle: HandleType, dx: number, dy: number) => {
    // Implementation for resize and rotate based on handle type
    console.log('Transform operation:', handle, dx, dy);
  };

  return (
    <div className="relative w-full h-full bg-muted/20">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-crosshair"
      />
    </div>
  );
};
