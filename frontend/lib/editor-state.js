export function deleteNodeAndConnectedEdges(nodes, edges, nodeId) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  };
}

export function deleteEdgeById(edges, edgeId) {
  return edges.filter((edge) => edge.id !== edgeId);
}

export function getNextSelectionAfterNodeDelete(selectedNodeId, deletedNodeId) {
  return selectedNodeId === deletedNodeId ? null : selectedNodeId;
}

export function getEdgeInspector(edge) {
  if (!edge) return null;
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
}
