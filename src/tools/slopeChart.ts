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
  x: z
    .string()
    .describe('The two-point axis (exactly two distinct values, e.g. before/after years). Example: "year".'),
  y: z.string().describe('Numeric value field. Example: "share".'),
  series: z.string().describe('The field that defines each slope line (one line per value). Example: "category".'),
  highlight: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Series name(s) to emphasize with the accent; the rest fade to grey."),
  ...editorialShape,
  ...styleShape,
};

function distinctX(data: DataRow[], x: string): string[] {
  const seen: string[] = [];
  for (const r of data) {
    const v = r[x];
    if (v == null) continue;
    const s = String(v);
    if (!seen.includes(s)) seen.push(s);
  }
  return seen;
}

function buildSpec(args: Record<string, unknown>, colors: ThemeColors): Record<string, unknown> {
  const data = args.data as DataRow[];
  const x = args.x as string;
  const y = args.y as string;
  const series = args.series as string;
  const highlight = toStringArray(args.highlight);

  assertFields(data, [
    { role: "x", field: x },
    { role: "y", field: y },
    { role: "series", field: series },
  ]);

  const xs = distinctX(data, x);
  if (xs.length !== 2) {
    throw new Error(
      `slope_chart needs exactly two distinct "${x}" values; found ${xs.length} (${xs.join(", ") || "none"}). ` +
        "A slope chart compares two points (before/after)."
    );
  }
  // Order numerically if both parse as numbers, else keep encountered order.
  const ordered = [...xs].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return 0;
  });
  const left = ordered[0] ?? xs[0]!;
  const right = ordered[1] ?? xs[1]!;

  const highlighting = highlight.length > 0;
  const transform: Array<Record<string, unknown>> = [];
  if (highlighting) {
    transform.push({
      calculate: `indexof(${JSON.stringify(highlight)}, ''+datum[${JSON.stringify(series)}]) >= 0 ? 'on' : 'off'`,
      as: "__hl",
    });
  }

  const colorEnc = highlighting
    ? {
        field: "__hl",
        type: "nominal",
        scale: { domain: ["on", "off"], range: [colors.accent, colors.mute] },
        legend: null,
      }
    : { field: series, type: "nominal", legend: null };

  const xEnc = {
    field: x,
    type: "nominal",
    sort: ordered,
    scale: { padding: 0.55 },
    title: null,
    axis: { grid: false, domain: false, ticks: false, labelAngle: 0, labelFontWeight: 600 },
  };
  const yEnc = {
    field: y,
    type: "quantitative",
    title: prettify(y),
    axis: { grid: false, labels: false, domain: false, ticks: false, title: null },
  };

  const detail = { detail: { field: series } };

  return {
    data: { values: data },
    ...(transform.length ? { transform } : {}),
    encoding: { x: xEnc, y: yEnc },
    layer: [
      { mark: { type: "line", strokeWidth: 2 }, encoding: { color: colorEnc, ...detail } },
      { mark: { type: "point", filled: true, size: 70 }, encoding: { color: colorEnc, ...detail } },
      {
        transform: [{ filter: `''+datum[${JSON.stringify(x)}] === ${JSON.stringify(left)}` }],
        mark: { type: "text", align: "right", dx: -10, baseline: "middle", fontWeight: 500, color: colors.ink },
        encoding: { text: { field: y, type: "quantitative", format: "~s" } },
      },
      {
        transform: [
          { filter: `''+datum[${JSON.stringify(x)}] === ${JSON.stringify(right)}` },
          {
            calculate: `datum[${JSON.stringify(series)}] + '   ' + format(datum[${JSON.stringify(y)}], '~s')`,
            as: "__rlabel",
          },
        ],
        mark: { type: "text", align: "left", dx: 12, baseline: "middle", fontWeight: 600 },
        encoding: { text: { field: "__rlabel" }, color: colorEnc, ...detail },
      },
    ],
    padding: { left: 44, top: 20, bottom: 28, right: 140 },
  };
}

export const slopeChart: ToolDef = {
  name: "slope_chart",
  title: "Slope chart",
  description:
    "Compare two points (before/after) across many series, making the direction and magnitude of change the message. " +
    "One line per `series` connecting its value at the two `x` points; endpoints are labeled with values and each line " +
    "is labeled with its series name on the right. Use `highlight` to emphasize specific series. Requires exactly two " +
    "distinct x values. Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args, style.colors), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source, sourceColor: style.colors.faint });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "slope_chart",
        x: args.x,
        y: args.y,
        series: args.series,
        highlight: toStringArray(args.highlight),
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
