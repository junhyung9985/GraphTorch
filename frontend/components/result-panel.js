"use client";

export function ResultPanel({ topologicalOrder, shapes, code, errorDetail }) {
  const hasResults = topologicalOrder.length > 0 || Object.keys(shapes).length > 0 || Boolean(code);

  return (
    <section className="rounded-xl2 border border-border bg-panel p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Results</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">Validation & Compile Output</h2>

      {errorDetail ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorDetail}
        </div>
      ) : null}

      {!hasResults ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-sm text-muted">
          Run validate or compile to inspect graph results.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Generated Code</p>
            <pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-[#0f172a] p-4 text-xs leading-6 text-slate-100">
              {code || "# Run compile to generate PyTorch code"}
            </pre>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Topological Order</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topologicalOrder.length > 0 ? (
                topologicalOrder.map((nodeId) => (
                  <span
                    key={nodeId}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {nodeId}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">No data</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Shapes</p>
            <pre className="mt-2 overflow-x-auto rounded-2xl bg-white p-3 text-xs leading-6 text-slate-700">
              {Object.keys(shapes).length > 0 ? JSON.stringify(shapes, null, 2) : "No data"}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
