import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Rect, Circle, IText, FabricImage, Point, filters } from "fabric";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PropertiesPanel } from "./design-studio/PropertiesPanel";
import { FiltersPanel } from "./design-studio/FiltersPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  
  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  // Pages state
  const [pages, setPages] = useState([
    { id: "page-1", name: "Page 1", canvasData: null, thumbnail: undefined }
  ]);
  const [currentPageId, setCurrentPageId] = useState("page-1");
  
  // Grid and snap state
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  
  // Autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 960,
      height: 540,
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

    // Enable panning by dragging on empty canvas or middle mouse button
    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      const isMiddleButton = 'button' in evt && evt.button === 1;
      const isEmptyCanvasDrag = !opt.target && 'button' in evt && evt.button === 0;
      
      if (isMiddleButton || isEmptyCanvasDrag) {
        isPanning = true;
        canvas.selection = false;
        lastPosX = 'clientX' in evt ? evt.clientX : 0;
        lastPosY = 'clientY' in evt ? evt.clientY : 0;
        canvas.setCursor("grabbing");
        evt.preventDefault();
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
        pushHistory();
      }
      if (e.key === "d" && e.ctrlKey) {
        e.preventDefault();
        duplicateSelected();
      }
      if (e.key === "z" && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === "z" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Canvas is now fixed size, no resize observer needed

    return () => {
      canvas.dispose();
      window.removeEventListener("keydown", handleKeyDown);
      canvasElement.removeEventListener("dragover", handleDragOver);
      canvasElement.removeEventListener("drop", handleDrop);
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
    pushHistory();
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
    pushHistory();
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
    pushHistory();
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
      pushHistory();
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

  const exportCanvasJPEG = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: "jpeg",
      quality: 0.9,
      multiplier: 1,
    });
    const link = document.createElement("a");
    link.download = `design-${Date.now()}.jpg`;
    link.href = dataURL;
    link.click();
    toast({ title: "Design exported as JPEG", description: "Your design has been downloaded" });
  };

  const pushHistory = () => {
    if (!fabricCanvas) return;
    const state = JSON.stringify(fabricCanvas.toJSON());
    setHistory((prev) => [...prev, state]);
    setRedoStack([]);
  };

  const undo = () => {
    if (!fabricCanvas || history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, JSON.stringify(fabricCanvas.toJSON())]);
    fabricCanvas.loadFromJSON(JSON.parse(prev), () => {
      fabricCanvas.renderAll();
      toast({ title: "Undo" });
    });
    setHistory((h) => h.slice(0, -1));
  };

  const redo = () => {
    if (!fabricCanvas || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, JSON.stringify(fabricCanvas.toJSON())]);
    fabricCanvas.loadFromJSON(JSON.parse(next), () => {
      fabricCanvas.renderAll();
      toast({ title: "Redo" });
    });
    setRedoStack((r) => r.slice(0, -1));
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
        pushHistory();
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

  const removeBackground = (tolerance: number) => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== "image") return;

    const imgElement = selectedObject.getElement();
    if (!imgElement) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Auto-detect key color from top-left corner
    const keyR = data[0];
    const keyG = data[1];
    const keyB = data[2];

    // Apply chroma key
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - keyR, 2) +
        Math.pow(g - keyG, 2) +
        Math.pow(b - keyB, 2)
      );

      // If color is close to key color, make it transparent
      if (distance < tolerance * 2.55) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Update the image with the new canvas
    selectedObject.setSrc(canvas.toDataURL(), () => {
      fabricCanvas.renderAll();
      toast({
        title: "Background removed",
        description: "Adjust tolerance if needed for better results",
      });
    });
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

  // Alignment functions
  const alignObjects = (alignment: string) => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;

    const canvasWidth = fabricCanvas.width!;
    const canvasHeight = fabricCanvas.height!;

    switch (alignment) {
      case "left":
        activeObject.set({ left: 0 });
        break;
      case "center-h":
        activeObject.set({ left: (canvasWidth - (activeObject.width! * (activeObject.scaleX || 1))) / 2 });
        break;
      case "right":
        activeObject.set({ left: canvasWidth - (activeObject.width! * (activeObject.scaleX || 1)) });
        break;
      case "top":
        activeObject.set({ top: 0 });
        break;
      case "center-v":
        activeObject.set({ top: (canvasHeight - (activeObject.height! * (activeObject.scaleY || 1))) / 2 });
        break;
      case "bottom":
        activeObject.set({ top: canvasHeight - (activeObject.height! * (activeObject.scaleY || 1)) });
        break;
    }

    activeObject.setCoords();
    fabricCanvas.renderAll();
    pushHistory();
    toast({ title: "Object aligned" });
  };

  // Filter functions
  const applyFilter = (filterType: string, value: number) => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== "image") return;

    let filterInstance;
    switch (filterType) {
      case "brightness":
        filterInstance = new filters.Brightness({ brightness: value / 100 });
        break;
      case "contrast":
        filterInstance = new filters.Contrast({ contrast: value });
        break;
      case "saturation":
        filterInstance = new filters.Saturation({ saturation: value });
        break;
      default:
        return;
    }

    // Remove existing filter of the same type
    selectedObject.filters = selectedObject.filters?.filter((f: any) => f.type !== filterType) || [];
    selectedObject.filters.push(filterInstance);
    selectedObject.applyFilters();
    fabricCanvas.renderAll();
    setSelectedObject({ ...selectedObject });
  };

  const resetFilters = () => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== "image") return;
    selectedObject.filters = [];
    selectedObject.applyFilters();
    fabricCanvas.renderAll();
    setSelectedObject({ ...selectedObject });
    toast({ title: "Filters reset" });
  };

  // Pages functions
  const handlePageSelect = (pageId: string) => {
    if (!fabricCanvas) return;
    
    // Save current page data
    const currentPage = pages.find(p => p.id === currentPageId);
    if (currentPage) {
      const updatedPages = pages.map(p =>
        p.id === currentPageId
          ? { ...p, canvasData: fabricCanvas.toJSON(), thumbnail: fabricCanvas.toDataURL({ multiplier: 0.1 }) }
          : p
      );
      setPages(updatedPages);
    }

    // Load new page
    const newPage = pages.find(p => p.id === pageId);
    if (newPage?.canvasData) {
      fabricCanvas.loadFromJSON(newPage.canvasData, () => {
        fabricCanvas.renderAll();
      });
    } else {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
    }

    setCurrentPageId(pageId);
  };

  const addPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: `Page ${pages.length + 1}`,
      canvasData: null,
      thumbnail: undefined,
    };
    setPages([...pages, newPage]);
    handlePageSelect(newPage.id);
    toast({ title: "Page added" });
  };

  const deletePage = (pageId: string) => {
    if (pages.length === 1) {
      toast({ title: "Cannot delete", description: "At least one page is required" });
      return;
    }
    const updatedPages = pages.filter(p => p.id !== pageId);
    setPages(updatedPages);
    if (currentPageId === pageId) {
      handlePageSelect(updatedPages[0].id);
    }
    toast({ title: "Page deleted" });
  };

  const duplicatePage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    
    const newPage = {
      ...page,
      id: `page-${Date.now()}`,
      name: `${page.name} Copy`,
    };
    setPages([...pages, newPage]);
    toast({ title: "Page duplicated" });
  };

  const renamePage = (pageId: string, name: string) => {
    setPages(pages.map(p => p.id === pageId ? { ...p, name } : p));
  };

  // Autosave effect
  useEffect(() => {
    if (!fabricCanvas || !currentTemplateId) return;

    const autoSave = () => {
      saveVersion();
    };

    autosaveTimerRef.current = setInterval(autoSave, 30000); // Autosave every 30 seconds

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [fabricCanvas, currentTemplateId]);

  useImperativeHandle(ref, () => ({
    addImageFromUrl,
  }));

  return (
    <div className="w-full h-full min-h-screen bg-slate-900 text-slate-100 flex flex-col select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Top Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Design Studio</span>
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0} className="h-8 px-2 text-xs">
            Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={redoStack.length === 0} className="h-8 px-2 text-xs">
            Redo
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={exportCanvas} className="h-8 px-3 text-xs bg-cyan-600 hover:bg-cyan-500 text-white">
            Export PNG
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCanvasJPEG} className="h-8 px-3 text-xs">
            Export JPEG
          </Button>
        </div>
      </div>

      {/* Work Area: 3-column grid */}
      <div className="flex-1 grid grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Left Sidebar - Tools & Elements */}
        <aside className="border-r border-slate-800 p-3 bg-slate-950/40 flex flex-col gap-3 overflow-y-auto">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Add</div>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" onClick={addText} className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm">
                Text
              </Button>
              <Button variant="ghost" size="sm" onClick={addRectangle} className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm">
                Rectangle
              </Button>
              <Button variant="ghost" size="sm" onClick={addCircle} className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm">
                Ellipse
              </Button>
              <Button variant="ghost" size="sm" onClick={addImage} className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm">
                Upload Image
              </Button>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Layers</div>
            <div className="flex flex-col gap-1 max-h-64 overflow-auto pr-1">
              {fabricCanvas?.getObjects().map((obj: any, idx: number) => (
                <button
                  key={idx}
                  className={`text-left px-2 py-1.5 rounded border text-xs ${
                    selectedObject === obj
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => {
                    fabricCanvas.setActiveObject(obj);
                    fabricCanvas.renderAll();
                    setSelectedObject(obj);
                  }}
                >
                  {idx + 1}. {obj.type || "Object"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={duplicateSelected} className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 h-7">
                Duplicate
              </Button>
              <Button variant="ghost" size="sm" onClick={bringForward} className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 h-7">
                Forward
              </Button>
              <Button variant="ghost" size="sm" onClick={sendBackward} className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 h-7">
                Backward
              </Button>
              <Button variant="ghost" size="sm" onClick={deleteSelected} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-500 h-7 text-white">
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 leading-relaxed">
            <div className="space-y-1">
              <div>Wheel: Zoom</div>
              <div>Ctrl+Z / Ctrl+Shift+Z: Undo/Redo</div>
              <div>Ctrl+D: Duplicate</div>
              <div>Delete: Remove</div>
            </div>
          </div>
        </aside>

        {/* Canvas Center */}
        <main className="relative bg-slate-900 flex items-center justify-center overflow-hidden">
          <div
            ref={containerRef}
            className="bg-white rounded-lg shadow-lg relative"
            style={{ width: 960, height: 540 }}
          >
            <canvas ref={canvasRef} />
          </div>
        </main>

        {/* Right Sidebar - Inspector/Properties */}
        <aside className="border-l border-slate-800 p-3 bg-slate-950/40 overflow-y-auto">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-3">Properties</div>
          <Tabs defaultValue="properties" className="h-full flex flex-col">
            <TabsList className="w-full grid grid-cols-2 bg-slate-700">
              <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
              <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full">
                {selectedObject ? (
                  <PropertiesPanel
                    selectedObject={selectedObject}
                    onPropertyChange={handlePropertyChange}
                    onRemoveBackground={removeBackground}
                  />
                ) : (
                  <div className="text-slate-400 text-sm">Select an object to edit</div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="filters" className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full">
                {selectedObject && selectedObject.type === "image" ? (
                  <FiltersPanel
                    selectedObject={selectedObject}
                    onFilterChange={applyFilter}
                    onResetFilters={resetFilters}
                  />
                ) : (
                  <div className="text-slate-400 text-sm">Select an image to apply filters</div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

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
