import { getCategory } from "./defaults.js";

export function toBackendGraph({ nodes, edges }) {
  return {
    nodes: nodes.map((node) => {
      const payload = {
        id: node.id,
        type: node.type,
        params: sanitizeParams(node.data?.params ?? {}),
      };
      if ((node.type === "Input" || node.type === "Output") && node.data?.name) {
        payload.name = node.data.name;
      }
      return payload;
    }),
    edges: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    })),
  };
}

export function toDiagramJson(nodes, edges) {
  return JSON.stringify(
    {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...(node.data?.name ? { name: node.data.name } : {}),
          params: sanitizeParams(node.data?.params ?? {}),
        },
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    },
    null,
    2
  );
}

export function fromDiagramJson(rawValue) {
  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("Invalid JSON format.");
  }

  if (!Array.isArray(parsed.nodes)) {
    throw new Error("Invalid diagram payload: nodes must be an array.");
  }
  if (!Array.isArray(parsed.edges)) {
    throw new Error("Invalid diagram payload: edges must be an array.");
  }

  parsed.nodes.forEach((node, index) => {
    if (!node || typeof node.id !== "string" || typeof node.type !== "string") {
      throw new Error(`Invalid diagram payload: node at index ${index} must include id and type.`);
    }
  });

  parsed.edges.forEach((edge, index) => {
    if (!edge || typeof edge.source !== "string" || typeof edge.target !== "string") {
      throw new Error(`Invalid diagram payload: edge at index ${index} must include source and target.`);
    }
  });

  return {
    nodes: parsed.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position ?? { x: 0, y: 0 },
      data: {
        ...(node.data?.name !== undefined ? { name: node.data.name } : {}),
        params: { ...(node.data?.params ?? {}) },
      },
    })),
    edges: parsed.edges.map((edge) => ({
      id: edge.id ?? `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
    })),
  };
}

export function getNodeTitle(node) {
  if (node.type === "Input" && node.data?.name) return node.data.name;
  if (node.type === "Output" && node.data?.name) return node.data.name;
  return node.type;
}

export function getNodeSummary(node) {
  const params = node.data?.params ?? {};
  switch (node.type) {
    case "Input":
      return formatArray(params.shape);
    case "Output":
      return "export tensor";
    case "Conv2d":
      return `${params.in_channels ?? "?"}\u2192${params.out_channels ?? "?"}, k=${params.kernel_size ?? "?"}, s=${params.stride ?? 1}`;
    case "Linear":
      return `${params.in_features ?? "?"}\u2192${params.out_features ?? "?"}`;
    case "BatchNorm2d":
      return `features=${params.num_features ?? "?"}`;
    case "MaxPool2d":
    case "AvgPool2d":
      return `k=${params.kernel_size ?? "?"}, s=${params.stride ?? params.kernel_size ?? "?"}`;
    case "Concat":
      return `dim=${params.dim ?? 1}`;
    case "Flatten":
      return `start=${params.start_dim ?? 1}`;
    case "Reshape":
      return formatArray(params.shape);
    case "Permute":
      return formatArray(params.dims);
    default:
      return "No params";
  }
}

export function getNodeBadge(nodeType) {
  const category = getCategory(nodeType);
  if (category === "input") return { label: nodeType, className: "bg-teal-50 text-teal-700 ring-1 ring-teal-200" };
  if (category === "functional") {
    return { label: nodeType, className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
  }
  return { label: nodeType, className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" };
}

export function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

export function parseScalar(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return "";
  const numeric = Number(trimmed);
  return Number.isNaN(numeric) ? trimmed : numeric;
}

export function parseArrayInput(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item));
}

export function formatArray(value) {
  if (!Array.isArray(value)) return "";
  return `[${value.join(", ")}]`;
}
