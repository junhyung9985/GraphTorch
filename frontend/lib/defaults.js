export const NODE_DEFINITIONS = [
  { type: "Input", category: "io" },
  { type: "Output", category: "io" },
  { type: "Conv2d", category: "layers" },
  { type: "Linear", category: "layers" },
  { type: "Dropout", category: "layers" },
  { type: "Identity", category: "layers" },
  { type: "BatchNorm2d", category: "normalization" },
  { type: "LayerNorm", category: "normalization" },
  { type: "LocalResponseNorm", category: "normalization" },
  { type: "ReLU", category: "activation" },
  { type: "Softmax", category: "activation" },
  { type: "MaxPool2d", category: "pooling" },
  { type: "AvgPool2d", category: "pooling" },
  { type: "AdaptiveAvgPool2d", category: "pooling" },
  { type: "LSTM", category: "sequence" },
  { type: "GRU", category: "sequence" },
  { type: "Add", category: "functional" },
  { type: "Concat", category: "functional" },
  { type: "Flatten", category: "functional" },
  { type: "Reshape", category: "functional" },
  { type: "Permute", category: "functional" },
];

export const PALETTE_CATEGORIES = [
  { key: "io", label: "I/O" },
  { key: "layers", label: "Layers" },
  { key: "normalization", label: "Normalization" },
  { key: "activation", label: "Activation" },
  { key: "pooling", label: "Pooling" },
  { key: "sequence", label: "Sequence" },
  { key: "functional", label: "Functional" },
];

export function getDefaultParams(type, index = 1) {
  switch (type) {
    case "Input":
      return { name: `input_${index}`, params: { shape: [1, 3, 32, 32] } };
    case "Output":
      return { name: `output_${index}`, params: {} };
    case "Conv2d":
      return {
        params: { in_channels: 3, out_channels: 16, kernel_size: 3, stride: 1, padding: 1 },
      };
    case "Linear":
      return { params: { in_features: 128, out_features: 64 } };
    case "BatchNorm2d":
      return { params: { num_features: 16 } };
    case "LayerNorm":
      return { params: { normalized_shape: [64] } };
    case "LSTM":
    case "GRU":
      return { params: { input_size: 128, hidden_size: 128, num_layers: 1, batch_first: 1, bidirectional: 0 } };
    case "ReLU":
      return { params: {} };
    case "Dropout":
      return { params: { p: 0.5 } };
    case "LocalResponseNorm":
      return { params: { size: 5, alpha: 0.0001, beta: 0.75, k: 1 } };
    case "MaxPool2d":
    case "AvgPool2d":
      return { params: { kernel_size: 2, stride: 2, padding: 0 } };
    case "AdaptiveAvgPool2d":
      return { params: { output_size: [1, 1] } };
    case "Identity":
      return { params: {} };
    case "Add":
      return { params: {} };
    case "Concat":
      return { params: { dim: 1 } };
    case "Flatten":
      return { params: { start_dim: 1 } };
    case "Reshape":
      return { params: { shape: [1, 128] } };
    case "Permute":
      return { params: { dims: [0, 2, 3, 1] } };
    case "Softmax":
      return { params: { dim: 1 } };
    default:
      return { params: {} };
  }
}

export function getCategory(type) {
  const definition = NODE_DEFINITIONS.find((item) => item.type === type);
  return definition?.category ?? "layers";
}

export function getNodesByCategory() {
  return PALETTE_CATEGORIES.map((section) => ({
    ...section,
    items: NODE_DEFINITIONS.filter((definition) => definition.category === section.key),
  }));
}
