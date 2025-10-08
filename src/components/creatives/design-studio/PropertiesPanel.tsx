import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Palette, Type as TypeIcon, Eraser, FlipHorizontal, FlipVertical, Crop, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignHorizontalJustifyStart, AlignHorizontalJustifyEnd } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

interface PropertiesPanelProps {
  selectedObject: any;
  onPropertyChange: (property: string, value: any) => void;
  onRemoveBackground?: (tolerance: number) => void;
  onStartCrop?: () => void;
  onAlign?: (alignment: string) => void;
}

export const PropertiesPanel = ({
  selectedObject,
  onPropertyChange,
  onRemoveBackground,
  onStartCrop,
  onAlign,
}: PropertiesPanelProps) => {
  const [chromaTolerance, setChromaTolerance] = useState(30);
  
  // Local state for smooth input updates
  const [localValues, setLocalValues] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  // Local slider states to avoid freeze and allow continuous updates
  const [rotation, setRotation] = useState(0);
  const [opacityVal, setOpacityVal] = useState(100); // 0-100 for UI
  const [strokeWidthVal, setStrokeWidthVal] = useState(0);
  const [fontSizeVal, setFontSizeVal] = useState(20);

  // rAF throttling per property to prevent excessive re-renders
  const rafIds = useRef<Record<string, number | null>>({});

  const schedulePropertyChange = useCallback((property: string, value: any) => {
    const id = rafIds.current[property];
    if (typeof id === "number") {
      cancelAnimationFrame(id);
    }
    rafIds.current[property] = requestAnimationFrame(() => {
      onPropertyChange(property, value);
      rafIds.current[property] = null;
    });
  }, [onPropertyChange]);

  // Cleanup any pending rAFs on unmount
  useEffect(() => {
    return () => {
      Object.values(rafIds.current).forEach((id) => {
        if (typeof id === "number") cancelAnimationFrame(id);
      });
    };
  }, []);

  // Sync local values when selectedObject changes
  useEffect(() => {
    if (selectedObject) {
      setLocalValues({
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
      });
      setRotation(Math.round(selectedObject.angle || 0));
      setOpacityVal(Math.round((selectedObject.opacity ?? 1) * 100));
      setStrokeWidthVal(Math.round(selectedObject.strokeWidth ?? 0));
      setFontSizeVal(Math.round(selectedObject.fontSize ?? 20));
    }
  }, [
    selectedObject?.left,
    selectedObject?.top,
    selectedObject?.width,
    selectedObject?.height,
    selectedObject?.scaleX,
    selectedObject?.scaleY,
    selectedObject?.angle,
    selectedObject?.opacity,
    selectedObject?.strokeWidth,
    selectedObject?.fontSize,
  ]);

  const handleInputChange = useCallback((property: string, value: number) => {
    setLocalValues(prev => ({ ...prev, [property]: value }));
    
    if (property === 'width' && selectedObject?.width) {
      schedulePropertyChange("scaleX", value / selectedObject.width);
    } else if (property === 'height' && selectedObject?.height) {
      schedulePropertyChange("scaleY", value / selectedObject.height);
    } else {
      schedulePropertyChange(property, value);
    }
  }, [selectedObject, schedulePropertyChange]);

  if (!selectedObject) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <Settings className="h-3 w-3" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-xs text-muted-foreground text-center py-4">
            Select an object to edit its properties
          </p>
          <div className="text-[10px] text-muted-foreground mt-2 space-y-1 p-2 bg-muted/20 rounded">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-1 text-[9px]">
              <li>Double-click text to edit</li>
              <li>Drag corners to resize</li>
              <li>Use toolbar colors</li>
              <li>Delete to remove</li>
              <li>Ctrl+D to duplicate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs">
          <Settings className="h-3 w-3" />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="position" className="text-[10px] px-1">Position</TabsTrigger>
            <TabsTrigger value="style" className="text-[10px] px-1">Style</TabsTrigger>
            <TabsTrigger value="text" className="text-[10px] px-1">Text</TabsTrigger>
          </TabsList>

          <TabsContent value="position" className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="x-pos" className="text-[10px]">X Position</Label>
                <Input
                  id="x-pos"
                  type="number"
                  value={localValues.left}
                  onChange={(e) => handleInputChange("left", parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="y-pos" className="text-[10px]">Y Position</Label>
                <Input
                  id="y-pos"
                  type="number"
                  value={localValues.top}
                  onChange={(e) => handleInputChange("top", parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="width" className="text-[10px]">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={localValues.width}
                  onChange={(e) => handleInputChange("width", parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height" className="text-[10px]">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={localValues.height}
                  onChange={(e) => handleInputChange("height", parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotation" className="text-[10px]">Rotation</Label>
                <span className="text-[10px] text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[rotation]}
                onValueChange={(value) => {
                  const v = value[0];
                  setRotation(v);
                  schedulePropertyChange("angle", v);
                }}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="opacity" className="text-[10px]">Opacity</Label>
                <span className="text-[10px] text-muted-foreground">{opacityVal}%</span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={1}
                value={[opacityVal]}
                onValueChange={(value) => {
                  const v = value[0];
                  setOpacityVal(v);
                  schedulePropertyChange("opacity", v / 100);
                }}
                className="cursor-pointer"
              />
            </div>

            {selectedObject.type === "image" && (
              <div className="space-y-2 pb-2 border-b">
                <Label className="text-[10px] font-medium">Image Controls</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPropertyChange("flipX", !selectedObject.flipX)}
                    className="h-7 gap-1 text-[10px] px-2"
                  >
                    <FlipHorizontal className="h-3 w-3" />
                    Flip H
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPropertyChange("flipY", !selectedObject.flipY)}
                    className="h-7 gap-1 text-[10px] px-2"
                  >
                    <FlipVertical className="h-3 w-3" />
                    Flip V
                  </Button>
                  {onStartCrop && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 h-7 gap-1 text-[10px]"
                      onClick={onStartCrop}
                    >
                      <Crop className="h-3 w-3" />
                      Crop Image
                    </Button>
                  )}
                </div>
              </div>
            )}

            {onAlign && (
              <div className="space-y-2">
                <Label className="text-[10px] font-medium">Alignment</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => onAlign("left")} className="h-7 gap-0.5 text-[10px] px-1">
                    <AlignLeft className="h-3 w-3" />
                    L
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("center-h")} className="h-7 gap-0.5 text-[10px] px-1">
                    <AlignCenter className="h-3 w-3" />
                    C
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("right")} className="h-7 gap-0.5 text-[10px] px-1">
                    <AlignRight className="h-3 w-3" />
                    R
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => onAlign("top")} className="h-7 gap-0.5 text-[10px] px-1">
                    <AlignHorizontalJustifyStart className="h-3 w-3 rotate-90" />
                    T
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("center-v")} className="h-7 gap-0.5 text-[10px] px-1">
                    <AlignVerticalJustifyCenter className="h-3 w-3" />
                    M
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("bottom")} className="h-7 gap-0.5 text-[10px] px-1">
                    <AlignHorizontalJustifyEnd className="h-3 w-3 rotate-90" />
                    B
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {selectedObject.type === "image" && onRemoveBackground && (
              <div className="space-y-4 pb-4 border-b">
                <Label>Background Removal</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onRemoveBackground(chromaTolerance)}
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Remove Background
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="chroma-tolerance">
                    Tolerance: {chromaTolerance}
                  </Label>
                  <Slider
                    id="chroma-tolerance"
                    min={0}
                    max={100}
                    step={1}
                    value={[chromaTolerance]}
                    onValueChange={(value) => setChromaTolerance(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Click the button to remove the background. Adjust tolerance for better results.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fill">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  id="fill"
                  type="color"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="w-16 h-9 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="flex-1 h-9"
                />
              </div>
            </div>

            {selectedObject.stroke !== undefined && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stroke">Stroke Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stroke"
                      type="color"
                      value={selectedObject.stroke || "#000000"}
                      onChange={(e) => onPropertyChange("stroke", e.target.value)}
                      className="w-16 h-9 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={selectedObject.stroke || "#000000"}
                      onChange={(e) => onPropertyChange("stroke", e.target.value)}
                      className="flex-1 h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stroke-width">Stroke Width</Label>
                    <span className="text-sm text-muted-foreground">{strokeWidthVal || 0}px</span>
                  </div>
                  <Slider
                    id="stroke-width"
                    min={0}
                    max={20}
                    step={1}
                    value={[strokeWidthVal || 0]}
                    onValueChange={(value) => {
                      const v = value[0];
                      setStrokeWidthVal(v);
                      schedulePropertyChange("strokeWidth", v);
                    }}
                    className="cursor-pointer"
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-4 mt-4">
            {selectedObject.type === "IText" || selectedObject.type === "Textbox" ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="font-size">Font Size</Label>
                    <span className="text-sm text-muted-foreground">{fontSizeVal || 20}px</span>
                  </div>
                  <Slider
                    id="font-size"
                    min={8}
                    max={200}
                    step={1}
                    value={[fontSizeVal || 20]}
                    onValueChange={(value) => {
                      const v = value[0];
                      setFontSizeVal(v);
                      schedulePropertyChange("fontSize", v);
                    }}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Text Style</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedObject.fontWeight === "bold" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        onPropertyChange(
                          "fontWeight",
                          selectedObject.fontWeight === "bold" ? "normal" : "bold"
                        )
                      }
                      className="h-9 w-full font-bold"
                    >
                      B
                    </Button>
                    <Button
                      variant={selectedObject.fontStyle === "italic" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        onPropertyChange(
                          "fontStyle",
                          selectedObject.fontStyle === "italic" ? "normal" : "italic"
                        )
                      }
                      className="h-9 w-full italic"
                    >
                      I
                    </Button>
                    <Button
                      variant={selectedObject.underline ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        onPropertyChange("underline", !selectedObject.underline)
                      }
                      className="h-9 w-full underline"
                    >
                      U
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-align">Text Alignment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={selectedObject.textAlign === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPropertyChange("textAlign", "left")}
                      className="h-9"
                    >
                      Left
                    </Button>
                    <Button
                      variant={selectedObject.textAlign === "center" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPropertyChange("textAlign", "center")}
                      className="h-9"
                    >
                      Center
                    </Button>
                    <Button
                      variant={selectedObject.textAlign === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPropertyChange("textAlign", "right")}
                      className="h-9"
                    >
                      Right
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select a text object to edit text properties
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
