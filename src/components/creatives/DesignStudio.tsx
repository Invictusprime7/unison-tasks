import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Circle, IText, FabricImage } from "fabric";
import { useToast } from "@/hooks/use-toast";
import { CanvasToolbar } from "./design-studio/CanvasToolbar";
import { PropertiesPanel } from "./design-studio/PropertiesPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export const DesignStudio = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState("select");
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [strokeColor, setStrokeColor] = useState("#1e40af");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    // Selection events
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    // Enable drag and drop
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgElement = new Image();
            imgElement.src = event.target?.result as string;
            imgElement.onload = () => {
              FabricImage.fromURL(imgElement.src).then((img) => {
                img.scale(0.5);
                img.set({
                  left: e.offsetX,
                  top: e.offsetY,
                });
                canvas.add(img);
                canvas.renderAll();
                toast({
                  title: "Image added",
                  description: "Image has been added to the canvas",
                });
              });
            };
          };
          reader.readAsDataURL(file);
        }
      } else if (e.dataTransfer?.getData("text/plain")) {
        const imageUrl = e.dataTransfer.getData("text/plain");
        if (imageUrl.startsWith("http") || imageUrl.startsWith("data:image")) {
          FabricImage.fromURL(imageUrl).then((img) => {
            img.scale(0.5);
            img.set({
              left: e.offsetX,
              top: e.offsetY,
            });
            canvas.add(img);
            canvas.renderAll();
            toast({
              title: "Image added",
              description: "Image has been added to the canvas",
            });
          });
        }
      }
    };

    const canvasElement = canvas.getElement();
    canvasElement.addEventListener("dragover", handleDragOver);
    canvasElement.addEventListener("drop", handleDrop);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && canvas.getActiveObject()) {
        canvas.remove(canvas.getActiveObject()!);
        canvas.renderAll();
      }
      if (e.key === "d" && e.ctrlKey) {
        e.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (container) {
        canvas.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        canvas.renderAll();
      }
    });

    resizeObserver.observe(container);

    return () => {
      canvas.dispose();
      window.removeEventListener("keydown", handleKeyDown);
      canvasElement.removeEventListener("dragover", handleDragOver);
      canvasElement.removeEventListener("drop", handleDrop);
      resizeObserver.disconnect();
    };
  }, []);

  const addRectangle = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 2,
      width: 200,
      height: 150,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
    toast({ title: "Rectangle added" });
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 2,
      radius: 75,
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.renderAll();
    toast({ title: "Circle added" });
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new IText("Double click to edit", {
      left: 100,
      top: 100,
      fill: fillColor,
      fontSize: 24,
      fontFamily: "Arial",
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast({ title: "Text added" });
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fabricCanvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgElement = new Image();
        imgElement.src = event.target?.result as string;
        imgElement.onload = () => {
          FabricImage.fromURL(imgElement.src).then((img) => {
            img.scale(0.5);
            img.set({ left: 100, top: 100 });
            fabricCanvas.add(img);
            fabricCanvas.renderAll();
            toast({ title: "Image added" });
          });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
      toast({ title: "Object deleted" });
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast({ title: "Canvas cleared" });
  };

  const exportCanvas = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });
    const link = document.createElement("a");
    link.download = `design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast({ title: "Design exported", description: "Your design has been downloaded" });
  };

  const duplicateSelected = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: any) => {
        cloned.set({
          left: (activeObject.left || 0) + 20,
          top: (activeObject.top || 0) + 20,
        });
        fabricCanvas.add(cloned);
        fabricCanvas.setActiveObject(cloned);
        fabricCanvas.renderAll();
        toast({ title: "Object duplicated" });
      });
    }
  };

  const bringForward = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.bringObjectForward(activeObject);
      fabricCanvas.renderAll();
    }
  };

  const sendBackward = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.sendObjectBackwards(activeObject);
      fabricCanvas.renderAll();
    }
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.set(property, value);
    fabricCanvas.renderAll();
    setSelectedObject({ ...selectedObject });
  };

  return (
    <div className="h-full flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      
      <CanvasToolbar
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        onAddRectangle={addRectangle}
        onAddCircle={addCircle}
        onAddText={addText}
        onAddImage={addImage}
        onDelete={deleteSelected}
        onClear={clearCanvas}
        onExport={exportCanvas}
        onDuplicate={duplicateSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        fillColor={fillColor}
        onFillColorChange={setFillColor}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={75} minSize={50}>
          <div
            ref={containerRef}
            className="w-full h-full bg-muted/20 overflow-hidden relative"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          >
            <canvas ref={canvasRef} />
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground">
              💡 Drag & drop images from AI Image Editor or Files
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <PropertiesPanel
            selectedObject={selectedObject}
            onPropertyChange={handlePropertyChange}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
