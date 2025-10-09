import { useEffect, useRef, useState } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import { Button } from "@/components/ui/button";
import { Code, Eye } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "sonner";
import { WebComponentsPanel } from "./design-studio/WebComponentsPanel";

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
                label: "Layers",
                command: "show-layers",
                togglable: false,
              },
              {
                id: "show-style",
                active: true,
                label: "Styles",
                command: "show-styles",
                togglable: false,
              },
              {
                id: "show-traits",
                active: true,
                label: "Settings",
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
                label: "Desktop",
                command: "set-device-desktop",
                active: true,
                togglable: false,
              },
              {
                id: "device-tablet",
                label: "Tablet",
                command: "set-device-tablet",
                togglable: false,
              },
              {
                id: "device-mobile",
                label: "Mobile",
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

    setEditor(grapesEditor);

    return () => {
      grapesEditor.destroy();
    };
  }, []);

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

  const handleSave = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    onSave?.(html, css);
    toast("Template saved successfully");
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

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <div className="h-9 sm:h-10 border-b bg-card flex items-center justify-between px-2 sm:px-4 flex-shrink-0 min-w-0">
        <div className="panel__devices flex gap-1 min-w-0"></div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-7 sm:h-8 px-2"
          >
            {showCode ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> : <Code className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{showCode ? "Visual" : "Code"}</span>
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7 sm:h-8 px-2 text-xs sm:text-sm">
            Save
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
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
          {/* Left Sidebar - Web Components */}
          <div className="w-full sm:w-64 border-b sm:border-r sm:border-b-0 bg-card max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
            <WebComponentsPanel onComponentSelect={handleComponentSelect} />
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 relative min-h-[300px] overflow-hidden">
            <div ref={editorRef} className="h-full w-full" />
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-full sm:w-64 md:w-72 border-t sm:border-l sm:border-t-0 bg-card max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
            <div className="panel__switcher border-b text-xs overflow-x-auto"></div>
            <div className="panel__right h-full overflow-auto text-xs"></div>
          </div>
        </div>
      )}
    </div>
  );
};
