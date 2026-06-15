import { z } from "zod";
import type { ToolDef } from "./types.js";
import {
  dataField,
  editorialShape,
  styleShape,
  resolveStyle,
  assertFields,
  prettify,
  inferType,
  type DataRow,
} from "../schemas/common.js";
import { applyTheme } from "../theme/theme.js";
import { LIGHT } from "../theme/palette.js";
import { renderVegaLite } from "../render/pipeline.js";

const inputShape = {
  ...dataField,
  x: z.string().describe('Numeric x field. Example: "spend".'),
  y: z.string().describe('Numeric y field. Example: "revenue".'),
  size: z.string().optional().describe("Optional numeric field mapped to point size (bubble chart)."),
  color: z.string().optional().describe("Optional field for point color (categorical or numeric)."),
  trendLine: z.boolean().optional().describe("Overlay a linear regression trend line. Default false."),
  ...editorialShape,
  ...styleShape,
};

function buildSpec(args: Record<string, unknown>): Record<string, unknown> {
  const data = args.data as DataRow[];
  const x = args.x as string;
  const y = args.y as string;
  const size = args.size as string | undefined;
  const color = args.color as string | undefined;
  const trendLine = (args.trendLine as boolean) ?? false;

  assertFields(data, [
    { role: "x", field: x },
    { role: "y", field: y },
    { role: "size", field: size },
    { role: "color", field: color },
  ]);

  const xEnc = {
    field: x,
    type: "quantitative",
    title: prettify(x),
    scale: { zero: false },
    axis: { grid: true, format: "~s" },
  };
  const yEnc = {
    field: y,
    type: "quantitative",
    title: prettify(y),
    scale: { zero: false },
    axis: { grid: true, format: "~s", domain: false, ticks: false },
  };

  const encoding: Record<string, unknown> = { x: xEnc, y: yEnc };
  if (size) {
    encoding.size = { field: size, type: "quantitative", title: prettify(size), legend: { format: "~s" } };
  }
  if (color) {
    const ctype = inferType(data, color);
    encoding.color =
      ctype === "quantitative"
        ? { field: color, type: "quantitative", title: prettify(color), legend: { format: "~s" } }
        : { field: color, type: "nominal", title: prettify(color) };
  }

  const pointLayer = {
    mark: { type: "point", filled: true, size: 70, opacity: 0.7 },
    encoding,
  };

  if (!trendLine) {
    return { data: { values: data }, ...pointLayer };
  }

  return {
    data: { values: data },
    layer: [
      pointLayer,
      {
        transform: [{ regression: y, on: x }],
        mark: { type: "line", color: LIGHT.faint, strokeWidth: 2, strokeDash: [4, 3] },
        encoding: { x: { field: x, type: "quantitative" }, y: { field: y, type: "quantitative" } },
      },
    ],
  };
}

export const scatterPlot: ToolDef = {
  name: "scatter_plot",
  title: "Scatter plot",
  description:
    "Show the relationship between two numeric variables. Optional `size` makes it a bubble chart and `color` " +
    "encodes a third field (categorical or numeric); points use reduced opacity to handle overplotting. Set " +
    "`trendLine` to overlay a linear regression. Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "scatter_plot",
        x: args.x,
        y: args.y,
        size: args.size ?? null,
        color: args.color ?? null,
        trendLine: (args.trendLine as boolean) ?? false,
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
