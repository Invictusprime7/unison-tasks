import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  Plus, Layout, Type, Square, Eye, Play,
  Monitor, Tablet, Smartphone, ZoomIn, ZoomOut,
  Sparkles, Code, Undo2, Redo2, Save, Keyboard
} from "lucide-react";
import { toast } from "sonner";
import { NavigationPanel } from "./web-builder/NavigationPanel";
import { ComponentsLibrary } from "./web-builder/ComponentsLibrary";
import { WebPropertiesPanel } from "./web-builder/WebPropertiesPanel";
import { AIAssistantPanel } from "./web-builder/AIAssistantPanel";
import { CodePreviewDialog } from "./web-builder/CodePreviewDialog";
import { webBlocks } from "./web-builder/webBlocks";
import { useKeyboardShortcuts, defaultWebBuilderShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebBuilderProps {
  initialHtml?: string;
  initialCss?: string;
  onSave?: (html: string, css: string) => void;
}

export const WebBuilder = ({ initialHtml, initialCss, onSave }: WebBuilderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<"insert" | "layout" | "text" | "vector">("insert");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState(0.5);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [codePreviewOpen, setCodePreviewOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // History management
  const history = useCanvasHistory(fabricCanvas);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasElement = canvasRef.current;
    
    const canvas = new FabricCanvas(canvasElement, {
      width: 1200,
      height: 800,
      backgroundColor: "#1a1a1a",
    });

    setFabricCanvas(canvas);

    const handleSelectionCreated = (e: any) => {
      setSelectedObject(e.selected?.[0]);
    };

    const handleSelectionUpdated = (e: any) => {
      setSelectedObject(e.selected?.[0]);
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionUpdated);
    canvas.on("selection:cleared", handleSelectionCleared);

    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionUpdated);
      canvas.off("selection:cleared", handleSelectionCleared);
      canvas.clear();
      canvas.dispose();
      setFabricCanvas(null);
      setSelectedObject(null);
    };
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...defaultWebBuilderShortcuts.undo,
      action: () => {
        if (history.canUndo) {
          history.undo();
          toast.success("Undone");
        }
      },
    },
    {
      ...defaultWebBuilderShortcuts.redo,
      action: () => {
        if (history.canRedo) {
          history.redo();
          toast.success("Redone");
        }
      },
    },
    {
      ...defaultWebBuilderShortcuts.redoAlt,
      action: () => {
        if (history.canRedo) {
          history.redo();
          toast.success("Redone");
        }
      },
    },
    {
      ...defaultWebBuilderShortcuts.delete,
      action: () => selectedObject && handleDelete(),
    },
    {
      ...defaultWebBuilderShortcuts.backspace,
      action: () => selectedObject && handleDelete(),
    },
    {
      ...defaultWebBuilderShortcuts.duplicate,
      action: () => selectedObject && handleDuplicate(),
    },
    {
      ...defaultWebBuilderShortcuts.save,
      action: () => {
        history.save();
        toast.success("Saved");
      },
    },
    {
      ...defaultWebBuilderShortcuts.toggleCode,
      action: () => setCodePreviewOpen(true),
    },
  ]);

  // Save to history when objects change
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleObjectModified = () => {
      setTimeout(() => history.save(), 100);
    };

    fabricCanvas.on("object:added", handleObjectModified);
    fabricCanvas.on("object:removed", handleObjectModified);
    fabricCanvas.on("object:modified", handleObjectModified);

    return () => {
      fabricCanvas.off("object:added", handleObjectModified);
      fabricCanvas.off("object:removed", handleObjectModified);
      fabricCanvas.off("object:modified", handleObjectModified);
    };
  }, [fabricCanvas, history]);

  const handleDelete = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    toast.success("Deleted");
  };

  const handleDuplicate = () => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.clone((cloned: any) => {
      cloned.set({
        left: cloned.left + 10,
        top: cloned.top + 10,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast.success("Duplicated");
    });
  };

  const addBlock = (blockId: string) => {
    if (!fabricCanvas) return;
    
    const block = webBlocks.find(b => b.id === blockId);
    if (!block) return;

    const component = block.create(fabricCanvas);
    if (component) {
      fabricCanvas.add(component);
      fabricCanvas.setActiveObject(component);
      fabricCanvas.renderAll();
      toast.success(`${block.label} added`);
    }
  };

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom * 1.2, 2);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const getCanvasWidth = () => {
    switch (device) {
      case "tablet": return 768;
      case "mobile": return 375;
      default: return 1200;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Top Toolbar */}
      <div className="h-14 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeMode === "insert" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveMode("insert")}
            className="text-white/70 hover:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Insert
          </Button>
          <Button
            variant={activeMode === "layout" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveMode("layout")}
            className="text-white/70 hover:text-white"
          >
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </Button>
          <Button
            variant={activeMode === "text" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveMode("text")}
            className="text-white/70 hover:text-white"
          >
            <Type className="h-4 w-4 mr-2" />
            Text
          </Button>
          <Button
            variant={activeMode === "vector" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveMode("vector")}
            className="text-white/70 hover:text-white"
          >
            <Square className="h-4 w-4 mr-2" />
            Vector
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50">Web Builder</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsDialogOpen(true)}
            className="text-white/70 hover:text-white"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={history.undo}
            disabled={!history.canUndo}
            className="text-white/70 hover:text-white disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={history.redo}
            disabled={!history.canRedo}
            className="text-white/70 hover:text-white disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              history.save();
              toast.success("Saved");
            }}
            className="text-white/70 hover:text-white"
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCodePreviewOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <Code className="h-4 w-4 mr-2" />
            Code
          </Button>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Panel */}
        <NavigationPanel />

        {/* Middle Components Library */}
        <ComponentsLibrary onAddBlock={addBlock} />

        {/* Center Canvas Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          {/* Device & Breakpoint Controls */}
          <div className="h-12 border-b border-white/10 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={device === "desktop" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDevice("desktop")}
                className="text-white/70 hover:text-white"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={device === "tablet" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDevice("tablet")}
                className="text-white/70 hover:text-white"
              >
                <Tablet className="h-4 w-4 mr-2" />
                Tablet
              </Button>
              <Button
                variant={device === "mobile" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDevice("mobile")}
                className="text-white/70 hover:text-white"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
            <span className="text-sm text-white/50">{getCanvasWidth()}px</span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            <div 
              className="bg-white"
              style={{ 
                width: getCanvasWidth() * zoom,
                height: 800 * zoom,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.1)"
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Bottom Controls - Zoom only */}
          <div className="h-12 border-t border-white/10 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="text-white/70 hover:text-white h-8 w-8 p-0"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-white/50 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="text-white/70 hover:text-white h-8 w-8 p-0"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <WebPropertiesPanel 
          fabricCanvas={fabricCanvas}
          selectedObject={selectedObject}
          onUpdate={() => fabricCanvas?.renderAll()}
        />
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />

      {/* Code Preview Dialog */}
      <CodePreviewDialog
        isOpen={codePreviewOpen}
        onClose={() => setCodePreviewOpen(false)}
        fabricCanvas={fabricCanvas}
      />

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {Object.entries(defaultWebBuilderShortcuts).map(([key, shortcut]) => {
              const parts = [];
              if ('ctrl' in shortcut && shortcut.ctrl) parts.push("Ctrl");
              if ('shift' in shortcut && shortcut.shift) parts.push("Shift");
              if ('alt' in shortcut && shortcut.alt) parts.push("Alt");
              parts.push(shortcut.key.toUpperCase());
              
              return (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="text-white/70">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-white/90 text-xs font-mono">
                    {parts.join("+")}
                  </kbd>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
