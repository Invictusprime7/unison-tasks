import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Monitor, Tablet, Smartphone, Plus, Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Breakpoint {
  id: string;
  name: string;
  width: number;
  active: boolean;
}

interface ResponsiveManagerProps {
  onBreakpointChange: (breakpoint: Breakpoint) => void;
  currentBreakpoint?: Breakpoint;
}

export const ResponsiveManager = ({ onBreakpointChange, currentBreakpoint }: ResponsiveManagerProps) => {
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([
    { id: "mobile", name: "Mobile", width: 375, active: true },
    { id: "tablet", name: "Tablet", width: 768, active: true },
    { id: "desktop", name: "Desktop", width: 1280, active: true },
    { id: "wide", name: "Wide Desktop", width: 1920, active: false },
  ]);

  const [selectedBreakpoint, setSelectedBreakpoint] = useState<Breakpoint>(
    currentBreakpoint || breakpoints[2]
  );

  const handleBreakpointSelect = (bp: Breakpoint) => {
    setSelectedBreakpoint(bp);
    onBreakpointChange(bp);
  };

  const updateBreakpointWidth = (id: string, newWidth: number) => {
    setBreakpoints(prev =>
      prev.map(bp => (bp.id === id ? { ...bp, width: newWidth } : bp))
    );
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Responsive Design
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Manage breakpoints and preview
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick Breakpoint Selector */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Quick Preview
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {breakpoints
                .filter(bp => bp.active)
                .map(bp => (
                  <Button
                    key={bp.id}
                    variant={selectedBreakpoint.id === bp.id ? "default" : "outline"}
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => handleBreakpointSelect(bp)}
                  >
                    {bp.id === "mobile" && <Smartphone className="h-4 w-4" />}
                    {bp.id === "tablet" && <Tablet className="h-4 w-4" />}
                    {(bp.id === "desktop" || bp.id === "wide") && <Monitor className="h-4 w-4" />}
                    <span className="text-xs">{bp.name}</span>
                  </Button>
                ))}
            </div>
          </div>

          <Separator />

          {/* Current Breakpoint Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Current View</span>
              <span className="text-xs text-muted-foreground">{selectedBreakpoint.width}px</span>
            </div>
            <div className="text-sm font-semibold">{selectedBreakpoint.name}</div>
          </div>

          <Separator />

          {/* Breakpoint Management */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Manage Breakpoints
            </Label>
            <div className="space-y-3">
              {breakpoints.map(bp => (
                <div key={bp.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{bp.name}</span>
                    <Switch
                      checked={bp.active}
                      onCheckedChange={(checked) =>
                        setBreakpoints(prev =>
                          prev.map(b => (b.id === bp.id ? { ...b, active: checked } : b))
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={bp.width}
                      onChange={(e) => updateBreakpointWidth(bp.id, Number(e.target.value))}
                      className="h-8 text-sm"
                      disabled={!bp.active}
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Responsive Settings */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Settings
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-Adjust Elements</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Maintain Aspect Ratio</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Safe Areas</Label>
                <Switch />
              </div>
            </div>
          </div>

          <Separator />

          {/* Add Custom Breakpoint */}
          <Button variant="outline" className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Breakpoint
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
};
