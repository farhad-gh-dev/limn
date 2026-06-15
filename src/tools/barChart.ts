import { z } from "zod";
import type { ToolDef } from "./types.js";
import {
  dataField,
  editorialShape,
  styleShape,
  resolveStyle,
  assertFields,
  prettify,
  toStringArray,
  type DataRow,
} from "../schemas/common.js";
import { applyTheme } from "../theme/theme.js";
import type { ThemeColors } from "../theme/palette.js";
import { renderVegaLite } from "../render/pipeline.js";

const inputShape = {
  ...dataField,
  x: z.string().describe('Category field (one bar per value). Example: "region".'),
  y: z.string().describe('Numeric value field (bar length). Example: "revenue".'),
  series: z.string().optional().describe("Optional grouping field → grouped or stacked bars."),
  layout: z
    .enum(["vertical", "horizontal", "stacked", "grouped"])
    .optional()
    .describe(
      "Default vertical. Use horizontal for many/long category labels. With `series`, default is stacked; pass grouped for side-by-side."
    ),
  sort: z
    .enum(["value-desc", "value-asc", "none"])
    .optional()
    .describe("Order bars by value. Default value-desc."),
  highlight: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Category value(s) to emphasize with the accent; the rest fade to grey. Single-series only."),
  valueLabels: z.boolean().optional().describe("Label bars directly with their value (single-series). Default false."),
  ...editorialShape,
  ...styleShape,
};

function buildSpec(args: Record<string, unknown>, colors: ThemeColors): Record<string, unknown> {
  const data = args.data as DataRow[];
  const x = args.x as string;
  const y = args.y as string;
  const series = args.series as string | undefined;
  const explicitLayout = args.layout != null;
  let layout = (args.layout as string) ?? "vertical";
  const sort = (args.sort as string) ?? "value-desc";
  const highlight = toStringArray(args.highlight);
  const valueLabels = (args.valueLabels as boolean) ?? false;

  assertFields(data, [
    { role: "x", field: x },
    { role: "y", field: y },
    { role: "series", field: series },
  ]);

  // Auto-switch to horizontal when category labels are long or numerous —
  // vertical bars with long labels read poorly. Explicit layout wins.
  if (!explicitLayout && !series && layout === "vertical") {
    const cats = new Set<string>();
    let maxLen = 0;
    for (const r of data) {
      const v = r[x];
      if (v != null) {
        const s = String(v);
        cats.add(s);
        if (s.length > maxLen) maxLen = s.length;
      }
    }
    if (cats.size > 12 || maxLen > 16) layout = "horizontal";
  }

  const horizontal = layout === "horizontal";
  const grouped = !!series && layout === "grouped";
  const stacked = !!series && !grouped; // series present and not grouped → stacked

  const catEnc: Record<string, unknown> = {
    field: x,
    type: "nominal",
    title: prettify(x),
    axis: { grid: false, labelAngle: 0 },
  };
  if (sort !== "none") {
    catEnc.sort = { op: "sum", field: y, order: sort === "value-asc" ? "ascending" : "descending" };
  }
  const valEnc: Record<string, unknown> = {
    field: y,
    type: "quantitative",
    title: prettify(y),
    axis: { grid: true, format: "~s", domain: false, ticks: false },
    stack: stacked ? "zero" : null,
  };

  const encoding: Record<string, unknown> = horizontal ? { y: catEnc, x: valEnc } : { x: catEnc, y: valEnc };

  const useHighlight = !series && highlight.length > 0;
  const transform: Array<Record<string, unknown>> = [];
  if (series) {
    encoding.color = { field: series, type: "nominal", title: prettify(series) };
    if (grouped) encoding[horizontal ? "yOffset" : "xOffset"] = { field: series };
  } else if (useHighlight) {
    transform.push({
      calculate: `indexof(${JSON.stringify(highlight)}, ''+datum[${JSON.stringify(x)}]) >= 0 ? 'on' : 'off'`,
      as: "__hl",
    });
    encoding.color = {
      field: "__hl",
      type: "nominal",
      scale: { domain: ["on", "off"], range: [colors.accent, colors.mute] },
      legend: null,
    };
  }

  const barMark = { type: "bar", cornerRadiusEnd: 2 };

  if (valueLabels && !series) {
    const textEnc: Record<string, unknown> = horizontal
      ? { y: catEnc, x: valEnc, text: { field: y, type: "quantitative", format: "~s" } }
      : { x: catEnc, y: valEnc, text: { field: y, type: "quantitative", format: "~s" } };
    const textMark = horizontal
      ? { type: "text", align: "left", baseline: "middle", dx: 4, fontWeight: 500, color: colors.ink }
      : { type: "text", align: "center", baseline: "bottom", dy: -4, fontWeight: 500, color: colors.ink };
    return {
      data: { values: data },
      ...(transform.length ? { transform } : {}),
      layer: [
        { mark: barMark, encoding },
        { mark: textMark, encoding: textEnc },
      ],
    };
  }

  return {
    data: { values: data },
    ...(transform.length ? { transform } : {}),
    mark: barMark,
    encoding,
  };
}

export const barChart: ToolDef = {
  name: "bar_chart",
  title: "Bar chart",
  description:
    "Compare a numeric value across categories. Zero baseline always; auto-sorts by value (descending). " +
    "Use `series` for grouped/stacked bars, `layout:'horizontal'` for many or long labels, `highlight` to " +
    "emphasize specific bars (others fade to grey), and `valueLabels` to label bars directly. " +
    "Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args, style.colors), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source, sourceColor: style.colors.faint });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "bar_chart",
        x: args.x,
        y: args.y,
        series: args.series ?? null,
        layout: args.layout ?? "vertical",
        sort: args.sort ?? "value-desc",
        highlight: toStringArray(args.highlight),
        valueLabels: (args.valueLabels as boolean) ?? false,
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
