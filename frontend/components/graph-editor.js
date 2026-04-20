"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { compileGraph, validateGraph } from "@/lib/api";
import { copySelectionToClipboard, pasteClipboardSelection } from "@/lib/clipboard";
import { getDefaultParams } from "@/lib/defaults";
import {
  deleteEdgeById,
  deleteNodeAndConnectedEdges,
  getEdgeInspector,
  getNextSelectionAfterNodeDelete,
} from "@/lib/editor-state";
import { exportGraphToSvg, validateExportableGraph } from "@/lib/export-svg";
import { fromDiagramJson, toBackendGraph, toDiagramJson } from "@/lib/graph";
import { createPresetEditorState, DEFAULT_PRESET_KEY, PRESET_LIST } from "@/lib/presets";
import { GraphNode } from "./graph-node";
import { JsonModal } from "./json-modal";
import { NodePalette } from "./node-palette";
import { PropertyPanel } from "./property-panel";
import { ResultPanel } from "./result-panel";

const nodeTypes = {
  Input: GraphNode,
  Conv2d: GraphNode,
  Linear: GraphNode,
  BatchNorm2d: GraphNode,
  ReLU: GraphNode,
  Dropout: GraphNode,
  LocalResponseNorm: GraphNode,
  MaxPool2d: GraphNode,
  AvgPool2d: GraphNode,
  AdaptiveAvgPool2d: GraphNode,
  Identity: GraphNode,
  Add: GraphNode,
  Concat: GraphNode,
  Flatten: GraphNode,
  Reshape: GraphNode,
  Permute: GraphNode,
  Softmax: GraphNode,
  Output: GraphNode,
};

const initialEditorState = createPresetEditorState(DEFAULT_PRESET_KEY);

function projectToEditorNode(node) {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  };
}

function edgeStyle(edge) {
  return {
    ...edge,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#b8c2d6" },
    style: { stroke: "#b8c2d6", strokeWidth: 2 },
  };
}

export function GraphEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialEditorState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEditorState.edges.map(edgeStyle));
  const [selectedNodeId, setSelectedNodeId] = useState(initialEditorState.selectedNodeId);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [topologicalOrder, setTopologicalOrder] = useState(initialEditorState.topologicalOrder);
  const [shapes, setShapes] = useState(initialEditorState.shapes);
  const [code, setCode] = useState(initialEditorState.code);
  const [errorDetail, setErrorDetail] = useState(initialEditorState.errorDetail);
  const [isValidating, setIsValidating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState(null);
  const [jsonModalValue, setJsonModalValue] = useState("");
  const [jsonModalError, setJsonModalError] = useState("");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [paletteWidth, setPaletteWidth] = useState(280);
  const [resultsWidth, setResultsWidth] = useState(380);
  const [activeResize, setActiveResize] = useState(null);
  const [exportError, setExportError] = useState("");

  const selectedNode = useMemo(
    () => {
      const node = nodes.find((item) => item.id === selectedNodeId);
      return node ? projectToEditorNode(node) : null;
    },
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => getEdgeInspector(edges.find((item) => item.id === selectedEdgeId) ?? null),
    [edges, selectedEdgeId]
  );

  useEffect(() => {
    if (selectedNodeId && !nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    setSelectedNodeIds((currentIds) => {
      const nextIds = currentIds.filter((nodeId) => nodes.some((node) => node.id === nodeId));
      if (nextIds.length === currentIds.length && nextIds.every((nodeId, index) => nodeId === currentIds[index])) {
        return currentIds;
      }
      return nextIds;
    });
  }, [nodes]);

  useEffect(() => {
    if (selectedEdgeId && !edges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
  }, [edges, selectedEdgeId]);

  useEffect(() => {
    if (!activeResize) return;

    function handleMouseMove(event) {
      if (activeResize === "palette") {
        const nextWidth = Math.min(420, Math.max(240, event.clientX - 16));
        setPaletteWidth(nextWidth);
        return;
      }
      if (activeResize === "results") {
        const nextWidth = Math.min(560, Math.max(320, window.innerWidth - event.clientX - 16));
        setResultsWidth(nextWidth);
      }
    }

    function handleMouseUp() {
      setActiveResize(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeResize]);

  const onConnect = useCallback(
    (params) => {
      setEdges((currentEdges) =>
        addEdge(edgeStyle({ ...params, id: `${params.source}-${params.target}-${crypto.randomUUID()}` }), currentEdges)
      );
    },
    [setEdges]
  );

  const addNode = useCallback(
    (nodeType) => {
      const nextIndex = nodes.filter((node) => node.type === nodeType).length + 1;
      const defaults = getDefaultParams(nodeType, nextIndex);
      const newNode = {
        id: `${nodeType.toLowerCase()}_${crypto.randomUUID().slice(0, 6)}`,
        type: nodeType,
        position: { x: 160 + nodes.length * 24, y: 120 + nodes.length * 18 },
        data: { name: defaults.name ?? "", params: defaults.params ?? {} },
      };
      setNodes((currentNodes) => [...currentNodes, newNode]);
      setSelectedNodeId(newNode.id);
      setSelectedNodeIds([newNode.id]);
      setSelectedEdgeId(null);
    },
    [nodes, setNodes]
  );

  const loadPreset = useCallback(
    (presetKey) => {
      const presetState = createPresetEditorState(presetKey);
      setNodes(presetState.nodes);
      setEdges(presetState.edges.map(edgeStyle));
      setSelectedNodeId(presetState.selectedNodeId);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setErrorDetail(presetState.errorDetail);
      setTopologicalOrder(presetState.topologicalOrder);
      setShapes(presetState.shapes);
      setCode(presetState.code);
    },
    [setEdges, setNodes]
  );

  const applyLoadedGraph = useCallback(
    (graph) => {
      setNodes(graph.nodes);
      setEdges(graph.edges.map(edgeStyle));
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setErrorDetail("");
      setTopologicalOrder([]);
      setShapes({});
      setCode("");
    },
    [setEdges, setNodes]
  );

  const updateNodeField = useCallback((nodeId, path, value) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== nodeId) return node;
        if (path === "name") {
          return { ...node, data: { ...node.data, name: value } };
        }
        if (path.startsWith("params.")) {
          const key = path.replace("params.", "");
          return {
            ...node,
            data: {
              ...node.data,
              params: {
                ...(node.data?.params ?? {}),
                [key]: value,
              },
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((currentNodes) => deleteNodeAndConnectedEdges(currentNodes, edges, nodeId).nodes);
      setEdges((currentEdges) => deleteNodeAndConnectedEdges(nodes, currentEdges, nodeId).edges);
      setSelectedNodeId((currentSelectedId) => getNextSelectionAfterNodeDelete(currentSelectedId, nodeId));
      setSelectedNodeIds((currentIds) => currentIds.filter((currentId) => currentId !== nodeId));
      setSelectedEdgeId(null);
    },
    [edges, nodes, setEdges, setNodes]
  );

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const selectedSet = new Set(selectedNodeIds);
    setNodes((currentNodes) => currentNodes.filter((node) => !selectedSet.has(node.id)));
    setEdges((currentEdges) => currentEdges.filter((edge) => !selectedSet.has(edge.source) && !selectedSet.has(edge.target)));
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, [selectedNodeIds, setEdges, setNodes]);

  const deleteEdge = useCallback(
    (edgeId) => {
      setEdges((currentEdges) => deleteEdgeById(currentEdges, edgeId));
      setSelectedEdgeId((currentSelectedId) => (currentSelectedId === edgeId ? null : currentSelectedId));
    },
    [setEdges]
  );

  const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
    if (selectedNodes[0]?.id) {
      setSelectedNodeId(selectedNodes[0].id);
      setSelectedNodeIds(selectedNodes.map((node) => node.id));
      setSelectedEdgeId(null);
      return;
    }
    if (selectedEdges[0]?.id) {
      setSelectedEdgeId(selectedEdges[0].id);
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      return;
    }
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, []);

  const handleNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setSelectedEdgeId(null);
  }, []);

  const handleEdgeClick = useCallback((_, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, []);

  useEffect(() => {
    function isEditableTarget(target) {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return tagName === "input" || tagName === "textarea" || target.isContentEditable;
    }

    function handleKeyDown(event) {
      if (isEditableTarget(event.target)) return;

      const isCopy = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c";
      const isPaste = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v";
      const isDelete = event.key === "Delete" || event.key === "Backspace";

      if (isCopy) {
        if (selectedNodeIds.length === 0) return;
        event.preventDefault();
        setClipboard(copySelectionToClipboard(nodes, edges, selectedNodeIds));
        return;
      }

      if (isPaste) {
        if (!clipboard || clipboard.nodes.length === 0) return;
        event.preventDefault();
        const pasted = pasteClipboardSelection(nodes, edges, clipboard);
        setNodes(pasted.nodes);
        setEdges(pasted.edges.map(edgeStyle));
        setSelectedNodeIds(pasted.pastedNodeIds);
        setSelectedNodeId(pasted.pastedNodeIds[0] ?? null);
        setSelectedEdgeId(null);
        return;
      }

      if (isDelete) {
        if (selectedNodeIds.length > 0) {
          event.preventDefault();
          deleteSelectedNodes();
          return;
        }
        if (selectedEdgeId) {
          event.preventDefault();
          deleteEdge(selectedEdgeId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clipboard, deleteEdge, deleteSelectedNodes, edges, nodes, selectedEdgeId, selectedNodeIds, setEdges, setNodes]);

  const buildPayload = useCallback(
    () =>
      toBackendGraph({
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges,
      }),
    [nodes, edges]
  );

  const runValidate = useCallback(async () => {
    setIsValidating(true);
    setErrorDetail("");
    try {
      const payload = buildPayload();
      const result = await validateGraph(payload);
      setTopologicalOrder(result.topological_order);
      setShapes(result.shapes);
      setErrorDetail("");
    } catch (error) {
      setErrorDetail(error.message);
    } finally {
      setIsValidating(false);
    }
  }, [buildPayload]);

  const runCompile = useCallback(async () => {
    setIsCompiling(true);
    setErrorDetail("");
    try {
      const payload = buildPayload();
      const result = await compileGraph(payload);
      setTopologicalOrder(result.topological_order);
      setShapes(result.shapes);
      setCode(result.code);
      setErrorDetail("");
    } catch (error) {
      setErrorDetail(error.message);
    } finally {
      setIsCompiling(false);
    }
  }, [buildPayload]);

  const openSaveJson = useCallback(() => {
    setJsonModalMode("save");
    setJsonModalError("");
    setJsonModalValue(toDiagramJson(nodes, edges));
  }, [edges, nodes]);

  const openLoadJson = useCallback(() => {
    setJsonModalMode("load");
    setJsonModalError("");
    setJsonModalValue("");
  }, []);

  const closeJsonModal = useCallback(() => {
    setJsonModalMode(null);
    setJsonModalError("");
  }, []);

  const copyDiagramJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonModalValue);
    } catch {
      setJsonModalError("Failed to copy JSON.");
    }
  }, [jsonModalValue]);

  const applyDiagramJson = useCallback(() => {
    try {
      const graph = fromDiagramJson(jsonModalValue);
      applyLoadedGraph(graph);
      closeJsonModal();
    } catch (error) {
      setJsonModalError(error.message);
    }
  }, [applyLoadedGraph, closeJsonModal, jsonModalValue]);

  const handleExportSvg = useCallback(() => {
    setExportError("");

    if (!validateExportableGraph(nodes)) {
      setExportError("Nothing to export");
      return;
    }

    try {
      exportGraphToSvg({
        nodes,
        edges,
      });
    } catch (error) {
      setExportError(error.message || "SVG export failed");
    }
  }, [edges, nodes]);

  const flowNodes = useMemo(() => nodes, [nodes]);
  const showInspector = Boolean(selectedNode || selectedEdge);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-4">
      <header className="flex flex-col gap-4 rounded-xl2 border border-border bg-panel px-5 py-4 shadow-panel lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">GraphTorch</p>
            <h1 className="mt-1 text-xl font-semibold text-ink">Diagram Compiler</h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen((current) => !current)}
              onMouseEnter={() => setIsShortcutsOpen(true)}
              onMouseLeave={() => setIsShortcutsOpen(false)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-slate-50"
            >
              Shortcuts
            </button>
            {isShortcutsOpen ? (
              <div
                onMouseEnter={() => setIsShortcutsOpen(true)}
                onMouseLeave={() => setIsShortcutsOpen(false)}
                className="absolute left-0 top-10 z-20 w-72 rounded-2xl border border-border bg-white p-3 text-xs leading-6 text-slate-700 shadow-panel"
              >
                <p>Ctrl/Cmd+C: Copy selection</p>
                <p>Ctrl/Cmd+V: Paste selection</p>
                <p>Delete / Backspace: Remove selection</p>
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPresetsOpen((current) => !current)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-slate-50"
            >
              Presets
            </button>
            {isPresetsOpen ? (
              <div className="absolute left-0 top-10 z-20 w-72 rounded-2xl border border-border bg-white p-3 shadow-panel">
                <div className="space-y-2">
                  {PRESET_LIST.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        loadPreset(preset.key);
                        setIsPresetsOpen(false);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-ink">{preset.label}</span>
                        <span className="text-xs text-muted">Load</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportSvg}
            disabled={!nodes.length}
            className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export SVG
          </button>
          <button
            type="button"
            onClick={openSaveJson}
            className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-slate-300 hover:bg-slate-50"
          >
            Save JSON
          </button>
          <button
            type="button"
            onClick={openLoadJson}
            className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-slate-300 hover:bg-slate-50"
          >
            Load JSON
          </button>
          <button
            type="button"
            onClick={runValidate}
            disabled={isValidating || isCompiling}
            className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isValidating ? "Validating..." : "Validate"}
          </button>
          <button
            type="button"
            onClick={runCompile}
            disabled={isValidating || isCompiling}
            className="rounded-2xl bg-[#1f4cff] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1b43e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCompiling ? "Compiling..." : "Compile"}
          </button>
        </div>
      </header>

      {exportError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-panel">
          {exportError}
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-xl2 border border-border bg-white shadow-panel">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-ink">Graph Canvas</p>
          <p className="mt-1 text-xs text-muted">Connect nodes to define tensor flow. Select a node or edge to inspect it.</p>
        </div>
        <div className="canvas-grid relative h-[760px]">
          <div className="absolute left-0 top-1/2 z-30 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setIsPaletteOpen((current) => !current)}
              className="flex h-24 w-7 items-center justify-center rounded-r-2xl border border-l-0 border-border bg-white/95 text-sm font-semibold text-slate-600 shadow-panel transition hover:bg-slate-50"
            >
              {isPaletteOpen ? "<" : ">"}
            </button>
          </div>

          <div
            className={`absolute left-4 top-4 z-20 h-[calc(100%-2rem)] transition duration-200 ${
              isPaletteOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
            }`}
            style={{ width: paletteWidth }}
          >
            <div className="relative h-full">
              <NodePalette onAddNode={addNode} />
              <div
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveResize("palette");
                }}
                className="absolute right-0 top-0 h-full w-3 cursor-col-resize"
              />
            </div>
          </div>

          <div
            className={`absolute right-4 top-4 z-20 h-[calc(100%-2rem)] transition duration-200 ${
              isResultsOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
            }`}
            style={{ width: resultsWidth }}
          >
            <div className="relative h-full">
              <ResultPanel
                topologicalOrder={topologicalOrder}
                shapes={shapes}
                code={code}
                errorDetail={errorDetail}
              />
              <div
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveResize("results");
                }}
                className="absolute left-0 top-0 h-full w-3 cursor-col-resize"
              />
            </div>
          </div>

          <div className="absolute right-0 top-1/2 z-30 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setIsResultsOpen((current) => !current)}
              className="flex h-24 w-7 items-center justify-center rounded-l-2xl border border-r-0 border-border bg-white/95 text-sm font-semibold text-slate-600 shadow-panel transition hover:bg-slate-50"
            >
              {isResultsOpen ? ">" : "<"}
            </button>
          </div>

          {showInspector ? (
            <div className="absolute right-4 top-4 z-30 w-[340px] max-w-[calc(100%-2rem)]">
              <PropertyPanel
                node={selectedNode}
                edge={selectedEdge}
                onChange={updateNodeField}
                onDelete={deleteNode}
                onDeleteEdge={deleteEdge}
              />
            </div>
          ) : null}

          <div className="h-full">
            <ReactFlow
              nodes={flowNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={handleSelectionChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
              deleteKeyCode={["Backspace", "Delete"]}
              fitView
              minZoom={0.4}
              defaultEdgeOptions={{
                type: "smoothstep",
                markerEnd: { type: MarkerType.ArrowClosed, color: "#b8c2d6" },
              }}
              selectionMode="partial"
            >
              <MiniMap pannable zoomable className="!bg-white" nodeStrokeWidth={3} />
              <Controls showInteractive={false} />
              <Background color="#d6dbe7" gap={24} />
            </ReactFlow>
          </div>
        </div>
      </section>

      <JsonModal
        mode={jsonModalMode}
        isOpen={Boolean(jsonModalMode)}
        value={jsonModalValue}
        loadError={jsonModalError}
        onChange={(value) => {
          setJsonModalValue(value);
          setJsonModalError("");
        }}
        onClose={closeJsonModal}
        onCopy={copyDiagramJson}
        onApply={applyDiagramJson}
      />
    </div>
  );
}
