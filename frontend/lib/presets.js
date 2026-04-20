export const DEFAULT_PRESET_KEY = "lenet";

export const PRESETS = {
  lenet: {
    key: "lenet",
    label: "LeNet",
    description:
      "One of the earliest successful CNNs for digit recognition. Shows the classic Conv -> Pool -> Conv -> Pool -> FC pipeline that shaped early vision models.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 180 },
        data: { name: "image", params: { shape: [1, 1, 32, 32] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 280, y: 180 },
        data: { params: { in_channels: 1, out_channels: 6, kernel_size: 5, stride: 1, padding: 0 } },
      },
      {
        id: "pool_1",
        type: "AvgPool2d",
        position: { x: 500, y: 180 },
        data: { params: { kernel_size: 2, stride: 2, padding: 0 } },
      },
      {
        id: "conv_2",
        type: "Conv2d",
        position: { x: 720, y: 180 },
        data: { params: { in_channels: 6, out_channels: 16, kernel_size: 5, stride: 1, padding: 0 } },
      },
      {
        id: "pool_2",
        type: "AvgPool2d",
        position: { x: 940, y: 180 },
        data: { params: { kernel_size: 2, stride: 2, padding: 0 } },
      },
      {
        id: "flatten_1",
        type: "Flatten",
        position: { x: 1160, y: 180 },
        data: { params: { start_dim: 1 } },
      },
      {
        id: "linear_1",
        type: "Linear",
        position: { x: 1380, y: 180 },
        data: { params: { in_features: 400, out_features: 120 } },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 1600, y: 180 },
        data: { name: "logits", params: {} },
      },
    ],
    edges: [
      { id: "e-lenet-input-conv1", source: "input_1", target: "conv_1" },
      { id: "e-lenet-conv1-pool1", source: "conv_1", target: "pool_1" },
      { id: "e-lenet-pool1-conv2", source: "pool_1", target: "conv_2" },
      { id: "e-lenet-conv2-pool2", source: "conv_2", target: "pool_2" },
      { id: "e-lenet-pool2-flatten", source: "pool_2", target: "flatten_1" },
      { id: "e-lenet-flatten-linear", source: "flatten_1", target: "linear_1" },
      { id: "e-lenet-linear-output", source: "linear_1", target: "output_1" },
    ],
  },
  alexnet: {
    key: "alexnet",
    label: "AlexNet",
    description:
      "The 2012 ImageNet breakthrough that restarted deep vision. Highlights the large first convolution, aggressive pooling, and heavy fully connected classifier head.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 180 },
        data: { name: "image", params: { shape: [1, 3, 224, 224] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 320, y: 180 },
        data: { params: { in_channels: 3, out_channels: 96, kernel_size: 11, stride: 4, padding: 2 } },
      },
      {
        id: "relu_1",
        type: "ReLU",
        position: { x: 540, y: 180 },
        data: { params: {} },
      },
      {
        id: "pool_1",
        type: "MaxPool2d",
        position: { x: 760, y: 180 },
        data: { params: { kernel_size: 3, stride: 2, padding: 0 } },
      },
      {
        id: "conv_2",
        type: "Conv2d",
        position: { x: 980, y: 180 },
        data: { params: { in_channels: 96, out_channels: 256, kernel_size: 5, stride: 1, padding: 2 } },
      },
      {
        id: "pool_2",
        type: "MaxPool2d",
        position: { x: 1200, y: 180 },
        data: { params: { kernel_size: 3, stride: 2, padding: 0 } },
      },
      {
        id: "flatten_1",
        type: "Flatten",
        position: { x: 1420, y: 180 },
        data: { params: { start_dim: 1 } },
      },
      {
        id: "linear_1",
        type: "Linear",
        position: { x: 1640, y: 180 },
        data: { params: { in_features: 43264, out_features: 4096 } },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 1860, y: 180 },
        data: { name: "logits", params: {} },
      },
    ],
    edges: [
      { id: "e-alex-input-conv1", source: "input_1", target: "conv_1" },
      { id: "e-alex-conv1-relu1", source: "conv_1", target: "relu_1" },
      { id: "e-alex-relu1-pool1", source: "relu_1", target: "pool_1" },
      { id: "e-alex-pool1-conv2", source: "pool_1", target: "conv_2" },
      { id: "e-alex-conv2-pool2", source: "conv_2", target: "pool_2" },
      { id: "e-alex-pool2-flatten", source: "pool_2", target: "flatten_1" },
      { id: "e-alex-flatten-linear", source: "flatten_1", target: "linear_1" },
      { id: "e-alex-linear-output", source: "linear_1", target: "output_1" },
    ],
  },
  vggnet: {
    key: "vggnet",
    label: "VGGNet",
    description:
      "Made depth practical with repeated small convolutions. This preset emphasizes stacked 3x3 Conv blocks followed by pooling and a dense classifier head.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 180 },
        data: { name: "image", params: { shape: [1, 3, 224, 224] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 280, y: 120 },
        data: { params: { in_channels: 3, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "conv_2",
        type: "Conv2d",
        position: { x: 500, y: 120 },
        data: { params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "pool_1",
        type: "MaxPool2d",
        position: { x: 720, y: 120 },
        data: { params: { kernel_size: 2, stride: 2, padding: 0 } },
      },
      {
        id: "conv_3",
        type: "Conv2d",
        position: { x: 940, y: 240 },
        data: { params: { in_channels: 64, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "conv_4",
        type: "Conv2d",
        position: { x: 1160, y: 240 },
        data: { params: { in_channels: 128, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "pool_2",
        type: "MaxPool2d",
        position: { x: 1380, y: 240 },
        data: { params: { kernel_size: 2, stride: 2, padding: 0 } },
      },
      {
        id: "flatten_1",
        type: "Flatten",
        position: { x: 1600, y: 180 },
        data: { params: { start_dim: 1 } },
      },
      {
        id: "linear_1",
        type: "Linear",
        position: { x: 1820, y: 180 },
        data: { params: { in_features: 401408, out_features: 4096 } },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 2040, y: 180 },
        data: { name: "logits", params: {} },
      },
    ],
    edges: [
      { id: "e-vgg-input-conv1", source: "input_1", target: "conv_1" },
      { id: "e-vgg-conv1-conv2", source: "conv_1", target: "conv_2" },
      { id: "e-vgg-conv2-pool1", source: "conv_2", target: "pool_1" },
      { id: "e-vgg-pool1-conv3", source: "pool_1", target: "conv_3" },
      { id: "e-vgg-conv3-conv4", source: "conv_3", target: "conv_4" },
      { id: "e-vgg-conv4-pool2", source: "conv_4", target: "pool_2" },
      { id: "e-vgg-pool2-flatten", source: "pool_2", target: "flatten_1" },
      { id: "e-vgg-flatten-linear", source: "flatten_1", target: "linear_1" },
      { id: "e-vgg-linear-output", source: "linear_1", target: "output_1" },
    ],
  },
  googlenet: {
    key: "googlenet",
    label: "GoogLeNet",
    description:
      "Introduced the Inception idea and won ImageNet 2014 with efficient multi-branch design. This graph focuses on parallel paths merged through Concat.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 260 },
        data: { name: "image", params: { shape: [1, 3, 224, 224] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 300, y: 260 },
        data: { params: { in_channels: 3, out_channels: 64, kernel_size: 7, stride: 2, padding: 3 } },
      },
      {
        id: "pool_1",
        type: "MaxPool2d",
        position: { x: 520, y: 260 },
        data: { params: { kernel_size: 3, stride: 2, padding: 1 } },
      },
      {
        id: "branch_1x1",
        type: "Conv2d",
        position: { x: 760, y: 80 },
        data: { params: { in_channels: 64, out_channels: 64, kernel_size: 1, stride: 1, padding: 0 } },
      },
      {
        id: "branch_3x3_reduce",
        type: "Conv2d",
        position: { x: 760, y: 220 },
        data: { params: { in_channels: 64, out_channels: 96, kernel_size: 1, stride: 1, padding: 0 } },
      },
      {
        id: "branch_3x3",
        type: "Conv2d",
        position: { x: 980, y: 220 },
        data: { params: { in_channels: 96, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "branch_pool",
        type: "MaxPool2d",
        position: { x: 760, y: 360 },
        data: { params: { kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "branch_pool_proj",
        type: "Conv2d",
        position: { x: 980, y: 360 },
        data: { params: { in_channels: 64, out_channels: 32, kernel_size: 1, stride: 1, padding: 0 } },
      },
      {
        id: "concat_1",
        type: "Concat",
        position: { x: 1240, y: 260 },
        data: { params: { dim: 1 } },
      },
      {
        id: "pool_2",
        type: "AvgPool2d",
        position: { x: 1460, y: 260 },
        data: { params: { kernel_size: 7, stride: 1, padding: 0 } },
      },
      {
        id: "flatten_1",
        type: "Flatten",
        position: { x: 1680, y: 260 },
        data: { params: { start_dim: 1 } },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 1900, y: 260 },
        data: { name: "logits", params: {} },
      },
    ],
    edges: [
      { id: "e-goog-input-conv1", source: "input_1", target: "conv_1" },
      { id: "e-goog-conv1-pool1", source: "conv_1", target: "pool_1" },
      { id: "e-goog-pool1-1x1", source: "pool_1", target: "branch_1x1" },
      { id: "e-goog-pool1-3x3reduce", source: "pool_1", target: "branch_3x3_reduce" },
      { id: "e-goog-3x3reduce-3x3", source: "branch_3x3_reduce", target: "branch_3x3" },
      { id: "e-goog-pool1-branchpool", source: "pool_1", target: "branch_pool" },
      { id: "e-goog-branchpool-proj", source: "branch_pool", target: "branch_pool_proj" },
      { id: "e-goog-1x1-concat", source: "branch_1x1", target: "concat_1" },
      { id: "e-goog-3x3-concat", source: "branch_3x3", target: "concat_1" },
      { id: "e-goog-poolproj-concat", source: "branch_pool_proj", target: "concat_1" },
      { id: "e-goog-concat-pool2", source: "concat_1", target: "pool_2" },
      { id: "e-goog-pool2-flatten", source: "pool_2", target: "flatten_1" },
      { id: "e-goog-flatten-output", source: "flatten_1", target: "output_1" },
    ],
  },
  resnet: {
    key: "resnet",
    label: "ResNet",
    description:
      "Residual learning enabled much deeper CNNs to train reliably. The key idea is the skip connection, where the input bypasses convolutions and rejoins through Add.",
    nodes: [
      {
        id: "input_1",
        type: "Input",
        position: { x: 80, y: 260 },
        data: { name: "image", params: { shape: [1, 3, 224, 224] } },
      },
      {
        id: "conv_1",
        type: "Conv2d",
        position: { x: 320, y: 140 },
        data: { params: { in_channels: 3, out_channels: 64, kernel_size: 7, stride: 2, padding: 3 } },
      },
      {
        id: "pool_1",
        type: "MaxPool2d",
        position: { x: 540, y: 140 },
        data: { params: { kernel_size: 3, stride: 2, padding: 1 } },
      },
      {
        id: "conv_2",
        type: "Conv2d",
        position: { x: 780, y: 140 },
        data: { params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "relu_1",
        type: "ReLU",
        position: { x: 1000, y: 140 },
        data: { params: {} },
      },
      {
        id: "conv_3",
        type: "Conv2d",
        position: { x: 1220, y: 140 },
        data: { params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } },
      },
      {
        id: "add_1",
        type: "Add",
        position: { x: 1460, y: 260 },
        data: { params: {} },
      },
      {
        id: "relu_2",
        type: "ReLU",
        position: { x: 1680, y: 260 },
        data: { params: {} },
      },
      {
        id: "pool_2",
        type: "AvgPool2d",
        position: { x: 1900, y: 260 },
        data: { params: { kernel_size: 7, stride: 1, padding: 0 } },
      },
      {
        id: "flatten_1",
        type: "Flatten",
        position: { x: 2120, y: 260 },
        data: { params: { start_dim: 1 } },
      },
      {
        id: "output_1",
        type: "Output",
        position: { x: 2340, y: 260 },
        data: { name: "logits", params: {} },
      },
    ],
    edges: [
      { id: "e-res-input-conv1", source: "input_1", target: "conv_1" },
      { id: "e-res-conv1-pool1", source: "conv_1", target: "pool_1" },
      { id: "e-res-pool1-conv2", source: "pool_1", target: "conv_2" },
      { id: "e-res-conv2-relu1", source: "conv_2", target: "relu_1" },
      { id: "e-res-relu1-conv3", source: "relu_1", target: "conv_3" },
      { id: "e-res-conv3-add", source: "conv_3", target: "add_1" },
      { id: "e-res-pool1-add", source: "pool_1", target: "add_1" },
      { id: "e-res-add-relu2", source: "add_1", target: "relu_2" },
      { id: "e-res-relu2-pool2", source: "relu_2", target: "pool_2" },
      { id: "e-res-pool2-flatten", source: "pool_2", target: "flatten_1" },
      { id: "e-res-flatten-output", source: "flatten_1", target: "output_1" },
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
