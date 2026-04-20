export const DEFAULT_PRESET_KEY = "lenet";

function node(id, type, x, y, data) {
  return {
    id,
    type,
    position: { x, y },
    data,
  };
}

function edge(id, source, target) {
  return { id, source, target };
}

function sequentialNodes(specs, { startX, startY, gap }) {
  return specs.map((spec, index) => node(spec.id, spec.type, startX + index * gap, startY, spec.data));
}

function sequentialEdges(ids, prefix) {
  return ids.slice(1).map((target, index) => edge(`e-${prefix}-${ids[index]}-${target}`, ids[index], target));
}

function createLeNetPreset() {
  const specs = [
    { id: "input_1", type: "Input", data: { name: "image", params: { shape: [1, 1, 32, 32] } } },
    { id: "conv_1", type: "Conv2d", data: { params: { in_channels: 1, out_channels: 6, kernel_size: 5, stride: 1, padding: 0 } } },
    { id: "relu_1", type: "ReLU", data: { params: {} } },
    { id: "pool_1", type: "AvgPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "conv_2", type: "Conv2d", data: { params: { in_channels: 6, out_channels: 16, kernel_size: 5, stride: 1, padding: 0 } } },
    { id: "relu_2", type: "ReLU", data: { params: {} } },
    { id: "pool_2", type: "AvgPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "flatten_1", type: "Flatten", data: { params: { start_dim: 1 } } },
    { id: "linear_1", type: "Linear", data: { params: { in_features: 400, out_features: 120 } } },
    { id: "relu_3", type: "ReLU", data: { params: {} } },
    { id: "linear_2", type: "Linear", data: { params: { in_features: 120, out_features: 84 } } },
    { id: "relu_4", type: "ReLU", data: { params: {} } },
    { id: "linear_3", type: "Linear", data: { params: { in_features: 84, out_features: 10 } } },
    { id: "output_1", type: "Output", data: { name: "logits", params: {} } },
  ];
  const nodes = sequentialNodes(specs, { startX: 80, startY: 180, gap: 170 });
  const edges = sequentialEdges(
    specs.map((spec) => spec.id),
    "lenet"
  );

  return {
    key: "lenet",
    label: "LeNet-5",
    description:
      "Closer to the original LeNet-5 pipeline, including both convolution stages and the full 120 -> 84 -> 10 classifier head.",
    nodes,
    edges,
  };
}

function createAlexNetPreset() {
  const specs = [
    { id: "input_1", type: "Input", data: { name: "image", params: { shape: [1, 3, 224, 224] } } },
    { id: "conv_1", type: "Conv2d", data: { params: { in_channels: 3, out_channels: 96, kernel_size: 11, stride: 4, padding: 2 } } },
    { id: "relu_1", type: "ReLU", data: { params: {} } },
    { id: "lrn_1", type: "LocalResponseNorm", data: { params: { size: 5, alpha: 0.0001, beta: 0.75, k: 2 } } },
    { id: "pool_1", type: "MaxPool2d", data: { params: { kernel_size: 3, stride: 2, padding: 0 } } },
    { id: "conv_2", type: "Conv2d", data: { params: { in_channels: 96, out_channels: 256, kernel_size: 5, stride: 1, padding: 2 } } },
    { id: "relu_2", type: "ReLU", data: { params: {} } },
    { id: "lrn_2", type: "LocalResponseNorm", data: { params: { size: 5, alpha: 0.0001, beta: 0.75, k: 2 } } },
    { id: "pool_2", type: "MaxPool2d", data: { params: { kernel_size: 3, stride: 2, padding: 0 } } },
    { id: "conv_3", type: "Conv2d", data: { params: { in_channels: 256, out_channels: 384, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_3", type: "ReLU", data: { params: {} } },
    { id: "conv_4", type: "Conv2d", data: { params: { in_channels: 384, out_channels: 384, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_4", type: "ReLU", data: { params: {} } },
    { id: "conv_5", type: "Conv2d", data: { params: { in_channels: 384, out_channels: 256, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_5", type: "ReLU", data: { params: {} } },
    { id: "pool_3", type: "MaxPool2d", data: { params: { kernel_size: 3, stride: 2, padding: 0 } } },
    { id: "flatten_1", type: "Flatten", data: { params: { start_dim: 1 } } },
    { id: "linear_1", type: "Linear", data: { params: { in_features: 9216, out_features: 4096 } } },
    { id: "relu_6", type: "ReLU", data: { params: {} } },
    { id: "dropout_1", type: "Dropout", data: { params: { p: 0.5 } } },
    { id: "linear_2", type: "Linear", data: { params: { in_features: 4096, out_features: 4096 } } },
    { id: "relu_7", type: "ReLU", data: { params: {} } },
    { id: "dropout_2", type: "Dropout", data: { params: { p: 0.5 } } },
    { id: "linear_3", type: "Linear", data: { params: { in_features: 4096, out_features: 1000 } } },
    { id: "output_1", type: "Output", data: { name: "logits", params: {} } },
  ];
  const nodes = sequentialNodes(specs, { startX: 80, startY: 180, gap: 145 });
  const edges = sequentialEdges(
    specs.map((spec) => spec.id),
    "alexnet"
  );

  return {
    key: "alexnet",
    label: "AlexNet",
    description:
      "A fuller AlexNet graph with LRN, three convolutional tail layers, and the original two-dropout classifier head.",
    nodes,
    edges,
  };
}

function createVggPreset() {
  const specs = [
    { id: "input_1", type: "Input", data: { name: "image", params: { shape: [1, 3, 224, 224] } } },
    { id: "conv_1", type: "Conv2d", data: { params: { in_channels: 3, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_1", type: "ReLU", data: { params: {} } },
    { id: "conv_2", type: "Conv2d", data: { params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_2", type: "ReLU", data: { params: {} } },
    { id: "pool_1", type: "MaxPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "conv_3", type: "Conv2d", data: { params: { in_channels: 64, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_3", type: "ReLU", data: { params: {} } },
    { id: "conv_4", type: "Conv2d", data: { params: { in_channels: 128, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_4", type: "ReLU", data: { params: {} } },
    { id: "pool_2", type: "MaxPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "conv_5", type: "Conv2d", data: { params: { in_channels: 128, out_channels: 256, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_5", type: "ReLU", data: { params: {} } },
    { id: "conv_6", type: "Conv2d", data: { params: { in_channels: 256, out_channels: 256, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_6", type: "ReLU", data: { params: {} } },
    { id: "conv_7", type: "Conv2d", data: { params: { in_channels: 256, out_channels: 256, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_7", type: "ReLU", data: { params: {} } },
    { id: "pool_3", type: "MaxPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "conv_8", type: "Conv2d", data: { params: { in_channels: 256, out_channels: 512, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_8", type: "ReLU", data: { params: {} } },
    { id: "conv_9", type: "Conv2d", data: { params: { in_channels: 512, out_channels: 512, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_9", type: "ReLU", data: { params: {} } },
    { id: "conv_10", type: "Conv2d", data: { params: { in_channels: 512, out_channels: 512, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_10", type: "ReLU", data: { params: {} } },
    { id: "pool_4", type: "MaxPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "conv_11", type: "Conv2d", data: { params: { in_channels: 512, out_channels: 512, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_11", type: "ReLU", data: { params: {} } },
    { id: "conv_12", type: "Conv2d", data: { params: { in_channels: 512, out_channels: 512, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_12", type: "ReLU", data: { params: {} } },
    { id: "conv_13", type: "Conv2d", data: { params: { in_channels: 512, out_channels: 512, kernel_size: 3, stride: 1, padding: 1 } } },
    { id: "relu_13", type: "ReLU", data: { params: {} } },
    { id: "pool_5", type: "MaxPool2d", data: { params: { kernel_size: 2, stride: 2, padding: 0 } } },
    { id: "flatten_1", type: "Flatten", data: { params: { start_dim: 1 } } },
    { id: "linear_1", type: "Linear", data: { params: { in_features: 25088, out_features: 4096 } } },
    { id: "relu_14", type: "ReLU", data: { params: {} } },
    { id: "dropout_1", type: "Dropout", data: { params: { p: 0.5 } } },
    { id: "linear_2", type: "Linear", data: { params: { in_features: 4096, out_features: 4096 } } },
    { id: "relu_15", type: "ReLU", data: { params: {} } },
    { id: "dropout_2", type: "Dropout", data: { params: { p: 0.5 } } },
    { id: "linear_3", type: "Linear", data: { params: { in_features: 4096, out_features: 1000 } } },
    { id: "output_1", type: "Output", data: { name: "logits", params: {} } },
  ];
  const nodes = sequentialNodes(specs, { startX: 80, startY: 180, gap: 118 });
  const edges = sequentialEdges(
    specs.map((spec) => spec.id),
    "vgg16"
  );

  return {
    key: "vggnet",
    label: "VGG-16",
    description:
      "A readable VGG-16 preset with all 13 convolution layers, five pooling stages, and the original three-layer classifier.",
    nodes,
    edges,
  };
}

function createBuilder() {
  const nodes = [];
  const edges = [];

  return {
    nodes,
    edges,
    addNode(id, type, x, y, data) {
      nodes.push(node(id, type, x, y, data));
      return id;
    },
    addEdge(id, source, target) {
      edges.push(edge(id, source, target));
    },
  };
}

function addInception(builder, prefix, inputId, x, baseY, spec) {
  const leftX = x;
  const midX = x + 130;
  const rightX = x + 260;
  const concatX = x + 410;

  const branch1 = builder.addNode(
    `${prefix}_1x1`,
    "Conv2d",
    leftX,
    baseY - 210,
    { params: { in_channels: spec.in_channels, out_channels: spec.branch1x1, kernel_size: 1, stride: 1, padding: 0 } }
  );
  const branch3Reduce = builder.addNode(
    `${prefix}_3x3_reduce`,
    "Conv2d",
    leftX,
    baseY - 70,
    { params: { in_channels: spec.in_channels, out_channels: spec.branch3x3Reduce, kernel_size: 1, stride: 1, padding: 0 } }
  );
  const branch3 = builder.addNode(
    `${prefix}_3x3`,
    "Conv2d",
    midX,
    baseY - 70,
    { params: { in_channels: spec.branch3x3Reduce, out_channels: spec.branch3x3, kernel_size: 3, stride: 1, padding: 1 } }
  );
  const branch5Reduce = builder.addNode(
    `${prefix}_5x5_reduce`,
    "Conv2d",
    leftX,
    baseY + 70,
    { params: { in_channels: spec.in_channels, out_channels: spec.branch5x5Reduce, kernel_size: 1, stride: 1, padding: 0 } }
  );
  const branch5 = builder.addNode(
    `${prefix}_5x5`,
    "Conv2d",
    midX,
    baseY + 70,
    { params: { in_channels: spec.branch5x5Reduce, out_channels: spec.branch5x5, kernel_size: 5, stride: 1, padding: 2 } }
  );
  const branchPool = builder.addNode(
    `${prefix}_pool`,
    "MaxPool2d",
    leftX,
    baseY + 210,
    { params: { kernel_size: 3, stride: 1, padding: 1 } }
  );
  const branchPoolProj = builder.addNode(
    `${prefix}_pool_proj`,
    "Conv2d",
    midX,
    baseY + 210,
    { params: { in_channels: spec.in_channels, out_channels: spec.poolProj, kernel_size: 1, stride: 1, padding: 0 } }
  );
  const concat = builder.addNode(`${prefix}_concat`, "Concat", concatX, baseY, { params: { dim: 1 } });

  builder.addEdge(`e-${prefix}-input-1x1`, inputId, branch1);
  builder.addEdge(`e-${prefix}-input-3x3reduce`, inputId, branch3Reduce);
  builder.addEdge(`e-${prefix}-3x3reduce-3x3`, branch3Reduce, branch3);
  builder.addEdge(`e-${prefix}-input-5x5reduce`, inputId, branch5Reduce);
  builder.addEdge(`e-${prefix}-5x5reduce-5x5`, branch5Reduce, branch5);
  builder.addEdge(`e-${prefix}-input-pool`, inputId, branchPool);
  builder.addEdge(`e-${prefix}-pool-proj`, branchPool, branchPoolProj);
  builder.addEdge(`e-${prefix}-1x1-concat`, branch1, concat);
  builder.addEdge(`e-${prefix}-3x3-concat`, branch3, concat);
  builder.addEdge(`e-${prefix}-5x5-concat`, branch5, concat);
  builder.addEdge(`e-${prefix}-poolproj-concat`, branchPoolProj, concat);

  return concat;
}

function createGoogLeNetPreset() {
  const builder = createBuilder();

  let current = builder.addNode("input_1", "Input", 80, 320, { name: "image", params: { shape: [1, 3, 224, 224] } });
  const stemSpecs = [
    ["conv_1", "Conv2d", { params: { in_channels: 3, out_channels: 64, kernel_size: 7, stride: 2, padding: 3 } }],
    ["relu_1", "ReLU", { params: {} }],
    ["pool_1", "MaxPool2d", { params: { kernel_size: 3, stride: 2, padding: 1 } }],
    ["lrn_1", "LocalResponseNorm", { params: { size: 5, alpha: 0.0001, beta: 0.75, k: 2 } }],
    ["conv_2", "Conv2d", { params: { in_channels: 64, out_channels: 64, kernel_size: 1, stride: 1, padding: 0 } }],
    ["relu_2", "ReLU", { params: {} }],
    ["conv_3", "Conv2d", { params: { in_channels: 64, out_channels: 192, kernel_size: 3, stride: 1, padding: 1 } }],
    ["relu_3", "ReLU", { params: {} }],
    ["lrn_2", "LocalResponseNorm", { params: { size: 5, alpha: 0.0001, beta: 0.75, k: 2 } }],
    ["pool_2", "MaxPool2d", { params: { kernel_size: 3, stride: 2, padding: 1 } }],
  ];

  stemSpecs.forEach(([id, type, data], index) => {
    const next = builder.addNode(id, type, 280 + index * 140, 320, data);
    builder.addEdge(`e-googlenet-${current}-${next}`, current, next);
    current = next;
  });

  current = addInception(builder, "inception_3a", current, 1780, 320, {
    in_channels: 192,
    branch1x1: 64,
    branch3x3Reduce: 96,
    branch3x3: 128,
    branch5x5Reduce: 16,
    branch5x5: 32,
    poolProj: 32,
  });
  current = addInception(builder, "inception_3b", current, 2270, 320, {
    in_channels: 256,
    branch1x1: 128,
    branch3x3Reduce: 128,
    branch3x3: 192,
    branch5x5Reduce: 32,
    branch5x5: 96,
    poolProj: 64,
  });

  const pool3 = builder.addNode("pool_3", "MaxPool2d", 2760, 320, { params: { kernel_size: 3, stride: 2, padding: 1 } });
  builder.addEdge("e-googlenet-inception3b-pool3", current, pool3);
  current = pool3;

  current = addInception(builder, "inception_4a", current, 2920, 320, {
    in_channels: 480,
    branch1x1: 192,
    branch3x3Reduce: 96,
    branch3x3: 208,
    branch5x5Reduce: 16,
    branch5x5: 48,
    poolProj: 64,
  });
  current = addInception(builder, "inception_4b", current, 3410, 320, {
    in_channels: 512,
    branch1x1: 160,
    branch3x3Reduce: 112,
    branch3x3: 224,
    branch5x5Reduce: 24,
    branch5x5: 64,
    poolProj: 64,
  });
  current = addInception(builder, "inception_4c", current, 3900, 320, {
    in_channels: 512,
    branch1x1: 128,
    branch3x3Reduce: 128,
    branch3x3: 256,
    branch5x5Reduce: 24,
    branch5x5: 64,
    poolProj: 64,
  });
  current = addInception(builder, "inception_4d", current, 4390, 320, {
    in_channels: 512,
    branch1x1: 112,
    branch3x3Reduce: 144,
    branch3x3: 288,
    branch5x5Reduce: 32,
    branch5x5: 64,
    poolProj: 64,
  });
  current = addInception(builder, "inception_4e", current, 4880, 320, {
    in_channels: 528,
    branch1x1: 256,
    branch3x3Reduce: 160,
    branch3x3: 320,
    branch5x5Reduce: 32,
    branch5x5: 128,
    poolProj: 128,
  });

  const pool4 = builder.addNode("pool_4", "MaxPool2d", 5370, 320, { params: { kernel_size: 2, stride: 2, padding: 0 } });
  builder.addEdge("e-googlenet-inception4e-pool4", current, pool4);
  current = pool4;

  current = addInception(builder, "inception_5a", current, 5530, 320, {
    in_channels: 832,
    branch1x1: 256,
    branch3x3Reduce: 160,
    branch3x3: 320,
    branch5x5Reduce: 32,
    branch5x5: 128,
    poolProj: 128,
  });
  current = addInception(builder, "inception_5b", current, 6020, 320, {
    in_channels: 832,
    branch1x1: 384,
    branch3x3Reduce: 192,
    branch3x3: 384,
    branch5x5Reduce: 48,
    branch5x5: 128,
    poolProj: 128,
  });

  const headSpecs = [
    ["pool_5", "AdaptiveAvgPool2d", { params: { output_size: [1, 1] } }],
    ["flatten_1", "Flatten", { params: { start_dim: 1 } }],
    ["dropout_1", "Dropout", { params: { p: 0.4 } }],
    ["linear_1", "Linear", { params: { in_features: 1024, out_features: 1000 } }],
    ["output_1", "Output", { name: "logits", params: {} }],
  ];

  headSpecs.forEach(([id, type, data], index) => {
    const next = builder.addNode(id, type, 6510 + index * 160, 320, data);
    builder.addEdge(`e-googlenet-${current}-${next}`, current, next);
    current = next;
  });

  return {
    key: "googlenet",
    label: "GoogLeNet",
    description:
      "A more faithful GoogLeNet main path with nine Inception blocks, LRN in the stem, and the original global-pool/dropout classifier. Auxiliary heads are omitted for readability.",
    nodes: builder.nodes,
    edges: builder.edges,
  };
}

function addBasicBlock(builder, prefix, inputId, x, baseY, inChannels, outChannels, stride) {
  const mainY = baseY - 90;
  const skipY = baseY + 110;

  const conv1 = builder.addNode(`${prefix}_conv1`, "Conv2d", x, mainY, {
    params: { in_channels: inChannels, out_channels: outChannels, kernel_size: 3, stride, padding: 1 },
  });
  const bn1 = builder.addNode(`${prefix}_bn1`, "BatchNorm2d", x + 110, mainY, {
    params: { num_features: outChannels },
  });
  const relu1 = builder.addNode(`${prefix}_relu1`, "ReLU", x + 220, mainY, { params: {} });
  const conv2 = builder.addNode(`${prefix}_conv2`, "Conv2d", x + 330, mainY, {
    params: { in_channels: outChannels, out_channels: outChannels, kernel_size: 3, stride: 1, padding: 1 },
  });
  const bn2 = builder.addNode(`${prefix}_bn2`, "BatchNorm2d", x + 440, mainY, {
    params: { num_features: outChannels },
  });
  const add = builder.addNode(`${prefix}_add`, "Add", x + 560, baseY, { params: {} });
  const relu2 = builder.addNode(`${prefix}_relu2`, "ReLU", x + 670, baseY, { params: {} });

  builder.addEdge(`e-${prefix}-input-conv1`, inputId, conv1);
  builder.addEdge(`e-${prefix}-conv1-bn1`, conv1, bn1);
  builder.addEdge(`e-${prefix}-bn1-relu1`, bn1, relu1);
  builder.addEdge(`e-${prefix}-relu1-conv2`, relu1, conv2);
  builder.addEdge(`e-${prefix}-conv2-bn2`, conv2, bn2);
  builder.addEdge(`e-${prefix}-bn2-add`, bn2, add);
  builder.addEdge(`e-${prefix}-add-relu2`, add, relu2);

  if (stride !== 1 || inChannels !== outChannels) {
    const projConv = builder.addNode(`${prefix}_proj_conv`, "Conv2d", x + 170, skipY, {
      params: { in_channels: inChannels, out_channels: outChannels, kernel_size: 1, stride, padding: 0 },
    });
    const projBn = builder.addNode(`${prefix}_proj_bn`, "BatchNorm2d", x + 300, skipY, {
      params: { num_features: outChannels },
    });
    builder.addEdge(`e-${prefix}-input-projconv`, inputId, projConv);
    builder.addEdge(`e-${prefix}-projconv-projbn`, projConv, projBn);
    builder.addEdge(`e-${prefix}-projbn-add`, projBn, add);
  } else {
    const identity = builder.addNode(`${prefix}_identity`, "Identity", x + 240, skipY, { params: {} });
    builder.addEdge(`e-${prefix}-input-identity`, inputId, identity);
    builder.addEdge(`e-${prefix}-identity-add`, identity, add);
  }

  return relu2;
}

function createResNetPreset() {
  const builder = createBuilder();

  let current = builder.addNode("input_1", "Input", 80, 320, { name: "image", params: { shape: [1, 3, 224, 224] } });
  const stemSpecs = [
    ["conv_1", "Conv2d", { params: { in_channels: 3, out_channels: 64, kernel_size: 7, stride: 2, padding: 3 } }],
    ["bn_1", "BatchNorm2d", { params: { num_features: 64 } }],
    ["relu_1", "ReLU", { params: {} }],
    ["pool_1", "MaxPool2d", { params: { kernel_size: 3, stride: 2, padding: 1 } }],
  ];

  stemSpecs.forEach(([id, type, data], index) => {
    const next = builder.addNode(id, type, 280 + index * 140, 320, data);
    builder.addEdge(`e-resnet-${current}-${next}`, current, next);
    current = next;
  });

  const stageConfigs = [
    { stage: 2, blocks: 3, inChannels: 64, outChannels: 64, firstStride: 1 },
    { stage: 3, blocks: 4, inChannels: 64, outChannels: 128, firstStride: 2 },
    { stage: 4, blocks: 6, inChannels: 128, outChannels: 256, firstStride: 2 },
    { stage: 5, blocks: 3, inChannels: 256, outChannels: 512, firstStride: 2 },
  ];

  let x = 980;
  stageConfigs.forEach((stageConfig) => {
    let stageInputChannels = stageConfig.inChannels;
    for (let blockIndex = 0; blockIndex < stageConfig.blocks; blockIndex += 1) {
      const blockName = `stage${stageConfig.stage}_block${blockIndex + 1}`;
      const stride = blockIndex === 0 ? stageConfig.firstStride : 1;
      current = addBasicBlock(
        builder,
        blockName,
        current,
        x,
        320,
        stageInputChannels,
        stageConfig.outChannels,
        stride
      );
      stageInputChannels = stageConfig.outChannels;
      x += 820;
    }
  });

  const tailSpecs = [
    ["pool_2", "AdaptiveAvgPool2d", { params: { output_size: [1, 1] } }],
    ["flatten_1", "Flatten", { params: { start_dim: 1 } }],
    ["linear_1", "Linear", { params: { in_features: 512, out_features: 1000 } }],
    ["output_1", "Output", { name: "logits", params: {} }],
  ];

  tailSpecs.forEach(([id, type, data], index) => {
    const next = builder.addNode(id, type, x + index * 180, 320, data);
    builder.addEdge(`e-resnet-${current}-${next}`, current, next);
    current = next;
  });

  return {
    key: "resnet",
    label: "ResNet-34",
    description:
      "A stage-complete ResNet-34 with all 16 basic blocks, BatchNorm, projection shortcuts, and adaptive global average pooling.",
    nodes: builder.nodes,
    edges: builder.edges,
  };
}

function createStackedLstmPreset() {
  const specs = [
    { id: "input_1", type: "Input", data: { name: "tokens", params: { shape: [4, 20, 128] } } },
    {
      id: "lstm_1",
      type: "LSTM",
      data: { params: { input_size: 128, hidden_size: 256, num_layers: 3, batch_first: 1, bidirectional: 0 } },
    },
    { id: "layernorm_1", type: "LayerNorm", data: { params: { normalized_shape: [256] } } },
    { id: "dropout_1", type: "Dropout", data: { params: { p: 0.3 } } },
    { id: "output_1", type: "Output", data: { name: "encoded", params: {} } },
  ];

  return {
    key: "stacked_lstm",
    label: "Stacked LSTM",
    description:
      "A compact stacked-LSTM encoder example using one black-box LSTM node with multiple layers, followed by light normalization and dropout.",
    nodes: sequentialNodes(specs, { startX: 80, startY: 220, gap: 190 }),
    edges: sequentialEdges(specs.map((spec) => spec.id), "stacked-lstm"),
  };
}

function createSeq2SeqLstmPreset() {
  const nodes = [
    node("source_1", "Input", 80, 140, { name: "source", params: { shape: [4, 20, 128] } }),
    node("target_1", "Input", 80, 340, { name: "target", params: { shape: [4, 20, 128] } }),
    node("encoder_lstm", "LSTM", 320, 140, {
      params: { input_size: 128, hidden_size: 128, num_layers: 2, batch_first: 1, bidirectional: 1 },
    }),
    node("merge_context", "Concat", 560, 240, { params: { dim: 2 } }),
    node("decoder_lstm", "LSTM", 800, 240, {
      params: { input_size: 384, hidden_size: 256, num_layers: 1, batch_first: 1, bidirectional: 0 },
    }),
    node("layernorm_1", "LayerNorm", 1040, 240, { params: { normalized_shape: [256] } }),
    node("output_1", "Output", 1280, 240, { name: "decoded", params: {} }),
  ];

  return {
    key: "seq2seq_lstm",
    label: "Seq2Seq (LSTM)",
    description:
      "A high-level encoder-decoder LSTM sketch. The encoder path is merged with teacher-forced target tokens before a compact decoder LSTM.",
    nodes,
    edges: [
      edge("e-seq2seq-source-encoder", "source_1", "encoder_lstm"),
      edge("e-seq2seq-encoder-merge", "encoder_lstm", "merge_context"),
      edge("e-seq2seq-target-merge", "target_1", "merge_context"),
      edge("e-seq2seq-merge-decoder", "merge_context", "decoder_lstm"),
      edge("e-seq2seq-decoder-norm", "decoder_lstm", "layernorm_1"),
      edge("e-seq2seq-norm-output", "layernorm_1", "output_1"),
    ],
  };
}

function createEncoderDecoderGruPreset() {
  const nodes = [
    node("source_1", "Input", 80, 140, { name: "source", params: { shape: [4, 20, 128] } }),
    node("target_1", "Input", 80, 340, { name: "target", params: { shape: [4, 20, 128] } }),
    node("encoder_gru", "GRU", 320, 140, {
      params: { input_size: 128, hidden_size: 128, num_layers: 2, batch_first: 1, bidirectional: 1 },
    }),
    node("merge_context", "Concat", 560, 240, { params: { dim: 2 } }),
    node("decoder_gru", "GRU", 800, 240, {
      params: { input_size: 384, hidden_size: 128, num_layers: 1, batch_first: 1, bidirectional: 0 },
    }),
    node("layernorm_1", "LayerNorm", 1040, 240, { params: { normalized_shape: [128] } }),
    node("output_1", "Output", 1280, 240, { name: "decoded", params: {} }),
  ];

  return {
    key: "encoder_decoder_gru",
    label: "Encoder-Decoder (GRU)",
    description:
      "A compact GRU encoder-decoder example with encoder context concatenated into the decoder input, staying compatible with the current DAG model.",
    nodes,
    edges: [
      edge("e-gru-source-encoder", "source_1", "encoder_gru"),
      edge("e-gru-encoder-merge", "encoder_gru", "merge_context"),
      edge("e-gru-target-merge", "target_1", "merge_context"),
      edge("e-gru-merge-decoder", "merge_context", "decoder_gru"),
      edge("e-gru-decoder-norm", "decoder_gru", "layernorm_1"),
      edge("e-gru-norm-output", "layernorm_1", "output_1"),
    ],
  };
}

export const PRESETS = {
  ...createSmallPresets(),
  lenet: createLeNetPreset(),
  alexnet: createAlexNetPreset(),
  vggnet: createVggPreset(),
  googlenet: createGoogLeNetPreset(),
  resnet: createResNetPreset(),
  stacked_lstm: createStackedLstmPreset(),
  seq2seq_lstm: createSeq2SeqLstmPreset(),
  encoder_decoder_gru: createEncoderDecoderGruPreset(),
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

function cloneNode(nodeValue) {
  return {
    id: nodeValue.id,
    type: nodeValue.type,
    position: { ...nodeValue.position },
    data: {
      ...(nodeValue.data?.name !== undefined ? { name: nodeValue.data.name } : {}),
      params: { ...(nodeValue.data?.params ?? {}) },
    },
  };
}

function cloneEdge(edgeValue) {
  return {
    id: edgeValue.id,
    source: edgeValue.source,
    target: edgeValue.target,
  };
}

function createSmallPresets() {
  return {
    lenet_small: {
      key: "lenet_small",
      label: "LeNet (small)",
      description:
        "The original compact preset backup: a minimal LeNet-style Conv -> Pool -> Conv -> Pool -> FC sketch.",
      nodes: [
        node("input_1", "Input", 80, 180, { name: "image", params: { shape: [1, 1, 32, 32] } }),
        node("conv_1", "Conv2d", 280, 180, {
          params: { in_channels: 1, out_channels: 6, kernel_size: 5, stride: 1, padding: 0 },
        }),
        node("pool_1", "AvgPool2d", 500, 180, { params: { kernel_size: 2, stride: 2, padding: 0 } }),
        node("conv_2", "Conv2d", 720, 180, {
          params: { in_channels: 6, out_channels: 16, kernel_size: 5, stride: 1, padding: 0 },
        }),
        node("pool_2", "AvgPool2d", 940, 180, { params: { kernel_size: 2, stride: 2, padding: 0 } }),
        node("flatten_1", "Flatten", 1160, 180, { params: { start_dim: 1 } }),
        node("linear_1", "Linear", 1380, 180, { params: { in_features: 400, out_features: 120 } }),
        node("output_1", "Output", 1600, 180, { name: "logits", params: {} }),
      ],
      edges: [
        edge("e-lenet-input-conv1", "input_1", "conv_1"),
        edge("e-lenet-conv1-pool1", "conv_1", "pool_1"),
        edge("e-lenet-pool1-conv2", "pool_1", "conv_2"),
        edge("e-lenet-conv2-pool2", "conv_2", "pool_2"),
        edge("e-lenet-pool2-flatten", "pool_2", "flatten_1"),
        edge("e-lenet-flatten-linear", "flatten_1", "linear_1"),
        edge("e-lenet-linear-output", "linear_1", "output_1"),
      ],
    },
    alexnet_small: {
      key: "alexnet_small",
      label: "AlexNet (small)",
      description:
        "The original compact AlexNet backup focused on the early conv stack and a single classifier projection.",
      nodes: [
        node("input_1", "Input", 80, 180, { name: "image", params: { shape: [1, 3, 224, 224] } }),
        node("conv_1", "Conv2d", 320, 180, {
          params: { in_channels: 3, out_channels: 96, kernel_size: 11, stride: 4, padding: 2 },
        }),
        node("relu_1", "ReLU", 540, 180, { params: {} }),
        node("pool_1", "MaxPool2d", 760, 180, { params: { kernel_size: 3, stride: 2, padding: 0 } }),
        node("conv_2", "Conv2d", 980, 180, {
          params: { in_channels: 96, out_channels: 256, kernel_size: 5, stride: 1, padding: 2 },
        }),
        node("pool_2", "MaxPool2d", 1200, 180, { params: { kernel_size: 3, stride: 2, padding: 0 } }),
        node("flatten_1", "Flatten", 1420, 180, { params: { start_dim: 1 } }),
        node("linear_1", "Linear", 1640, 180, { params: { in_features: 43264, out_features: 4096 } }),
        node("output_1", "Output", 1860, 180, { name: "logits", params: {} }),
      ],
      edges: [
        edge("e-alex-input-conv1", "input_1", "conv_1"),
        edge("e-alex-conv1-relu1", "conv_1", "relu_1"),
        edge("e-alex-relu1-pool1", "relu_1", "pool_1"),
        edge("e-alex-pool1-conv2", "pool_1", "conv_2"),
        edge("e-alex-conv2-pool2", "conv_2", "pool_2"),
        edge("e-alex-pool2-flatten", "pool_2", "flatten_1"),
        edge("e-alex-flatten-linear", "flatten_1", "linear_1"),
        edge("e-alex-linear-output", "linear_1", "output_1"),
      ],
    },
    vggnet_small: {
      key: "vggnet_small",
      label: "VGGNet (small)",
      description:
        "The original compact VGG-style backup with two stacked conv blocks before the classifier projection.",
      nodes: [
        node("input_1", "Input", 80, 180, { name: "image", params: { shape: [1, 3, 224, 224] } }),
        node("conv_1", "Conv2d", 280, 120, {
          params: { in_channels: 3, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("conv_2", "Conv2d", 500, 120, {
          params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("pool_1", "MaxPool2d", 720, 120, { params: { kernel_size: 2, stride: 2, padding: 0 } }),
        node("conv_3", "Conv2d", 940, 240, {
          params: { in_channels: 64, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("conv_4", "Conv2d", 1160, 240, {
          params: { in_channels: 128, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("pool_2", "MaxPool2d", 1380, 240, { params: { kernel_size: 2, stride: 2, padding: 0 } }),
        node("flatten_1", "Flatten", 1600, 180, { params: { start_dim: 1 } }),
        node("linear_1", "Linear", 1820, 180, { params: { in_features: 401408, out_features: 4096 } }),
        node("output_1", "Output", 2040, 180, { name: "logits", params: {} }),
      ],
      edges: [
        edge("e-vgg-input-conv1", "input_1", "conv_1"),
        edge("e-vgg-conv1-conv2", "conv_1", "conv_2"),
        edge("e-vgg-conv2-pool1", "conv_2", "pool_1"),
        edge("e-vgg-pool1-conv3", "pool_1", "conv_3"),
        edge("e-vgg-conv3-conv4", "conv_3", "conv_4"),
        edge("e-vgg-conv4-pool2", "conv_4", "pool_2"),
        edge("e-vgg-pool2-flatten", "pool_2", "flatten_1"),
        edge("e-vgg-flatten-linear", "flatten_1", "linear_1"),
        edge("e-vgg-linear-output", "linear_1", "output_1"),
      ],
    },
    googlenet_small: {
      key: "googlenet_small",
      label: "GoogLeNet (small)",
      description:
        "The original compact Inception backup with a single multi-branch module merged by Concat.",
      nodes: [
        node("input_1", "Input", 80, 260, { name: "image", params: { shape: [1, 3, 224, 224] } }),
        node("conv_1", "Conv2d", 300, 260, {
          params: { in_channels: 3, out_channels: 64, kernel_size: 7, stride: 2, padding: 3 },
        }),
        node("pool_1", "MaxPool2d", 520, 260, { params: { kernel_size: 3, stride: 2, padding: 1 } }),
        node("branch_1x1", "Conv2d", 760, 80, {
          params: { in_channels: 64, out_channels: 64, kernel_size: 1, stride: 1, padding: 0 },
        }),
        node("branch_3x3_reduce", "Conv2d", 760, 220, {
          params: { in_channels: 64, out_channels: 96, kernel_size: 1, stride: 1, padding: 0 },
        }),
        node("branch_3x3", "Conv2d", 980, 220, {
          params: { in_channels: 96, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("branch_pool", "MaxPool2d", 760, 360, { params: { kernel_size: 3, stride: 1, padding: 1 } }),
        node("branch_pool_proj", "Conv2d", 980, 360, {
          params: { in_channels: 64, out_channels: 32, kernel_size: 1, stride: 1, padding: 0 },
        }),
        node("concat_1", "Concat", 1240, 260, { params: { dim: 1 } }),
        node("pool_2", "AvgPool2d", 1460, 260, { params: { kernel_size: 7, stride: 1, padding: 0 } }),
        node("flatten_1", "Flatten", 1680, 260, { params: { start_dim: 1 } }),
        node("output_1", "Output", 1900, 260, { name: "logits", params: {} }),
      ],
      edges: [
        edge("e-goog-input-conv1", "input_1", "conv_1"),
        edge("e-goog-conv1-pool1", "conv_1", "pool_1"),
        edge("e-goog-pool1-1x1", "pool_1", "branch_1x1"),
        edge("e-goog-pool1-3x3reduce", "pool_1", "branch_3x3_reduce"),
        edge("e-goog-3x3reduce-3x3", "branch_3x3_reduce", "branch_3x3"),
        edge("e-goog-pool1-branchpool", "pool_1", "branch_pool"),
        edge("e-goog-branchpool-proj", "branch_pool", "branch_pool_proj"),
        edge("e-goog-1x1-concat", "branch_1x1", "concat_1"),
        edge("e-goog-3x3-concat", "branch_3x3", "concat_1"),
        edge("e-goog-poolproj-concat", "branch_pool_proj", "concat_1"),
        edge("e-goog-concat-pool2", "concat_1", "pool_2"),
        edge("e-goog-pool2-flatten", "pool_2", "flatten_1"),
        edge("e-goog-flatten-output", "flatten_1", "output_1"),
      ],
    },
    resnet_small: {
      key: "resnet_small",
      label: "ResNet (small)",
      description:
        "The original compact residual backup with one skip connection and a shallow classifier tail.",
      nodes: [
        node("input_1", "Input", 80, 260, { name: "image", params: { shape: [1, 3, 224, 224] } }),
        node("conv_1", "Conv2d", 320, 140, {
          params: { in_channels: 3, out_channels: 64, kernel_size: 7, stride: 2, padding: 3 },
        }),
        node("pool_1", "MaxPool2d", 540, 140, { params: { kernel_size: 3, stride: 2, padding: 1 } }),
        node("conv_2", "Conv2d", 780, 140, {
          params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("relu_1", "ReLU", 1000, 140, { params: {} }),
        node("conv_3", "Conv2d", 1220, 140, {
          params: { in_channels: 64, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 },
        }),
        node("add_1", "Add", 1460, 260, { params: {} }),
        node("relu_2", "ReLU", 1680, 260, { params: {} }),
        node("pool_2", "AvgPool2d", 1900, 260, { params: { kernel_size: 7, stride: 1, padding: 0 } }),
        node("flatten_1", "Flatten", 2120, 260, { params: { start_dim: 1 } }),
        node("output_1", "Output", 2340, 260, { name: "logits", params: {} }),
      ],
      edges: [
        edge("e-res-input-conv1", "input_1", "conv_1"),
        edge("e-res-conv1-pool1", "conv_1", "pool_1"),
        edge("e-res-pool1-conv2", "pool_1", "conv_2"),
        edge("e-res-conv2-relu1", "conv_2", "relu_1"),
        edge("e-res-relu1-conv3", "relu_1", "conv_3"),
        edge("e-res-conv3-add", "conv_3", "add_1"),
        edge("e-res-pool1-add", "pool_1", "add_1"),
        edge("e-res-add-relu2", "add_1", "relu_2"),
        edge("e-res-relu2-pool2", "relu_2", "pool_2"),
        edge("e-res-pool2-flatten", "pool_2", "flatten_1"),
        edge("e-res-flatten-output", "flatten_1", "output_1"),
      ],
    },
  };
}
