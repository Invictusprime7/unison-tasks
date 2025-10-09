import { useEffect, useRef, useState } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "@/styles/grapesjs-custom.css";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code, Eye, Sparkles, Send, Loader2, Save, FolderOpen, Download, Palette, LayoutGrid } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "sonner";
import { WebComponentsPanel } from "./design-studio/WebComponentsPanel";
import { SaveTemplateDialog } from "./design-studio/SaveTemplateDialog";
import { TemplateGallery } from "./design-studio/TemplateGallery";
import { ExportDialog } from "./design-studio/ExportDialog";
import { DesignTokensPanel } from "./design-studio/DesignTokensPanel";
import { LayoutControlsPanel } from "./design-studio/LayoutControlsPanel";
import { supabase } from "@/integrations/supabase/client";

interface GrapeJSEditorProps {
  initialHtml?: string;
  initialCss?: string;
  onSave?: (html: string, css: string) => void;
}

export const GrapeJSEditor = ({ initialHtml, initialCss, onSave }: GrapeJSEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(initialHtml || "");
  const [cssCode, setCssCode] = useState(initialCss || "");
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTokensPanel, setShowTokensPanel] = useState(false);
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const grapesEditor = grapesjs.init({
      container: editorRef.current,
      height: "100%",
      width: "100%",
      plugins: [gjsPresetWebpage],
      pluginsOpts: {
        [gjsPresetWebpage as any]: {
          blocksBasicOpts: {
            blocks: ["column1", "column2", "column3", "text", "link", "image", "video"],
            flexGrid: true,
          },
          blocks: ["link-block", "quote", "text-basic"],
        },
      },
      storageManager: false,
      canvas: {
        styles: [],
        scripts: [],
      },
      // Clean panel configuration
      panels: {
        defaults: [
          {
            id: "layers",
            el: ".panel__right",
            resizable: {
              maxDim: 350,
              minDim: 200,
              tc: false,
              cl: true,
              cr: false,
              bc: false,
            },
          },
          {
            id: "panel-switcher",
            el: ".panel__switcher",
            buttons: [
              {
                id: "show-layers",
                active: true,
                label: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg><span class="ml-2">Layers</span>',
                command: "show-layers",
                togglable: false,
              },
              {
                id: "show-style",
                active: true,
                label: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg><span class="ml-2">Styles</span>',
                command: "show-styles",
                togglable: false,
              },
              {
                id: "show-traits",
                active: true,
                label: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="ml-2">Settings</span>',
                command: "show-traits",
                togglable: false,
              },
            ],
          },
          {
            id: "panel-devices",
            el: ".panel__devices",
            buttons: [
              {
                id: "device-desktop",
                label: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
                command: "set-device-desktop",
                active: true,
                togglable: false,
              },
              {
                id: "device-tablet",
                label: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
                command: "set-device-tablet",
                togglable: false,
              },
              {
                id: "device-mobile",
                label: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
                command: "set-device-mobile",
                togglable: false,
              },
            ],
          },
        ],
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Tablet",
            width: "768px",
            widthMedia: "992px",
          },
          {
            name: "Mobile",
            width: "320px",
            widthMedia: "480px",
          },
        ],
      },
      // Modern block manager
      blockManager: {
        appendTo: '.blocks-container',
      },
    });

    // Load initial content
    if (initialHtml) {
      grapesEditor.setComponents(initialHtml);
    }
    if (initialCss) {
      grapesEditor.setStyle(initialCss);
    }

    // Update code states when editor changes
    grapesEditor.on("update", () => {
      setHtmlCode(grapesEditor.getHtml());
      setCssCode(grapesEditor.getCss());
    });

    // Enable snap-to-grid and alignment guides
    grapesEditor.on('component:drag:start', () => {
      const canvas = grapesEditor.Canvas.getElement();
      if (canvas) {
        canvas.style.backgroundImage = `
          repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(0,0,0,0.05) 9px, rgba(0,0,0,0.05) 10px),
          repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(0,0,0,0.05) 9px, rgba(0,0,0,0.05) 10px)
        `;
        canvas.style.backgroundSize = '10px 10px';
      }
    });

    grapesEditor.on('component:drag:end', () => {
      const canvas = grapesEditor.Canvas.getElement();
      if (canvas) {
        canvas.style.backgroundImage = '';
      }
    });

    setEditor(grapesEditor);

    return () => {
      grapesEditor.destroy();
    };
  }, []);

  // Track GrapesJS fullscreen state to keep AI Assistant visible
  useEffect(() => {
    if (!editor) return;
    const onFs = () => setIsFullscreen(true);
    const offFs = () => setIsFullscreen(false);
    editor.on('run:fullscreen', onFs);
    editor.on('stop:fullscreen', offFs);
    return () => {
      editor.off('run:fullscreen', onFs);
      editor.off('stop:fullscreen', offFs);
    };
  }, [editor]);

  const handleCodeUpdate = () => {
    if (!editor) return;
    
    try {
      editor.setComponents(htmlCode);
      editor.setStyle(cssCode);
      setShowCode(false);
      toast("Code updated successfully");
    } catch (error) {
      console.error("Error updating code:", error);
      toast.error("Error updating code. Please check your HTML/CSS syntax");
    }
  };

  const handleQuickSave = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    onSave?.(html, css);
    toast("Changes saved");
  };

  const handleSaveAsTemplate = async (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to save templates");
        return;
      }

      const html = editor.getHtml();
      const css = editor.getCss();

      const { error } = await supabase
        .from('design_templates')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          canvas_data: { html, css },
        });

      if (error) throw error;

      toast.success("Template saved successfully");
      setSaveDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (html: string, css: string) => {
    if (!editor) return;

    try {
      editor.setComponents(html);
      editor.setStyle(css);
      setHtmlCode(html);
      setCssCode(css);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  };

  const handleExport = () => {
    if (!editor) return;
    setExportDialogOpen(true);
  };

  const handleComponentSelect = (component: any) => {
    if (!editor) return;

    const { config } = component;
    
    // Add component to the canvas
    editor.addComponents(config.html || '');
    
    // Add CSS if provided
    if (config.css) {
      const currentCss = editor.getCss();
      editor.setStyle(currentCss + '\n' + config.css);
    }
    
    toast(`${component.name} added to canvas`);
  };

  const handleAiAssist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editor || !aiPrompt.trim()) {
      toast.error("Please enter a design instruction");
      return;
    }

    setIsAiProcessing(true);
    console.log("Processing AI design request:", aiPrompt);

    try {
      const currentHtml = editor.getHtml();
      const currentCss = editor.getCss();

      const { data, error } = await supabase.functions.invoke('ai-design-assistant', {
        body: {
          prompt: aiPrompt,
          currentHtml,
          currentCss
        }
      });

      if (error) {
        console.error("AI assistant error:", error);
        throw error;
      }

      if (data?.html !== undefined && data?.css !== undefined) {
        // Extract body content from full HTML if needed
        let htmlContent = data.html;
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          htmlContent = bodyMatch[1];
        }
        
        // Apply the AI-generated changes
        editor.setComponents(htmlContent);
        editor.setStyle(data.css);
        
        toast.success("Design updated by AI");
        setAiPrompt("");
      } else {
        throw new Error("Invalid response from AI assistant");
      }
    } catch (error: any) {
      console.error("Error in AI assistant:", error);
      
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("Payment required")) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to process AI request. Please try again.");
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <div className="h-9 sm:h-10 border-b bg-card flex items-center justify-between px-2 sm:px-4 flex-shrink-0 min-w-0">
        <div className="panel__devices flex gap-1 min-w-0"></div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokensPanel(!showTokensPanel)}
              className="h-7 sm:h-8 px-2"
            >
              <Palette className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tokens</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLayoutPanel(!showLayoutPanel)}
              className="h-7 sm:h-8 px-2"
            >
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Layout</span>
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setGalleryOpen(true)}
            className="h-7 sm:h-8 px-2"
          >
            <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-7 sm:h-8 px-2"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-7 sm:h-8 px-2"
          >
            {showCode ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> : <Code className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{showCode ? "Visual" : "Code"}</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setSaveDialogOpen(true)} 
            className="h-7 sm:h-8 px-2 text-xs sm:text-sm"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {showCode ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="border-b bg-card">
            <div className="flex gap-2 p-2">
              <Button
                variant={activeTab === "html" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("html")}
              >
                HTML
              </Button>
              <Button
                variant={activeTab === "css" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("css")}
              >
                CSS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCodeUpdate}
                className="ml-auto"
              >
                Apply Changes
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === "html" ? (
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                value={htmlCode}
                onChange={(value) => setHtmlCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <MonacoEditor
                height="100%"
                defaultLanguage="css"
                value={cssCode}
                onChange={(value) => setCssCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
            {/* Left Sidebar - Web Components */}
            <div className="w-full sm:w-64 border-b sm:border-r sm:border-b-0 bg-card max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
              <WebComponentsPanel onComponentSelect={handleComponentSelect} />
            </div>

            {/* Center - Canvas */}
            <div className={`flex-1 relative min-h-[300px] overflow-hidden ${isFullscreen ? 'pb-24' : ''}`}>
              <div ref={editorRef} className="h-full w-full" />
            </div>

            {/* Right Sidebar - Design Tokens */}
            {showTokensPanel && (
              <div className="w-full sm:w-72 border-t sm:border-l sm:border-t-0 max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
                <DesignTokensPanel
                  onTokensUpdate={(tokens) => {
                    if (!editor) return;
                    const css = `
:root {
  --color-primary: ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent: ${tokens.colors.accent};
  --color-background: ${tokens.colors.background};
  --color-text: ${tokens.colors.text};
  --color-border: ${tokens.colors.border};
  --font-heading: ${tokens.fonts.heading};
  --font-body: ${tokens.fonts.body};
  --spacing-md: ${tokens.spacing.md};
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
}`;
                    const currentCss = editor.getCss();
                    editor.setStyle(css + '\n' + currentCss);
                  }}
                />
              </div>
            )}

            {/* Right Sidebar - Layout Controls */}
            {showLayoutPanel && !showTokensPanel && (
              <div className="w-full sm:w-72 border-t sm:border-l sm:border-t-0 max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
                <LayoutControlsPanel
                  onLayoutUpdate={(layout) => {
                    if (!editor) return;
                    const selected = editor.getSelected();
                    if (!selected) {
                      toast.info("Select an element to apply layout");
                      return;
                    }
                    
                    const styles: Record<string, string> = {
                      display: layout.display,
                    };

                    if (layout.display === 'flex') {
                      if (layout.flexDirection) styles['flex-direction'] = layout.flexDirection;
                      if (layout.justifyContent) styles['justify-content'] = layout.justifyContent;
                      if (layout.alignItems) styles['align-items'] = layout.alignItems;
                    }

                    if (layout.display === 'grid') {
                      if (layout.gridCols) styles['grid-template-columns'] = `repeat(${layout.gridCols}, 1fr)`;
                      if (layout.gridRows) styles['grid-template-rows'] = `repeat(${layout.gridRows}, 1fr)`;
                    }

                    if (layout.gap) styles.gap = layout.gap;
                    if (layout.padding) styles.padding = layout.padding;
                    if (layout.position) styles.position = layout.position;
                    if (layout.zIndex !== undefined) styles['z-index'] = String(layout.zIndex);

                    selected.setStyle(styles);
                    toast.success("Layout applied to selected element");
                  }}
                />
              </div>
            )}
          </div>

          {/* AI Assistant - Always Visible at Bottom */}
          <div className={`border-t bg-card p-3 flex-shrink-0 ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-[99999] shadow-lg' : ''}`}>
            <form onSubmit={handleAiAssist} className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Ask AI to create or modify your design (e.g., 'Create a modern landing page for a SaaS product')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isAiProcessing}
                  className="flex-1"
                />
              </div>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isAiProcessing || !aiPrompt.trim()}
                className="flex gap-2"
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Generate</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveAsTemplate}
        isLoading={isSaving}
      />

      <TemplateGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onLoadTemplate={handleLoadTemplate}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        html={htmlCode}
        css={cssCode}
      />
    </div>
  );
};
