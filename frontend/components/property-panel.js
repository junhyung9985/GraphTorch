"use client";

import { formatArray, parseArrayInput, parseScalar } from "@/lib/graph";

const PARAM_FIELDS = {
  Input: [{ key: "shape", label: "Shape", kind: "array" }],
  Output: [],
  Conv2d: [
    { key: "in_channels", label: "In Channels", kind: "number" },
    { key: "out_channels", label: "Out Channels", kind: "number" },
    { key: "kernel_size", label: "Kernel Size", kind: "number" },
    { key: "stride", label: "Stride", kind: "number" },
    { key: "padding", label: "Padding", kind: "number" },
  ],
  Linear: [
    { key: "in_features", label: "In Features", kind: "number" },
    { key: "out_features", label: "Out Features", kind: "number" },
  ],
  BatchNorm2d: [{ key: "num_features", label: "Num Features", kind: "number" }],
  LayerNorm: [{ key: "normalized_shape", label: "Normalized Shape", kind: "array" }],
  LSTM: [
    { key: "input_size", label: "Input Size", kind: "number" },
    { key: "hidden_size", label: "Hidden Size", kind: "number" },
    { key: "num_layers", label: "Layers", kind: "number" },
    { key: "batch_first", label: "Batch First 0/1", kind: "number" },
    { key: "bidirectional", label: "Bidirectional 0/1", kind: "number" },
  ],
  GRU: [
    { key: "input_size", label: "Input Size", kind: "number" },
    { key: "hidden_size", label: "Hidden Size", kind: "number" },
    { key: "num_layers", label: "Layers", kind: "number" },
    { key: "batch_first", label: "Batch First 0/1", kind: "number" },
    { key: "bidirectional", label: "Bidirectional 0/1", kind: "number" },
  ],
  ReLU: [],
  Dropout: [{ key: "p", label: "Drop Probability", kind: "number" }],
  LocalResponseNorm: [
    { key: "size", label: "Size", kind: "number" },
    { key: "alpha", label: "Alpha", kind: "number" },
    { key: "beta", label: "Beta", kind: "number" },
    { key: "k", label: "K", kind: "number" },
  ],
  MaxPool2d: [
    { key: "kernel_size", label: "Kernel Size", kind: "number" },
    { key: "stride", label: "Stride", kind: "number" },
    { key: "padding", label: "Padding", kind: "number" },
  ],
  AvgPool2d: [
    { key: "kernel_size", label: "Kernel Size", kind: "number" },
    { key: "stride", label: "Stride", kind: "number" },
    { key: "padding", label: "Padding", kind: "number" },
  ],
  AdaptiveAvgPool2d: [{ key: "output_size", label: "Output Size", kind: "array" }],
  Identity: [],
  Add: [],
  Concat: [{ key: "dim", label: "Dim", kind: "number" }],
  Flatten: [{ key: "start_dim", label: "Start Dim", kind: "number" }],
  Reshape: [{ key: "shape", label: "Shape", kind: "array" }],
  Permute: [{ key: "dims", label: "Dims", kind: "array" }],
  Softmax: [{ key: "dim", label: "Dim", kind: "number" }],
};

function InputField({ label, value, onChange, placeholder }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function PropertyPanel({ node, edge, onChange, onDelete, onDeleteEdge }) {
  if (!node && edge) {
    return (
      <section className="rounded-xl2 border border-border bg-panel p-4 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Properties</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">Edge</h2>
            <p className="mt-1 text-xs text-muted">Edge ID: {edge.id}</p>
          </div>
          <button
            type="button"
            onClick={() => onDeleteEdge(edge.id)}
            className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-4 text-sm text-muted">
          <p>
            Source: <span className="font-medium text-ink">{edge.source}</span>
          </p>
          <p className="mt-2">
            Target: <span className="font-medium text-ink">{edge.target}</span>
          </p>
        </div>
      </section>
    );
  }

  if (!node) {
    return (
      <section className="rounded-xl2 border border-border bg-panel p-4 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Properties</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">Node Inspector</h2>
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-sm text-muted">
          Select a node to edit its fields.
        </p>
      </section>
    );
  }

  const fields = PARAM_FIELDS[node.type] ?? [];
  const params = node.data?.params ?? {};
  const allowsName = node.type === "Input" || node.type === "Output";

  return (
    <section className="rounded-xl2 border border-border bg-panel p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Properties</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{node.type}</h2>
          <p className="mt-1 text-xs text-muted">Node ID: {node.id}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
        >
          Delete
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {allowsName ? (
          <InputField
            label="Name"
            value={node.data?.name ?? ""}
            placeholder={node.type === "Input" ? "image" : "main"}
            onChange={(event) => onChange(node.id, "name", event.target.value)}
          />
        ) : null}

        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-4 text-sm text-muted">
            No editable fields for this node.
          </div>
        ) : (
          fields.map((field) => (
            <InputField
              key={field.key}
              label={field.label}
              value={field.kind === "array" ? formatArray(params[field.key]) : String(params[field.key] ?? "")}
              placeholder={field.kind === "array" ? "1, 3, 32, 32" : "0"}
              onChange={(event) =>
                onChange(
                  node.id,
                  `params.${field.key}`,
                  field.kind === "array" ? parseArrayInput(event.target.value) : parseScalar(event.target.value)
                )
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
