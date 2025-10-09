import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Group, Rect, IText, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, Download, Save, Layers, Settings2, FolderOpen,
  Code, Eye, Sparkles, ZoomIn, ZoomOut, Undo2, Redo2, Grid3x3
} from "lucide-react";
import { toast } from "sonner";
import { WebBlocksPanel } from "./web-builder/WebBlocksPanel";
import { WebLayersPanel } from "./web-builder/WebLayersPanel";
import { WebPropertiesPanel } from "./web-builder/WebPropertiesPanel";
import { SaveTemplateDialog } from "./design-studio/SaveTemplateDialog";
import { TemplateGallery } from "./design-studio/TemplateGallery";
import { webBlocks } from "./web-builder/webBlocks";

interface WebBuilderProps {
  initialHtml?: string;
  initialCss?: string;
  onSave?: (html: string, css: string) => void;
}

export const WebBuilder = ({ initialHtml, initialCss, onSave }: WebBuilderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    // Selection events
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  const addBlock = (blockId: string) => {
    if (!fabricCanvas) return;
    
    const block = webBlocks.find(b => b.id === blockId);
    if (!block) return;

    // Create the block component
    const component = block.create(fabricCanvas);
    if (component) {
      fabricCanvas.add(component);
      fabricCanvas.setActiveObject(component);
      fabricCanvas.renderAll();
      toast.success(`${block.label} added`);
    }
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    
    // Export as image
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement("a");
    link.download = "web-design.png";
    link.href = dataURL;
    link.click();
    
    toast.success("Design exported");
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;
    
    const json = fabricCanvas.toJSON();
    localStorage.setItem("web-builder-design", JSON.stringify(json));
    
    if (onSave) {
      // Generate HTML/CSS from canvas
      const html = generateHTML(fabricCanvas);
      const css = generateCSS(fabricCanvas);
      onSave(html, css);
    }
    
    toast.success("Design saved");
  };

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom * 1.2, 3);
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

  const handleDelete = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    toast.success("Component deleted");
  };

  const generateHTML = (canvas: FabricCanvas): string => {
    const objects = canvas.getObjects();
    let html = '<div class="page-container">\n';
    
    objects.forEach(obj => {
      if (obj.type === 'group') {
        const data = (obj as any).blockData;
        if (data?.html) {
          html += `  ${data.html}\n`;
        }
      }
    });
    
    html += '</div>';
    return html;
  };

  const generateCSS = (canvas: FabricCanvas): string => {
    return `
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

section {
  padding: 60px 20px;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 80px 20px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
`;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Blocks */}
      {showBlocks && (
        <WebBlocksPanel 
          onAddBlock={addBlock}
        />
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBlocks(!showBlocks)}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={showCode ? "default" : "ghost"} 
              size="sm"
              onClick={() => setShowCode(!showCode)}
            >
              <Code className="h-4 w-4 mr-2" />
              Code
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" onClick={() => setShowLayers(!showLayers)}>
              <Layers className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowProperties(!showProperties)}>
              <Settings2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" onClick={() => setGalleryOpen(true)}>
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        {!showCode ? (
          <div className="flex-1 overflow-auto bg-muted/30 p-8">
            <div 
              className="bg-white shadow-2xl mx-auto"
              style={{ 
                width: 1200 * zoom,
                height: 800 * zoom,
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-card border border-border rounded-lg p-4 max-w-4xl mx-auto">
              <h3 className="text-sm font-semibold mb-2">HTML</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-60 mb-4">
                {generateHTML(fabricCanvas!)}
              </pre>
              <h3 className="text-sm font-semibold mb-2">CSS</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-60">
                {generateCSS(fabricCanvas!)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Right Panels */}
      {showLayers && (
        <WebLayersPanel 
          fabricCanvas={fabricCanvas} 
          selectedObject={selectedObject}
          onDelete={handleDelete}
        />
      )}
      
      {showProperties && (
        <WebPropertiesPanel 
          fabricCanvas={fabricCanvas} 
          selectedObject={selectedObject}
          onUpdate={() => fabricCanvas?.renderAll()}
        />
      )}

      {/* Dialogs */}
      <SaveTemplateDialog 
        open={saveDialogOpen} 
        onOpenChange={setSaveDialogOpen}
        onSave={async (data) => {
          await handleSave();
          setSaveDialogOpen(false);
        }}
      />
      <TemplateGallery 
        open={galleryOpen} 
        onOpenChange={setGalleryOpen}
        onLoadTemplate={(template) => {
          setGalleryOpen(false);
        }}
      />
    </div>
  );
};
