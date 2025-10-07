import { Canvas as FabricCanvas, Rect, Circle, IText, FabricImage } from 'fabric';
import type { AIGeneratedTemplate, TemplateComponent } from '@/types/template';
import { LayoutEngine, type LayoutResult } from './layoutEngine';

export class TemplateRenderer {
  private canvas: FabricCanvas;
  private layoutEngine: LayoutEngine;

  constructor(canvas: FabricCanvas) {
    this.canvas = canvas;
    this.layoutEngine = new LayoutEngine();
  }

  /**
   * Render AI-generated template to Fabric canvas
   */
  async renderTemplate(template: AIGeneratedTemplate, data?: Record<string, any>) {
    const mergedData = { ...template.data, ...data };
    this.canvas.clear();

    // Set canvas size based on first variant
    if (template.variants.length > 0) {
      const variant = template.variants[0];
      this.canvas.setWidth(variant.size.width);
      this.canvas.setHeight(variant.size.height);
    }

    // Render each section
    let currentY = 0;
    for (const section of template.sections) {
      // Calculate layout using Yoga
      const layout = this.layoutEngine.applyLayout(section);
      
      // Render components based on calculated layout
      await this.renderSection(section, layout, mergedData, 0, currentY);
      
      currentY += layout.height;
    }

    this.canvas.renderAll();
  }

  private async renderSection(
    section: any,
    layout: LayoutResult,
    data: Record<string, any>,
    offsetX: number,
    offsetY: number
  ) {
    for (const component of section.components) {
      const componentLayout = layout.components.find((l) => l.id === component.id);
      if (!componentLayout) continue;

      const x = offsetX + componentLayout.x;
      const y = offsetY + componentLayout.y;

      await this.renderComponent(component, data, x, y, componentLayout.width, componentLayout.height);
    }
  }

  private async renderComponent(
    component: TemplateComponent,
    data: Record<string, any>,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    // Get data value if bound
    let value = component.dataBinding?.defaultValue || '';
    if (component.dataBinding && data[component.dataBinding.field] !== undefined) {
      value = data[component.dataBinding.field];
    }

    switch (component.type) {
      case 'shape': {
        const shape = new Rect({
          left: x,
          top: y,
          width,
          height,
          fill: component.style.backgroundColor || '#cccccc',
          rx: component.style.borderRadius || 0,
          ry: component.style.borderRadius || 0,
          opacity: component.style.opacity ?? 1,
          ...component.fabricProps,
        });
        this.canvas.add(shape);
        break;
      }

      case 'text': {
        const text = new IText(String(value), {
          left: x,
          top: y,
          fontSize: component.fabricProps?.fontSize || 16,
          fontFamily: component.fabricProps?.fontFamily || 'Arial',
          fill: component.fabricProps?.fill || '#000000',
          fontWeight: component.fabricProps?.fontWeight || 'normal',
          opacity: component.style.opacity ?? 1,
          ...component.fabricProps,
        });
        this.canvas.add(text);
        break;
      }

      case 'image': {
        if (value && typeof value === 'string') {
          try {
            const img = await FabricImage.fromURL(value);
            img.set({
              left: x,
              top: y,
              scaleX: width / (img.width || 1),
              scaleY: height / (img.height || 1),
              opacity: component.style.opacity ?? 1,
            });
            this.canvas.add(img);
          } catch (error) {
            console.error('Error loading image:', error);
          }
        }
        break;
      }

      case 'button': {
        // Render as rectangle + text
        const button = new Rect({
          left: x,
          top: y,
          width,
          height,
          fill: component.style.backgroundColor || '#007bff',
          rx: component.style.borderRadius || 4,
          ry: component.style.borderRadius || 4,
          opacity: component.style.opacity ?? 1,
        });
        this.canvas.add(button);

        const buttonText = new IText(String(value), {
          left: x + width / 2,
          top: y + height / 2,
          fontSize: component.fabricProps?.fontSize || 16,
          fontFamily: component.fabricProps?.fontFamily || 'Arial',
          fill: component.fabricProps?.fill || '#ffffff',
          originX: 'center',
          originY: 'center',
        });
        this.canvas.add(buttonText);
        break;
      }

      case 'container': {
        // Containers are just layout containers, render children
        if (component.children) {
          for (const child of component.children) {
            await this.renderComponent(child, data, x, y, width, height);
          }
        }
        break;
      }
    }
  }
}
