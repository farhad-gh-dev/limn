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
import { OKABE_ITO, type ThemeColors } from "../theme/palette.js";
import { renderVegaLite } from "../render/pipeline.js";

const C1 = OKABE_ITO[0] ?? "#0072B2"; // blue (first endpoint)
const C2 = OKABE_ITO[1] ?? "#E69F00"; // orange (second endpoint)

const inputShape = {
  ...dataField,
  category: z.string().describe('Row field — one dumbbell per value. Example: "country".'),
  group: z.string().describe('Field with exactly two values (the two endpoints). Example: "year".'),
  value: z.string().describe('Numeric value field (dot position). Example: "score".'),
  sort: z.enum(["gap", "value", "none"]).optional().describe("Order rows by gap size (default), by value, or none."),
  valueLabels: z.boolean().optional().describe("Label both endpoints with their value. Default true."),
  ...editorialShape,
  ...styleShape,
};

interface Row {
  category: string;
  v1: number;
  v2: number;
  __order: number;
}
interface Pt {
  category: string;
  group: string;
  value: number;
  isMax: boolean;
  __order: number;
}

function buildSpec(args: Record<string, unknown>, colors: ThemeColors): Record<string, unknown> {
  const data = args.data as DataRow[];
  const category = args.category as string;
  const group = args.group as string;
  const value = args.value as string;
  const sortBy = (args.sort as string) ?? "gap";
  const valueLabels = (args.valueLabels as boolean) ?? true;

  assertFields(data, [
    { role: "category", field: category },
    { role: "group", field: group },
    { role: "value", field: value },
  ]);

  // The two endpoint groups, ordered numerically when possible.
  const groupsSeen: string[] = [];
  for (const r of data) {
    const g = r[group];
    if (g != null && !groupsSeen.includes(String(g))) groupsSeen.push(String(g));
  }
  if (groupsSeen.length !== 2) {
    throw new Error(
      `dumbbell_plot needs exactly two distinct "${group}" values; found ${groupsSeen.length} (${groupsSeen.join(", ") || "none"}).`
    );
  }
  const ordered = [...groupsSeen].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    return !Number.isNaN(na) && !Number.isNaN(nb) ? na - nb : 0;
  });
  const g1 = ordered[0]!;
  const g2 = ordered[1]!;

  // Pivot to one record per category.
  const byCat = new Map<string, { g1?: number; g2?: number }>();
  data.forEach((r, i) => {
    const v = Number(r[value]);
    if (Number.isNaN(v)) {
      throw new Error(`dumbbell_plot value "${value}" is not numeric at row ${i} (got ${JSON.stringify(r[value])}).`);
    }
    const c = String(r[category]);
    const rec = byCat.get(c) ?? {};
    if (String(r[group]) === g1) rec.g1 = v;
    else if (String(r[group]) === g2) rec.g2 = v;
    byCat.set(c, rec);
  });

  const rows: Row[] = [];
  for (const [c, rec] of byCat.entries()) {
    if (rec.g1 == null || rec.g2 == null) {
      throw new Error(`dumbbell_plot: category "${c}" is missing a value for "${rec.g1 == null ? g1 : g2}".`);
    }
    rows.push({ category: c, v1: rec.g1, v2: rec.g2, __order: 0 });
  }

  if (sortBy === "gap") rows.sort((a, b) => Math.abs(b.v2 - b.v1) - Math.abs(a.v2 - a.v1));
  else if (sortBy === "value") rows.sort((a, b) => b.v2 - a.v2);
  rows.forEach((r, i) => (r.__order = i));

  const points: Pt[] = [];
  for (const r of rows) {
    points.push({ category: r.category, group: g1, value: r.v1, isMax: r.v1 >= r.v2, __order: r.__order });
    points.push({ category: r.category, group: g2, value: r.v2, isMax: r.v2 > r.v1, __order: r.__order });
  }

  const yEnc = { field: "category", type: "nominal", sort: { field: "__order" }, title: null, axis: { grid: false } };

  const layer: Array<Record<string, unknown>> = [
    {
      data: { values: rows },
      mark: { type: "rule", color: colors.mute, strokeWidth: 2.5 },
      encoding: { x: { field: "v1", type: "quantitative", scale: { zero: false }, axis: null }, x2: { field: "v2" } },
    },
    {
      data: { values: points },
      mark: { type: "point", filled: true, size: 130, opacity: 1 },
      encoding: {
        x: {
          field: "value",
          type: "quantitative",
          title: prettify(value),
          scale: { zero: false },
          axis: { grid: true, format: "~s", domain: false, ticks: false },
        },
        color: {
          field: "group",
          type: "nominal",
          scale: { domain: [g1, g2], range: [C1, C2] },
          legend: { orient: "top", title: null },
        },
      },
    },
  ];

  if (valueLabels) {
    layer.push({
      data: { values: points.filter((p) => p.isMax) },
      mark: { type: "text", align: "left", dx: 9, baseline: "middle", fontWeight: 500, color: colors.ink },
      encoding: { x: { field: "value", type: "quantitative" }, text: { field: "value", type: "quantitative", format: "~s" } },
    });
    layer.push({
      data: { values: points.filter((p) => !p.isMax) },
      mark: { type: "text", align: "right", dx: -9, baseline: "middle", fontWeight: 500, color: colors.ink },
      encoding: { x: { field: "value", type: "quantitative" }, text: { field: "value", type: "quantitative", format: "~s" } },
    });
  }

  return {
    encoding: { y: yEnc },
    layer,
    padding: { left: 8, top: 8, bottom: 8, right: 52 },
  };
}

export const dumbbellPlot: ToolDef = {
  name: "dumbbell_plot",
  title: "Dumbbell plot",
  description:
    "Compare two values per category as connected dots — the gap is the message. Long-format input: `category` " +
    "(rows), `group` (exactly two values, the endpoints), `value`. Sorted by gap by default; both endpoints labeled. " +
    "Great for before/after across many categories. Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args, style.colors), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source, sourceColor: style.colors.faint });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "dumbbell_plot",
        category: args.category,
        group: args.group,
        value: args.value,
        sort: args.sort ?? "gap",
        valueLabels: (args.valueLabels as boolean) ?? true,
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
