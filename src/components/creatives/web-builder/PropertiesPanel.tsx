import { Canvas as FabricCanvas } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface PropertiesPanelProps {
  fabricCanvas: FabricCanvas | null;
  selectedObject: any;
}

export const PropertiesPanel = ({ fabricCanvas, selectedObject }: PropertiesPanelProps) => {
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
    
    setProperties((prev: any) => ({ ...prev, [key]: value }));
  };

  if (!selectedObject) {
    return (
      <div className="w-72 bg-[#1a1a1a] border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white/90">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-sm text-white/30">
            Select a component to view properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-[#1a1a1a] border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90">Properties</h3>
        <p className="text-xs text-white/40 mt-1 capitalize">
          {selectedObject.blockData?.id || selectedObject.type || "Component"}
        </p>
      </div>

      {/* Properties */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <Label className="text-xs text-white/40 uppercase tracking-wider">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-white/60">X</Label>
                <Input
                  type="number"
                  value={properties.left}
                  onChange={(e) => updateProperty("left", Number(e.target.value))}
                  className="h-8 text-sm bg-white/5 border-white/10 text-white/90"
                />
              </div>
              <div>
                <Label className="text-xs text-white/60">Y</Label>
                <Input
                  type="number"
                  value={properties.top}
                  onChange={(e) => updateProperty("top", Number(e.target.value))}
                  className="h-8 text-sm bg-white/5 border-white/10 text-white/90"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          {selectedObject.width && selectedObject.height && (
            <div className="space-y-2">
              <Label className="text-xs text-white/40 uppercase tracking-wider">Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-white/60">W</Label>
                  <Input
                    type="number"
                    value={properties.width}
                    onChange={(e) => {
                      const newWidth = Number(e.target.value);
                      selectedObject.set("width", newWidth / (selectedObject.scaleX || 1));
                      fabricCanvas?.renderAll();
                    }}
                    className="h-8 text-sm bg-white/5 border-white/10 text-white/90"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/60">H</Label>
                  <Input
                    type="number"
                    value={properties.height}
                    onChange={(e) => {
                      const newHeight = Number(e.target.value);
                      selectedObject.set("height", newHeight / (selectedObject.scaleY || 1));
                      fabricCanvas?.renderAll();
                    }}
                    className="h-8 text-sm bg-white/5 border-white/10 text-white/90"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rotation */}
          <div className="space-y-2">
            <Label className="text-xs text-white/40 uppercase tracking-wider">Rotation</Label>
            <Input
              type="number"
              value={properties.angle}
              onChange={(e) => updateProperty("angle", Number(e.target.value))}
              className="h-8 text-sm bg-white/5 border-white/10 text-white/90"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <Label className="text-xs text-white/40 uppercase tracking-wider">
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
