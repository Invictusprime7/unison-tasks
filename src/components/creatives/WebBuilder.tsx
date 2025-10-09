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
import { WebPropertiesPanel } from "./web-builder/WebPropertiesPanel";
import { AIAssistantPanel } from "./web-builder/AIAssistantPanel";
import { CodePreviewDialog } from "./web-builder/CodePreviewDialog";
import { IntegrationsPanel } from "./design-studio/IntegrationsPanel";
import { ExportDialog } from "./design-studio/ExportDialog";
import { webBlocks } from "./web-builder/webBlocks";
import { useKeyboardShortcuts, defaultWebBuilderShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";
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
  const [integrationsPanelOpen, setIntegrationsPanelOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportHtml, setExportHtml] = useState("");
  const [exportCss, setExportCss] = useState("");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // History management
  const history = useCanvasHistory(fabricCanvas);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasElement = canvasRef.current;
    
    const canvas = new FabricCanvas(canvasElement, {
      width: 1920,
      height: 1440,
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
      default: return 1920;
    }
  };

  const getCanvasHeight = () => {
    switch (device) {
      case "tablet": return 1024;
      case "mobile": return 667;
      default: return 1440;
    }
  };

  const handleExport = (format: string) => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    let html = '<div class="web-page">\n';
    let css = '.web-page {\n  min-height: 100vh;\n  position: relative;\n  background: white;\n}\n\n';
    
    objects.forEach((obj: any, index: number) => {
      const className = `element-${index}`;
      
      // Generate HTML
      if (obj.type === 'text' || obj.type === 'textbox') {
        html += `  <div class="${className}">${obj.text}</div>\n`;
      } else if (obj.type === 'rect') {
        html += `  <div class="${className}"></div>\n`;
      } else if (obj.type === 'image') {
        html += `  <img class="${className}" src="${obj.getSrc()}" alt="" />\n`;
      }
      
      // Generate CSS
      css += `.${className} {\n`;
      css += `  position: absolute;\n`;
      css += `  left: ${obj.left}px;\n`;
      css += `  top: ${obj.top}px;\n`;
      css += `  width: ${obj.width * (obj.scaleX || 1)}px;\n`;
      css += `  height: ${obj.height * (obj.scaleY || 1)}px;\n`;
      
      if (obj.fill) {
        css += `  background-color: ${obj.fill};\n`;
      }
      if (obj.fontSize) {
        css += `  font-size: ${obj.fontSize}px;\n`;
      }
      if (obj.fontFamily) {
        css += `  font-family: ${obj.fontFamily};\n`;
      }
      if (obj.textAlign) {
        css += `  text-align: ${obj.textAlign};\n`;
      }
      css += `}\n\n`;
    });
    
    html += '</div>';
    
    setExportHtml(html);
    setExportCss(css);
    
    if (format === 'html') {
      setExportDialogOpen(true);
    } else if (format === 'react') {
      // Convert to React component
      const reactCode = `import React from 'react';\n\nconst GeneratedComponent = () => {\n  return (\n${html.split('\n').map(l => '    ' + l).join('\n')}\n  );\n};\n\nexport default GeneratedComponent;`;
      const blob = new Blob([reactCode], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'GeneratedComponent.jsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('React component exported');
    } else if (format === 'json') {
      const json = JSON.stringify(fabricCanvas.toJSON(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'design.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('JSON exported');
    }
  };

  const toggleFullscreen = async () => {
    if (!mainContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await mainContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
        toast.success('Entered fullscreen preview');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        toast.success('Exited fullscreen');
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Failed to toggle fullscreen');
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={mainContainerRef} className="flex flex-col h-screen bg-[#0a0a0a]">
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
            onClick={() => setAiPanelOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIntegrationsPanelOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Export & Integrations
          </Button>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isFullscreen ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Panel - Collapsible */}
        {!leftPanelCollapsed && <NavigationPanel />}
        
        {/* Left Panel Toggle */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-6 rounded-r-md rounded-l-none bg-[#1a1a1a] border-l-0 border border-white/10 text-white/70 hover:text-white hover:bg-[#252525]"
            title={leftPanelCollapsed ? "Show left panel" : "Hide left panel"}
          >
            {leftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

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
            <span className="text-sm text-white/50">{getCanvasWidth()}×{getCanvasHeight()}px</span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            <div 
              className="bg-white shadow-2xl"
              style={{ 
                width: getCanvasWidth() * zoom,
                height: getCanvasHeight() * zoom,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)"
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

        {/* Right Properties Panel - Collapsible */}
        {/* Right Panel Toggle */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-6 rounded-l-md rounded-r-none bg-[#1a1a1a] border-r-0 border border-white/10 text-white/70 hover:text-white hover:bg-[#252525]"
            title={rightPanelCollapsed ? "Show properties panel" : "Hide properties panel"}
          >
            {rightPanelCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        
        {!rightPanelCollapsed && (
          <WebPropertiesPanel 
            fabricCanvas={fabricCanvas}
            selectedObject={selectedObject}
            onUpdate={() => fabricCanvas?.renderAll()}
          />
        )}
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel 
        isOpen={aiPanelOpen} 
        onClose={() => setAiPanelOpen(false)}
        fabricCanvas={fabricCanvas}
      />

      {/* Code Preview Dialog */}
      <CodePreviewDialog
        isOpen={codePreviewOpen}
        onClose={() => setCodePreviewOpen(false)}
        fabricCanvas={fabricCanvas}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        html={exportHtml}
        css={exportCss}
      />

      {/* Integrations Panel as Sidebar */}
      {integrationsPanelOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Export & Integrations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIntegrationsPanelOpen(false)}
            >
              ✕
            </Button>
          </div>
          <IntegrationsPanel 
            onExport={handleExport}
            onIntegrationConnect={(integration, config) => {
              console.log('Integration connected:', integration, config);
              toast.success(`${integration} connected successfully!`);
            }}
          />
        </div>
      )}

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
