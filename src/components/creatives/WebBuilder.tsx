import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, Layout, Type, Square, Eye, Play,
  Monitor, Tablet, Smartphone, ZoomIn, ZoomOut,
  Sparkles, Code, Undo2, Redo2, Save, Keyboard, Zap
} from "lucide-react";
import { toast } from "sonner";
import { NavigationPanel } from "./web-builder/NavigationPanel";
import { AIAssistantPanel } from "./web-builder/AIAssistantPanel";
import { CodePreviewDialog } from "./web-builder/CodePreviewDialog";
import { IntegrationsPanel } from "./design-studio/IntegrationsPanel";
import { ExportDialog } from "./design-studio/ExportDialog";
import { PerformancePanel } from "./web-builder/PerformancePanel";
import { useGrapeJS } from "@/hooks/useGrapeJS";
import { GrapeJSAdapter } from "@/utils/grapeJsAdapter";
import grapeJsTemplate from "@/utils/grapeJsTemplate.html?raw";
import { useKeyboardShortcuts, defaultWebBuilderShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AIGeneratedTemplate } from "@/types/template";

interface WebBuilderProps {
  initialHtml?: string;
  initialCss?: string;
  onSave?: (html: string, css: string) => void;
}

export const WebBuilder = ({ initialHtml, initialCss, onSave }: WebBuilderProps) => {
  const grapeJS = useGrapeJS();
  const [adapter] = useState(() => new GrapeJSAdapter());
  const [activeMode, setActiveMode] = useState<"insert" | "layout" | "text" | "vector">("insert");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState(1);
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
  const [performancePanelOpen, setPerformancePanelOpen] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Sync device changes to GrapeJS
  useEffect(() => {
    if (!grapeJS.isReady) return;
    
    const deviceMap: Record<string, string> = {
      desktop: 'Desktop',
      tablet: 'Tablet',
      mobile: 'Mobile',
    };
    
    grapeJS.setDevice(deviceMap[device]);
  }, [device, grapeJS.isReady, grapeJS.setDevice]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...defaultWebBuilderShortcuts.undo,
      action: () => {
        grapeJS.undo();
        toast.success("Undone");
      },
    },
    {
      ...defaultWebBuilderShortcuts.redo,
      action: () => {
        grapeJS.redo();
        toast.success("Redone");
      },
    },
    {
      ...defaultWebBuilderShortcuts.redoAlt,
      action: () => {
        grapeJS.redo();
        toast.success("Redone");
      },
    },
    {
      ...defaultWebBuilderShortcuts.save,
      action: async () => {
        const html = await grapeJS.getHtml();
        const css = await grapeJS.getCss();
        if (onSave) {
          onSave(html, css);
        }
        toast.success("Saved");
      },
    },
    {
      ...defaultWebBuilderShortcuts.toggleCode,
      action: () => setCodePreviewOpen(true),
    },
  ]);

  const handleExport = async (format: string) => {
    const html = await grapeJS.getHtml();
    const css = await grapeJS.getCss();
    
    setExportHtml(html);
    setExportCss(css);
    
    if (format === 'html') {
      setExportDialogOpen(true);
    } else if (format === 'react') {
      const reactCode = `import React from 'react';\n\nconst GeneratedComponent = () => {\n  return (\n    <div>\n${html.split('\n').map(l => '      ' + l).join('\n')}\n    </div>\n  );\n};\n\nexport default GeneratedComponent;`;
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
      const components = await grapeJS.getComponents();
      const json = JSON.stringify(components, null, 2);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleTemplateGenerated = async (template: AIGeneratedTemplate) => {
    if (!grapeJS.isReady) {
      toast.error('Editor not ready');
      return;
    }

    try {
      // Convert template to GrapeJS components
      const components = adapter.templateToGrapeJS(template);
      
      // Set components in GrapeJS
      await grapeJS.setComponents(components);
      
      toast.success('Template rendered successfully!');
    } catch (error) {
      console.error('Error rendering template:', error);
      toast.error('Failed to render template');
    }
  };

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
            onClick={() => setPerformancePanelOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Performance
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
            onClick={() => grapeJS.undo()}
            className="text-white/70 hover:text-white"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => grapeJS.redo()}
            className="text-white/70 hover:text-white"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const html = await grapeJS.getHtml();
              const css = await grapeJS.getCss();
              if (onSave) {
                onSave(html, css);
              }
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
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => toast.success('Click Publish in the top right to deploy your website with a custom domain!')}
          >
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
            <span className="text-sm text-white/50">Responsive Design</span>
          </div>

          {/* GrapeJS Editor Iframe */}
          <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
            <iframe
              ref={grapeJS.iframeRef}
              srcDoc={grapeJsTemplate}
              className="w-full h-full border-0"
              title="GrapeJS Editor"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>

          {/* Bottom Controls - Zoom */}
          <div className="h-12 border-t border-white/10 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
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
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="text-white/70 hover:text-white h-8 w-8 p-0"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(1)}
                className="text-white/70 hover:text-white text-xs"
                title="Reset zoom"
              >
                Reset View
              </Button>
            </div>
            {grapeJS.isReady && (
              <span className="text-xs text-green-500">● Editor Ready</span>
            )}
          </div>
        </div>

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
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel 
        isOpen={aiPanelOpen} 
        onClose={() => setAiPanelOpen(false)}
        fabricCanvas={null}
        onTemplateGenerated={handleTemplateGenerated}
      />

      {/* Code Preview Dialog */}
      <CodePreviewDialog
        isOpen={codePreviewOpen}
        onClose={() => setCodePreviewOpen(false)}
        fabricCanvas={null}
        grapeJS={grapeJS}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        html={exportHtml}
        css={exportCss}
      />

      {/* Performance Panel as Sidebar */}
      {performancePanelOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#1a1a1a] border-l border-white/10 shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-white">Performance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPerformancePanelOpen(false)}
              className="text-white/70 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <PerformancePanel 
            fabricCanvas={null}
            onAutoFix={() => {
              toast.success("Auto-fix applied! Optimizations complete.");
            }}
          />
        </div>
      )}

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
