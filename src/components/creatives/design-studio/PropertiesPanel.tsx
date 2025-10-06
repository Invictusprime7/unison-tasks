import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Palette, Type as TypeIcon, Eraser } from "lucide-react";
import { useState } from "react";

interface PropertiesPanelProps {
  selectedObject: any;
  onPropertyChange: (property: string, value: any) => void;
  onRemoveBackground?: (tolerance: number) => void;
}

export const PropertiesPanel = ({
  selectedObject,
  onPropertyChange,
  onRemoveBackground,
}: PropertiesPanelProps) => {
  const [chromaTolerance, setChromaTolerance] = useState(30);
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
                <Label htmlFor="x-pos">X</Label>
                <Input
                  id="x-pos"
                  type="number"
                  value={Math.round(selectedObject.left || 0)}
                  onChange={(e) =>
                    onPropertyChange("left", parseInt(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y-pos">Y</Label>
                <Input
                  id="y-pos"
                  type="number"
                  value={Math.round(selectedObject.top || 0)}
                  onChange={(e) =>
                    onPropertyChange("top", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={Math.round(
                    (selectedObject.width || 0) * (selectedObject.scaleX || 1)
                  )}
                  onChange={(e) => {
                    const newWidth = parseInt(e.target.value);
                    onPropertyChange("scaleX", newWidth / selectedObject.width);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={Math.round(
                    (selectedObject.height || 0) * (selectedObject.scaleY || 1)
                  )}
                  onChange={(e) => {
                    const newHeight = parseInt(e.target.value);
                    onPropertyChange(
                      "scaleY",
                      newHeight / selectedObject.height
                    );
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rotation">Rotation: {Math.round(selectedObject.angle || 0)}°</Label>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[selectedObject.angle || 0]}
                onValueChange={(value) => onPropertyChange("angle", value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opacity">Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%</Label>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={1}
                value={[(selectedObject.opacity || 1) * 100]}
                onValueChange={(value) => onPropertyChange("opacity", value[0] / 100)}
              />
            </div>
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
                  className="w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stroke">Stroke Color</Label>
              <div className="flex gap-2">
                <Input
                  id="stroke"
                  type="color"
                  value={selectedObject.stroke || "#000000"}
                  onChange={(e) => onPropertyChange("stroke", e.target.value)}
                  className="w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedObject.stroke || "#000000"}
                  onChange={(e) => onPropertyChange("stroke", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stroke-width">Stroke Width: {selectedObject.strokeWidth || 0}px</Label>
              <Slider
                id="stroke-width"
                min={0}
                max={20}
                step={1}
                value={[selectedObject.strokeWidth || 0]}
                onValueChange={(value) => onPropertyChange("strokeWidth", value[0])}
              />
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 mt-4">
            {selectedObject.type === "IText" || selectedObject.type === "Textbox" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size: {selectedObject.fontSize || 20}px</Label>
                  <Slider
                    id="font-size"
                    min={8}
                    max={200}
                    step={1}
                    value={[selectedObject.fontSize || 20]}
                    onValueChange={(value) => onPropertyChange("fontSize", value[0])}
                  />
                </div>

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
                  >
                    I
                  </Button>
                  <Button
                    variant={selectedObject.underline ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      onPropertyChange("underline", !selectedObject.underline)
                    }
                  >
                    U
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-align">Text Align</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedObject.textAlign === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPropertyChange("textAlign", "left")}
                    >
                      Left
                    </Button>
                    <Button
                      variant={selectedObject.textAlign === "center" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPropertyChange("textAlign", "center")}
                    >
                      Center
                    </Button>
                    <Button
                      variant={selectedObject.textAlign === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPropertyChange("textAlign", "right")}
                    >
                      Right
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a text object to edit text properties
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
