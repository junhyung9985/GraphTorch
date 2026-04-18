const PASTE_OFFSET = 48;

export function copySelectionToClipboard(nodes, edges, selectedNodeIds) {
  const selectedSet = new Set(selectedNodeIds);
  const selectedNodes = nodes.filter((node) => selectedSet.has(node.id));
  const internalEdges = edges.filter((edge) => selectedSet.has(edge.source) && selectedSet.has(edge.target));

  return {
    nodes: selectedNodes.map(cloneNode),
    edges: internalEdges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
  };
}

export function pasteClipboardSelection(nodes, edges, clipboard) {
  if (!clipboard || clipboard.nodes.length === 0) {
    return { nodes, edges, pastedNodeIds: [] };
  }

  const nodeIdMap = new Map();
  const pastedNodes = clipboard.nodes.map((node) => {
    const nextId = createPastedId(node.id);
    nodeIdMap.set(node.id, nextId);
    return {
      ...cloneNode(node),
      id: nextId,
      position: {
        x: node.position.x + PASTE_OFFSET,
        y: node.position.y + PASTE_OFFSET,
      },
    };
  });

  const pastedEdges = clipboard.edges.map((edge) => ({
    ...edge,
    id: `${nodeIdMap.get(edge.source)}-${nodeIdMap.get(edge.target)}-${createUniqueSuffix()}`,
    source: nodeIdMap.get(edge.source),
    target: nodeIdMap.get(edge.target),
  }));

  return {
    nodes: [...nodes, ...pastedNodes],
    edges: [...edges, ...pastedEdges],
    pastedNodeIds: pastedNodes.map((node) => node.id),
  };
}

function cloneNode(node) {
  return {
    id: node.id,
    type: node.type,
    position: { ...node.position },
    data: {
      ...(node.data?.name !== undefined ? { name: node.data.name } : {}),
      params: { ...(node.data?.params ?? {}) },
    },
  };
}

function createPastedId(sourceId) {
  return `${sourceId}_copy_${createUniqueSuffix()}`;
}

function createUniqueSuffix() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().slice(0, 6);
  }
  return Math.random().toString(16).slice(2, 8);
}
