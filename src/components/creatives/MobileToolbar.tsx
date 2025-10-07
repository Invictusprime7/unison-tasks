import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Layers, Settings } from 'lucide-react';
import type { DesignElement } from './design-studio/ElementsPanel';
import { DesignSidebar } from './DesignSidebar';

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
}

export const MobileToolbar = (props: MobileToolbarProps) => {
  return (
    <div className="lg:hidden fixed bottom-4 right-4 z-50 flex gap-2">
      {/* Elements & Layers Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-500"
          >
            <Layers className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-slate-950">
          <DesignSidebar {...props} />
        </SheetContent>
      </Sheet>

      {/* Properties Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-lg bg-cyan-600 hover:bg-cyan-500"
            disabled={!props.selectedObject}
          >
            <Settings className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] p-4 bg-slate-950">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-200">Properties</h3>
            {props.selectedObject ? (
              <div className="space-y-2 text-xs text-slate-300">
                <div>Type: {props.selectedObject.type?.toUpperCase()}</div>
                {props.selectedObject.left !== undefined && (
                  <div>X: {Math.round(props.selectedObject.left)}</div>
                )}
                {props.selectedObject.top !== undefined && (
                  <div>Y: {Math.round(props.selectedObject.top)}</div>
                )}
                {props.selectedObject.width !== undefined && (
                  <div>Width: {Math.round(props.selectedObject.width * (props.selectedObject.scaleX || 1))}</div>
                )}
                {props.selectedObject.height !== undefined && (
                  <div>Height: {Math.round(props.selectedObject.height * (props.selectedObject.scaleY || 1))}</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No object selected</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
