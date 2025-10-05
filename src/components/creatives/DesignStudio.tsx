import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Square, Circle, Type, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DesignStudio = () => {
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "text", icon: Type, label: "Text" },
    { id: "move", icon: Move, label: "Move" },
  ];

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    toast({
      title: `${toolId} tool selected`,
      description: "Click on the canvas to use this tool",
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Design Studio
        </CardTitle>
        <CardDescription>
          Create digital designs with powerful vector tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "default" : "outline"}
              onClick={() => handleToolSelect(tool.id)}
              className="flex flex-col h-20 gap-1"
            >
              <tool.icon className="h-5 w-5" />
              <span className="text-xs">{tool.label}</span>
            </Button>
          ))}
        </div>

        <div className="border rounded-lg bg-muted/50 h-96 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Canvas Area</p>
            <p className="text-xs">Select a tool and start designing</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            Clear Canvas
          </Button>
          <Button className="flex-1">Save Design</Button>
        </div>
      </CardContent>
    </Card>
  );
};
