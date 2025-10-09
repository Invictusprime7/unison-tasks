import { Canvas as FabricCanvas } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface WebPropertiesPanelProps {
  fabricCanvas: FabricCanvas | null;
  selectedObject: any;
  onUpdate: () => void;
}

export const WebPropertiesPanel = ({ fabricCanvas, selectedObject, onUpdate }: WebPropertiesPanelProps) => {
  const [properties, setProperties] = useState<any>({});

  useEffect(() => {
    if (selectedObject) {
      setProperties({
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
        opacity: selectedObject.opacity || 1,
        angle: Math.round(selectedObject.angle || 0),
      });
    }
  }, [selectedObject]);

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject) return;
    
    selectedObject.set(key, value);
    fabricCanvas?.renderAll();
    onUpdate();
    
    setProperties((prev: any) => ({ ...prev, [key]: value }));
  };

  if (!selectedObject) {
    return (
      <div className="w-64 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Select a component to view its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Properties</h3>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {selectedObject.blockData?.id || selectedObject.type || "Component"}
        </p>
      </div>

      {/* Properties */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  value={properties.left}
                  onChange={(e) => updateProperty("left", Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  value={properties.top}
                  onChange={(e) => updateProperty("top", Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          {selectedObject.width && selectedObject.height && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">W</Label>
                  <Input
                    type="number"
                    value={properties.width}
                    onChange={(e) => {
                      const newWidth = Number(e.target.value);
                      selectedObject.set("width", newWidth / (selectedObject.scaleX || 1));
                      fabricCanvas?.renderAll();
                      onUpdate();
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">H</Label>
                  <Input
                    type="number"
                    value={properties.height}
                    onChange={(e) => {
                      const newHeight = Number(e.target.value);
                      selectedObject.set("height", newHeight / (selectedObject.scaleY || 1));
                      fabricCanvas?.renderAll();
                      onUpdate();
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rotation */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rotation</Label>
            <Input
              type="number"
              value={properties.angle}
              onChange={(e) => updateProperty("angle", Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Opacity ({Math.round(properties.opacity * 100)}%)
            </Label>
            <Slider
              value={[properties.opacity]}
              onValueChange={([value]) => updateProperty("opacity", value)}
              max={1}
              step={0.01}
              className="py-4"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
