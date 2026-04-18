"use client";

export function JsonModal({
  mode,
  isOpen,
  value,
  loadError,
  onChange,
  onClose,
  onCopy,
  onApply,
}) {
  if (!isOpen) return null;

  const isSaveMode = mode === "save";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-3xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Diagram JSON</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{isSaveMode ? "Save JSON" : "Load JSON"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          readOnly={isSaveMode}
          className="mt-4 h-[360px] w-full rounded-[20px] border border-border bg-slate-50 px-4 py-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />

        {!isSaveMode && loadError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          {isSaveMode ? (
            <button
              type="button"
              onClick={onCopy}
              className="rounded-2xl bg-[#1f4cff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b43e0]"
            >
              Copy JSON
            </button>
          ) : (
            <button
              type="button"
              onClick={onApply}
              className="rounded-2xl bg-[#1f4cff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b43e0]"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
