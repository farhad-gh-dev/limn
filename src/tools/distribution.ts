import { z } from "zod";
import type { ToolDef } from "./types.js";
import {
  dataField,
  editorialShape,
  styleShape,
  resolveStyle,
  assertFields,
  prettify,
  type DataRow,
} from "../schemas/common.js";
import { applyTheme } from "../theme/theme.js";
import { renderVegaLite } from "../render/pipeline.js";

const inputShape = {
  ...dataField,
  value: z.string().describe('Numeric field whose distribution to show. Example: "response_ms".'),
  kind: z
    .enum(["histogram", "box", "density"])
    .optional()
    .describe("histogram (default), box (box-and-whisker), or density (smoothed KDE)."),
  series: z.string().optional().describe("Optional grouping field to compare distributions (box / density)."),
  maxBins: z.number().int().min(2).max(100).optional().describe("Histogram bin cap. Default 20."),
  ...editorialShape,
  ...styleShape,
};

function buildSpec(args: Record<string, unknown>): Record<string, unknown> {
  const data = args.data as DataRow[];
  const value = args.value as string;
  const kind = (args.kind as string) ?? "histogram";
  const series = args.series as string | undefined;
  const maxBins = (args.maxBins as number) ?? 20;

  assertFields(data, [
    { role: "value", field: value },
    { role: "series", field: series },
  ]);

  if (kind === "box") {
    const encoding: Record<string, unknown> = {
      y: { field: value, type: "quantitative", title: prettify(value), axis: { grid: true, format: "~s" } },
    };
    if (series) {
      encoding.x = { field: series, type: "nominal", title: prettify(series), axis: { grid: false, labelAngle: 0 } };
      encoding.color = { field: series, type: "nominal", legend: null };
    }
    return {
      data: { values: data },
      mark: { type: "boxplot", extent: 1.5, ...(series ? {} : { size: 56 }) },
      encoding,
    };
  }

  if (kind === "density") {
    const encoding: Record<string, unknown> = {
      x: { field: "value", type: "quantitative", title: prettify(value), axis: { grid: false } },
      y: { field: "density", type: "quantitative", title: "Density", axis: { grid: true, domain: false, ticks: false } },
    };
    if (series) encoding.color = { field: series, type: "nominal", title: prettify(series) };
    return {
      data: { values: data },
      transform: [{ density: value, ...(series ? { groupby: [series] } : {}) }],
      mark: { type: "area", line: true, opacity: series ? 0.4 : 0.6 },
      encoding,
    };
  }

  // histogram
  return {
    data: { values: data },
    mark: { type: "bar" },
    encoding: {
      x: { field: value, bin: { maxbins: maxBins }, type: "quantitative", title: prettify(value), axis: { grid: false } },
      y: { aggregate: "count", type: "quantitative", title: "Count", axis: { grid: true, domain: false, ticks: false } },
    },
  };
}

export const distribution: ToolDef = {
  name: "distribution",
  title: "Distribution",
  description:
    "Show the shape of a numeric variable: `kind` = histogram (default), box (box-and-whisker), or density (smoothed). " +
    "Pass `series` to compare distributions across groups (box / density). Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "distribution",
        value: args.value,
        kind: args.kind ?? "histogram",
        series: args.series ?? null,
        maxBins: (args.maxBins as number) ?? 20,
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
