import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Layers, Settings } from "lucide-react";
import { DesignSidebar } from "./DesignSidebar";
import { PropertiesPanel } from "./design-studio/PropertiesPanel";
import { FiltersPanel } from "./design-studio/FiltersPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DesignElement } from "./design-studio/ElementsPanel";
import { useEffect, useState } from "react";

interface MobileToolbarProps {
  onElementSelect: (element: DesignElement) => void;
  onElementDragStart: (element: DesignElement) => void;
  onAddText: () => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddImage: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
  selectedObject: any;
  layers: any[];
  onLayerSelect: (obj: any) => void;
  isCropping: boolean;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onPropertyChange?: (property: string, value: any) => void;
  onStartCrop?: () => void;
  onRemoveBackground?: (tolerance: number) => void;
  onAlign?: (alignment: string) => void;
  onApplyFilter?: (filterType: string, value?: number) => void;
  onResetFilters?: () => void;
}

export const MobileToolbar = (props: MobileToolbarProps) => {
  const [propertiesOpen, setPropertiesOpen] = useState(false);

  // Auto-open properties when object is selected
  useEffect(() => {
    if (props.selectedObject) {
      setPropertiesOpen(true);
    }
  }, [props.selectedObject]);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 shadow-lg">
      <div className="flex items-center justify-around p-2 gap-2">
        {/* Elements & Layers */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="flex-1 h-12 flex flex-col items-center justify-center gap-1 text-xs">
              <Layers className="h-5 w-5" />
              <span>Layers</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0 bg-slate-950">
            <SheetHeader className="px-4 py-3 border-b border-slate-800">
              <SheetTitle className="text-slate-100">Design Elements</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-60px)] overflow-y-auto">
              <DesignSidebar {...props} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Properties (Only show when object selected) */}
        {props.selectedObject && (
          <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1 h-12 flex flex-col items-center justify-center gap-1 text-xs bg-cyan-600/20 text-cyan-400">
                <Settings className="h-5 w-5" />
                <span>Edit</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 bg-slate-950">
              <SheetHeader className="px-4 py-3 border-b border-slate-800">
                <SheetTitle className="text-slate-100">Edit {props.selectedObject.type || 'Object'}</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(85vh-60px)] overflow-y-auto">
                <Tabs defaultValue="properties" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-900 rounded-none">
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="filters">Filters</TabsTrigger>
                  </TabsList>
                  <TabsContent value="properties" className="m-0 p-4">
                    <PropertiesPanel
                      selectedObject={props.selectedObject}
                      onPropertyChange={props.onPropertyChange || (() => {})}
                      onStartCrop={props.onStartCrop}
                      onRemoveBackground={props.onRemoveBackground}
                      onAlign={props.onAlign}
                    />
                  </TabsContent>
                  <TabsContent value="filters" className="m-0 p-4">
                    <FiltersPanel
                      selectedObject={props.selectedObject}
                      onApplyFilter={props.onApplyFilter || (() => {})}
                      onResetFilters={props.onResetFilters}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
};
