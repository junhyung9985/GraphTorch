export const NODE_DEFINITIONS = [
  { type: "Input", category: "input" },
  { type: "Conv2d", category: "module" },
  { type: "Linear", category: "module" },
  { type: "BatchNorm2d", category: "module" },
  { type: "ReLU", category: "module" },
  { type: "MaxPool2d", category: "module" },
  { type: "AvgPool2d", category: "module" },
  { type: "Add", category: "functional" },
  { type: "Concat", category: "functional" },
  { type: "Flatten", category: "functional" },
  { type: "Reshape", category: "functional" },
  { type: "Permute", category: "functional" },
  { type: "Output", category: "input" },
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
    case "ReLU":
      return { params: {} };
    case "MaxPool2d":
    case "AvgPool2d":
      return { params: { kernel_size: 2, stride: 2, padding: 0 } };
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
    default:
      return { params: {} };
  }
}

export function getCategory(type) {
  if (type === "Input" || type === "Output") return "input";
  if (["Add", "Concat", "Flatten", "Reshape", "Permute"].includes(type)) return "functional";
  return "module";
}
