export const DEFAULT_PRESET_KEY = "basic_cnn";

export const PRESETS = {
  basic_cnn: {
    key: "basic_cnn",
    label: "Basic CNN",
    description: "Single input CNN chain ending in one named output.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 160 },
        data: { name: "image", params: { shape: [1, 3, 32, 32] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 340, y: 160 },
        data: { params: { in_channels: 3, out_channels: 16, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "relu_1",
        type: "ReLU",
        position: { x: 600, y: 160 },
        data: { params: {} },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 860, y: 160 },
        data: { name: "main", params: {} },
      },
    ],
    edges: [
      { id: "e-input-conv", source: "input_1", target: "conv_1" },
      { id: "e-conv-relu", source: "conv_1", target: "relu_1" },
      { id: "e-relu-output", source: "relu_1", target: "output_1" },
    ],
  },
  residual_block: {
    key: "residual_block",
    label: "Residual Block",
    description: "Branch and add pattern with one exported tensor.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 220 },
        data: { name: "image", params: { shape: [1, 3, 32, 32] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 320, y: 120 },
        data: { params: { in_channels: 3, out_channels: 3, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "relu_1",
        type: "ReLU",
        position: { x: 560, y: 120 },
        data: { params: {} },
      },
      {
        id: "conv_2",
        type: "Conv2d",
        position: { x: 800, y: 120 },
        data: { params: { in_channels: 3, out_channels: 3, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "add_1",
        type: "Add",
        position: { x: 1040, y: 220 },
        data: { params: {} },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 1280, y: 220 },
        data: { name: "main", params: {} },
      },
    ],
    edges: [
      { id: "e-input-conv1", source: "input_1", target: "conv_1" },
      { id: "e-conv1-relu1", source: "conv_1", target: "relu_1" },
      { id: "e-relu1-conv2", source: "relu_1", target: "conv_2" },
      { id: "e-conv2-add", source: "conv_2", target: "add_1" },
      { id: "e-input-add", source: "input_1", target: "add_1" },
      { id: "e-add-output", source: "add_1", target: "output_1" },
    ],
  },
};

export const PRESET_LIST = Object.values(PRESETS);

export function createPresetEditorState(presetKey = DEFAULT_PRESET_KEY) {
  const preset = PRESETS[presetKey] ?? PRESETS[DEFAULT_PRESET_KEY];
  return {
    nodes: preset.nodes.map(cloneNode),
    edges: preset.edges.map(cloneEdge),
    selectedNodeId: null,
    errorDetail: "",
    topologicalOrder: [],
    shapes: {},
    code: "",
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

function cloneEdge(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
}
