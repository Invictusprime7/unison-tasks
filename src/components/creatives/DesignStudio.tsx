import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Rect, Circle, IText, FabricImage, Point } from "fabric";
import { useToast } from "@/hooks/use-toast";
import { CanvasToolbar } from "./design-studio/CanvasToolbar";
import { PropertiesPanel } from "./design-studio/PropertiesPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TemplateLibrary } from "./design-studio/TemplateLibrary";
import { SaveTemplateDialog } from "./design-studio/SaveTemplateDialog";
import { VersionHistory } from "./design-studio/VersionHistory";
import { supabase } from "@/integrations/supabase/client";

export const DesignStudio = forwardRef((props, ref) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState("select");
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [strokeColor, setStrokeColor] = useState("#1e40af");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#ffffff",
    });

    // Enable zoom with mouse wheel
    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Enable panning with Shift + drag or middle mouse button
    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      if ('button' in evt && (evt.button === 1 || (evt.button === 0 && evt.shiftKey))) {
        isPanning = true;
        canvas.selection = false;
        lastPosX = 'clientX' in evt ? evt.clientX : 0;
        lastPosY = 'clientY' in evt ? evt.clientY : 0;
        canvas.setCursor("grab");
      }
    });

    canvas.on("mouse:move", (opt) => {
      if (isPanning) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform!;
        const clientX = 'clientX' in evt ? evt.clientX : 0;
        const clientY = 'clientY' in evt ? evt.clientY : 0;
        vpt[4] += clientX - lastPosX;
        vpt[5] += clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = clientX;
        lastPosY = clientY;
        canvas.setCursor("grabbing");
      }
    });

    canvas.on("mouse:up", () => {
      canvas.setViewportTransform(canvas.viewportTransform!);
      isPanning = false;
      canvas.selection = true;
      canvas.setCursor("default");
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
                const scaleFactor = Math.min(canvas.width! / img.width!, canvas.height! / img.height!, 0.5);
                img.scale(scaleFactor);
                const zoom = canvas.getZoom();
                const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
                img.set({
                  left: (e.offsetX - vpt[4]) / zoom - (img.width! * scaleFactor) / 2,
                  top: (e.offsetY - vpt[5]) / zoom - (img.height! * scaleFactor) / 2,
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
      }
      
      // Handle URL drops (from file browser)
      const imageUrl = e.dataTransfer?.getData("text/plain");
      if (imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("data:image"))) {
        FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" }).then((img) => {
          const scaleFactor = Math.min(canvas.width! / img.width!, canvas.height! / img.height!, 0.5);
          img.scale(scaleFactor);
          const zoom = canvas.getZoom();
          const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
          img.set({
            left: (e.offsetX - vpt[4]) / zoom - (img.width! * scaleFactor) / 2,
            top: (e.offsetY - vpt[5]) / zoom - (img.height! * scaleFactor) / 2,
          });
          canvas.add(img);
          canvas.renderAll();
          toast({
            title: "Image added",
            description: "Image has been added to the canvas",
          });
        }).catch((error) => {
          console.error("Error loading image:", error);
          toast({
            title: "Error",
            description: "Failed to load image. Make sure the file storage bucket is public.",
            variant: "destructive",
          });
        });
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

  const getCenterPosition = () => {
    if (!fabricCanvas) return { left: 100, top: 100 };
    const zoom = fabricCanvas.getZoom();
    const vpt = fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    return {
      left: (fabricCanvas.width! / 2 - vpt[4]) / zoom,
      top: (fabricCanvas.height! / 2 - vpt[5]) / zoom,
    };
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;
    const center = getCenterPosition();
    const rect = new Rect({
      left: center.left - 100,
      top: center.top - 75,
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
    const center = getCenterPosition();
    const circle = new Circle({
      left: center.left - 75,
      top: center.top - 75,
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
    const center = getCenterPosition();
    const text = new IText("Double click to edit", {
      left: center.left - 100,
      top: center.top - 12,
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
            const center = getCenterPosition();
            const scaleFactor = Math.min(fabricCanvas.width! / img.width!, fabricCanvas.height! / img.height!, 0.5);
            img.scale(scaleFactor);
            img.set({ 
              left: center.left - (img.width! * scaleFactor) / 2, 
              top: center.top - (img.height! * scaleFactor) / 2 
            });
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

  const getCanvasData = () => {
    if (!fabricCanvas) return null;
    return fabricCanvas.toJSON();
  };

  const loadCanvasData = (canvasData: any) => {
    if (!fabricCanvas) return;
    fabricCanvas.loadFromJSON(canvasData, () => {
      fabricCanvas.renderAll();
      toast({ title: "Template loaded successfully" });
    });
  };

  const saveAsTemplate = () => {
    setShowSaveDialog(true);
  };

  const handleTemplateLoad = (canvasData: any) => {
    loadCanvasData(canvasData);
  };

  const handleVersionRestore = (canvasData: any) => {
    loadCanvasData(canvasData);
  };

  // Auto-save current state for version control
  const saveVersion = async () => {
    if (!fabricCanvas || !currentTemplateId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const canvasData = getCanvasData();
    
    // Get latest version number
    const { data: versions } = await supabase
      .from("template_versions")
      .select("version_number")
      .eq("template_id", currentTemplateId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    await supabase.from("template_versions").insert({
      template_id: currentTemplateId,
      version_number: nextVersion,
      canvas_data: canvasData,
      created_by: user.id,
    });

    toast({ title: "Version saved" });
  };

  const addImageFromUrl = async (imageUrl: string) => {
    if (!fabricCanvas) return;
    
    try {
      // For Supabase storage URLs, fetch as blob to avoid CORS issues
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const img = await FabricImage.fromURL(objectUrl);
      
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
      
      const center = getCenterPosition();
      const scaleFactor = Math.min(fabricCanvas.width! / img.width!, fabricCanvas.height! / img.height!, 0.5);
      img.scale(scaleFactor);
      img.set({
        left: center.left - (img.width! * scaleFactor) / 2,
        top: center.top - (img.height! * scaleFactor) / 2,
      });
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      toast({
        title: "Image added",
        description: "Image has been added to the canvas",
      });
    } catch (error) {
      console.error("Error loading image:", error);
      toast({
        title: "Error",
        description: "Failed to load image from storage",
        variant: "destructive",
      });
    }
  };

  useImperativeHandle(ref, () => ({
    addImageFromUrl,
  }));

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
        onSaveTemplate={saveAsTemplate}
        onOpenTemplates={() => setShowTemplateLibrary(true)}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        onSaveVersion={saveVersion}
        hasTemplate={!!currentTemplateId}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={75} minSize={50}>
          <ScrollArea className="h-full w-full">
            <div
              ref={containerRef}
              className="w-full h-full bg-muted/20 relative min-h-[800px] min-w-[1200px]"
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
                💡 Scroll to zoom | Shift+Drag to pan
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ScrollArea className="h-full">
            <PropertiesPanel
              selectedObject={selectedObject}
              onPropertyChange={handlePropertyChange}
            />
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      <TemplateLibrary
        open={showTemplateLibrary}
        onOpenChange={setShowTemplateLibrary}
        onLoadTemplate={handleTemplateLoad}
      />

      <SaveTemplateDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        canvasData={getCanvasData()}
      />

      <VersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        templateId={currentTemplateId}
        onRestoreVersion={handleVersionRestore}
      />
    </div>
  );
});
