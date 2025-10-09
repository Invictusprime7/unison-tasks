import { useEditor } from "@craftjs/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Settings } from "lucide-react";

export const CraftPropertiesPanel = () => {
  const { selected, actions, query } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').first();
    return {
      selected: currentNodeId ? {
        id: currentNodeId,
        name: state.nodes[currentNodeId]?.data?.displayName || state.nodes[currentNodeId]?.data?.name,
        settings: state.nodes[currentNodeId]?.related?.toolbar,
      } : null,
    };
  });

  const renderLayers = () => {
    const nodes = query.getSerializedNodes();
    return Object.entries(nodes).map(([id, node]: [string, any]) => {
      const isSelected = selected?.id === id;
      return (
        <div
          key={id}
          onClick={() => actions.selectNode(id)}
          className={`p-2 cursor-pointer rounded text-sm transition-colors ${
            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          {node.displayName || node.type?.resolvedName || "Element"}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Properties
        </h3>
      </div>
      <ScrollArea className="flex-1">
        {selected?.settings ? (
          <div className="p-4">
            <h4 className="text-sm font-medium mb-4">
              Editing: {selected.name}
            </h4>
            {/* Settings component will be rendered here */}
            <div id="craft-settings-panel" />
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Layers
              </h4>
              <div className="space-y-1">
                {renderLayers()}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Select an element to edit its properties
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
