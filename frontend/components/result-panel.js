"use client";

import { useState } from "react";

export function ResultPanel({ topologicalOrder, shapes, code, errorDetail }) {
  const hasResults = topologicalOrder.length > 0 || Object.keys(shapes).length > 0 || Boolean(code);
  const [copyStatus, setCopyStatus] = useState("");

  async function handleCopyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl2 border border-border bg-panel p-4 shadow-panel">
      <div className="shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Results</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">Validation & Compile Output</h2>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {errorDetail ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorDetail}
          </div>
        ) : null}

        {!hasResults ? (
          <p className="mt-2 rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-sm text-muted">
            Run validate or compile to inspect graph results.
          </p>
        ) : (
          <div className={`space-y-4 ${errorDetail ? "mt-4" : ""}`}>
          <div className="rounded-2xl border border-border bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Generated Code</p>
              <div className="flex items-center gap-2">
                {copyStatus ? <span className="text-xs text-muted">{copyStatus}</span> : null}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!code}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Copy Code
                </button>
              </div>
            </div>
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
      </div>
    </section>
  );
}
