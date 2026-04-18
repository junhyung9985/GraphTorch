"use client";

import { Handle, Position } from "reactflow";

import { getNodeBadge, getNodeSummary, getNodeTitle } from "@/lib/graph";

export function GraphNode({ data, id, type, selected }) {
  const badge = getNodeBadge(type);
  const summary = getNodeSummary({ id, type, data });
  const title = getNodeTitle({ id, type, data });

  return (
    <div
      className={`min-w-[190px] max-w-[220px] rounded-[16px] border bg-white px-4 py-3 shadow-node transition ${
        selected ? "border-blue-400 shadow-selected" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!left-[-10px] !h-5 !w-5" />
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{id}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{summary}</div>
      </div>
      <Handle type="source" position={Position.Right} className="!right-[-10px] !h-5 !w-5" />
    </div>
  );
}
