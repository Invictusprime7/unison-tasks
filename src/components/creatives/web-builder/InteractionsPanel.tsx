import { useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Zap, MousePointer2, Eye } from "lucide-react";
import { toast } from "sonner";

interface Interaction {
  id: string;
  trigger: "click" | "hover" | "scroll" | "load";
  action: "navigate" | "animate" | "toggle" | "custom";
  target?: string;
  parameters: Record<string, any>;
}

interface InteractionsPanelProps {
  fabricCanvas: FabricCanvas | null;
  selectedObject: any;
}

export const InteractionsPanel = ({ fabricCanvas, selectedObject }: InteractionsPanelProps) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const addInteraction = () => {
    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}`,
      trigger: "click",
      action: "navigate",
      parameters: {},
    };
    setInteractions([...interactions, newInteraction]);
    toast.success("Interaction added");
    setShowAddForm(false);
  };

  const updateInteraction = (id: string, updates: Partial<Interaction>) => {
    setInteractions(prev =>
      prev.map(int => (int.id === id ? { ...int, ...updates } : int))
    );
  };

  const deleteInteraction = (id: string) => {
    setInteractions(prev => prev.filter(int => int.id !== id));
    toast.success("Interaction removed");
  };

  const animationPresets = [
    { value: "fade-in", label: "Fade In" },
    { value: "slide-in", label: "Slide In" },
    { value: "scale-up", label: "Scale Up" },
    { value: "rotate", label: "Rotate" },
    { value: "bounce", label: "Bounce" },
  ];

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Interactions
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {selectedObject ? "Configure element interactions" : "Select an element"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {!selectedObject ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MousePointer2 className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select an element to add interactions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing Interactions */}
              {interactions.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Interactions ({interactions.length})
                  </Label>
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="border border-border rounded-lg p-3 space-y-3">
                      {/* Trigger */}
                      <div>
                        <Label className="text-xs mb-2 block">Trigger</Label>
                        <Select
                          value={interaction.trigger}
                          onValueChange={(value: any) =>
                            updateInteraction(interaction.id, { trigger: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="click">Click</SelectItem>
                            <SelectItem value="hover">Hover</SelectItem>
                            <SelectItem value="scroll">Scroll Into View</SelectItem>
                            <SelectItem value="load">Page Load</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action */}
                      <div>
                        <Label className="text-xs mb-2 block">Action</Label>
                        <Select
                          value={interaction.action}
                          onValueChange={(value: any) =>
                            updateInteraction(interaction.id, { action: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="navigate">Navigate To</SelectItem>
                            <SelectItem value="animate">Animate</SelectItem>
                            <SelectItem value="toggle">Toggle Visibility</SelectItem>
                            <SelectItem value="custom">Custom Function</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Parameters */}
                      {interaction.action === "navigate" && (
                        <div>
                          <Label className="text-xs mb-2 block">URL</Label>
                          <Input
                            placeholder="https://example.com"
                            className="h-8 text-sm"
                            value={interaction.parameters.url || ""}
                            onChange={(e) =>
                              updateInteraction(interaction.id, {
                                parameters: { ...interaction.parameters, url: e.target.value },
                              })
                            }
                          />
                        </div>
                      )}

                      {interaction.action === "animate" && (
                        <>
                          <div>
                            <Label className="text-xs mb-2 block">Animation</Label>
                            <Select
                              value={interaction.parameters.animation || "fade-in"}
                              onValueChange={(value) =>
                                updateInteraction(interaction.id, {
                                  parameters: { ...interaction.parameters, animation: value },
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {animationPresets.map(preset => (
                                  <SelectItem key={preset.value} value={preset.value}>
                                    {preset.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs mb-2 block">Duration (ms)</Label>
                              <Input
                                type="number"
                                className="h-8 text-sm"
                                value={interaction.parameters.duration || 300}
                                onChange={(e) =>
                                  updateInteraction(interaction.id, {
                                    parameters: {
                                      ...interaction.parameters,
                                      duration: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-2 block">Delay (ms)</Label>
                              <Input
                                type="number"
                                className="h-8 text-sm"
                                value={interaction.parameters.delay || 0}
                                onChange={(e) =>
                                  updateInteraction(interaction.id, {
                                    parameters: {
                                      ...interaction.parameters,
                                      delay: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => deleteInteraction(interaction.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Remove Interaction
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Add New Interaction */}
              <Button
                variant="outline"
                className="w-full"
                onClick={addInteraction}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Interaction
              </Button>

              {/* Preview Button */}
              <Button variant="secondary" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Preview Interactions
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
