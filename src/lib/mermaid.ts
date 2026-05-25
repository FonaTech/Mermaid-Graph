import mermaid from 'mermaid';
import type {
  DiagramKind,
  MermaidClassDef,
  MermaidEdgeData,
  MermaidNodeData,
  MermaidSubgraph,
  ParsedFlowchart,
} from '../types';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base',
  themeVariables: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

export async function renderMermaid(code: string, id: string): Promise<string> {
  const { svg } = await mermaid.render(`mermaid-${id}`, normalizeMermaidForRender(code));
  return svg;
}

function normalizeMermaidForRender(code: string): string {
  return code
    .split('\n')
    .map((line) =>
      line
        .replace(/\/\*.*?\*\//g, '')
        .replace(/^\s*linkStyle\s+.+$/i, '')
        .replace(
          /(^|\s)([A-Za-z0-9µ_\-.]+)\[([^\]\n]*(?:<[^>\n]+>|\([^)\n]*\))[^\]\n]*)\](:::[A-Za-z0-9_-]+)?/g,
          (_match, prefix: string, id: string, body: string, className = '') => {
            const escaped = body.replace(/"/g, '#quot;');
            return `${prefix}${id}["${escaped}"]${className}`;
          },
        ),
    )
    .join('\n');
}

export function detectDiagramKind(code: string): DiagramKind {
  const head = code.trim().slice(0, 120).toLowerCase();
  if (head.startsWith('graph ') || head.startsWith('flowchart ')) return 'flowchart';
  if (head.startsWith('sequenceDiagram'.toLowerCase())) return 'sequence';
  if (head.startsWith('classDiagram'.toLowerCase())) return 'class';
  if (head.startsWith('stateDiagram'.toLowerCase())) return 'state';
  return 'other';
}

function parseNodeToken(token: string): MermaidNodeData | null {
  const match = token.trim().match(/^([^\[\(\{]+)\s*([[\(\{]{1})(.*)([\]\)\}]{1})(?:::(.+))?$/);
  if (!match) return null;
  const [, id, open, body, close, className] = match;
  const label = body.trim().replace(/<br\/>/gi, '\n').replace(/<B>|<\/B>/gi, '');
  let shape: MermaidNodeData['shape'] = 'rect';
  if (open === '(' && close === ')') shape = 'round';
  if (open === '[' && close === ']') shape = 'rect';
  if (open === '{' && close === '}') shape = 'diamond';
  if (open === '(' && close === ']') shape = 'stadium';
  return { id: id.trim(), label, rawLabel: body.trim(), shape, className: className?.trim() };
}

function edgeArrow(op: string): MermaidEdgeData['arrow'] {
  if (op.includes('<-->')) return '<-->';
  if (op.includes('-.->')) return '-.->';
  if (op.includes('==>')) return '==>';
  if (op.includes('-->')) return '-->';
  if (op.includes('<--')) return '<--';
  if (op.includes('<-')) return '<-';
  if (op.includes('-.')) return '-.-';
  return '->';
}

function stripInlineComment(line: string): string {
  return line.replace(/\/\*.*?\*\//g, '').trim();
}

function parseEdgeLine(line: string, index: number): MermaidEdgeData[] {
  const cleaned = stripInlineComment(line).replace(/;$/, '').trim();
  const edgePattern = /(<-->|-.->|-->|==>|<--|<-|-.-)\s*(?:\|([^|]+)\|)?/g;
  const matches = [...cleaned.matchAll(edgePattern)];
  if (!matches.length) return [];

  const edges: MermaidEdgeData[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const next = matches[i + 1];
    const sourceStart = i === 0 ? 0 : (matches[i - 1].index ?? 0) + matches[i - 1][0].length;
    const source = cleaned.slice(sourceStart, match.index).trim();
    const targetEnd = next?.index ?? cleaned.length;
    const target = cleaned.slice((match.index ?? 0) + match[0].length, targetEnd).trim();
    if (!source || !target) continue;
    edges.push({
      id: `edge-${index + i}`,
      source,
      target,
      label: match[2]?.trim(),
      arrow: edgeArrow(match[1]),
    });
  }
  return edges;
}

export function parseFlowchart(code: string): ParsedFlowchart {
  const lines = code.split('\n');
  let direction = 'TB';
  const nodes: MermaidNodeData[] = [];
  const edges: MermaidEdgeData[] = [];
  const subgraphs: ParsedFlowchart['subgraphs'] = [];
  const classDefs: MermaidClassDef[] = [];
  const classAssignments: ParsedFlowchart['classAssignments'] = [];
  const linkStyles: Record<number, string> = {};
  let defaultLinkStyle: string | undefined;
  let title: string | undefined;
  const stack: { id: string; label: string; direction?: string }[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith('%%')) continue;
    if (/^(graph|flowchart)\s+/i.test(line)) {
      const match = line.match(/^(graph|flowchart)\s+([A-Z]{2})/i);
      if (match) direction = match[2].toUpperCase();
      continue;
    }
    if (/^direction\s+/i.test(line)) {
      const match = line.match(/^direction\s+([A-Z]{2})/i);
      if (match && stack.length) stack[stack.length - 1].direction = match[1].toUpperCase();
      continue;
    }
    const subgraphMatch = line.match(/^subgraph\s+([^\[]+)(?:\s+\[(.+)\])?/i);
    if (subgraphMatch) {
      const id = subgraphMatch[1].trim();
      const label = subgraphMatch[2]?.trim() ?? id;
      nodes.push({
        id,
        label,
        rawLabel: label,
        shape: 'rect',
        parentId: stack[stack.length - 1]?.id,
        isSubgraph: true,
      });
      stack.push({
        id,
        label,
      });
      continue;
    }
    if (/^end$/i.test(line)) {
      const item = stack.pop();
      if (item) {
        const children = nodes
          .filter((node) => node.parentId === item.id && node.id !== item.id)
          .map((node) => node.id);
        subgraphs.push({
          id: item.id,
          label: item.label,
          direction: item.direction,
          parentId: nodes.find((node) => node.id === item.id)?.parentId,
          nodes: children,
        });
      }
      continue;
    }
    if (/^classDef\s+/i.test(line)) {
      const [, name, rest] = line.match(/^classDef\s+([^\s]+)\s+(.+)$/i) ?? [];
      if (name && rest) classDefs.push({ name: name.trim(), raw: rest.trim().replace(/;$/, '') });
      continue;
    }
    if (/^class\s+/i.test(line)) {
      const [, ids, classes] = line.match(/^class\s+(.+?)\s+(.+)$/i) ?? [];
      if (ids && classes) {
        ids.split(',').forEach((id) =>
          classAssignments.push({
            nodeId: id.trim(),
            classNames: classes.split(',').map((c) => c.trim()).filter(Boolean),
          }),
        );
      }
      continue;
    }
    if (/^linkStyle\s+/i.test(line)) {
      const match = line.match(/^linkStyle\s+([0-9,]+|default)\s+(.+)$/i);
      if (match && match[1] === 'default') {
        defaultLinkStyle = match[2].replace(/;$/, '').trim();
      } else if (match) {
        match[1].split(',').forEach((indexText) => {
          const idx = Number(indexText.trim());
          if (!Number.isNaN(idx)) linkStyles[idx] = match[2].replace(/;$/, '').trim();
        });
      }
      continue;
    }
    if (line.includes('-->') || line.includes('==>') || line.includes('<-->') || line.includes('-.->') || line.includes('<--') || line.includes('<-') || line.includes('-.-')) {
      const parsedEdges = parseEdgeLine(line, edges.length);
      if (parsedEdges.length) {
        edges.push(...parsedEdges);
        continue;
      }
    }
    const nodeTokenMatch = line.match(/^([^=\-].*?)\s*(?:::.*)?$/);
    if (nodeTokenMatch) {
      const node = parseNodeToken(nodeTokenMatch[1]);
      if (node) {
        if (stack.length) node.parentId = stack[stack.length - 1].id;
        nodes.push(node);
        if (node.id === 'Title') title = node.label;
        continue;
      }
    }
  }

  return {
    direction,
    title,
    nodes,
    edges,
    subgraphs,
    classDefs,
    classAssignments,
    linkStyles,
    defaultLinkStyle,
    rawLines: lines,
  };
}

export function serializeFlowchart(parsed: ParsedFlowchart): string {
  const lines: string[] = [`graph ${parsed.direction}`];
  const classDefMap = new Map(parsed.classDefs.map((item) => [item.name, item.raw]));
  const classByNode = new Map(parsed.classAssignments.map((item) => [item.nodeId, item.classNames.join(',')]));
  const nodes = parsed.nodes;
  const edges = parsed.edges;
  const subgraphMap = new Map(parsed.subgraphs.map((item) => [item.id, item]));
  const childrenByParent = new Map<string, MermaidNodeData[]>();
  const rootNodes: MermaidNodeData[] = [];

  nodes.forEach((node) => {
    if (node.parentId) {
      const children = childrenByParent.get(node.parentId) ?? [];
      children.push(node);
      childrenByParent.set(node.parentId, children);
    } else {
      rootNodes.push(node);
    }
  });

  const serializeNode = (node: MermaidNodeData, indent = '    ') => {
    if (node.isSubgraph) {
      const subgraph = subgraphMap.get(node.id);
      lines.push(`${indent}subgraph ${node.id} [${node.label}]`);
      if (subgraph?.direction) lines.push(`${indent}    direction ${subgraph.direction}`);
      (childrenByParent.get(node.id) ?? []).forEach((child) => serializeNode(child, `${indent}    `));
      lines.push(`${indent}end`);
      return;
    }
    let body = node.rawLabel && node.rawLabel.replace(/<br\/>/gi, '\n').replace(/<B>|<\/B>/gi, '') === node.label
      ? node.rawLabel
      : node.label.replace(/\n/g, '<br/>');
    if (!/[<][B][>]/i.test(body) && node.id === 'Title') body = `<B>${body}</B>`;
    let token = `${node.id}[${body}]`;
    if (node.shape === 'round') token = `${node.id}(${body})`;
    if (node.shape === 'diamond') token = `${node.id}{${body}}`;
    if (node.shape === 'stadium') token = `${node.id}([${body}])`;
    if (node.className) token += `:::${node.className}`;
    lines.push(`${indent}${token}`);
  };

  for (const node of rootNodes) {
    serializeNode(node, '');
  }

  for (const edge of edges) {
    const op = edge.arrow;
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`${edge.source} ${op}${label ? ` ${label} ` : ' '} ${edge.target}`.replace(/\s+/g, ' ').trim());
  }

  for (const [name, raw] of classDefMap.entries()) {
    lines.push(`classDef ${name} ${raw}`);
  }

  for (const [nodeId, classNames] of classByNode.entries()) {
    lines.push(`class ${nodeId} ${classNames}`);
  }

  if (parsed.defaultLinkStyle) {
    lines.push(`linkStyle default ${parsed.defaultLinkStyle}`);
  }

  Object.entries(parsed.linkStyles).forEach(([index, style]) => {
    lines.push(`linkStyle ${index} ${style}`);
  });

  return lines.join('\n');
}

export function createUniqueId(prefix: string, existing: string[]): string {
  let index = 1;
  let id = `${prefix}${index}`;
  while (existing.includes(id)) {
    index += 1;
    id = `${prefix}${index}`;
  }
  return id;
}
