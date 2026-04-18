import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteEdgeById,
  deleteNodeAndConnectedEdges,
  getEdgeInspector,
  getNextSelectionAfterNodeDelete,
} from "../lib/editor-state.js";
import { copySelectionToClipboard, pasteClipboardSelection } from "../lib/clipboard.js";
import {
  fromDiagramJson,
  getNodeTitle,
  getNodeSummary,
  toBackendGraph,
  toDiagramJson,
} from "../lib/graph.js";
import { createPresetEditorState, PRESETS } from "../lib/presets.js";

test("toBackendGraph serializes Input and Output names only", () => {
  const payload = toBackendGraph({
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 0, y: 0 },
        data: {
          name: "image",
          params: { shape: [1, 3, 32, 32] },
        },
      },
      {
        id: "relu_1",
        type: "ReLU",
        position: { x: 100, y: 0 },
        data: {
          name: "should_not_be_sent",
          params: {},
        },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 200, y: 0 },
        data: {
          name: "main",
          params: {},
        },
      },
    ],
    edges: [
      { id: "e1", source: "input_1", target: "relu_1" },
      { id: "e2", source: "relu_1", target: "output_1" },
    ],
  });

  assert.deepEqual(payload, {
    nodes: [
      { id: "input_1", type: "Input", name: "image", params: { shape: [1, 3, 32, 32] } },
      { id: "relu_1", type: "ReLU", params: {} },
      { id: "output_1", type: "Output", name: "main", params: {} },
    ],
    edges: [
      { source: "input_1", target: "relu_1" },
      { source: "relu_1", target: "output_1" },
    ],
  });
});

test("node presentation helpers stay compact for cards", () => {
  assert.equal(getNodeTitle({ id: "conv_1", type: "Conv2d", data: { name: "", params: {} } }), "Conv2d");
  assert.equal(
    getNodeSummary({
      type: "Conv2d",
      data: { params: { in_channels: 3, out_channels: 16, kernel_size: 3, stride: 1, padding: 1 } },
    }),
    "3→16, k=3, s=1"
  );
});

test("createPresetEditorState replaces the full graph and clears prior results", () => {
  const state = createPresetEditorState("residual_block");

  assert.equal(state.selectedNodeId, null);
  assert.equal(state.errorDetail, "");
  assert.deepEqual(state.topologicalOrder, []);
  assert.deepEqual(state.shapes, {});
  assert.equal(state.code, "");
  assert.ok(state.nodes.length > 0);
  assert.ok(state.edges.length > 0);
});

test("presets expose graph definitions with nodes and edges", () => {
  assert.ok(PRESETS.basic_cnn);
  assert.ok(PRESETS.residual_block);
  assert.ok(Array.isArray(PRESETS.basic_cnn.nodes));
  assert.ok(Array.isArray(PRESETS.basic_cnn.edges));
});

test("deleting a node also removes its connected edges and clears matching selection", () => {
  const state = createPresetEditorState("basic_cnn");
  const next = deleteNodeAndConnectedEdges(state.nodes, state.edges, "conv_1");

  assert.equal(next.nodes.some((node) => node.id === "conv_1"), false);
  assert.equal(next.edges.some((edge) => edge.source === "conv_1" || edge.target === "conv_1"), false);
  assert.equal(getNextSelectionAfterNodeDelete("conv_1", "conv_1"), null);
});

test("edge helpers expose inspector data and allow deletion by id", () => {
  const state = createPresetEditorState("basic_cnn");
  const firstEdge = state.edges[0];

  assert.deepEqual(getEdgeInspector(firstEdge), {
    id: firstEdge.id,
    source: firstEdge.source,
    target: firstEdge.target,
  });
  assert.equal(deleteEdgeById(state.edges, firstEdge.id).some((edge) => edge.id === firstEdge.id), false);
});

test("copySelectionToClipboard keeps only selected nodes and internal edges", () => {
  const state = createPresetEditorState("residual_block");
  const clipboard = copySelectionToClipboard(state.nodes, state.edges, ["conv_1", "relu_1", "conv_2"]);

  assert.equal(clipboard.nodes.length, 3);
  assert.deepEqual(
    clipboard.edges.map((edge) => [edge.source, edge.target]),
    [
      ["conv_1", "relu_1"],
      ["relu_1", "conv_2"],
    ]
  );
});

test("pasteClipboardSelection duplicates nodes with new ids and shifted positions", () => {
  const state = createPresetEditorState("basic_cnn");
  const clipboard = copySelectionToClipboard(state.nodes, state.edges, ["conv_1"]);
  const pasted = pasteClipboardSelection(state.nodes, state.edges, clipboard);

  assert.equal(pasted.nodes.length, state.nodes.length + 1);
  assert.equal(pasted.pastedNodeIds.length, 1);

  const original = state.nodes.find((node) => node.id === "conv_1");
  const duplicate = pasted.nodes.find((node) => node.id === pasted.pastedNodeIds[0]);
  assert.notEqual(duplicate.id, original.id);
  assert.deepEqual(duplicate.data.params, original.data.params);
  assert.equal(duplicate.position.x, original.position.x + 48);
  assert.equal(duplicate.position.y, original.position.y + 48);
});

test("toDiagramJson preserves graph structure and positions without transient UI state", () => {
  const state = createPresetEditorState("basic_cnn");
  const json = toDiagramJson(state.nodes, state.edges);
  const payload = JSON.parse(json);

  assert.ok(Array.isArray(payload.nodes));
  assert.ok(Array.isArray(payload.edges));
  assert.equal("selectedNodeId" in payload, false);
  assert.equal("errorDetail" in payload, false);
  assert.deepEqual(payload.nodes[0].position, state.nodes[0].position);
});

test("fromDiagramJson validates required diagram fields before applying", () => {
  assert.throws(() => fromDiagramJson("{}"), /nodes must be an array/i);
  assert.throws(() => fromDiagramJson('{"nodes":[],"edges":[{}]}'), /edge at index 0/i);
  assert.throws(() => fromDiagramJson('{"nodes":[{}],"edges":[]}'), /node at index 0/i);
});
