import { z } from "zod";
import type { ToolDef } from "./types.js";
import {
  dataField,
  editorialShape,
  styleShape,
  resolveStyle,
  assertFields,
  type DataRow,
} from "../schemas/common.js";
import { applyTheme } from "../theme/theme.js";
import { OKABE_ITO, type ThemeColors } from "../theme/palette.js";
import { renderVegaLite } from "../render/pipeline.js";

const inputShape = {
  ...dataField,
  category: z.string().describe('Category / slice field. Example: "channel".'),
  value: z.string().describe('Numeric value field; summed per category. Example: "sessions".'),
  kind: z.enum(["donut", "bar"]).optional().describe("donut (default) or a horizontal share bar."),
  maxSlices: z
    .number()
    .int()
    .min(2)
    .max(12)
    .optional()
    .describe('Cap on slices; the remainder is grouped into "Other". Default 6.'),
  ...editorialShape,
  ...styleShape,
};

interface Slice {
  category: string;
  value: number;
  pct: number;
  pctLabel: string;
  legendLabel: string;
  __i: number;
}

function buildSlices(data: DataRow[], category: string, value: string, maxSlices: number): Slice[] {
  const totals = new Map<string, number>();
  data.forEach((r, i) => {
    const v = Number(r[value]);
    if (Number.isNaN(v)) {
      throw new Error(`part_to_whole value "${value}" is not numeric at row ${i} (got ${JSON.stringify(r[value])}).`);
    }
    const k = String(r[category]);
    totals.set(k, (totals.get(k) ?? 0) + v);
  });

  let entries = [...totals.entries()]
    .map(([c, v]) => ({ category: c, value: v }))
    .sort((a, b) => b.value - a.value);

  if (entries.length > maxSlices) {
    const head = entries.slice(0, maxSlices - 1);
    const otherVal = entries.slice(maxSlices - 1).reduce((s, e) => s + e.value, 0);
    entries = [...head, { category: "Other", value: otherVal }];
  }

  const total = entries.reduce((s, e) => s + e.value, 0);
  return entries.map((e, i) => {
    const pct = total > 0 ? (e.value / total) * 100 : 0;
    const pctRounded = Math.round(pct);
    return {
      category: e.category,
      value: e.value,
      pct,
      pctLabel: `${pctRounded}%`,
      legendLabel: `${e.category} · ${pctRounded}%`,
      __i: i,
    };
  });
}

function buildSpec(args: Record<string, unknown>, colors: ThemeColors): Record<string, unknown> {
  const data = args.data as DataRow[];
  const category = args.category as string;
  const value = args.value as string;
  const kind = (args.kind as string) ?? "donut";
  const maxSlices = (args.maxSlices as number) ?? 6;

  assertFields(data, [
    { role: "category", field: category },
    { role: "value", field: value },
  ]);

  const slices = buildSlices(data, category, value, maxSlices);

  if (kind === "bar") {
    return {
      data: { values: slices },
      layer: [
        {
          mark: { type: "bar", cornerRadiusEnd: 2, color: colors.accent },
          encoding: {
            y: { field: "category", type: "nominal", sort: { field: "__i" }, title: null, axis: { grid: false } },
            x: { field: "pct", type: "quantitative", title: "Share (%)", axis: { grid: true, domain: false, ticks: false } },
          },
        },
        {
          mark: { type: "text", align: "left", dx: 5, baseline: "middle", fontWeight: 500, color: colors.ink },
          encoding: {
            y: { field: "category", type: "nominal", sort: { field: "__i" } },
            x: { field: "pct", type: "quantitative" },
            text: { field: "pctLabel" },
          },
        },
      ],
    };
  }

  // donut
  const legendLabels = slices.map((s) => s.legendLabel);
  return {
    data: { values: slices },
    mark: { type: "arc", innerRadius: 75, cornerRadius: 1 },
    encoding: {
      theta: { field: "value", type: "quantitative", stack: true },
      order: { field: "__i", type: "quantitative" },
      color: {
        field: "legendLabel",
        type: "nominal",
        scale: { domain: legendLabels, range: [...OKABE_ITO].slice(0, legendLabels.length) },
        legend: { title: null, orient: "right", direction: "vertical" },
      },
    },
  };
}

export const partToWhole: ToolDef = {
  name: "part_to_whole",
  title: "Part-to-whole",
  description:
    "Show how categories make up a total, as a donut (default) or a horizontal share bar. Values are summed per " +
    "category, percentages computed, and the smallest slices grouped into \"Other\" past `maxSlices`. The donut " +
    "legend and the bar labels show percentages. Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args, style.colors), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source, sourceColor: style.colors.faint });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "part_to_whole",
        category: args.category,
        value: args.value,
        kind: args.kind ?? "donut",
        maxSlices: (args.maxSlices as number) ?? 6,
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
