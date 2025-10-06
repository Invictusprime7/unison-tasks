// Abstract rendering engine interface for design mode
export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
}

export interface RenderObject {
  id: string;
  type: 'image' | 'text' | 'shape' | 'group';
  transform: Transform;
  visible: boolean;
  locked: boolean;
  blendMode: string;
  filters?: any[];
  data: any;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export abstract class RenderEngine {
  protected canvas: HTMLCanvasElement;
  protected objects: Map<string, RenderObject> = new Map();
  protected selectedIds: Set<string> = new Set();
  protected grid: boolean = false;
  protected snapToGrid: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // Core rendering
  abstract render(): void;
  abstract clear(): void;
  abstract resize(width: number, height: number): void;

  // Object management
  abstract addObject(obj: RenderObject): void;
  abstract removeObject(id: string): void;
  abstract updateObject(id: string, updates: Partial<RenderObject>): void;
  abstract getObject(id: string): RenderObject | undefined;

  // Selection & interaction
  abstract selectObjects(ids: string[]): void;
  abstract getSelectedBounds(): SelectionBounds | null;
  abstract hitTest(x: number, y: number): string | null;

  // Transform operations
  abstract applyTransform(id: string, transform: Partial<Transform>): void;
  abstract bringToFront(id: string): void;
  abstract sendToBack(id: string): void;

  // Export
  abstract exportToImage(format: 'png' | 'jpeg', quality?: number): Promise<Blob>;
  abstract exportToJSON(): any;
  abstract loadFromJSON(data: any): void;

  // Grid & guides
  setGrid(enabled: boolean) {
    this.grid = enabled;
    this.render();
  }

  setSnap(enabled: boolean) {
    this.snapToGrid = enabled;
  }

  dispose() {
    this.objects.clear();
    this.selectedIds.clear();
  }
}
