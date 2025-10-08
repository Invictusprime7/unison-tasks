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
import { AITemplateGenerator } from "./AITemplateGenerator";
import { ElementsPanel, type DesignElement } from "./design-studio/ElementsPanel";
import { DesignSidebar } from "./DesignSidebar";
import { MobileToolbar } from "./MobileToolbar";
import { TemplateDebugPanel } from "./design-studio/TemplateDebugPanel";
import { TemplateErrorBoundary } from "../TemplateErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { TemplateRenderer } from "@/utils/templateRenderer";
import { HTMLExporter } from "@/utils/htmlExporter";
import { validateTemplateStrict } from "@/utils/zodTemplateValidator";
import { templateToDocument, extractTemplateAssets } from "@/utils/templateAdapter";
import { preloadAssets } from "@/utils/assetPreloader";
import type { AIGeneratedTemplate } from "@/types/template";
import { Polygon } from "fabric";

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
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  
  // Debug mode - check URL parameter
  const [debugMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('debugTemplates');
  });
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Template renderer and exporter
  const templateRendererRef = useRef<TemplateRenderer | null>(null);
  const htmlExporterRef = useRef<HTMLExporter>(new HTMLExporter());
  
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
  
  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [cropTarget, setCropTarget] = useState<any>(null);
  
  // Autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize canvas with responsive sizing
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const maxWidth = Math.min(960, container.clientWidth);
    const maxHeight = Math.min(540, container.clientHeight);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: maxWidth,
      height: maxHeight,
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
      if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateSelected();
      }
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.key === "y" || e.key === "Y") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
      }
      // Also support Ctrl+Shift+Z for redo
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Canvas is now fixed size, no resize observer needed

    // Initialize template renderer
    templateRendererRef.current = new TemplateRenderer(canvas);

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
            pushHistory();
            toast({ title: "Image added" });
          });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Add element from Elements Panel
  const addElementToCanvas = (element: DesignElement) => {
    if (!fabricCanvas) return;
    const center = getCenterPosition();

    switch (element.type) {
      case 'frame':
        addFrame(element, center);
        break;
      case 'grid':
        addGrid(element, center);
        break;
      case 'shape':
        addShape(element, center);
        break;
      case 'mockup':
        addMockup(element, center);
        break;
    }
    
    pushHistory();
  };

  const addFrame = (element: DesignElement, center: { left: number; top: number }) => {
    if (!fabricCanvas) return;
    
    if (element.variant.includes('circle')) {
      const circle = new Circle({
        ...element.config,
        left: center.left - element.config.radius,
        top: center.top - element.config.radius,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else {
      const rect = new Rect({
        ...element.config,
        left: center.left - element.config.width / 2,
        top: center.top - element.config.height / 2,
        rx: element.config.borderRadius,
        ry: element.config.borderRadius,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    }
    
    fabricCanvas.renderAll();
    toast({ title: `${element.name} added` });
  };

  const addGrid = (element: DesignElement, center: { left: number; top: number }) => {
    if (!fabricCanvas) return;
    
    const { rows, cols, gap, cellWidth, cellHeight } = element.config;
    const totalWidth = cols * cellWidth + (cols - 1) * gap;
    const totalHeight = rows * cellHeight + (rows - 1) * gap;
    const startX = center.left - totalWidth / 2;
    const startY = center.top - totalHeight / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const rect = new Rect({
          left: startX + col * (cellWidth + gap),
          top: startY + row * (cellHeight + gap),
          width: cellWidth,
          height: cellHeight,
          fill: '#f3f4f6',
          stroke: '#9ca3af',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        });
        fabricCanvas.add(rect);
      }
    }
    
    fabricCanvas.renderAll();
    toast({ title: `${element.name} added` });
  };

  const addShape = (element: DesignElement, center: { left: number; top: number }) => {
    if (!fabricCanvas) return;

    if (element.variant === 'circle') {
      const circle = new Circle({
        ...element.config,
        left: center.left - element.config.radius,
        top: center.top - element.config.radius,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (element.variant === 'rectangle') {
      const rect = new Rect({
        ...element.config,
        left: center.left - element.config.width / 2,
        top: center.top - element.config.height / 2,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (element.variant === 'triangle') {
      const points = [
        { x: 0, y: -element.config.height / 2 },
        { x: -element.config.width / 2, y: element.config.height / 2 },
        { x: element.config.width / 2, y: element.config.height / 2 },
      ];
      const triangle = new Polygon(points, {
        left: center.left,
        top: center.top,
        fill: element.config.fill,
        stroke: element.config.stroke,
        strokeWidth: element.config.strokeWidth,
      });
      fabricCanvas.add(triangle);
      fabricCanvas.setActiveObject(triangle);
    } else if (element.variant === 'star') {
      const starPoints = createStarPoints(5, element.config.outerRadius, element.config.innerRadius);
      const star = new Polygon(starPoints, {
        left: center.left,
        top: center.top,
        fill: element.config.fill,
        stroke: element.config.stroke,
        strokeWidth: element.config.strokeWidth,
      });
      fabricCanvas.add(star);
      fabricCanvas.setActiveObject(star);
    } else if (element.variant === 'hexagon') {
      const hexPoints = createRegularPolygonPoints(6, element.config.radius);
      const hex = new Polygon(hexPoints, {
        left: center.left,
        top: center.top,
        fill: element.config.fill,
        stroke: element.config.stroke,
        strokeWidth: element.config.strokeWidth,
      });
      fabricCanvas.add(hex);
      fabricCanvas.setActiveObject(hex);
    }
    
    fabricCanvas.renderAll();
    toast({ title: `${element.name} added` });
  };

  const createStarPoints = (points: number, outerRadius: number, innerRadius: number) => {
    const starPoints = [];
    const angle = Math.PI / points;
    
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const currentAngle = i * angle - Math.PI / 2;
      starPoints.push({
        x: radius * Math.cos(currentAngle),
        y: radius * Math.sin(currentAngle),
      });
    }
    
    return starPoints;
  };

  const createRegularPolygonPoints = (sides: number, radius: number) => {
    const points = [];
    const angle = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
      const currentAngle = i * angle - Math.PI / 2;
      points.push({
        x: radius * Math.cos(currentAngle),
        y: radius * Math.sin(currentAngle),
      });
    }
    
    return points;
  };

  const addMockup = (element: DesignElement, center: { left: number; top: number }) => {
    if (!fabricCanvas) return;

    const mockup = new Rect({
      ...element.config,
      left: center.left - element.config.width / 2,
      top: center.top - element.config.height / 2,
      rx: element.config.borderRadius,
      ry: element.config.borderRadius,
    });
    
    // Add screen area inside mockup
    const screenPadding = 20;
    const screen = new Rect({
      left: mockup.left! + screenPadding,
      top: mockup.top! + screenPadding,
      width: element.config.width - screenPadding * 2,
      height: element.config.height - screenPadding * 2,
      fill: '#ffffff',
      rx: element.config.borderRadius - 5,
      ry: element.config.borderRadius - 5,
    });
    
    fabricCanvas.add(mockup);
    fabricCanvas.add(screen);
    fabricCanvas.setActiveObject(mockup);
    fabricCanvas.renderAll();
    toast({ title: `${element.name} added` });
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
    selectedObject.setCoords();
    fabricCanvas.requestRenderAll();
    // Create a fresh reference to trigger re-render without losing focus
    setSelectedObject({ ...selectedObject, [property]: value });
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

  // Cropping functions
  const startCrop = () => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== "image") {
      toast({ title: "Please select an image to crop", variant: "destructive" });
      return;
    }
    
    setIsCropping(true);
    setCropTarget(selectedObject);
    
    // Store original dimensions
    selectedObject.set({
      cropX: 0,
      cropY: 0,
    });
    
    fabricCanvas.renderAll();
    toast({ title: "Crop mode enabled", description: "Resize the image to crop. Click 'Apply Crop' when done." });
  };

  const applyCrop = () => {
    if (!fabricCanvas || !cropTarget) return;
    
    const img = cropTarget;
    const scaleX = img.scaleX || 1;
    const scaleY = img.scaleY || 1;
    
    // Get the current crop rectangle
    const cropX = img.cropX || 0;
    const cropY = img.cropY || 0;
    const cropWidth = img.width * scaleX;
    const cropHeight = img.height * scaleY;
    
    // Create a new canvas element for cropping
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    const imgElement = img.getElement();
    ctx.drawImage(
      imgElement,
      cropX, cropY,
      cropWidth / scaleX, cropHeight / scaleY,
      0, 0,
      cropWidth, cropHeight
    );
    
    // Create new fabric image from cropped canvas
    FabricImage.fromURL(canvas.toDataURL()).then((newImg) => {
      newImg.set({
        left: img.left,
        top: img.top,
        scaleX: 1,
        scaleY: 1,
      });
      
      fabricCanvas.remove(img);
      fabricCanvas.add(newImg);
      fabricCanvas.setActiveObject(newImg);
      fabricCanvas.renderAll();
      
      setIsCropping(false);
      setCropTarget(null);
      pushHistory();
      toast({ title: "Image cropped successfully" });
    });
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCropTarget(null);
    toast({ title: "Crop cancelled" });
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

  // AI Template handlers with robust validation and error boundary
  const handleAITemplateGenerated = async (rawTemplate: any) => {
    if (!fabricCanvas) {
      toast({ 
        title: "Error", 
        description: "Canvas not initialized",
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const layoutStart = performance.now();
      
      // Step 1: Validate using Zod schema
      console.log('[DesignStudio] Validating AI template with Zod...');
      const validation = validateTemplateStrict(rawTemplate, debugMode);
      
      if (!validation.success) {
        setDebugInfo({
          parseResult: {
            success: false,
            errors: validation.errors,
          },
          assets: [],
        });
        
        toast({ 
          title: "Template Validation Failed", 
          description: validation.errors?.[0] || 'Invalid template structure',
          variant: "destructive" 
        });
        return;
      }
      
      const template = validation.data!;
      
      // Step 2: Extract and preload assets
      console.log('[DesignStudio] Preloading template assets...');
      const assetUrls = extractTemplateAssets(template);
      const assetsStatus = await preloadAssets(assetUrls);
      
      // Step 3: Compute layout
      console.log('[DesignStudio] Converting template to document...');
      const document = templateToDocument(template);
      
      const layoutEnd = performance.now();
      
      // Update debug info
      setDebugInfo({
        parseResult: {
          success: true,
          autoFilled: validation.autoFilled,
        },
        layoutTiming: {
          start: layoutStart,
          end: layoutEnd,
          duration: Math.round(layoutEnd - layoutStart),
        },
        assets: assetUrls.map(url => {
          const status = assetsStatus.find(a => a.url === url);
          return {
            url,
            status: status?.status || 'pending',
            size: status?.size,
          };
        }),
        template,
      });
      
      // Step 4: Render to canvas using new Fabric renderer
      console.log('[DesignStudio] Rendering AI template to canvas:', template.name);
      const { FabricTemplateRenderer } = await import('@/utils/fabricTemplateRenderer');
      const renderer = new FabricTemplateRenderer(fabricCanvas);
      await renderer.renderTemplate(template);
      
      setCurrentTemplateId(template.id || null);
      pushHistory();
      
      toast({ 
        title: "AI Template Loaded Successfully", 
        description: `${template.name} rendered with ${template.frames.length} frame(s)`,
      });
    } catch (error) {
      console.error('[DesignStudio] Error rendering AI template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setDebugInfo(prev => ({
        ...prev,
        parseResult: {
          success: false,
          errors: [errorMessage],
        },
      }));
      
      toast({ 
        title: "Template Rendering Failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const exportToHTML = () => {
    if (!htmlExporterRef.current) return;
    
    // For now, export current canvas as static template
    const mockTemplate: AIGeneratedTemplate = {
      id: currentTemplateId || "export-" + Date.now(),
      name: "Exported Template",
      description: "Canvas export",
      brandKit: {
        primaryColor: "#3b82f6",
        secondaryColor: "#1e40af",
        accentColor: "#06b6d4",
        fonts: { heading: "Arial", body: "Arial", accent: "Arial" }
      },
      sections: [],
      variants: [{ id: "v1", name: "Web", size: { width: 960, height: 540 }, format: "web" }],
      data: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const html = htmlExporterRef.current.exportToHTML(mockTemplate);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template.html";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "HTML exported successfully" });
  };

  const exportToReact = () => {
    if (!htmlExporterRef.current) return;
    
    const mockTemplate: AIGeneratedTemplate = {
      id: currentTemplateId || "export-" + Date.now(),
      name: "ExportedTemplate",
      description: "Canvas export",
      brandKit: {
        primaryColor: "#3b82f6",
        secondaryColor: "#1e40af",
        accentColor: "#06b6d4",
        fonts: { heading: "Arial", body: "Arial", accent: "Arial" }
      },
      sections: [],
      variants: [{ id: "v1", name: "Web", size: { width: 960, height: 540 }, format: "web" }],
      data: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const reactCode = htmlExporterRef.current.exportToReact(mockTemplate);
    const blob = new Blob([reactCode], { type: "text/tsx" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template.tsx";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "React component exported successfully" });
  };

  const loadTemplateInGrapeJS = (htmlCode: string, cssCode?: string) => {
    // This will be called from the parent component
    // We'll store the template code to pass to GrapeJS editor
    return { html: htmlCode, css: cssCode || "" };
  };

  useImperativeHandle(ref, () => ({
    addImageFromUrl,
    loadTemplateInGrapeJS,
  }));

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Top Toolbar - Responsive */}
      <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 border-b border-slate-800 bg-slate-900 overflow-x-auto">
        <div className="flex items-center gap-1 md:gap-2 min-w-fit">
          <span className="font-semibold text-xs md:text-sm whitespace-nowrap">Design Studio</span>
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0} className="h-7 md:h-8 px-1.5 md:px-2 text-xs">
            Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={redoStack.length === 0} className="h-7 md:h-8 px-1.5 md:px-2 text-xs">
            Redo
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1 md:gap-2 flex-wrap">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAIGenerator(true)} 
            className="h-7 md:h-8 px-2 md:px-3 text-xs bg-purple-600 hover:bg-purple-500 text-white whitespace-nowrap"
          >
            AI Generate
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCanvas} className="h-7 md:h-8 px-2 md:px-3 text-xs bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap">
            Export PNG
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCanvasJPEG} className="hidden sm:inline-flex h-7 md:h-8 px-2 md:px-3 text-xs whitespace-nowrap">
            JPEG
          </Button>
          <Button variant="ghost" size="sm" onClick={exportToHTML} className="hidden md:inline-flex h-7 md:h-8 px-2 md:px-3 text-xs whitespace-nowrap">
            HTML
          </Button>
          <Button variant="ghost" size="sm" onClick={exportToReact} className="hidden lg:inline-flex h-7 md:h-8 px-2 md:px-3 text-xs whitespace-nowrap">
            React
          </Button>
        </div>
      </div>

      {/* Work Area - Responsive Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] overflow-hidden">
        {/* Left Sidebar - Elements & Layers (Collapsible on mobile) */}
        <aside className="hidden lg:flex border-r border-slate-800 bg-slate-950/40 overflow-hidden flex-col">
          <DesignSidebar
            onElementSelect={addElementToCanvas}
            onElementDragStart={(element) => {
              if (fabricCanvas) {
                (fabricCanvas as any)._pendingElement = element;
              }
            }}
            onAddText={addText}
            onAddRectangle={addRectangle}
            onAddCircle={addCircle}
            onAddImage={addImage}
            onDuplicate={duplicateSelected}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onDelete={deleteSelected}
            selectedObject={selectedObject}
            layers={fabricCanvas?.getObjects() || []}
            onLayerSelect={(obj) => {
              if (fabricCanvas) {
                fabricCanvas.setActiveObject(obj);
                fabricCanvas.renderAll();
                setSelectedObject(obj);
              }
            }}
            isCropping={isCropping}
            onApplyCrop={applyCrop}
            onCancelCrop={cancelCrop}
          />
        </aside>


        {/* Canvas Center - Responsive */}
        <main className="relative bg-slate-900 flex items-center justify-center overflow-auto p-2 md:p-4">
          <div
            ref={containerRef}
            className="bg-white rounded-lg shadow-lg relative mx-auto"
            style={{ 
              width: 'min(960px, 100%)',
              height: 'min(540px, calc(100vh - 200px))',
              maxWidth: '100%',
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </main>

        {/* Right Sidebar - Properties & Filters (Hidden on smaller screens) */}
        <aside className="hidden xl:flex border-l border-slate-800 bg-slate-950/40 overflow-hidden flex-col">
          <Tabs defaultValue="properties" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900">
              <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
              <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="flex-1 overflow-y-auto m-0">
              <PropertiesPanel
                selectedObject={selectedObject}
                onPropertyChange={handlePropertyChange}
                onStartCrop={startCrop}
                onRemoveBackground={removeBackground}
                onAlign={alignObjects}
              />
            </TabsContent>
            <TabsContent value="filters" className="flex-1 overflow-y-auto m-0">
              <FiltersPanel
                selectedObject={selectedObject}
                onApplyFilter={applyFilter}
                onResetFilters={resetFilters}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>


      {/* Mobile Floating Toolbar */}
      <MobileToolbar
        onElementSelect={addElementToCanvas}
        onElementDragStart={(element) => {
          if (fabricCanvas) {
            (fabricCanvas as any)._pendingElement = element;
          }
        }}
        onAddText={addText}
        onAddRectangle={addRectangle}
        onAddCircle={addCircle}
        onAddImage={addImage}
        onDuplicate={duplicateSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onDelete={deleteSelected}
        selectedObject={selectedObject}
        layers={fabricCanvas?.getObjects() || []}
        onLayerSelect={(obj) => {
          if (fabricCanvas) {
            fabricCanvas.setActiveObject(obj);
            fabricCanvas.renderAll();
            setSelectedObject(obj);
          }
        }}
        isCropping={isCropping}
        onApplyCrop={applyCrop}
        onCancelCrop={cancelCrop}
      />

      <TemplateLibrary
        open={showTemplateLibrary} 
        onOpenChange={setShowTemplateLibrary}
        onLoadTemplate={(data) => {
          if (fabricCanvas && data) {
            fabricCanvas.loadFromJSON(data, () => {
              fabricCanvas.renderAll();
              toast({ title: "Template loaded successfully" });
            });
          }
        }}
      />
      
      <SaveTemplateDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        canvasData={fabricCanvas?.toJSON() || null}
      />
      
      <VersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        templateId={currentTemplateId}
        onRestoreVersion={handleVersionRestore}
      />

      <TemplateErrorBoundary onReset={() => setDebugInfo(null)}>
        <AITemplateGenerator
          open={showAIGenerator}
          onOpenChange={setShowAIGenerator}
          onTemplateGenerated={handleAITemplateGenerated}
        />
      </TemplateErrorBoundary>

      <TemplateDebugPanel debugInfo={debugInfo} enabled={debugMode} />
    </div>
  );
});
