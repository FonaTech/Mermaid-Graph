import '@xyflow/react/dist/style.css';

import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { GitBranchPlus, LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createUniqueId, parseFlowchart, serializeFlowchart } from '../lib/mermaid';
import { layoutFlow } from '../lib/layout';
import type { MermaidEdgeData, MermaidNodeData, ParsedFlowchart } from '../types';

type FlowNode = Node<MermaidNodeData>;
type FlowEdge = Edge<MermaidEdgeData>;

interface VisualEditorProps {
  code: string;
  onCodeChange: (value: string) => void;
  readOnly: boolean;
}

const nodeColors: Record<string, string> = {
  title: '#f4f8ff',
  coreNode: '#ffe189',
  scale: '#d8ebff',
  method: '#e7f8e6',
  result: '#ffe5e5',
  limit: '#f8f8f8',
};

function toFlow(parsed: ParsedFlowchart): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = parsed.nodes.map((item, index) => ({
    id: item.id,
    type: 'default',
    position: { x: 80 + (index % 3) * 260, y: 80 + Math.floor(index / 3) * 150 },
    data: item,
    style: {
      width: 220,
      minHeight: 64,
      borderRadius: item.isSubgraph ? 8 : item.className === 'coreNode' ? 10 : 7,
      border: item.isSubgraph
        ? '1px dashed #7b8da5'
        : item.className === 'coreNode' || item.className === 'result'
          ? '2px solid #996a10'
          : '1px solid #6c7a89',
      background: item.isSubgraph ? '#eef4fb' : nodeColors[item.className ?? ''] ?? '#ffffff',
      color: '#18212f',
      fontSize: item.className === 'title' ? 16 : 13,
      fontWeight: item.className === 'title' || item.className === 'coreNode' || item.className === 'result' ? 700 : 500,
      boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
    },
  }));
  const edges: FlowEdge[] = parsed.edges.map((item) => ({
    id: item.id,
    source: item.source,
    target: item.target,
    label: item.label,
    data: item,
    animated: item.arrow.includes('==>') || item.arrow.includes('<-->'),
    style: {
      strokeWidth: item.arrow.includes('==>') ? 2.8 : 1.6,
      stroke: item.arrow.includes('-.') ? '#b8860b' : '#2b3440',
      strokeDasharray: item.arrow.includes('-.') ? '5 5' : undefined,
    },
  }));
  return { nodes, edges };
}

function fromFlow(base: ParsedFlowchart, nodes: FlowNode[], edges: FlowEdge[]) {
  return serializeFlowchart({
    ...base,
    nodes: nodes.map((node) => {
      const previous = base.nodes.find((item) => item.id === node.data.id || item.id === node.id);
      return {
        ...previous,
        ...node.data,
        id: node.id,
        label: node.data.label,
      };
    }),
    edges: edges.map((edge, index) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === 'string' ? edge.label : edge.data?.label,
      arrow: edge.data?.arrow ?? '-->',
      style: edge.data?.style,
    })),
    linkStyles: Object.fromEntries(
      Object.entries(base.linkStyles).filter(([index]) => Number(index) < edges.length),
    ),
  });
}

export function VisualEditor({ code, onCodeChange, readOnly }: VisualEditorProps) {
  const parsed = useMemo(() => parseFlowchart(code), [code]);
  const initialFlow = useMemo(() => toFlow(parsed), [parsed]);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialFlow.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  useEffect(() => {
    setNodes(initialFlow.nodes);
    setEdges(initialFlow.edges);
  }, [initialFlow, setEdges, setNodes]);

  const syncCode = useCallback(
    (nextNodes: FlowNode[], nextEdges: FlowEdge[]) => {
      if (readOnly) return;
      onCodeChange(fromFlow(parsed, nextNodes, nextEdges));
    },
    [onCodeChange, parsed, readOnly],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const data: MermaidEdgeData = {
        id: `edge-${Date.now()}`,
        source: connection.source ?? '',
        target: connection.target ?? '',
        arrow: '-->',
      };
      const nextEdges = addEdge<FlowEdge>({ ...connection, id: data.id, data }, edges);
      setEdges(nextEdges);
      syncCode(nodes, nextEdges);
    },
    [edges, nodes, setEdges, syncCode],
  );

  const addNode = () => {
    const id = createUniqueId('Node', nodes.map((node) => node.id));
    const data: MermaidNodeData = {
      id,
      label: 'New Node',
      shape: 'rect',
      className: 'method',
    };
    const nextNodes = [
      ...nodes,
      {
        id,
        position: { x: 80 + nodes.length * 24, y: 80 + nodes.length * 24 },
        data,
      style: {
        width: 220,
        minHeight: 64,
        borderRadius: 7,
        background: nodeColors.method,
          border: '1px solid #3f7f45',
        },
      },
    ];
    setNodes(nextNodes);
    syncCode(nextNodes, edges);
  };

  const deleteSelection = () => {
    let nextNodes = nodes;
    let nextEdges = edges;
    if (selectedNode) {
      nextNodes = nodes.filter((node) => node.id !== selectedNode);
      nextEdges = edges.filter((edge) => edge.source !== selectedNode && edge.target !== selectedNode);
      setSelectedNode(null);
    }
    if (selectedEdge) {
      nextEdges = nextEdges.filter((edge) => edge.id !== selectedEdge);
      setSelectedEdge(null);
    }
    setNodes(nextNodes);
    setEdges(nextEdges);
    syncCode(nextNodes, nextEdges);
  };

  const runLayout = async () => {
    const direction = parsed.direction === 'LR' ? 'RIGHT' : 'DOWN';
    const nextNodes = await layoutFlow(nodes, edges, direction);
    setNodes(nextNodes);
  };

  const updateNode = (patch: Partial<MermaidNodeData>) => {
    const previousId = selectedNode;
    const nextId = typeof patch.id === 'string' && patch.id.trim() ? patch.id.trim() : previousId;
    const nextNodes = nodes.map((node) =>
      node.id === previousId
        ? { ...node, id: nextId ?? node.id, data: { ...node.data, ...patch, id: nextId ?? node.id } }
        : node,
    );
    const nextEdges = edges.map((edge) => ({
      ...edge,
      source: edge.source === previousId ? nextId ?? edge.source : edge.source,
      target: edge.target === previousId ? nextId ?? edge.target : edge.target,
      data: {
        ...(edge.data as MermaidEdgeData),
        source: edge.source === previousId ? nextId ?? edge.source : edge.source,
        target: edge.target === previousId ? nextId ?? edge.target : edge.target,
      },
    }));
    if (nextId !== previousId) setSelectedNode(nextId ?? null);
    setNodes(nextNodes);
    setEdges(nextEdges);
    syncCode(nextNodes, nextEdges);
  };

  const updateEdge = (patch: Partial<MermaidEdgeData>) => {
    const nextEdges = edges.map((edge) =>
      edge.id === selectedEdge
        ? {
            ...edge,
            label: patch.label ?? edge.label,
            data: { ...(edge.data as MermaidEdgeData), ...patch },
          }
        : edge,
    );
    setEdges(nextEdges);
    syncCode(nodes, nextEdges);
  };

  const currentNode = nodes.find((node) => node.id === selectedNode);
  const currentEdge = edges.find((edge) => edge.id === selectedEdge);

  if (readOnly) {
    return (
      <div className="visual-readonly">
        <GitBranchPlus size={22} />
        <strong>当前图类型支持代码预览与导出</strong>
        <p>结构化图形编辑首版聚焦 Flowchart。你仍可在代码模式编辑任意 Mermaid 图。</p>
      </div>
    );
  }

  return (
    <div className="visual-editor">
      <div className="flow-toolbar">
        <button onClick={addNode}>
          <Plus size={16} />
          节点
        </button>
        <button onClick={runLayout}>
          <LayoutTemplate size={16} />
          自动布局
        </button>
        <button onClick={deleteSelection} disabled={!selectedNode && !selectedEdge}>
          <Trash2 size={16} />
          删除
        </button>
      </div>

      <div className="flow-area">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          onNodeClick={(_, node) => {
            setSelectedNode(node.id);
            setSelectedEdge(null);
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdge(edge.id);
            setSelectedNode(null);
          }}
          onPaneClick={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        >
          <Background color="#d4dbe7" gap={18} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>

      <div className="property-panel">
        {currentNode ? (
          <>
            <span className="panel-eyebrow">节点属性</span>
            <label>
              ID
              <input value={currentNode.data.id} onChange={(event) => updateNode({ id: event.target.value })} />
            </label>
            <label>
              标题
              <textarea value={currentNode.data.label} onChange={(event) => updateNode({ label: event.target.value })} />
            </label>
            <label>
              样式类
              <select
                value={currentNode.data.className ?? ''}
                onChange={(event) => updateNode({ className: event.target.value || undefined })}
                disabled={currentNode.data.isSubgraph}
              >
                <option value="">none</option>
                <option value="title">title</option>
                <option value="coreNode">coreNode</option>
                <option value="scale">scale</option>
                <option value="method">method</option>
                <option value="result">result</option>
                <option value="limit">limit</option>
              </select>
            </label>
          </>
        ) : currentEdge ? (
          <>
            <span className="panel-eyebrow">连线属性</span>
            <label>
              标签
              <input
                value={(currentEdge.label as string | undefined) ?? ''}
                onChange={(event) => updateEdge({ label: event.target.value })}
              />
            </label>
            <label>
              线型
              <select
                value={currentEdge.data?.arrow ?? '-->'}
                onChange={(event) => updateEdge({ arrow: event.target.value as MermaidEdgeData['arrow'] })}
              >
                <option value="-->">arrow</option>
                <option value="==>">strong</option>
                <option value="-.->">dotted arrow</option>
                <option value="-.-">dotted</option>
                <option value="<-->">both ways</option>
              </select>
            </label>
          </>
        ) : (
          <div className="empty-properties">
            <strong>选择节点或连线</strong>
            <p>在画布中选择元素后，可调整文本、样式类和连线标签。</p>
          </div>
        )}
      </div>
    </div>
  );
}
