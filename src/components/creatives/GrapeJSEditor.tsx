import { useEffect, useRef, useState } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import { Button } from "@/components/ui/button";
import { Code, Eye } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "sonner";

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

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="h-12 border-b bg-card flex items-center justify-between px-4">
        <div className="panel__devices flex gap-2"></div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? <Eye className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
            {showCode ? "Visual Editor" : "Code Editor"}
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Template
          </Button>
        </div>
      </div>

      {showCode ? (
        <div className="flex-1 flex flex-col">
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
          <div className="flex-1">
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
        <div className="flex-1 flex">
          <div className="flex-1 relative">
            <div ref={editorRef} className="h-full w-full" />
          </div>
          <div className="w-80 border-l bg-card">
            <div className="panel__switcher border-b"></div>
            <div className="panel__right h-full overflow-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
};
