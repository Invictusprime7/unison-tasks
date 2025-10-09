import { useEditor, Frame, Element } from "@craftjs/core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, FolderOpen, Download, Sparkles, Send, Loader2, Eye, Code } from "lucide-react";
import { toast } from "sonner";
import { Container } from "./craftjs/Container";
import { CraftButton } from "./craftjs/Button";
import { CraftText } from "./craftjs/Text";
import { CraftCard } from "./craftjs/Card";
import { CraftImage } from "./craftjs/Image";
import { CraftComponentsPanel } from "./craftjs/CraftComponentsPanel";
import { CraftPropertiesPanel } from "./craftjs/CraftPropertiesPanel";
import { SaveTemplateDialog } from "./design-studio/SaveTemplateDialog";
import { TemplateGallery } from "./design-studio/TemplateGallery";
import { ExportDialog } from "./design-studio/ExportDialog";
import { supabase } from "@/integrations/supabase/client";
import MonacoEditor from "@monaco-editor/react";

interface CraftJSEditorProps {
  initialData?: string;
  onSave?: (data: string) => void;
}

const EditorContent = () => {
  const { query, actions, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [jsonData, setJsonData] = useState("");

  const handleSaveAsTemplate = async (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to save templates");
        return;
      }

      const serialized = query.serialize();

      const { error } = await supabase
        .from('design_templates')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          canvas_data: { craftjs: serialized },
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
    // For backward compatibility with GrapeJS templates
    toast.info("GrapeJS templates not yet supported in this editor");
  };

  const handleLoadCraftTemplate = (data: string) => {
    try {
      actions.deserialize(data);
      toast.success("Template loaded successfully");
      setGalleryOpen(false);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  };

  const handleExport = () => {
    const serialized = query.serialize();
    setJsonData(JSON.stringify(JSON.parse(serialized), null, 2));
    setExportDialogOpen(true);
  };

  const handleAiAssist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiPrompt.trim()) {
      toast.error("Please enter a design instruction");
      return;
    }

    setIsAiProcessing(true);
    
    try {
      const currentState = query.serialize();

      const { data, error } = await supabase.functions.invoke('ai-design-assistant', {
        body: {
          prompt: aiPrompt,
          currentState: JSON.parse(currentState),
          editor: 'craftjs'
        }
      });

      if (error) throw error;

      if (data?.craftData) {
        actions.deserialize(JSON.stringify(data.craftData));
        toast.success("Design updated by AI");
        setAiPrompt("");
      } else {
        throw new Error("Invalid response from AI assistant");
      }
    } catch (error: any) {
      console.error("Error in AI assistant:", error);
      toast.error("AI assistant temporarily unavailable");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const toggleCodeView = () => {
    if (!showCode) {
      const serialized = query.serialize();
      setJsonData(JSON.stringify(JSON.parse(serialized), null, 2));
    }
    setShowCode(!showCode);
  };

  const applyCodeChanges = () => {
    try {
      const parsed = JSON.parse(jsonData);
      actions.deserialize(JSON.stringify(parsed));
      setShowCode(false);
      toast.success("Code applied successfully");
    } catch (error) {
      toast.error("Invalid JSON format");
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-9 sm:h-10 border-b bg-card flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
        <div className="flex gap-2">
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => actions.setOptions((options) => (options.enabled = !enabled))}
            className="h-7 sm:h-8 px-2 text-xs sm:text-sm"
          >
            {enabled ? "Edit Mode" : "Preview"}
          </Button>
        </div>
        <div className="flex gap-1 sm:gap-2">
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
            onClick={toggleCodeView}
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-card p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={applyCodeChanges}
            >
              Apply Changes
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              value={jsonData}
              onChange={(value) => setJsonData(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Components */}
          <div className="w-64 border-r bg-card overflow-auto flex-shrink-0">
            <CraftComponentsPanel />
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 overflow-auto bg-muted/20 p-4">
            <Frame>
              <Element
                is={Container}
                padding="40px"
                background="hsl(var(--background))"
                canvas
              >
                <CraftText text="Welcome to the Web Builder" fontSize="32px" fontWeight="700" />
                <CraftText text="Drag and drop components to build your website" fontSize="16px" margin="8px 0" />
              </Element>
            </Frame>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-72 border-l bg-card overflow-auto flex-shrink-0">
            <CraftPropertiesPanel />
          </div>
        </div>
      )}

      {/* AI Assistant - Bottom */}
      <div className="border-t bg-card p-3 flex-shrink-0">
        <form onSubmit={handleAiAssist} className="flex gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <Input
              type="text"
              placeholder="Ask AI to create or modify your design..."
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
          >
            {isAiProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </Button>
        </form>
      </div>

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
        html={jsonData}
        css=""
      />
    </div>
  );
};

export const CraftJSEditor = ({ initialData, onSave }: CraftJSEditorProps) => {
  const { Editor } = useEditor(() => ({
    resolver: {
      Container,
      CraftButton,
      CraftText,
      CraftCard,
      CraftImage,
    },
  }));

  return (
    <Editor
      resolver={{
        Container,
        CraftButton,
        CraftText,
        CraftCard,
        CraftImage,
      }}
    >
      <EditorContent />
    </Editor>
  );
};
