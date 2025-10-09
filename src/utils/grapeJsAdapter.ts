import type { AIGeneratedTemplate, TemplateSection, TemplateComponent } from '@/types/template';
import type { GrapeJSComponent } from '@/hooks/useGrapeJS';

/**
 * Adapts AI-generated template schemas to GrapeJS component structures
 */
export class GrapeJSAdapter {
  /**
   * Convert template schema to GrapeJS components
   */
  templateToGrapeJS(template: AIGeneratedTemplate): GrapeJSComponent[] {
    const components: GrapeJSComponent[] = [];

    for (const section of template.sections) {
      const sectionComponent = this.sectionToGrapeJS(section, template);
      components.push(sectionComponent);
    }

    return components;
  }

  /**
   * Convert template section to GrapeJS component
   */
  private sectionToGrapeJS(section: TemplateSection, template: AIGeneratedTemplate): GrapeJSComponent {
    const { constraints } = section;
    
    return {
      tagName: 'section',
      attributes: {
        'data-section-id': section.id,
        'data-section-type': section.type,
      },
      style: {
        display: 'flex',
        flexDirection: constraints.flexDirection || 'column',
        alignItems: constraints.alignItems || 'flex-start',
        justifyContent: constraints.justifyContent || 'flex-start',
        gap: `${constraints.gap || 0}px`,
        padding: constraints.padding ? 
          `${constraints.padding.top}px ${constraints.padding.right}px ${constraints.padding.bottom}px ${constraints.padding.left}px` :
          '0',
        minHeight: this.getDimensionValue(constraints.height),
        width: this.getDimensionValue(constraints.width),
      },
      components: section.components.map(comp => this.componentToGrapeJS(comp, template)),
    };
  }

  /**
   * Convert template component to GrapeJS component
   */
  private componentToGrapeJS(component: TemplateComponent, template: AIGeneratedTemplate): GrapeJSComponent {
    const baseStyle = {
      backgroundColor: component.style.backgroundColor,
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : undefined,
      opacity: component.style.opacity,
      width: this.getDimensionValue(component.constraints.width),
      height: this.getDimensionValue(component.constraints.height),
      margin: component.constraints.margin ?
        `${component.constraints.margin.top}px ${component.constraints.margin.right}px ${component.constraints.margin.bottom}px ${component.constraints.margin.left}px` :
        undefined,
      padding: component.constraints.padding ?
        `${component.constraints.padding.top}px ${component.constraints.padding.right}px ${component.constraints.padding.bottom}px ${component.constraints.padding.left}px` :
        undefined,
    };

    // Get data-bound value
    const getValue = () => {
      if (component.dataBinding) {
        return template.data[component.dataBinding.field] || component.dataBinding.defaultValue || '';
      }
      return '';
    };

    switch (component.type) {
      case 'text': {
        const content = getValue() || 'Text';
        return {
          tagName: this.getSemanticTag(component),
          type: 'text',
          content,
          style: {
            ...baseStyle,
            fontSize: component.fabricProps?.fontSize ? `${component.fabricProps.fontSize}px` : '16px',
            fontFamily: component.fabricProps?.fontFamily || 'Arial, sans-serif',
            color: component.fabricProps?.fill || '#000000',
            fontWeight: component.fabricProps?.fontWeight || 'normal',
          },
          attributes: {
            'data-component-id': component.id,
          },
        };
      }

      case 'image': {
        const src = getValue() || 'https://via.placeholder.com/400x300';
        return {
          tagName: 'img',
          type: 'image',
          attributes: {
            src,
            alt: component.name || 'Image',
            'data-component-id': component.id,
          },
          style: {
            ...baseStyle,
            objectFit: 'cover',
          },
        };
      }

      case 'button': {
        const text = getValue() || 'Button';
        return {
          tagName: 'button',
          type: 'button',
          content: text,
          style: {
            ...baseStyle,
            fontSize: component.fabricProps?.fontSize ? `${component.fabricProps.fontSize}px` : '16px',
            fontFamily: component.fabricProps?.fontFamily || 'Arial, sans-serif',
            color: component.fabricProps?.fill || '#ffffff',
            cursor: 'pointer',
            border: 'none',
            padding: '12px 24px',
          },
          attributes: {
            'data-component-id': component.id,
          },
        };
      }

      case 'container': {
        return {
          tagName: 'div',
          type: 'default',
          style: {
            ...baseStyle,
            display: 'flex',
            flexDirection: component.constraints.flexDirection || 'column',
            alignItems: component.constraints.alignItems || 'flex-start',
            justifyContent: component.constraints.justifyContent || 'flex-start',
            gap: `${component.constraints.gap || 0}px`,
          },
          attributes: {
            'data-component-id': component.id,
          },
          components: component.children?.map(child => this.componentToGrapeJS(child, template)) || [],
        };
      }

      case 'shape': {
        return {
          tagName: 'div',
          type: 'default',
          style: baseStyle,
          attributes: {
            'data-component-id': component.id,
          },
        };
      }

      default: {
        return {
          tagName: 'div',
          type: 'default',
          content: 'Unknown component type',
          style: baseStyle,
          attributes: {
            'data-component-id': component.id,
          },
        };
      }
    }
  }

  /**
   * Get semantic HTML tag based on component type and properties
   */
  private getSemanticTag(component: TemplateComponent): string {
    const fontSize = component.fabricProps?.fontSize || 16;
    
    if (fontSize >= 32) return 'h1';
    if (fontSize >= 28) return 'h2';
    if (fontSize >= 24) return 'h3';
    if (fontSize >= 20) return 'h4';
    if (fontSize >= 18) return 'h5';
    
    return 'p';
  }

  /**
   * Convert dimension constraint to CSS value
   */
  private getDimensionValue(constraint: { mode: string; value?: number }): string {
    switch (constraint.mode) {
      case 'fixed':
        return constraint.value ? `${constraint.value}px` : 'auto';
      case 'fill':
        return '100%';
      case 'hug':
        return 'auto';
      default:
        return 'auto';
    }
  }
}
