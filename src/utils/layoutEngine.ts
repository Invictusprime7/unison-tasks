import Yoga, { Node } from 'yoga-layout';
import type { LayoutConstraints, TemplateComponent, TemplateSection } from '@/types/template';

export class LayoutEngine {
  private yoga: typeof Yoga;

  constructor() {
    this.yoga = Yoga;
  }

  /**
   * Apply Yoga layout constraints to calculate positions and sizes
   */
  applyLayout(section: TemplateSection): LayoutResult {
    const rootNode = this.createYogaNode(section.constraints);
    const componentNodes = new Map<string, Node>();

    // Build Yoga tree
    section.components.forEach(component => {
      const node = this.buildComponentTree(component, componentNodes);
      rootNode.insertChild(node, rootNode.getChildCount());
    });

    // Calculate layout
    rootNode.calculateLayout(
      section.constraints.width.value,
      section.constraints.height.value,
      this.yoga.DIRECTION_LTR
    );

    // Extract computed layout
    const results = this.extractLayout(rootNode, section.components, componentNodes);

    // Cleanup
    this.freeNode(rootNode);

    return results;
  }

  private createYogaNode(constraints: LayoutConstraints): Node {
    const node = this.yoga.Node.create();

    // Width
    if (constraints.width.mode === 'fixed' && constraints.width.value !== undefined) {
      node.setWidth(constraints.width.value);
    } else if (constraints.width.mode === 'fill') {
      node.setWidthPercent(100);
    } else if (constraints.width.mode === 'hug') {
      node.setWidthAuto();
    }

    // Height
    if (constraints.height.mode === 'fixed' && constraints.height.value !== undefined) {
      node.setHeight(constraints.height.value);
    } else if (constraints.height.mode === 'fill') {
      node.setHeightPercent(100);
    } else if (constraints.height.mode === 'hug') {
      node.setHeightAuto();
    }

    // Padding
    if (constraints.padding) {
      node.setPadding(Yoga.EDGE_TOP, constraints.padding.top);
      node.setPadding(Yoga.EDGE_RIGHT, constraints.padding.right);
      node.setPadding(Yoga.EDGE_BOTTOM, constraints.padding.bottom);
      node.setPadding(Yoga.EDGE_LEFT, constraints.padding.left);
    }

    // Margin
    if (constraints.margin) {
      node.setMargin(Yoga.EDGE_TOP, constraints.margin.top);
      node.setMargin(Yoga.EDGE_RIGHT, constraints.margin.right);
      node.setMargin(Yoga.EDGE_BOTTOM, constraints.margin.bottom);
      node.setMargin(Yoga.EDGE_LEFT, constraints.margin.left);
    }

    // Flex
    if (constraints.flexDirection) {
      node.setFlexDirection(
        constraints.flexDirection === 'row' 
          ? Yoga.FLEX_DIRECTION_ROW 
          : Yoga.FLEX_DIRECTION_COLUMN
      );
    }

    if (constraints.alignItems) {
      const alignMap = {
        'flex-start': Yoga.ALIGN_FLEX_START,
        'center': Yoga.ALIGN_CENTER,
        'flex-end': Yoga.ALIGN_FLEX_END,
        'stretch': Yoga.ALIGN_STRETCH,
      };
      node.setAlignItems(alignMap[constraints.alignItems]);
    }

    if (constraints.justifyContent) {
      const justifyMap = {
        'flex-start': Yoga.JUSTIFY_FLEX_START,
        'center': Yoga.JUSTIFY_CENTER,
        'flex-end': Yoga.JUSTIFY_FLEX_END,
        'space-between': Yoga.JUSTIFY_SPACE_BETWEEN,
        'space-around': Yoga.JUSTIFY_SPACE_AROUND,
      };
      node.setJustifyContent(justifyMap[constraints.justifyContent]);
    }

    if (constraints.gap) {
      node.setGap(Yoga.GUTTER_ALL, constraints.gap);
    }

    return node;
  }

  private buildComponentTree(
    component: TemplateComponent,
    nodeMap: Map<string, Node>
  ): Node {
    const node = this.createYogaNode(component.constraints);
    nodeMap.set(component.id, node);

    if (component.children) {
      component.children.forEach(child => {
        const childNode = this.buildComponentTree(child, nodeMap);
        node.insertChild(childNode, node.getChildCount());
      });
    }

    return node;
  }

  private extractLayout(
    rootNode: Node,
    components: TemplateComponent[],
    nodeMap: Map<string, Node>
  ): LayoutResult {
    const layouts: ComponentLayout[] = [];

    const extractComponentLayout = (component: TemplateComponent, parentX = 0, parentY = 0) => {
      const node = nodeMap.get(component.id);
      if (!node) return;

      const layout: ComponentLayout = {
        id: component.id,
        x: parentX + node.getComputedLeft(),
        y: parentY + node.getComputedTop(),
        width: node.getComputedWidth(),
        height: node.getComputedHeight(),
      };

      layouts.push(layout);

      if (component.children) {
        component.children.forEach(child => {
          extractComponentLayout(child, layout.x, layout.y);
        });
      }
    };

    components.forEach(component => extractComponentLayout(component));

    return {
      width: rootNode.getComputedWidth(),
      height: rootNode.getComputedHeight(),
      components: layouts,
    };
  }

  private freeNode(node: Node) {
    const childCount = node.getChildCount();
    for (let i = 0; i < childCount; i++) {
      this.freeNode(node.getChild(i));
    }
    node.free();
  }
}

export interface ComponentLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  width: number;
  height: number;
  components: ComponentLayout[];
}
