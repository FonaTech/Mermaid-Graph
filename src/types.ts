export type DiagramKind = 'flowchart' | 'sequence' | 'class' | 'state' | 'other';

export type NodeShape =
  | 'rect'
  | 'round'
  | 'stadium'
  | 'subroutine'
  | 'cylinder'
  | 'circle'
  | 'diamond';

export interface MermaidNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  rawLabel?: string;
  shape: NodeShape;
  className?: string;
  style?: string;
  parentId?: string;
  isSubgraph?: boolean;
}

export interface MermaidEdgeData extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: string;
  arrow: '->' | '-->' | '==>' | '-.->' | '<-->' | '<--' | '<-' | '-.-';
}

export interface MermaidClassDef {
  name: string;
  raw: string;
}

export interface MermaidProject {
  id: string;
  name: string;
  kind: DiagramKind;
  code: string;
  description?: string;
  updatedAt: number;
}

export interface MermaidSubgraph {
  id: string;
  label: string;
  direction?: string;
  nodes: string[];
  parentId?: string;
}

export interface ParsedFlowchart {
  direction: string;
  title?: string;
  nodes: MermaidNodeData[];
  edges: MermaidEdgeData[];
  subgraphs: MermaidSubgraph[];
  classDefs: MermaidClassDef[];
  classAssignments: { nodeId: string; classNames: string[] }[];
  linkStyles: Record<number, string>;
  defaultLinkStyle?: string;
  rawLines: string[];
}

export interface EditorSettings {
  theme: 'light' | 'dark' | 'paper';
  previewScale: number;
  showGrid: boolean;
}
