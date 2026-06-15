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
import { LIGHT } from "../theme/palette.js";
import { renderVegaLite } from "../render/pipeline.js";

type XType = "temporal" | "quantitative" | "nominal";

const inputShape = {
  ...dataField,
  x: z.string().describe('X-axis field — usually a date or ordered sequence. Example: "date".'),
  y: z.string().describe('Numeric value field. Example: "latency_ms".'),
  series: z.string().optional().describe("Optional field that splits the data into multiple lines."),
  xType: z
    .enum(["temporal", "quantitative", "nominal"])
    .optional()
    .describe("Override x-axis type. Auto-detected from the data if omitted."),
  area: z.boolean().optional().describe("Fill the area under the line (single-series only). Default false."),
  highlight: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Series name(s) to emphasize with the accent; the rest fade to grey."),
  ...editorialShape,
  ...styleShape,
};

function isDateLike(s: string): boolean {
  if (/^\d{4}(-\d{1,2}){0,2}([ T]\d)?/.test(s)) return true;
  return /[/]/.test(s) && !Number.isNaN(Date.parse(s));
}

function detectType(data: DataRow[], field: string): XType {
  const vals: Array<string | number | boolean> = [];
  for (const r of data) {
    const v = r[field];
    if (v != null) {
      vals.push(v);
      if (vals.length >= 20) break;
    }
  }
  if (vals.length > 0 && vals.every((v) => typeof v === "number")) return "quantitative";
  if (vals.length > 0 && vals.every((v) => typeof v === "string" && isDateLike(v))) return "temporal";
  return "nominal";
}

function buildSpec(args: Record<string, unknown>): Record<string, unknown> {
  const data = args.data as DataRow[];
  const x = args.x as string;
  const y = args.y as string;
  const series = args.series as string | undefined;
  const area = (args.area as boolean) ?? false;
  const highlight = toStringArray(args.highlight);
  const xType = ((args.xType as XType) ?? detectType(data, x)) as XType;

  assertFields(data, [
    { role: "x", field: x },
    { role: "y", field: y },
    { role: "series", field: series },
  ]);

  const xEnc: Record<string, unknown> = {
    field: x,
    type: xType,
    title: prettify(x),
    axis: { grid: false },
  };
  if (xType === "nominal") xEnc.sort = null;
  const yEnc: Record<string, unknown> = {
    field: y,
    type: "quantitative",
    title: prettify(y),
    axis: { grid: true, format: "~s", domain: false, ticks: false },
  };

  const highlighting = !!series && highlight.length > 0;
  const orderSort = xType === "nominal" ? undefined : [{ field: x, order: "ascending" }];

  const transform: Array<Record<string, unknown>> = [
    {
      window: [{ op: "row_number", as: "__i" }],
      ...(orderSort ? { sort: orderSort } : {}),
      ...(series ? { groupby: [series] } : {}),
    },
  ];
  if (highlighting) {
    transform.push({
      calculate: `indexof(${JSON.stringify(highlight)}, ''+datum[${JSON.stringify(series)}]) >= 0 ? 'on' : 'off'`,
      as: "__hl",
    });
  }

  let colorEnc: Record<string, unknown> | undefined;
  if (series && highlighting) {
    colorEnc = {
      field: "__hl",
      type: "nominal",
      scale: { domain: ["on", "off"], range: [LIGHT.accent, LIGHT.mute] },
      legend: null,
    };
  } else if (series) {
    colorEnc = { field: series, type: "nominal", legend: null }; // direct end-labels instead of a legend
  }

  const lineMark = area && !series ? { type: "area", line: { strokeWidth: 2.5 }, fillOpacity: 0.15 } : { type: "line" };

  const lineLayer: Record<string, unknown> = {
    mark: lineMark,
    encoding: {
      order: { field: "__i", type: "quantitative" },
      ...(colorEnc ? { color: colorEnc } : {}),
      ...(highlighting ? { detail: { field: series } } : {}),
    },
  };

  const layer: Array<Record<string, unknown>> = [lineLayer];

  if (series) {
    layer.push({
      transform: [
        { joinaggregate: [{ op: "max", field: "__i", as: "__mi" }], groupby: [series] },
        { filter: "datum.__i === datum.__mi" },
      ],
      mark: { type: "text", align: "left", dx: 8, baseline: "middle", fontWeight: 600 },
      encoding: {
        text: { field: series },
        ...(colorEnc ? { color: colorEnc } : {}),
        ...(highlighting ? { detail: { field: series } } : {}),
      },
    });
  }

  return {
    data: { values: data },
    transform,
    encoding: { x: xEnc, y: yEnc },
    layer,
    padding: { left: 18, top: 18, bottom: 24, right: series ? 96 : 24 },
  };
}

export const lineChart: ToolDef = {
  name: "line_chart",
  title: "Line chart",
  description:
    "Show how a numeric value changes across an ordered axis (usually time). Multi-series via `series`, with " +
    "direct end-of-line labels instead of a legend. Use `area` for a single filled series and `highlight` to " +
    "emphasize specific series (others fade to grey). Non-zero y-baseline is allowed. " +
    "Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "line_chart",
        x: args.x,
        y: args.y,
        series: args.series ?? null,
        xType: args.xType ?? null,
        area: (args.area as boolean) ?? false,
        highlight: toStringArray(args.highlight),
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
