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
import {
  EXPORT_PADDING,
  EXPORT_FILENAME,
  buildPaperSvg,
  computeExportBounds,
  validateExportableGraph,
} from "../lib/export-svg.js";
import { getDefaultParams, getNodesByCategory } from "../lib/defaults.js";
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
  assert.equal(
    getNodeSummary({
      type: "AdaptiveAvgPool2d",
      data: { params: { output_size: [1, 1] } },
    }),
    "out=[1, 1]"
  );
  assert.equal(
    getNodeSummary({
      type: "LocalResponseNorm",
      data: { params: { size: 5 } },
    }),
    "size=5"
  );
  assert.equal(
    getNodeSummary({
      type: "Dropout",
      data: { params: { p: 0.5 } },
    }),
    "p=0.5"
  );
  assert.equal(
    getNodeSummary({
      type: "Softmax",
      data: { params: { dim: 1 } },
    }),
    "dim=1"
  );
  assert.equal(
    getNodeSummary({
      type: "LayerNorm",
      data: { params: { normalized_shape: [64] } },
    }),
    "norm=[64]"
  );
  assert.equal(
    getNodeSummary({
      type: "LSTM",
      data: { params: { input_size: 128, hidden_size: 256, num_layers: 2 } },
    }),
    "128→256, layers=2"
  );
  assert.equal(
    getNodeSummary({
      type: "GRU",
      data: { params: { input_size: 256, hidden_size: 128, num_layers: 1 } },
    }),
    "256→128, layers=1"
  );
});

test("new node types expose sensible default params", () => {
  assert.deepEqual(getDefaultParams("LayerNorm"), { params: { normalized_shape: [64] } });
  assert.deepEqual(getDefaultParams("LSTM"), {
    params: { input_size: 128, hidden_size: 128, num_layers: 1, batch_first: 1, bidirectional: 0 },
  });
  assert.deepEqual(getDefaultParams("GRU"), {
    params: { input_size: 128, hidden_size: 128, num_layers: 1, batch_first: 1, bidirectional: 0 },
  });
  assert.deepEqual(getDefaultParams("Dropout"), { params: { p: 0.5 } });
  assert.deepEqual(getDefaultParams("LocalResponseNorm"), {
    params: { size: 5, alpha: 0.0001, beta: 0.75, k: 1 },
  });
  assert.deepEqual(getDefaultParams("AdaptiveAvgPool2d"), {
    params: { output_size: [1, 1] },
  });
  assert.deepEqual(getDefaultParams("Identity"), { params: {} });
  assert.deepEqual(getDefaultParams("Softmax"), { params: { dim: 1 } });
});

test("node palette categories expose ordered accordion sections", () => {
  const sections = getNodesByCategory();

  assert.deepEqual(
    sections.map((section) => section.key),
    ["io", "layers", "normalization", "activation", "pooling", "sequence", "functional"]
  );
  assert.ok(sections.find((section) => section.key === "sequence").items.some((item) => item.type === "LSTM"));
  assert.ok(sections.find((section) => section.key === "sequence").items.some((item) => item.type === "GRU"));
});

test("createPresetEditorState replaces the full graph and clears prior results", () => {
  const state = createPresetEditorState("resnet");

  assert.equal(state.selectedNodeId, null);
  assert.equal(state.errorDetail, "");
  assert.deepEqual(state.topologicalOrder, []);
  assert.deepEqual(state.shapes, {});
  assert.equal(state.code, "");
  assert.ok(state.nodes.length > 0);
  assert.ok(state.edges.length > 0);
});

test("presets expose graph definitions with nodes and edges", () => {
  assert.deepEqual(Object.keys(PRESETS), [
    "lenet_small",
    "alexnet_small",
    "vggnet_small",
    "googlenet_small",
    "resnet_small",
    "lenet",
    "alexnet",
    "vggnet",
    "googlenet",
    "resnet",
    "stacked_lstm",
    "seq2seq_lstm",
    "encoder_decoder_gru",
  ]);
  assert.ok(Array.isArray(PRESETS.lenet.nodes));
  assert.ok(Array.isArray(PRESETS.lenet.edges));
  assert.ok(Array.isArray(PRESETS.lenet_small.nodes));
  assert.ok(Array.isArray(PRESETS.lenet_small.edges));
  assert.equal(PRESETS.alexnet.nodes.filter((node) => node.type === "LocalResponseNorm").length, 2);
  assert.equal(PRESETS.alexnet_small.nodes.filter((node) => node.type === "LocalResponseNorm").length, 0);
  assert.equal(PRESETS.vggnet.nodes.filter((node) => node.type === "Conv2d").length, 13);
  assert.equal(PRESETS.vggnet_small.nodes.filter((node) => node.type === "Conv2d").length, 4);
  assert.equal(PRESETS.googlenet.nodes.filter((node) => node.type === "Concat").length, 9);
  assert.equal(PRESETS.googlenet_small.nodes.filter((node) => node.type === "Concat").length, 1);
  assert.equal(PRESETS.resnet.nodes.filter((node) => node.type === "Add").length, 16);
  assert.equal(PRESETS.resnet_small.nodes.filter((node) => node.type === "Add").length, 1);
  assert.ok(PRESETS.stacked_lstm.nodes.some((node) => node.type === "LSTM"));
  assert.ok(PRESETS.seq2seq_lstm.nodes.some((node) => node.type === "Concat"));
  assert.ok(PRESETS.encoder_decoder_gru.nodes.some((node) => node.type === "GRU"));
});

test("alexnet and vggnet classifier heads match flattened feature size", () => {
  const alexLinear = PRESETS.alexnet.nodes.find((node) => node.id === "linear_1");
  const vggLinear = PRESETS.vggnet.nodes.find((node) => node.id === "linear_1");

  assert.equal(alexLinear.data.params.in_features, 9216);
  assert.equal(vggLinear.data.params.in_features, 25088);
});

test("googlenet and resnet presets use the new architecture nodes", () => {
  assert.ok(PRESETS.googlenet.nodes.some((node) => node.type === "AdaptiveAvgPool2d"));
  assert.ok(PRESETS.googlenet.nodes.some((node) => node.type === "Dropout"));
  assert.ok(PRESETS.resnet.nodes.some((node) => node.type === "Identity"));
  assert.ok(PRESETS.resnet.nodes.some((node) => node.type === "BatchNorm2d"));
});

test("deleting a node also removes its connected edges and clears matching selection", () => {
  const state = createPresetEditorState("lenet");
  const next = deleteNodeAndConnectedEdges(state.nodes, state.edges, "conv_1");

  assert.equal(next.nodes.some((node) => node.id === "conv_1"), false);
  assert.equal(next.edges.some((edge) => edge.source === "conv_1" || edge.target === "conv_1"), false);
  assert.equal(getNextSelectionAfterNodeDelete("conv_1", "conv_1"), null);
});

test("edge helpers expose inspector data and allow deletion by id", () => {
  const state = createPresetEditorState("lenet");
  const firstEdge = state.edges[0];

  assert.deepEqual(getEdgeInspector(firstEdge), {
    id: firstEdge.id,
    source: firstEdge.source,
    target: firstEdge.target,
  });
  assert.equal(deleteEdgeById(state.edges, firstEdge.id).some((edge) => edge.id === firstEdge.id), false);
});

test("copySelectionToClipboard keeps only selected nodes and internal edges", () => {
  const state = createPresetEditorState("resnet");
  const clipboard = copySelectionToClipboard(state.nodes, state.edges, [
    "stage2_block1_conv1",
    "stage2_block1_bn1",
    "stage2_block1_relu1",
  ]);

  assert.equal(clipboard.nodes.length, 3);
  assert.deepEqual(
    clipboard.edges.map((edge) => [edge.source, edge.target]),
    [
      ["stage2_block1_conv1", "stage2_block1_bn1"],
      ["stage2_block1_bn1", "stage2_block1_relu1"],
    ]
  );
});

test("pasteClipboardSelection duplicates nodes with new ids and shifted positions", () => {
  const state = createPresetEditorState("lenet");
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
  const state = createPresetEditorState("lenet");
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

test("validateExportableGraph rejects empty graphs", () => {
  assert.equal(validateExportableGraph([]), false);
  assert.equal(validateExportableGraph(createPresetEditorState("lenet").nodes), true);
});

test("computeExportBounds uses fitted graph bounds with fixed padding", () => {
  const bounds = computeExportBounds([
    { id: "a", position: { x: 100, y: 50 }, width: 200, height: 80 },
    { id: "b", position: { x: 420, y: 220 }, width: 180, height: 64 },
  ]);

  assert.equal(bounds.padding, EXPORT_PADDING);
  assert.equal(bounds.x, 100 - EXPORT_PADDING);
  assert.equal(bounds.y, 50 - EXPORT_PADDING);
  assert.equal(bounds.width, 420 + 180 - 100 + EXPORT_PADDING * 2);
  assert.equal(bounds.height, 220 + 64 - 50 + EXPORT_PADDING * 2);
});

test("export filename stays deterministic", () => {
  assert.equal(EXPORT_FILENAME, "graphtorch-diagram.svg");
});

test("buildPaperSvg renders clean paper boxes with type-only labels", () => {
  const state = createPresetEditorState("lenet");
  const bounds = computeExportBounds(state.nodes);
  const svg = buildPaperSvg({
    nodes: state.nodes,
    edges: state.edges,
    bounds,
  });

  assert.match(svg, /<svg[\s\S]*viewBox=/);
  assert.match(svg, />Input</);
  assert.match(svg, />Conv2d</);
  assert.match(svg, />Output</);
  assert.doesNotMatch(svg, /input_1/);
  assert.doesNotMatch(svg, /output_1/);
  assert.doesNotMatch(svg, /export tensor/);
  assert.match(svg, /<path/);
});
