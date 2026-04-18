export const EXPORT_PADDING = 32;
export const EXPORT_FILENAME = "graphtorch-diagram.svg";

const PAPER_NODE_WIDTH = 156;
const PAPER_NODE_HEIGHT = 56;
const PAPER_NODE_RADIUS = 10;
const PAPER_FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const PAPER_FONT_SIZE = 14;
const PAPER_LINE_HEIGHT = 1.35;
const PAPER_BORDER_COLOR = "#94a3b8";
const PAPER_FILL = "#ffffff";
const PAPER_TEXT_COLOR = "#0f172a";
const PAPER_EDGE_COLOR = "#475569";
const PAPER_EDGE_WIDTH = 2;

export function validateExportableGraph(nodes) {
  return Array.isArray(nodes) && nodes.length > 0;
}

export function computeExportBounds(nodes, padding = EXPORT_PADDING) {
  if (!validateExportableGraph(nodes)) {
    throw new Error("Nothing to export");
  }

  const layoutNodes = nodes.map(getPaperNodeLayout);
  const minX = Math.min(...layoutNodes.map((node) => node.x));
  const minY = Math.min(...layoutNodes.map((node) => node.y));
  const maxX = Math.max(...layoutNodes.map((node) => node.x + node.width));
  const maxY = Math.max(...layoutNodes.map((node) => node.y + node.height));

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    padding,
  };
}

export function buildPaperSvg({ nodes, edges, bounds }) {
  const nodeLayouts = nodes.map(getPaperNodeLayout);
  const nodeLookup = new Map(nodeLayouts.map((node) => [node.id, node]));

  const markerId = "paper-arrow";
  const edgeMarkup = edges
    .map((edge) => renderPaperEdge(edge, nodeLookup, markerId))
    .filter(Boolean)
    .join("");
  const nodeMarkup = nodeLayouts.map(renderPaperNode).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" fill="none">`,
    `<defs>`,
    `<marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">`,
    `<path d="M 0 0 L 10 5 L 0 10 z" fill="${PAPER_EDGE_COLOR}"/>`,
    `</marker>`,
    `</defs>`,
    `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="#ffffff"/>`,
    edgeMarkup,
    nodeMarkup,
    `</svg>`,
  ].join("");
}

export function exportGraphToSvg({ nodes, edges, padding = EXPORT_PADDING }) {
  if (!validateExportableGraph(nodes)) {
    throw new Error("Nothing to export");
  }

  const bounds = computeExportBounds(nodes, padding);
  const svgText = buildPaperSvg({ nodes, edges, bounds });
  downloadSvg(svgText, EXPORT_FILENAME);
  return svgText;
}

export function downloadSvg(svgText, filename = EXPORT_FILENAME) {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderPaperNode(node) {
  const labelX = node.x + node.width / 2;
  const labelY = node.y + node.height / 2 + 1;

  return [
    `<g>`,
    `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${PAPER_NODE_RADIUS}" ry="${PAPER_NODE_RADIUS}" fill="${PAPER_FILL}" stroke="${PAPER_BORDER_COLOR}" stroke-width="1.5"/>`,
    `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="${PAPER_TEXT_COLOR}" font-family="${xmlEscape(
      PAPER_FONT_FAMILY
    )}" font-size="${PAPER_FONT_SIZE}" font-weight="600" lengthAdjust="spacingAndGlyphs">${xmlEscape(node.type)}</text>`,
    `</g>`,
  ].join("");
}

function renderPaperEdge(edge, nodeLookup, markerId) {
  const source = nodeLookup.get(edge.source);
  const target = nodeLookup.get(edge.target);
  if (!source || !target) return "";

  const sourceX = source.x + source.width;
  const sourceY = source.y + source.height / 2;
  const targetX = target.x;
  const targetY = target.y + target.height / 2;
  const delta = Math.max(48, Math.abs(targetX - sourceX) / 2);
  const control1X = sourceX + delta;
  const control2X = targetX - delta;

  return `<path d="M ${sourceX} ${sourceY} C ${control1X} ${sourceY}, ${control2X} ${targetY}, ${targetX} ${targetY}" stroke="${PAPER_EDGE_COLOR}" stroke-width="${PAPER_EDGE_WIDTH}" fill="none" marker-end="url(#${markerId})"/>`;
}

function getPaperNodeLayout(node) {
  return {
    id: node.id,
    type: node.type,
    x: Number(node.position?.x ?? 0),
    y: Number(node.position?.y ?? 0),
    width: Number(node.width ?? node.measured?.width ?? PAPER_NODE_WIDTH) || PAPER_NODE_WIDTH,
    height: Number(node.height ?? node.measured?.height ?? PAPER_NODE_HEIGHT) || PAPER_NODE_HEIGHT,
  };
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
