import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Database, Plus, Trash2, Link2, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface DataSource {
  id: string;
  name: string;
  type: "api" | "static" | "database";
  endpoint?: string;
  data?: any[];
}

interface DataBinding {
  id: string;
  elementId: string;
  sourceId: string;
  field: string;
}

interface CMSDataManagerProps {
  selectedObject: any;
  onBindData: (binding: DataBinding) => void;
}

export const CMSDataManager = ({ selectedObject, onBindData }: CMSDataManagerProps) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "products",
      name: "Products",
      type: "static",
      data: [
        { id: 1, name: "Product 1", price: "$99", image: "https://placehold.co/400" },
        { id: 2, name: "Product 2", price: "$149", image: "https://placehold.co/400" },
      ],
    },
  ]);

  const [bindings, setBindings] = useState<DataBinding[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState<{
    name: string;
    type: "api" | "static" | "database";
    endpoint: string;
  }>({
    name: "",
    type: "static",
    endpoint: "",
  });

  const addDataSource = () => {
    if (!newSource.name) {
      toast.error("Please enter a data source name");
      return;
    }

    const source: DataSource = {
      id: `source-${Date.now()}`,
      name: newSource.name,
      type: newSource.type,
      endpoint: newSource.endpoint || undefined,
      data: newSource.type === "static" ? [] : undefined,
    };

    setDataSources([...dataSources, source]);
    toast.success("Data source added");
    setShowAddSource(false);
    setNewSource({ name: "", type: "static", endpoint: "" });
  };

  const deleteDataSource = (id: string) => {
    setDataSources(prev => prev.filter(source => source.id !== id));
    toast.success("Data source removed");
  };

  const createBinding = (sourceId: string, field: string) => {
    if (!selectedObject) {
      toast.error("Please select an element first");
      return;
    }

    const binding: DataBinding = {
      id: `binding-${Date.now()}`,
      elementId: selectedObject.id || "unknown",
      sourceId,
      field,
    };

    setBindings([...bindings, binding]);
    onBindData(binding);
    toast.success("Data binding created");
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          CMS & Data Binding
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Connect elements to data sources
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Data Sources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data Sources ({dataSources.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setShowAddSource(!showAddSource)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {showAddSource && (
              <div className="border border-border rounded-lg p-3 space-y-3 mb-3">
                <div>
                  <Label className="text-xs mb-1 block">Name</Label>
                  <Input
                    placeholder="My Data Source"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Type</Label>
                  <Select
                    value={newSource.type}
                    onValueChange={(value: any) => setNewSource({ ...newSource, type: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static Data</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newSource.type === "api" || newSource.type === "database") && (
                  <div>
                    <Label className="text-xs mb-1 block">
                      {newSource.type === "api" ? "API Endpoint" : "Database Connection"}
                    </Label>
                    <Input
                      placeholder={newSource.type === "api" ? "https://api.example.com/data" : "database-connection-string"}
                      value={newSource.endpoint}
                      onChange={(e) => setNewSource({ ...newSource, endpoint: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={addDataSource}>
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddSource(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {dataSources.map(source => (
                <div
                  key={source.id}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{source.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {source.type}
                        {source.type === "static" && source.data && ` • ${source.data.length} items`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteDataSource(source.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {(source.type === "api" || source.type === "database") && source.endpoint && (
                    <div className="text-xs text-muted-foreground mb-2 truncate">
                      {source.endpoint}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => {
                        if (selectedObject) {
                          createBinding(source.id, "default");
                        } else {
                          toast.error("Select an element first");
                        }
                      }}
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Bind
                    </Button>
                    {source.type === "api" && (
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Active Bindings */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Active Bindings ({bindings.length})
            </Label>
            {bindings.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                No data bindings yet
              </div>
            ) : (
              <div className="space-y-2">
                {bindings.map(binding => {
                  const source = dataSources.find(s => s.id === binding.sourceId);
                  return (
                    <div
                      key={binding.id}
                      className="border border-border rounded-lg p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{source?.name}</div>
                          <div className="text-muted-foreground">→ Element {binding.elementId}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setBindings(prev => prev.filter(b => b.id !== binding.id))
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Quick Actions
            </Label>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Database className="h-3 w-3 mr-2" />
                Import CSV Data
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <RefreshCw className="h-3 w-3 mr-2" />
                Sync All Sources
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
