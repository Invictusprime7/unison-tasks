import { RenderEngine, RenderObject, Transform, SelectionBounds } from './RenderEngine';

export class Canvas2DRenderer extends RenderEngine {
  private ctx: CanvasRenderingContext2D;
  private layerOrder: string[] = [];
  private offscreenCanvas?: OffscreenCanvas;
  private offscreenCtx?: OffscreenCanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Try to use OffscreenCanvas for better performance
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    }
  }

  render(): void {
    const renderCtx = this.offscreenCtx || this.ctx;
    
    // Clear canvas
    renderCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    renderCtx.fillStyle = '#ffffff';
    renderCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid if enabled
    if (this.grid) {
      this.drawGrid(renderCtx);
    }

    // Render objects in layer order
    for (const id of this.layerOrder) {
      const obj = this.objects.get(id);
      if (obj && obj.visible) {
        this.renderObject(renderCtx, obj);
      }
    }

    // Draw selection bounds
    if (this.selectedIds.size > 0) {
      this.drawSelectionBounds(renderCtx);
    }

    // Copy offscreen to main canvas if using OffscreenCanvas
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.ctx.drawImage(this.offscreenCanvas as any, 0, 0);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const gridSize = 20;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let x = 0; x < this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  private renderObject(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: RenderObject): void {
    ctx.save();
    
    // Apply transform
    ctx.translate(obj.transform.x, obj.transform.y);
    ctx.rotate((obj.transform.rotation * Math.PI) / 180);
    ctx.scale(obj.transform.scaleX, obj.transform.scaleY);
    ctx.globalAlpha = obj.transform.opacity;

    // Apply blend mode
    ctx.globalCompositeOperation = obj.blendMode as GlobalCompositeOperation;

    // Render based on type
    switch (obj.type) {
      case 'shape':
        this.renderShape(ctx, obj);
        break;
      case 'text':
        this.renderText(ctx, obj);
        break;
      case 'image':
        this.renderImage(ctx, obj);
        break;
    }

    ctx.restore();
  }

  private renderShape(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: RenderObject): void {
    const { shape, fill, stroke, width, height } = obj.data;
    
    ctx.fillStyle = fill || '#000000';
    ctx.strokeStyle = stroke || '#000000';

    if (shape === 'rect') {
      ctx.fillRect(-width / 2, -height / 2, width, height);
      if (stroke) ctx.strokeRect(-width / 2, -height / 2, width, height);
    } else if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, width / 2, 0, 2 * Math.PI);
      ctx.fill();
      if (stroke) ctx.stroke();
    }
  }

  private renderText(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: RenderObject): void {
    const { text, fontSize, fontFamily, fill } = obj.data;
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fill || '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
  }

  private renderImage(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, obj: RenderObject): void {
    if (obj.data.image) {
      const { width, height } = obj.data;
      ctx.drawImage(obj.data.image, -width / 2, -height / 2, width, height);
    }
  }

  private drawSelectionBounds(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const bounds = this.getSelectedBounds();
    if (!bounds) return;

    ctx.save();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    ctx.rotate((bounds.rotation * Math.PI) / 180);
    ctx.strokeRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
    
    ctx.restore();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
    }
    
    this.render();
  }

  addObject(obj: RenderObject): void {
    this.objects.set(obj.id, obj);
    this.layerOrder.push(obj.id);
    this.render();
  }

  removeObject(id: string): void {
    this.objects.delete(id);
    this.layerOrder = this.layerOrder.filter(lid => lid !== id);
    this.selectedIds.delete(id);
    this.render();
  }

  updateObject(id: string, updates: Partial<RenderObject>): void {
    const obj = this.objects.get(id);
    if (obj) {
      Object.assign(obj, updates);
      this.render();
    }
  }

  getObject(id: string): RenderObject | undefined {
    return this.objects.get(id);
  }

  selectObjects(ids: string[]): void {
    this.selectedIds.clear();
    ids.forEach(id => this.selectedIds.add(id));
    this.render();
  }

  getSelectedBounds(): SelectionBounds | null {
    if (this.selectedIds.size === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    this.selectedIds.forEach(id => {
      const obj = this.objects.get(id);
      if (obj) {
        const { x, y } = obj.transform;
        const width = obj.data.width || 100;
        const height = obj.data.height || 100;
        
        minX = Math.min(minX, x - width / 2);
        minY = Math.min(minY, y - height / 2);
        maxX = Math.max(maxX, x + width / 2);
        maxY = Math.max(maxY, y + height / 2);
      }
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0
    };
  }

  hitTest(x: number, y: number): string | null {
    // Test in reverse layer order (top to bottom)
    for (let i = this.layerOrder.length - 1; i >= 0; i--) {
      const id = this.layerOrder[i];
      const obj = this.objects.get(id);
      
      if (obj && obj.visible && !obj.locked) {
        const width = obj.data.width || 100;
        const height = obj.data.height || 100;
        const { x: objX, y: objY } = obj.transform;
        
        if (
          x >= objX - width / 2 &&
          x <= objX + width / 2 &&
          y >= objY - height / 2 &&
          y <= objY + height / 2
        ) {
          return id;
        }
      }
    }
    
    return null;
  }

  applyTransform(id: string, transform: Partial<Transform>): void {
    const obj = this.objects.get(id);
    if (obj) {
      Object.assign(obj.transform, transform);
      this.render();
    }
  }

  bringToFront(id: string): void {
    this.layerOrder = this.layerOrder.filter(lid => lid !== id);
    this.layerOrder.push(id);
    this.render();
  }

  sendToBack(id: string): void {
    this.layerOrder = this.layerOrder.filter(lid => lid !== id);
    this.layerOrder.unshift(id);
    this.render();
  }

  async exportToImage(format: 'png' | 'jpeg', quality = 1.0): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to export image'));
        },
        `image/${format}`,
        quality
      );
    });
  }

  exportToJSON(): any {
    return {
      objects: Array.from(this.objects.values()),
      layerOrder: this.layerOrder
    };
  }

  loadFromJSON(data: any): void {
    this.objects.clear();
    this.layerOrder = data.layerOrder || [];
    
    data.objects?.forEach((obj: RenderObject) => {
      this.objects.set(obj.id, obj);
    });
    
    this.render();
  }
}
