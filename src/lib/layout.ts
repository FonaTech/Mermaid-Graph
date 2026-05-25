import ELK from 'elkjs/lib/elk.bundled.js';
import type { Edge, Node } from '@xyflow/react';
import type { MermaidNodeData } from '../types';

const elk = new ELK();

export async function layoutFlow<NodeType extends Node<MermaidNodeData>, EdgeType extends Edge>(
  nodes: NodeType[],
  edges: EdgeType[],
  direction = 'RIGHT',
) {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': '54',
      'elk.layered.spacing.nodeNodeBetweenLayers': '82',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: node.width ?? 220,
      height: node.height ?? 86,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
  const result = await elk.layout(graph);
  const positions = new Map(result.children?.map((child) => [child.id, child]));
  return nodes.map((node) => {
    const position = positions.get(node.id);
    return {
      ...node,
      position: {
        x: position?.x ?? node.position.x,
        y: position?.y ?? node.position.y,
      },
    };
  }) as NodeType[];
}
