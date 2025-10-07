import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ElementsPanel } from './design-studio/ElementsPanel';
import { Button } from '@/components/ui/button';
import type { DesignElement } from './design-studio/ElementsPanel';

interface DesignSidebarProps {
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

export const DesignSidebar = ({
  onElementSelect,
  onElementDragStart,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onAddImage,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onDelete,
  selectedObject,
  layers,
  onLayerSelect,
  isCropping,
  onApplyCrop,
  onCancelCrop,
}: DesignSidebarProps) => {
  return (
    <Tabs defaultValue="elements" className="w-full h-full flex flex-col">
      <TabsList className="w-full grid grid-cols-2 bg-slate-900 border-b border-slate-800">
        <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
        <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
      </TabsList>

      <TabsContent value="elements" className="flex-1 m-0 overflow-hidden">
        <ElementsPanel
          onElementSelect={onElementSelect}
          onElementDragStart={onElementDragStart}
        />
      </TabsContent>

      <TabsContent value="layers" className="flex-1 m-0 p-3 overflow-y-auto space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Quick Add</div>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddText}
              className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm"
            >
              Text
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddRectangle}
              className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm"
            >
              Rectangle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddCircle}
              className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm"
            >
              Circle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddImage}
              className="justify-start bg-slate-800 hover:bg-slate-700 h-9 text-sm"
            >
              Upload Image
            </Button>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Layers</div>
          <div className="flex flex-col gap-1 max-h-64 overflow-auto pr-1">
            {layers.map((obj: any, idx: number) => (
              <button
                key={idx}
                className={`text-left px-2 py-1.5 rounded border text-xs ${
                  selectedObject === obj
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
                onClick={() => onLayerSelect(obj)}
              >
                {idx + 1}. {obj.type || 'Object'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Actions</div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 h-7"
            >
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBringForward}
              className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 h-7"
            >
              Forward
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSendBackward}
              className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 h-7"
            >
              Backward
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-500 h-7 text-white"
            >
              Delete
            </Button>
          </div>
        </div>

        {isCropping && (
          <div className="p-2 bg-cyan-900/30 border border-cyan-700 rounded">
            <div className="text-xs text-cyan-300 mb-2">Crop Mode Active</div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onApplyCrop}
                className="flex-1 h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Apply Crop
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelCrop}
                className="flex-1 h-7 text-xs bg-slate-700 hover:bg-slate-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
