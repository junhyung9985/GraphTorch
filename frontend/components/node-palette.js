"use client";

import { useState } from "react";

import { NODE_DEFINITIONS } from "@/lib/defaults";

const CATEGORY_LABELS = {
  input: "I/O",
  module: "Modules",
  functional: "Functions",
};

const CATEGORY_STYLES = {
  input: "border-teal-100 bg-teal-50/70 text-teal-700",
  module: "border-blue-100 bg-blue-50/70 text-blue-700",
  functional: "border-amber-100 bg-amber-50/80 text-amber-700",
};

export function NodePalette({ onAddNode }) {
  const [collapsed, setCollapsed] = useState({
    input: true,
    module: true,
    functional: true,
  });

  return (
    <section className="flex h-full flex-col rounded-xl2 border border-border bg-panel p-4 shadow-panel">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Palette</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">Node Library</h2>
      </div>
      <div className="space-y-4 overflow-y-auto pr-1">
        {Object.entries(
          NODE_DEFINITIONS.reduce((grouped, definition) => {
            grouped[definition.category] ??= [];
            grouped[definition.category].push(definition);
            return grouped;
          }, {})
        ).map(([category, items]) => (
          <div key={category}>
            <button
              type="button"
              onClick={() => setCollapsed((current) => ({ ...current, [category]: !current[category] }))}
              className="mb-2 flex w-full items-center justify-between text-left text-xs font-medium uppercase tracking-[0.16em] text-muted"
            >
              <span>{CATEGORY_LABELS[category]}</span>
              <span>{collapsed[category] ? "+" : "-"}</span>
            </button>
            {!collapsed[category] ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onAddNode(item.type)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${CATEGORY_STYLES[item.category]}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{item.type}</span>
                      <span className="text-xs opacity-80">Add</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
