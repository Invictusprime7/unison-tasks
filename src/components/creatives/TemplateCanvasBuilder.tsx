import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricObject, Textbox, Rect, Circle as FabricCircle, Text } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon, 
  Move, 
  RotateCcw, 
  Copy, 
  Trash2, 
  Download,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface TemplateCanvasBuilderProps {
  template: {
    name: string;
    code: string;
    aesthetic: string;
  };
  onBack: () => void;
}

interface CanvasObject extends FabricObject {
  id?: string;
  name?: string;
}

export const TemplateCanvasBuilder: React.FC<TemplateCanvasBuilderProps> = ({
  template,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<CanvasObject | null>(null);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'shapes' | 'images' | 'layers'>('text');

  // Text properties
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState([20]);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('left');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('');

  // Shape properties
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState([2]);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff'
      });

      // Load template as background
      if (template.code) {
        const blob = new Blob([template.code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Create an iframe to render the template
        const iframe = document.createElement('iframe');
        iframe.style.width = '1200px';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        iframe.src = url;
        
        iframe.onload = () => {
          // Convert iframe to canvas using html2canvas-like approach
          // For now, we'll add a placeholder background
          fabricCanvas.backgroundColor = '#f8fafc';
          fabricCanvas.renderAll();
          URL.revokeObjectURL(url);
        };
      }

      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected?.[0] as CanvasObject;
        if (obj) {
          setSelectedObject(obj);
          updatePropertiesFromObject(obj);
        }
      });

      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected?.[0] as CanvasObject;
        if (obj) {
          setSelectedObject(obj);
          updatePropertiesFromObject(obj);
        }
      });

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      fabricCanvas.on('object:added', () => {
        updateObjectsList(fabricCanvas);
      });

      fabricCanvas.on('object:removed', () => {
        updateObjectsList(fabricCanvas);
      });

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [template.code]);

  const updatePropertiesFromObject = (obj: CanvasObject) => {
    if (obj.type === 'text' || obj.type === 'textbox') {
      const textObj = obj as Text;
      setTextContent(textObj.text || '');
      setFontSize([textObj.fontSize || 20]);
      setFontFamily(textObj.fontFamily || 'Arial');
      setTextColor(textObj.fill as string || '#000000');
      setTextAlign(textObj.textAlign || 'left');
      setFontWeight(String(textObj.fontWeight) || 'normal');
      setFontStyle(textObj.fontStyle || 'normal');
      setTextDecoration(textObj.underline ? 'underline' : '');
    } else {
      setFillColor((obj as any).fill as string || '#3B82F6');
      setStrokeColor((obj as any).stroke as string || '#000000');
      setStrokeWidth([(obj as any).strokeWidth || 2]);
    }
  };

  const updateObjectsList = (fabricCanvas: Canvas) => {
    const canvasObjects = fabricCanvas.getObjects() as CanvasObject[];
    setObjects([...canvasObjects]);
  };

  const addText = () => {
    if (!canvas) return;

    const text = new Textbox('Edit this text', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: fontSize[0],
      fontFamily: fontFamily,
      fill: textColor,
      textAlign: textAlign as any,
      fontWeight: fontWeight as any,
      fontStyle: fontStyle as any,
      underline: textDecoration === 'underline'
    });

    (text as CanvasObject).id = `text_${Date.now()}`;
    (text as CanvasObject).name = 'Text';

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    if (!canvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth[0]
    });

    (rect as CanvasObject).id = `rect_${Date.now()}`;
    (rect as CanvasObject).name = 'Rectangle';

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;

    const circle = new FabricCircle({
      left: 100,
      top: 100,
      radius: 50,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth[0]
    });

    (circle as CanvasObject).id = `circle_${Date.now()}`;
    (circle as CanvasObject).name = 'Circle';

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const updateSelectedText = () => {
    if (!canvas || !selectedObject || (selectedObject.type !== 'text' && selectedObject.type !== 'textbox')) return;

    const textObj = selectedObject as Text;
    (textObj as any).set({
      text: textContent,
      fontSize: fontSize[0],
      fontFamily: fontFamily,
      fill: textColor,
      textAlign: textAlign as any,
      fontWeight: fontWeight as any,
      fontStyle: fontStyle as any,
      underline: textDecoration === 'underline'
    });

    canvas.renderAll();
  };

  const updateSelectedShape = () => {
    if (!canvas || !selectedObject) return;

    (selectedObject as any).set({
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth[0]
    });

    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
  };

  const duplicateSelected = () => {
    if (!canvas || !selectedObject) return;

    (selectedObject as any).clone((cloned: CanvasObject) => {
      (cloned as any).set({
        left: ((cloned as any).left || 0) + 20,
        top: ((cloned as any).top || 0) + 20
      });
      cloned.id = `${selectedObject.type}_${Date.now()}`;
      cloned.name = `${selectedObject.name} Copy`;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  const bringToFront = () => {
    if (!canvas || !selectedObject) return;
    (selectedObject as any).bringToFront();
    canvas.renderAll();
  };

  const sendToBack = () => {
    if (!canvas || !selectedObject) return;
    (selectedObject as any).sendToBack();
    canvas.renderAll();
  };

  const exportCanvas = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });

    const link = document.createElement('a');
    link.download = `${template.name}_edited.png`;
    link.href = dataURL;
    link.click();

    toast.success('Canvas exported successfully!');
  };

  const selectObject = (obj: CanvasObject) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const toggleObjectVisibility = (obj: CanvasObject) => {
    if (!canvas) return;
    (obj as any).set('visible', !(obj as any).visible);
    canvas.renderAll();
    updateObjectsList(canvas);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Template
          </Button>
          <h2 className="text-lg font-semibold">Canvas Builder</h2>
          <p className="text-sm text-gray-500">Edit {template.name}</p>
        </div>

        {/* Tool Tabs */}
        <div className="p-4">
          <div className="flex gap-1 mb-4">
            <Button
              variant={activeTab === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('text')}
              className="flex-1"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTab === 'shapes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('shapes')}
              className="flex-1"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTab === 'images' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('images')}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTab === 'layers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('layers')}
              className="flex-1"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>

          {/* Text Tools */}
          {activeTab === 'text' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={addText} className="w-full">
                  <Type className="h-4 w-4 mr-2" />
                  Add Text
                </Button>

                {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="text-content">Content</Label>
                        <Input
                          id="text-content"
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          onBlur={updateSelectedText}
                        />
                      </div>

                      <div>
                        <Label>Font Size: {fontSize[0]}px</Label>
                        <Slider
                          value={fontSize}
                          onValueChange={setFontSize}
                          onValueCommit={updateSelectedText}
                          min={8}
                          max={200}
                          step={1}
                        />
                      </div>

                      <div>
                        <Label htmlFor="font-family">Font Family</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="text-color">Color</Label>
                        <Input
                          id="text-color"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          onBlur={updateSelectedText}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={textAlign === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setTextAlign('left');
                            updateSelectedText();
                          }}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={textAlign === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setTextAlign('center');
                            updateSelectedText();
                          }}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={textAlign === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setTextAlign('right');
                            updateSelectedText();
                          }}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold');
                            updateSelectedText();
                          }}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic');
                            updateSelectedText();
                          }}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={textDecoration === 'underline' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setTextDecoration(textDecoration === 'underline' ? '' : 'underline');
                            updateSelectedText();
                          }}
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shape Tools */}
          {activeTab === 'shapes' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shape Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={addRectangle} variant="outline">
                    <Square className="h-4 w-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button onClick={addCircle} variant="outline">
                    <Circle className="h-4 w-4 mr-2" />
                    Circle
                  </Button>
                </div>

                {selectedObject && selectedObject.type !== 'text' && selectedObject.type !== 'textbox' && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="fill-color">Fill Color</Label>
                        <Input
                          id="fill-color"
                          type="color"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          onBlur={updateSelectedShape}
                        />
                      </div>

                      <div>
                        <Label htmlFor="stroke-color">Stroke Color</Label>
                        <Input
                          id="stroke-color"
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          onBlur={updateSelectedShape}
                        />
                      </div>

                      <div>
                        <Label>Stroke Width: {strokeWidth[0]}px</Label>
                        <Slider
                          value={strokeWidth}
                          onValueChange={setStrokeWidth}
                          onValueCommit={updateSelectedShape}
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Image Tools */}
          {activeTab === 'images' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Image Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Layers Panel */}
          {activeTab === 'layers' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Layers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {objects.map((obj, index) => (
                    <div
                      key={obj.id || index}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        selectedObject === obj ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => selectObject(obj)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleObjectVisibility(obj);
                        }}
                      >
                        {(obj as any).visible === false ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="flex-1 text-sm truncate">
                        {obj.name || (obj as any).type || 'Object'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Object Actions */}
          {selectedObject && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Object Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={duplicateSelected}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={deleteSelected}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={bringToFront}>
                    ↑ Front
                  </Button>
                  <Button variant="outline" size="sm" onClick={sendToBack}>
                    ↓ Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{template.name}</h1>
              <span className="text-sm text-gray-500">- Canvas Builder</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportCanvas}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="mx-auto bg-white shadow-lg">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
};