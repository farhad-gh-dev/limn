// The render pipeline, engine-agnostic at the call site: themed Vega-Lite spec
// in → { svg, png, resolved spec } out. Path A (Vega-Lite → SVG → resvg-js).
import * as vega from "vega";
import { compile } from "vega-lite";
import { Resvg } from "@resvg/resvg-js";
import { FONT, FONT as DEFAULT_FAMILY } from "../theme/theme.js";
import { FONT_FILES } from "./fonts.js";
import { installTextMetrics } from "./textMetrics.js";
import { stderrLogger } from "./logger.js";
import { lockedLoader } from "./loader.js";
import { LIGHT } from "../theme/palette.js";

export interface RenderResult {
  svg: string;
  png: Buffer;
  vegaLiteSpec: unknown;
  vegaSpec: unknown;
}

interface VegaView {
  initialize(): VegaView;
  runAsync(): Promise<VegaView>;
  toSVG(): Promise<string>;
  finalize(): void;
}

export interface RenderOptions {
  scale?: number; // PNG raster scale (default 2 → crisp on retina/print)
  source?: string; // optional source/footnote line, drawn bottom-left
}

/** Compile + render a themed Vega-Lite spec to SVG and PNG. */
export async function renderVegaLite(
  vlSpec: Record<string, unknown>,
  opts: RenderOptions = {}
): Promise<RenderResult> {
  installTextMetrics();

  const compiled = compile(vlSpec as unknown as Parameters<typeof compile>[0]);
  const vgSpec = compiled.spec;

  const runtime = vega.parse(vgSpec as Parameters<typeof vega.parse>[0]);
  // vega's published types are a thin stub; the runtime options (renderer/logger/
  // loader) are valid but not in the typings, so construct through `any`.
  const view = new (vega.View as unknown as new (rt: unknown, opts: unknown) => VegaView)(runtime, {
    renderer: "none",
    logger: stderrLogger(),
    loader: lockedLoader(),
  }).initialize();

  await view.runAsync();
  let svg = await view.toSVG();
  view.finalize();

  if (opts.source) svg = addSourceFooter(svg, opts.source);

  const png = rasterize(svg, opts.scale ?? 2);
  return { svg, png, vegaLiteSpec: vlSpec, vegaSpec: vgSpec };
}

function rasterize(svg: string, scale: number): Buffer {
  const resvg = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: DEFAULT_FAMILY },
    fitTo: { mode: "zoom", value: scale },
  });
  return resvg.render().asPng();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Append a muted source line below the chart, growing the SVG canvas to fit. */
function addSourceFooter(svg: string, source: string): string {
  const tagMatch = svg.match(/<svg([^>]*)>/);
  if (!tagMatch || tagMatch[1] === undefined) return svg;
  const attrs = tagMatch[1];

  const wMatch = attrs.match(/\bwidth="([\d.]+)"/);
  const hMatch = attrs.match(/\bheight="([\d.]+)"/);
  if (!wMatch?.[1] || !hMatch?.[1]) return svg;

  const w = parseFloat(wMatch[1]);
  const h = parseFloat(hMatch[1]);
  const footerH = 26;
  const newH = h + footerH;

  let newAttrs = attrs.replace(/\bheight="[\d.]+"/, `height="${newH}"`);
  if (/viewBox="[^"]*"/.test(newAttrs)) {
    newAttrs = newAttrs.replace(/viewBox="[^"]*"/, `viewBox="0 0 ${w} ${newH}"`);
  }

  const footer =
    `<text x="18" y="${h + 16}" font-family="${FONT}, sans-serif" ` +
    `font-size="11" fill="${LIGHT.faint}">${escapeXml(source)}</text>`;

  return svg.replace(/<svg[^>]*>/, `<svg${newAttrs}>`).replace("</svg>", `${footer}</svg>`);
}
