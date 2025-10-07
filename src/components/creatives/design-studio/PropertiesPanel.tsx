import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Palette, Type as TypeIcon, Eraser, FlipHorizontal, FlipVertical, Crop, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignHorizontalJustifyStart, AlignHorizontalJustifyEnd } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

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

  // Sync local values when selectedObject changes
  useEffect(() => {
    if (selectedObject) {
      setLocalValues({
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
      });
    }
  }, [selectedObject?.left, selectedObject?.top, selectedObject?.width, selectedObject?.height, selectedObject?.scaleX, selectedObject?.scaleY]);

  const handleInputChange = useCallback((property: string, value: number) => {
    setLocalValues(prev => ({ ...prev, [property]: value }));
    
    if (property === 'width' && selectedObject?.width) {
      onPropertyChange("scaleX", value / selectedObject.width);
    } else if (property === 'height' && selectedObject?.height) {
      onPropertyChange("scaleY", value / selectedObject.height);
    } else {
      onPropertyChange(property, value);
    }
  }, [selectedObject, onPropertyChange]);

  if (!selectedObject) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Select an object to edit its properties
          </p>
          <div className="text-xs text-muted-foreground mt-4 space-y-2 p-4 bg-muted/20 rounded-lg">
            <p>💡 <strong>WYSIWYG Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Double-click text to edit inline</li>
              <li>Drag corners to resize</li>
              <li>Use toolbar colors for quick changes</li>
              <li>Press Delete to remove objects</li>
              <li>Ctrl+D to duplicate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>

          <TabsContent value="position" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="x-pos">X Position</Label>
                <Input
                  id="x-pos"
                  type="number"
                  value={localValues.left}
                  onChange={(e) => handleInputChange("left", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y-pos">Y Position</Label>
                <Input
                  id="y-pos"
                  type="number"
                  value={localValues.top}
                  onChange={(e) => handleInputChange("top", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={localValues.width}
                  onChange={(e) => handleInputChange("width", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={localValues.height}
                  onChange={(e) => handleInputChange("height", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotation">Rotation</Label>
                <span className="text-sm text-muted-foreground">{Math.round(selectedObject.angle || 0)}°</span>
              </div>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[selectedObject.angle || 0]}
                onValueChange={(value) => onPropertyChange("angle", value[0])}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="opacity">Opacity</Label>
                <span className="text-sm text-muted-foreground">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={1}
                value={[(selectedObject.opacity || 1) * 100]}
                onValueChange={(value) => onPropertyChange("opacity", value[0] / 100)}
                className="cursor-pointer"
              />
            </div>

            {selectedObject.type === "image" && (
              <div className="space-y-3 pb-4 border-b">
                <Label className="text-sm font-medium">Image Controls</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPropertyChange("flipX", !selectedObject.flipX)}
                    className="h-9 gap-2"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                    Flip H
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPropertyChange("flipY", !selectedObject.flipY)}
                    className="h-9 gap-2"
                  >
                    <FlipVertical className="h-4 w-4" />
                    Flip V
                  </Button>
                  {onStartCrop && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 h-9 gap-2"
                      onClick={onStartCrop}
                    >
                      <Crop className="h-4 w-4" />
                      Crop Image
                    </Button>
                  )}
                </div>
              </div>
            )}

            {onAlign && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Alignment</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => onAlign("left")} className="h-9 gap-1">
                    <AlignLeft className="h-4 w-4" />
                    Left
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("center-h")} className="h-9 gap-1">
                    <AlignCenter className="h-4 w-4" />
                    Center
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("right")} className="h-9 gap-1">
                    <AlignRight className="h-4 w-4" />
                    Right
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => onAlign("top")} className="h-9 gap-1">
                    <AlignHorizontalJustifyStart className="h-4 w-4 rotate-90" />
                    Top
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("center-v")} className="h-9 gap-1">
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                    Middle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAlign("bottom")} className="h-9 gap-1">
                    <AlignHorizontalJustifyEnd className="h-4 w-4 rotate-90" />
                    Bottom
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
                    <span className="text-sm text-muted-foreground">{selectedObject.strokeWidth || 0}px</span>
                  </div>
                  <Slider
                    id="stroke-width"
                    min={0}
                    max={20}
                    step={1}
                    value={[selectedObject.strokeWidth || 0]}
                    onValueChange={(value) => onPropertyChange("strokeWidth", value[0])}
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
                    <span className="text-sm text-muted-foreground">{selectedObject.fontSize || 20}px</span>
                  </div>
                  <Slider
                    id="font-size"
                    min={8}
                    max={200}
                    step={1}
                    value={[selectedObject.fontSize || 20]}
                    onValueChange={(value) => onPropertyChange("fontSize", value[0])}
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
